import type { Entity, Field } from '../types';

export interface ValidationResult {
  blocking: string[];   // hard errors — impedisce il salvataggio
  warnings: string[];   // soft warnings — chiede conferma
}

export function validateEntity(entity: Entity): ValidationResult {
  const blocking: string[] = [];
  const warnings: string[] = [];

  const fields = entity.fields;

  // ── Hard block ───────────────────────────────────────────────────────────────
  if (fields.length === 0) {
    blocking.push('You must define at least one field before saving.');
  }

  if (fields.length > 0) {
    // ── Key checks ─────────────────────────────────────────────────────────────
    const keyFields = fields.filter((f) => f.key === 1);

    if (keyFields.length === 0) {
      warnings.push('No primary key (key = 1) is defined. It is strongly recommended to set at least one key field.');
    }

    // Detail-specific key rules
    if (entity.type === 'detail' && keyFields.length > 0) {
      const repeatedKeys = keyFields.filter((f) => f.repeated);
      const nonRepeatedKeys = keyFields.filter((f) => !f.repeated);

      if (repeatedKeys.length === 0) {
        warnings.push(
          'Detail entity: no primary key on a REPEATED field. ' +
          'A detail must have at least one key on a repeated field (e.g. CPROWNUM).'
        );
      }

      if (nonRepeatedKeys.length === 0) {
        warnings.push(
          'Detail entity: no primary key on a NON-REPEATED field. ' +
          'CPROWNUM and CPROWORD are both repeated — you must also set a key on a non-repeated field (e.g. the parent ID).'
        );
      }
    }
  }

  return { blocking, warnings };
}
