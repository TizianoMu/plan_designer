from __future__ import annotations
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import json
import os

app = FastAPI(title="SitePainter Clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ────────────────────────────────────────────────────────────────────

class OpenProjectRequest(BaseModel):
    path: str

class CreateProjectRequest(BaseModel):
    path: str
    name: str

class CreateModuleRequest(BaseModel):
    project_path: str
    module_name: str

class SavePlanRequest(BaseModel):
    project_path: str
    module_name: str
    plan: dict

class GeneratedFileItem(BaseModel):
    path: str      # relative to module folder, e.g. "generated/jkr_foo/jkr_foo.list.json"
    filename: str
    content: str
    type: str      # "json" | "js" | "sql"

class GeneratePrototypeRequest(BaseModel):
    project_path: str
    module_name: str
    files: List[GeneratedFileItem]

# ── Helpers ───────────────────────────────────────────────────────────────────

def get_module_path(project_path: str, module_name: str) -> str:
    return os.path.join(project_path, module_name)

def get_plan_path(project_path: str, module_name: str) -> str:
    return os.path.join(project_path, module_name, "Plan.json")

def scan_modules(project_path: str) -> List[dict]:
    modules = []
    if not os.path.isdir(project_path):
        return modules
    for entry in sorted(os.scandir(project_path), key=lambda e: e.name):
        if entry.is_dir():
            plan_file = os.path.join(entry.path, "Plan.json")
            if os.path.isfile(plan_file):
                modules.append({"name": entry.name, "path": entry.path})
    return modules

# ── Routes ────────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok"}

@app.post("/project/open")
def open_project(req: OpenProjectRequest):
    if not os.path.isdir(req.path):
        raise HTTPException(status_code=404, detail="Path not found")
    modules = scan_modules(req.path)
    return {
        "project_path": req.path,
        "project_name": os.path.basename(req.path),
        "modules": modules,
    }

@app.post("/project/create")
def create_project(req: CreateProjectRequest):
    full_path = os.path.join(req.path, req.name)
    if os.path.exists(full_path):
        raise HTTPException(status_code=400, detail="Project already exists")
    os.makedirs(full_path)
    return {
        "project_path": full_path,
        "project_name": req.name,
        "modules": [],
    }

@app.post("/module/create")
def create_module(req: CreateModuleRequest):
    module_path = get_module_path(req.project_path, req.module_name)
    if os.path.exists(module_path):
        raise HTTPException(status_code=400, detail="Module already exists")
    os.makedirs(module_path)
    empty_plan = {
        "module": req.module_name,
        "entities": [],
        "relations": [],
        "notes": [],
    }
    plan_path = os.path.join(module_path, "Plan.json")
    with open(plan_path, "w", encoding="utf-8") as f:
        json.dump(empty_plan, f, indent=2, ensure_ascii=False)
    return {"name": req.module_name, "path": module_path, "plan": empty_plan}

@app.get("/module/plan")
def get_plan(project_path: str, module_name: str):
    plan_path = get_plan_path(project_path, module_name)
    if not os.path.isfile(plan_path):
        raise HTTPException(status_code=404, detail="Plan.json not found")
    with open(plan_path, "r", encoding="utf-8") as f:
        return json.load(f)

@app.post("/module/plan/save")
def save_plan(req: SavePlanRequest):
    plan_path = get_plan_path(req.project_path, req.module_name)
    if not os.path.isfile(plan_path):
        raise HTTPException(status_code=404, detail="Plan.json not found")
    with open(plan_path, "w", encoding="utf-8") as f:
        json.dump(req.plan, f, indent=2, ensure_ascii=False)
    return {"status": "saved"}

@app.post("/module/prototype/generate")
def generate_prototype(req: GeneratePrototypeRequest):
    """Write prototype-generated files to disk under {module}/generated/{program}/."""
    module_path = get_module_path(req.project_path, req.module_name)
    if not os.path.isdir(module_path):
        raise HTTPException(status_code=404, detail="Module not found")

    written = []
    for item in req.files:
        # Prevent path traversal
        safe_path = os.path.normpath(item.path).lstrip(os.sep).lstrip("/")
        if safe_path.startswith(".."):
            raise HTTPException(status_code=400, detail=f"Invalid path: {item.path}")

        full_path = os.path.join(module_path, safe_path)
        os.makedirs(os.path.dirname(full_path), exist_ok=True)
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(item.content)
        written.append(safe_path)

    return {"status": "generated", "files": written}


@app.get("/browse")
def browse_directory(path: str = ""):
    """Return subdirectories of the given path (for folder picker)."""
    if not path:
        path = os.path.expanduser("~")

    # Resolve path so Windows junction points (Documents, Desktop, etc.) are followed
    path = str(os.path.realpath(path))

    if not os.path.isdir(path):
        raise HTTPException(status_code=404, detail="Path not found")

    # Windows system folders that are never useful to browse
    SKIP_FOLDERS = {
        "$Recycle.Bin", "System Volume Information", "Recovery",
        "Config.Msi", "ProgramData", "Windows", "bootmgr",
    }

    entries = []
    try:
        for entry in sorted(os.scandir(path), key=lambda e: e.name.lower()):
            name = entry.name
            if name.startswith(".") or name in SKIP_FOLDERS:
                continue
            # follow_symlinks=True is critical on Windows for junction points
            try:
                is_dir = entry.is_dir(follow_symlinks=True)
            except (OSError, PermissionError):
                continue
            if not is_dir:
                continue

            entry_path = entry.path
            is_project = False
            try:
                is_project = os.path.isfile(os.path.join(entry_path, "Plan.json")) or any(
                    os.path.isfile(os.path.join(entry_path, sub, "Plan.json"))
                    for sub in os.listdir(entry_path)
                    if os.path.isdir(os.path.join(entry_path, sub))
                )
            except (OSError, PermissionError):
                pass

            entries.append({"name": name, "path": entry_path, "is_project": is_project})
    except PermissionError:
        pass

    return {"path": path, "parent": str(os.path.dirname(path)), "entries": entries}
