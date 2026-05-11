import type { Entity, Field, Plan } from '../types';
import { getEntityEffectiveFields } from './helpers';

function fieldTypeToSql(field: Field): string {
  switch (field.type) {
    case 'C':  return `VARCHAR(${field.length})`;
    case 'N':  return field.decimals > 0
      ? `DECIMAL(${field.length}, ${field.decimals})`
      : `NUMERIC(${field.length})`;
    case 'D':  return 'DATE';
    case 'M':  return 'TEXT';
    case 'B':  return 'BOOLEAN';
    case 'DT': return 'TIMESTAMP';
  }
}

function tableName(entity: Entity): string {
  return entity.program || entity.name;
}

function generateTableSql(entity: Entity, plan: Plan): string {
  const tbl = tableName(entity);
  const fields = getEntityEffectiveFields(entity);

  if (fields.length === 0) {
    return `-- Table ${tbl}: no fields defined\n`;
  }

  const lines: string[] = [];

  for (const f of fields) {
    let col = `  ${f.name} ${fieldTypeToSql(f)}`;
    if (!f.allowNulls) col += ' NOT NULL';
    if (f.defaultValue.trim()) col += ` DEFAULT ${f.defaultValue.trim()}`;
    lines.push(col);
  }

  const pkFields = fields
    .filter((f) => f.key > 0)
    .sort((a, b) => a.key - b.key);
  if (pkFields.length > 0) {
    lines.push(`  PRIMARY KEY (${pkFields.map((f) => f.name).join(', ')})`);
  }

  for (const link of (entity.links ?? [])) {
    const target = plan.entities.find((e) => e.id === link.targetEntityId);
    if (!target || (link.fields ?? []).length === 0) continue;
    const local   = link.fields.map((lf) => lf.localField).join(', ');
    const foreign = link.fields.map((lf) => lf.foreignField).join(', ');
    lines.push(`  FOREIGN KEY (${local}) REFERENCES ${tableName(target)} (${foreign})`);
  }

  let sql = `CREATE TABLE ${tbl} (\n${lines.join(',\n')}\n);\n`;

  for (const idx of (entity.indexes ?? [])) {
    if (idx.fromKey || idx.fields.length === 0) continue;
    const idxCols = idx.fields
      .map((c) => `${c.fieldName} ${c.direction.toUpperCase()}`)
      .join(', ');
    const idxName = `idx_${tbl}_${idx.id.replace(/\W/g, '').slice(0, 16)}`;
    sql += `CREATE INDEX ${idxName} ON ${tbl} (${idxCols});\n`;
  }

  return sql;
}

export function generateSql(plan: Plan): string {
  const header = [
    `-- SQL Schema — module: ${plan.module}`,
    `-- Generated: ${new Date().toISOString()}`,
    '',
  ];

  const tables = plan.entities
    .filter((e) => e.type !== 'virtual')
    .map((e) => {
      const separator = `-- ${'─'.repeat(56)}`;
      const label = `-- ${e.name} (${e.type}${e.program ? `, table: ${e.program}` : ''})`;
      return [separator, label, generateTableSql(e, plan)].join('\n');
    });

  return [...header, ...tables].join('\n');
}
