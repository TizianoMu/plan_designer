import type { Plan, Project, Module } from '../types';
import type { GeneratedFile } from './generatePrototype';

const BASE = 'http://localhost:8000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Request failed');
  }
  return res.json();
}

export const api = {
  openProject: (path: string): Promise<Project> =>
    request('/project/open', {
      method: 'POST',
      body: JSON.stringify({ path }),
    }),

  createProject: (path: string, name: string): Promise<Project> =>
    request('/project/create', {
      method: 'POST',
      body: JSON.stringify({ path, name }),
    }),

  createModule: (project_path: string, module_name: string): Promise<{ name: string; path: string; plan: Plan }> =>
    request('/module/create', {
      method: 'POST',
      body: JSON.stringify({ project_path, module_name }),
    }),

  getPlan: (project_path: string, module_name: string): Promise<Plan> =>
    request(`/module/plan?project_path=${encodeURIComponent(project_path)}&module_name=${encodeURIComponent(module_name)}`),

  savePlan: (project_path: string, module_name: string, plan: Plan): Promise<{ status: string }> =>
    request('/module/plan/save', {
      method: 'POST',
      body: JSON.stringify({ project_path, module_name, plan }),
    }),

  browse: (path: string = ''): Promise<{ path: string; parent: string; entries: { name: string; path: string; is_project: boolean }[] }> =>
    request(`/browse?path=${encodeURIComponent(path)}`),

  generatePrototype: (
    project_path: string,
    module_name: string,
    files: GeneratedFile[],
  ): Promise<{ status: string; files: string[] }> =>
    request('/module/prototype/generate', {
      method: 'POST',
      body: JSON.stringify({ project_path, module_name, files }),
    }),
};
