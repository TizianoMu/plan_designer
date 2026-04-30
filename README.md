# SitePainter Clone

A web-based designer tool that replicates SitePainter Infinity's entity/plan modeling,
built with **FastAPI** (Python backend) + **React + TypeScript + React Flow** (frontend).

---

## Prerequisites

- Python 3.11+
- Node.js 18+

---

## Setup & Run

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at http://localhost:8000

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:5173

---

## Features

### Project management
- Open an existing folder as a project (auto-detects modules with `Plan.json`)
- Create a new project (creates a folder)
- Create new modules (subfolders with empty `Plan.json`)

### Canvas
- **Master entities** (green) — `Master entity (Master)` template
- **Detail entities** (blue) — `Child Detail entity (DetailChild)` template
- **External** (yellow) and **Virtual** (purple) entities
- Drag entities to reposition; positions are saved in `Plan.json`
- **Right-click** on an entity → context menu:
  - Edit entity
  - Add relation 1:1 (dashed line)
  - Add relation 1:n (solid arrow)
  - Delete entity
- Click a target entity to complete a relation → field picker dialog
- Relations auto-populate the **Links** tab of the source entity
- Delete a relation by selecting the edge and pressing `Delete`

### Entity definition (5 tabs)
- **Main**: name, program, template, type, flags (prototype, menu, public…), notes
  - Detail flag: auto-add `CPROWNUM` (row ID) and/or `CPROWORD` (sort order)
- **Fields**: add/edit/delete fields with full type support (C, N, D, M, B, DT), key, repeated, multilang, privacy settings
- **Database**: data name, physical name, index management
- **Data properties**: placeholder (coming soon)
- **Links**: auto-populated when relations are created on canvas

### Save & unsaved-changes guard
- `💾 Save` button writes `Plan.json` to disk
- Yellow "● Unsaved" indicator when there are pending changes
- Confirmation dialog when switching modules or opening a new project with unsaved changes
- Browser `beforeunload` warning on page refresh

---

## Plan.json structure

```json
{
  "module": "MyModule",
  "entities": [
    {
      "id": "entity_...",
      "name": "Visit Report",
      "program": "jkr_visitreport",
      "type": "master",
      "template": "Master entity (Master)",
      "fields": [...],
      "links": [...],
      "position": { "x": 120, "y": 80 }
    }
  ],
  "relations": [
    {
      "id": "rel_...",
      "sourceId": "entity_...",
      "targetId": "entity_...",
      "type": "1:n",
      "sourceField": "Id",
      "targetField": "Id"
    }
  ]
}
```
