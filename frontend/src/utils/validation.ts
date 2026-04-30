import type { Entity } from '../types';

export function validateEntity(entity: Entity, allEntities: Entity[] = []) {
  const blocking: string[] = [];
  const warnings: string[] = [];
  const nameRegex = /^[a-zA-Z0-9_]*$/;

  if (!entity.name.trim()) blocking.push('Name is required.');
  
  if (!entity.program.trim()) blocking.push('Program is required.');
  else if (!nameRegex.test(entity.program)) blocking.push('Program cannot contain spaces or special characters.');

  if (!entity.dataName?.trim()) blocking.push('Data name is required.');
  else if (!nameRegex.test(entity.dataName)) blocking.push('Data name cannot contain spaces or special characters.');

  // Duplicate checks against all other entities
  const duplicateName = allEntities.find(e => e.id !== entity.id && e.name.toLowerCase() === entity.name.toLowerCase());
  const duplicateProg = allEntities.find(e => e.id !== entity.id && e.program.toLowerCase() === entity.program.toLowerCase());
  const duplicateData = allEntities.find(e => e.id !== entity.id && (e.dataName || '').toLowerCase() === (entity.dataName || '').toLowerCase());

  if (duplicateName) blocking.push(`The name "${entity.name}" is already used by another entity.`);
  if (duplicateProg) blocking.push(`The program "${entity.program}" is already used by entity "${duplicateProg.name}".`);
  if (duplicateData) blocking.push(`The data name "${entity.dataName}" is already used by entity "${duplicateData.name}".`);

  // Example warning (if any)
  if (entity.fields.length === 0) warnings.push('Entity has no fields defined.');

  return { blocking, warnings };
}