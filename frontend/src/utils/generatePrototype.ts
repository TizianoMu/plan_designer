import type { Entity, Field, Plan } from '../types';

// ── Output types ──────────────────────────────────────────────────────────────

export type GeneratedFileType = 'html' | 'css' | 'js' | 'py';

export interface GeneratedFile {
  path: string;      // relative to module folder
  filename: string;
  content: string;
  type: GeneratedFileType;
}

export interface GeneratedPrototype {
  entityId: string;
  entityName: string;
  program: string;
  files: GeneratedFile[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function humanize(name: string): string {
  return name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

function pkFields(entity: Entity): Field[] {
  return entity.fields.filter((f) => f.key === 1);
}

function nonPkFields(entity: Entity): Field[] {
  return entity.fields.filter((f) => f.key !== 1);
}

function fieldLabel(f: Field): string {
  return f.description || humanize(f.name);
}

function htmlInputType(f: Field): string {
  switch (f.type) {
    case 'N':  return 'number';
    case 'D':  return 'date';
    case 'DT': return 'datetime-local';
    case 'B':  return 'checkbox';
    case 'M':  return 'textarea';
    default:   return 'text';
  }
}

// ── HTML generator ────────────────────────────────────────────────────────────

function buildHtml(entity: Entity): string {
  const pk = pkFields(entity);
  const pkName = pk[0]?.name ?? 'ID';
  const title = entity.name || entity.program;
  const prog = entity.program;

  const thCols = entity.fields
    .map((f) => `        <th>${fieldLabel(f).toUpperCase()}</th>`)
    .join('\n');

  const tdCols = entity.fields
    .map((f) => `          <td data-field="${f.name}"></td>`)
    .join('\n');

  const formRows = entity.fields.map((f) => {
    const label = fieldLabel(f);
    const itype = htmlInputType(f);
    const readonly = f.key === 1 ? ' readonly' : '';
    const required = f.key === 1 ? ' required' : '';
    const maxlen = f.type === 'C' ? ` maxlength="${f.length}"` : '';

    if (itype === 'textarea') {
      return `
      <div class="sp-field-row">
        <label class="sp-label" for="f_${f.name}">${label}:</label>
        <textarea id="f_${f.name}" name="${f.name}" class="sp-input"${readonly}${required}></textarea>
      </div>`;
    }
    if (itype === 'checkbox') {
      return `
      <div class="sp-field-row">
        <label class="sp-label" for="f_${f.name}">${label}:</label>
        <input type="checkbox" id="f_${f.name}" name="${f.name}" class="sp-checkbox"${readonly}>
      </div>`;
    }
    return `
      <div class="sp-field-row">
        <label class="sp-label" for="f_${f.name}">${label}:</label>
        <input type="${itype}" id="f_${f.name}" name="${f.name}" class="sp-input"${maxlen}${readonly}${required}>
      </div>`;
  }).join('');

  return `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="${prog}.css">
</head>
<body>

  <!-- ── LIST VIEW ────────────────────────────────────────────────── -->
  <div id="view-list" class="sp-view">
    <div class="sp-topbar">
      <h1 class="sp-title">${title}</h1>
      <div class="sp-topbar-actions">
        <button class="sp-btn sp-btn-primary" onclick="${prog}.openNew()">Nuovo +</button>
        <button class="sp-btn" onclick="window.print()">Stampa</button>
      </div>
    </div>

    <div class="sp-toolbar">
      <div class="sp-toolbar-left">
        <span class="sp-view-label">Elenco</span>
      </div>
      <div class="sp-toolbar-right">
        <input id="search-input" type="text" class="sp-search" placeholder="Cerca…"
               oninput="${prog}.filterList(this.value)">
      </div>
    </div>

    <div class="sp-table-wrap">
      <table class="sp-table" id="list-table">
        <thead>
          <tr>
${thCols}
            <th class="sp-col-actions"></th>
          </tr>
        </thead>
        <tbody id="list-body">
          <!-- populated by ${prog}.loadList() -->
        </tbody>
      </table>
    </div>
  </div>

  <!-- ── DETAIL VIEW ──────────────────────────────────────────────── -->
  <div id="view-detail" class="sp-view sp-hidden">
    <div class="sp-topbar">
      <h2 class="sp-title">
        <span id="detail-mode-label">modifica</span>
        <strong>${title}</strong>
      </h2>
      <div class="sp-topbar-actions">
        <button class="sp-btn sp-btn-primary" onclick="${prog}.save()" id="btn-save">Salva</button>
        <button class="sp-btn" onclick="${prog}.cancel()">Annulla ✕</button>
      </div>
    </div>

    <form id="detail-form" class="sp-form" onsubmit="return false;">
${formRows}
    </form>
  </div>

  <!-- ── ROW ACTION POPUP ──────────────────────────────────────────── -->
  <div id="row-actions" class="sp-row-actions sp-hidden">
    <button onclick="${prog}.viewSelected()">🔍 Visualizza</button>
    <button onclick="${prog}.editSelected()">✏️ Modifica</button>
    <button onclick="${prog}.deleteSelected()">🗑️ Rimuovi</button>
  </div>

  <script src="${prog}.js"></script>
  <script>${prog}.init();</script>
</body>
</html>
`;
}

// ── CSS generator ─────────────────────────────────────────────────────────────

function buildCss(entity: Entity): string {
  const prog = entity.program;
  // Color by entity type
  const accentMap: Record<string, string> = {
    master:   '#16a34a',
    detail:   '#2563eb',
    external: '#d97706',
    virtual:  '#7c3aed',
  };
  const accent = accentMap[entity.type] ?? '#16a34a';
  const accentDark = accent; // same for now

  return `/* ── ${prog}.css — AUTO-GENERATED ───────────────────────────────── */
/* Entity: ${entity.name}  Type: ${entity.type}  Program: ${prog}        */

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, sans-serif;
  font-size: 13px;
  background: #f5f5f5;
  color: #111827;
}

/* ── Views ──────────────────────────────────────────────────────── */
.sp-view { max-width: 1100px; margin: 0 auto; background: #fff; min-height: 100vh; }
.sp-hidden { display: none !important; }

/* ── Top bar ─────────────────────────────────────────────────────── */
.sp-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 16px;
  background: ${accent};
  color: #fff;
}
.sp-title { font-size: 15px; font-weight: 600; }
.sp-topbar-actions { display: flex; gap: 6px; }

/* ── Toolbar ─────────────────────────────────────────────────────── */
.sp-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 16px; border-bottom: 1px solid #e5e7eb; background: #fafafa;
}
.sp-view-label { font-size: 12px; color: #6b7280; font-weight: 500; }
.sp-search {
  padding: 4px 10px; border: 1px solid #d1d5db; border-radius: 4px;
  font-size: 12px; outline: none; width: 200px;
}
.sp-search:focus { border-color: ${accent}; }

/* ── Buttons ─────────────────────────────────────────────────────── */
.sp-btn {
  padding: 5px 14px; border: 1px solid rgba(255,255,255,0.5);
  border-radius: 4px; cursor: pointer; font-size: 12px; font-family: inherit;
  background: rgba(255,255,255,0.15); color: #fff; font-weight: 500;
}
.sp-btn:hover { background: rgba(255,255,255,0.25); }
.sp-btn-primary {
  background: #fff; color: ${accentDark}; border-color: #fff; font-weight: 700;
}
.sp-btn-primary:hover { background: #f0fdf4; }

/* ── Table ───────────────────────────────────────────────────────── */
.sp-table-wrap { overflow-x: auto; }
.sp-table {
  width: 100%; border-collapse: collapse; font-size: 12px;
}
.sp-table thead tr {
  background: #f9fafb; border-bottom: 2px solid #e5e7eb;
}
.sp-table th {
  padding: 8px 10px; text-align: left; font-size: 11px;
  font-weight: 700; color: #6b7280; letter-spacing: 0.3px;
  white-space: nowrap;
}
.sp-table td {
  padding: 7px 10px; border-bottom: 1px solid #f3f4f6;
  color: #374151;
}
.sp-table tbody tr:hover { background: #fefce8; }
.sp-table tbody tr.sp-row-selected { background: #fef9c3; }
.sp-col-actions { width: 1px; white-space: nowrap; }

/* ── Row action popup ────────────────────────────────────────────── */
.sp-row-actions {
  display: flex; gap: 4px; padding: 3px 0;
}
.sp-row-actions button {
  background: none; border: none; cursor: pointer;
  font-size: 11px; color: #6b7280; padding: 2px 6px;
  border-radius: 3px;
}
.sp-row-actions button:hover { background: #f3f4f6; color: #111827; }

/* ── Detail form ─────────────────────────────────────────────────── */
.sp-form {
  padding: 20px 24px; display: flex; flex-direction: column; gap: 10px;
  max-width: 600px;
}
.sp-field-row {
  display: flex; align-items: flex-start; gap: 8px;
}
.sp-label {
  min-width: 130px; text-align: right; padding-top: 5px;
  font-size: 12px; color: #374151; flex-shrink: 0;
}
.sp-input, .sp-form textarea {
  flex: 1; padding: 5px 8px; border: 1px solid #d1d5db;
  border-radius: 3px; font-size: 12px; font-family: inherit;
  outline: none; color: #111827; background: #fff;
}
.sp-input:focus, .sp-form textarea:focus { border-color: ${accent}; }
.sp-input[readonly], .sp-form textarea[readonly] {
  background: #f9fafb; color: #6b7280; cursor: default;
}
.sp-checkbox { margin-top: 6px; accent-color: ${accent}; }
.sp-form textarea { resize: vertical; min-height: 70px; }
`;
}

// ── JS generator ──────────────────────────────────────────────────────────────

function buildJs(entity: Entity): string {
  const prog = entity.program;
  const title = entity.name || prog;
  const pk = pkFields(entity);
  const nonPks = nonPkFields(entity);
  const pkName = pk[0]?.name ?? 'ID';

  const fieldNames = entity.fields.map((f) => `'${f.name}'`).join(', ');
  const nonPkNames = nonPks.map((f) => `'${f.name}'`).join(', ');
  const boolFields = entity.fields.filter((f) => f.type === 'B').map((f) => `'${f.name}'`).join(', ');

  const generated = new Date().toISOString().slice(0, 10);

  return `// ── ${prog}.js — AUTO-GENERATED ─────────────────────────────────────
// Entity : ${title}  Program: ${prog}
// Generated: ${generated}
// DO NOT edit — place custom logic in ${prog}.custom.js
// ─────────────────────────────────────────────────────────────────────

const ${prog} = (() => {

  const API_BASE = '/api/${prog}';
  const PK       = '${pkName}';
  const FIELDS   = [${fieldNames}];
  const NON_PK   = [${nonPkNames}];
  const BOOL_FIELDS = [${boolFields}];

  let _rows      = [];
  let _filtered  = [];
  let _selected  = null;   // selected row index
  let _mode      = 'insert'; // 'insert' | 'update' | 'view'

  // ── Init ──────────────────────────────────────────────────────────

  function init() {
    loadList();
  }

  // ── List view ─────────────────────────────────────────────────────

  async function loadList() {
    try {
      const res  = await fetch(API_BASE);
      const data = await res.json();
      _rows     = data;
      _filtered = data;
      renderList(_filtered);
    } catch (e) {
      console.error('loadList error', e);
    }
  }

  function renderList(rows) {
    const tbody = document.getElementById('list-body');
    tbody.innerHTML = '';
    rows.forEach((row, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.idx = idx;
      tr.addEventListener('click', () => selectRow(idx, tr));

      FIELDS.forEach((field) => {
        const td = document.createElement('td');
        td.dataset.field = field;
        td.textContent = row[field] ?? '';
        tr.appendChild(td);
      });

      // Actions cell (hidden until row selected)
      const tdActions = document.createElement('td');
      tdActions.className = 'sp-col-actions';
      tbody.appendChild(tr);
    });
  }

  function selectRow(idx, trEl) {
    // Deselect previous
    document.querySelectorAll('#list-body tr').forEach((r) => r.classList.remove('sp-row-selected'));
    if (_selected === idx) {
      _selected = null;
      hideRowActions();
      return;
    }
    _selected = idx;
    trEl.classList.add('sp-row-selected');
    const rect = trEl.getBoundingClientRect();
    showRowActions(rect);
  }

  function showRowActions(rect) {
    const el = document.getElementById('row-actions');
    el.classList.remove('sp-hidden');
    el.style.position = 'fixed';
    el.style.top  = (rect.bottom + 2) + 'px';
    el.style.left = rect.left + 'px';
  }

  function hideRowActions() {
    document.getElementById('row-actions').classList.add('sp-hidden');
  }

  function filterList(query) {
    const q = query.toLowerCase();
    _filtered = q
      ? _rows.filter((r) => FIELDS.some((f) => String(r[f] ?? '').toLowerCase().includes(q)))
      : _rows;
    renderList(_filtered);
    _selected = null;
    hideRowActions();
  }

  // ── Detail view ───────────────────────────────────────────────────

  function showView(id) {
    document.getElementById('view-list').classList.add('sp-hidden');
    document.getElementById('view-detail').classList.add('sp-hidden');
    document.getElementById(id).classList.remove('sp-hidden');
    hideRowActions();
  }

  function openNew() {
    _mode = 'insert';
    document.getElementById('detail-mode-label').textContent = 'nuovo';
    resetForm();
    document.getElementById('btn-save').style.display = '';
    showView('view-detail');
  }

  function viewSelected() {
    if (_selected === null) return;
    _mode = 'view';
    document.getElementById('detail-mode-label').textContent = 'visualizza';
    fillForm(_filtered[_selected]);
    setFormReadonly(true);
    document.getElementById('btn-save').style.display = 'none';
    showView('view-detail');
  }

  function editSelected() {
    if (_selected === null) return;
    _mode = 'update';
    document.getElementById('detail-mode-label').textContent = 'modifica';
    fillForm(_filtered[_selected]);
    setFormReadonly(false);
    // Keep PK readonly in edit mode
    const pkInput = document.getElementById('f_' + PK);
    if (pkInput) pkInput.readOnly = true;
    document.getElementById('btn-save').style.display = '';
    showView('view-detail');
  }

  async function deleteSelected() {
    if (_selected === null) return;
    const row = _filtered[_selected];
    if (!confirm('Eliminare il record ' + row[PK] + '?')) return;
    try {
      await fetch(API_BASE + '/' + row[PK], { method: 'DELETE' });
      hideRowActions();
      await loadList();
    } catch (e) {
      alert('Errore durante l\'eliminazione: ' + e.message);
    }
  }

  async function save() {
    const form = document.getElementById('detail-form');
    const data = readForm();

    const isInsert = _mode === 'insert';
    const url    = isInsert ? API_BASE : API_BASE + '/' + data[PK];
    const method = isInsert ? 'POST' : 'PUT';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Error'); }
      showView('view-list');
      await loadList();
    } catch (e) {
      alert('Errore durante il salvataggio: ' + e.message);
    }
  }

  function cancel() {
    showView('view-list');
  }

  // ── Form helpers ──────────────────────────────────────────────────

  function resetForm() {
    FIELDS.forEach((f) => {
      const el = document.getElementById('f_' + f);
      if (!el) return;
      if (el.type === 'checkbox') el.checked = false;
      else el.value = '';
    });
    setFormReadonly(false);
  }

  function fillForm(row) {
    FIELDS.forEach((f) => {
      const el = document.getElementById('f_' + f);
      if (!el) return;
      const val = row[f] ?? '';
      if (el.type === 'checkbox') el.checked = !!val;
      else el.value = val;
    });
  }

  function readForm() {
    const data = {};
    FIELDS.forEach((f) => {
      const el = document.getElementById('f_' + f);
      if (!el) return;
      data[f] = el.type === 'checkbox' ? el.checked : el.value;
    });
    return data;
  }

  function setFormReadonly(readonly) {
    FIELDS.forEach((f) => {
      const el = document.getElementById('f_' + f);
      if (!el) return;
      if (el.type === 'checkbox') el.disabled = readonly;
      else el.readOnly = readonly;
    });
  }

  return { init, loadList, filterList, openNew, viewSelected, editSelected, deleteSelected, save, cancel };

})();
`;
}

// ── Python API generator ──────────────────────────────────────────────────────

function buildApi(entity: Entity): string {
  const prog = entity.program;
  const title = entity.name || prog;
  const pk = pkFields(entity);
  const nonPks = nonPkFields(entity);
  const pkName = pk[0]?.name ?? 'ID';
  const pkType = pk[0]?.type === 'N' ? 'int' : 'str';

  const generated = new Date().toISOString().slice(0, 10);

  const pyTypeMap: Record<string, string> = {
    C: 'str', N: 'float', D: 'str', DT: 'str', M: 'str', B: 'bool',
  };

  const modelFields = entity.fields.map((f) => {
    const pyType = pyTypeMap[f.type] ?? 'str';
    const optional = f.key !== 1 && f.allowNulls;
    return optional
      ? `    ${f.name}: Optional[${pyType}] = None`
      : `    ${f.name}: ${pyType}`;
  }).join('\n');

  const insertCols  = nonPks.map((f) => f.name).join(', ');
  const insertPh    = nonPks.map((f) => `:${f.name}`).join(', ');
  const updateSets  = nonPks.map((f) => `${f.name} = :${f.name}`).join(', ');
  const insertArgs  = nonPks.map((f) => `"${f.name}": item.${f.name}`).join(', ');
  const updateArgs  = entity.fields.map((f) => `"${f.name}": item.${f.name}`).join(', ');

  return `# ── ${prog}.api.py — AUTO-GENERATED ──────────────────────────────────
# Entity : ${title}  Program: ${prog}
# Generated: ${generated}
# DO NOT edit — place custom logic in ${prog}.api.custom.py
#
# Usage: include this router in your FastAPI main.py:
#   from ${prog}.api import router as ${prog}_router
#   app.include_router(${prog}_router)
# ─────────────────────────────────────────────────────────────────────

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
import sqlite3
import os

router = APIRouter(prefix="/api/${prog}", tags=["${title}"])

DB_PATH = os.environ.get("DB_PATH", "database.db")


# ── Schema ────────────────────────────────────────────────────────────

class ${prog}_Schema(BaseModel):
${modelFields}


class ${prog}_Create(BaseModel):
${nonPks.map((f) => `    ${f.name}: ${pyTypeMap[f.type] ?? 'str'}`).join('\n') || '    pass'}


# ── DB helper ─────────────────────────────────────────────────────────

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ── Endpoints ─────────────────────────────────────────────────────────

@router.get("/", response_model=List[${prog}_Schema])
def list_${prog}():
    """Return all records ordered by ${pkName}."""
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM ${prog} ORDER BY ${pkName}"
        ).fetchall()
    return [dict(r) for r in rows]


@router.get("/{${pkName.toLowerCase()}}", response_model=${prog}_Schema)
def get_${prog}(${pkName.toLowerCase()}: ${pkType}):
    """Return a single record by primary key."""
    with get_db() as conn:
        row = conn.execute(
            "SELECT * FROM ${prog} WHERE ${pkName} = ?", (${pkName.toLowerCase()},)
        ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="${title} not found")
    return dict(row)


@router.post("/", response_model=${prog}_Schema, status_code=201)
def create_${prog}(item: ${prog}_Create):
    """Insert a new record."""
    with get_db() as conn:
        cur = conn.execute(
            "INSERT INTO ${prog} (${insertCols}) VALUES (${insertPh})",
            {${insertArgs}},
        )
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute(
            "SELECT * FROM ${prog} WHERE rowid = ?", (new_id,)
        ).fetchone()
    return dict(row)


@router.put("/{${pkName.toLowerCase()}}", response_model=${prog}_Schema)
def update_${prog}(${pkName.toLowerCase()}: ${pkType}, item: ${prog}_Schema):
    """Update an existing record."""
    with get_db() as conn:
        affected = conn.execute(
            "UPDATE ${prog} SET ${updateSets} WHERE ${pkName} = :${pkName}",
            {${updateArgs}},
        ).rowcount
        conn.commit()
        if not affected:
            raise HTTPException(status_code=404, detail="${title} not found")
        row = conn.execute(
            "SELECT * FROM ${prog} WHERE ${pkName} = ?", (${pkName.toLowerCase()},)
        ).fetchone()
    return dict(row)


@router.delete("/{${pkName.toLowerCase()}}", status_code=204)
def delete_${prog}(${pkName.toLowerCase()}: ${pkType}):
    """Delete a record by primary key."""
    with get_db() as conn:
        affected = conn.execute(
            "DELETE FROM ${prog} WHERE ${pkName} = ?", (${pkName.toLowerCase()},)
        ).rowcount
        conn.commit()
    if not affected:
        raise HTTPException(status_code=404, detail="${title} not found")
`;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generatePrototype(entity: Entity, _plan: Plan): GeneratedPrototype {
  const folder = `generated/${entity.program}`;
  const p = entity.program;

  return {
    entityId:   entity.id,
    entityName: entity.name,
    program:    entity.program,
    files: [
      { path: `${folder}/${p}.html`, filename: `${p}.html`, content: buildHtml(entity),   type: 'html' },
      { path: `${folder}/${p}.css`,  filename: `${p}.css`,  content: buildCss(entity),    type: 'css'  },
      { path: `${folder}/${p}.js`,   filename: `${p}.js`,   content: buildJs(entity),     type: 'js'   },
      { path: `${folder}/${p}.api.py`, filename: `${p}.api.py`, content: buildApi(entity), type: 'py'  },
    ],
  };
}

export function generateAllPrototypes(plan: Plan): GeneratedPrototype[] {
  return plan.entities
    .filter((e) => e.isPrototype)
    .map((e) => generatePrototype(e, plan));
}
