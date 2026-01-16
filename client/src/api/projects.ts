import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Project } from '@/types/project';

interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectsResponse {
  projects: ProjectListItem[];
}

interface ProjectResponse {
  project: {
    id: string;
    name: string;
    data: Project; // Already parsed by server
    createdAt: string;
    updatedAt: string;
  };
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const { projects } = await apiGet<ProjectsResponse>('/api/projects');
  return projects;
}

export async function getProject(id: string): Promise<Project> {
  const { project } = await apiGet<ProjectResponse>(`/api/projects/${id}`);
  return project.data;
}

export async function createProject(name: string, data: Project): Promise<string> {
  const { project } = await apiPost<ProjectResponse>('/api/projects', {
    name,
    data: JSON.stringify(data),
  });
  return project.id;
}

export async function updateProject(id: string, name: string, data: Project): Promise<void> {
  await apiPut(`/api/projects/${id}`, {
    name,
    data: JSON.stringify(data),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await apiDelete(`/api/projects/${id}`);
}

export async function duplicateProject(id: string): Promise<string> {
  const { project } = await apiPost<ProjectResponse>(`/api/projects/${id}/duplicate`, {});
  return project.id;
}
