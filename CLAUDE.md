# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SitePainter Clone is a web-based entity/plan modeling designer tool. It allows users to create projects with modules containing entity diagrams, field definitions, and relational structures—all persisted to Plan.json files on disk.

- **Backend**: FastAPI (Python) REST API serving project management and plan persistence
- **Frontend**: React + TypeScript with React Flow for the visual canvas

## Development Commands

### Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API at http://localhost:8000, docs at http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
npm run dev       # Dev server on http://localhost:5173
npm run build     # Type-check (tsc -b) then Vite build
npm run preview   # Preview production build
```

No test runner is configured in the current setup.

## Architecture

### State Management (Zustand)

Single store at `frontend/src/store/index.ts`:

- **Project/Module**: `project`, `activeModule`, `plan`
- **Entity operations**: `upsertEntity`, `deleteEntity`, `updateEntityPosition`
- **Relations**: `addRelation`, `deleteRelation`
- **Sticky notes**: `upsertNote`, `deleteNote`, `updateNotePosition`
- **UI state**: `selectedEntityId`, `selectedEntityIds`, `contextMenu`, `pendingRelation`
- **Dirty tracking**: `isDirty`, `markDirty`, `markClean`, `pendingAction` (guards unsaved-changes flows)

All plan data is in-memory; saving triggers a backend POST to persist Plan.json.

### Data Models (`frontend/src/types/index.ts`)

- **Entity**: Master/detail/external/virtual entity with fields, links, indexes, autonumbers, and canvas position
- **Field**: Data column (Character, Numeric, Date, Memo, Boolean, DateTime) with key/multilang/privacy metadata
- **Relation**: Edge between two entities (1:1 or 1:n); automatically populates Links on the source entity
- **Link**: Auto-generated on relation creation; read-only in the entity's Links tab
- **StickyNote**: Canvas annotation with text and colors
- **Plan**: Container for all entities, relations, and notes in a module (serialized as Plan.json)
- **Project**: Folder structure with modules (auto-detected by presence of Plan.json)

### Canvas (`frontend/src/components/canvas/Canvas.tsx`)

- Converts plan entities/relations/notes to React Flow nodes/edges
- Owns undo/redo via plan snapshots (capped at 50)
- Handles clipboard (Ctrl+X/C/V), context menus, and all entity/relation/note dialogs

**EntityNode** (`canvas/nodes/EntityNode.tsx`): Cards colored by type (green=master, blue=detail, yellow=external, purple=virtual).

**EntityDialog** (`dialogs/entity/EntityDialog.tsx`): 5-tab modal — Main, Fields, Database, Data properties, Links. Detail entities auto-receive CPROWNUM/CPROWORD fields when their flags are set. Links tab is read-only.

**Sidebar** (`layout/Sidebar.tsx`): Module list, unsaved indicator, and save button.

### Backend (`backend/main.py`)

Stateless file-I/O only — all business logic is in the frontend.

| Route | Purpose |
|---|---|
| `POST /project/open` | Scan folder for modules (Plan.json detection) |
| `POST /project/create` | Create new project folder |
| `POST /module/create` | Create module with empty Plan.json |
| `GET /module/plan` | Fetch Plan.json |
| `POST /module/plan/save` | Persist Plan.json |
| `GET /browse` | List subdirectories for folder picker |

CORS allows `localhost:5173` and `localhost:3000`. Windows junction points are resolved via `os.path.realpath()`.

### Key Utilities

- **`frontend/src/utils/api.ts`**: Typed fetch wrappers around all backend endpoints
- **`frontend/src/utils/helpers.ts`**: `genId()`, entity/field factories (`makeEntity`, `makeField`, `cprownum`, `cproword`), React Flow converters (`entitiesToNodes`, `relationsToEdges`, `notesToNodes`), `getEntityEffectiveFields()` (applies auto-added detail fields)
- **`frontend/src/utils/validation.ts`**: Entity name/program validation, duplicate field name prevention

### Persistence & Unsaved-Changes Flow

- `isDirty` is set on every mutation; `markClean()` is called only after a successful save
- Navigating away with unsaved changes shows a confirmation modal (`pendingAction` stores the deferred action)
- `beforeunload` warns on browser close/refresh
- Last session (project path + module) is restored from `localStorage` on reload

### Plan.json Schema

```json
{
  "module": "string",
  "entities": [ /* Entity objects with positions */ ],
  "relations": [ /* Relation objects */ ],
  "notes": [ /* StickyNote objects */ ]
}
```
