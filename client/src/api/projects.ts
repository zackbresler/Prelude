import { v4 as uuidv4 } from 'uuid';
import { Project } from '@/types/project';
import {
  getAllProjects,
  getProjectById,
  saveProject,
  deleteProjectById,
} from '@/storage/indexedDB';

interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export async function listProjects(): Promise<ProjectListItem[]> {
  const projects = await getAllProjects();
  return projects.map(({ id, name, createdAt, updatedAt }) => ({
    id,
    name,
    createdAt,
    updatedAt,
  }));
}

export async function getProject(id: string): Promise<Project> {
  const record = await getProjectById(id);
  if (!record) {
    throw new Error(`Project not found: ${id}`);
  }
  return record.data;
}

export async function createProject(name: string, data: Project): Promise<string> {
  const id = uuidv4();
  const now = new Date().toISOString();
  await saveProject({
    id,
    name,
    data: { ...data, id },
    createdAt: now,
    updatedAt: now,
  });
  return id;
}

export async function updateProject(id: string, name: string, data: Project): Promise<void> {
  const existing = await getProjectById(id);
  if (!existing) {
    throw new Error(`Project not found: ${id}`);
  }
  await saveProject({
    ...existing,
    name,
    data,
    updatedAt: new Date().toISOString(),
  });
}

export async function deleteProject(id: string): Promise<void> {
  await deleteProjectById(id);
}

export async function duplicateProject(id: string): Promise<string> {
  const existing = await getProjectById(id);
  if (!existing) {
    throw new Error(`Project not found: ${id}`);
  }

  const newId = uuidv4();
  const now = new Date().toISOString();
  const newData = {
    ...existing.data,
    id: newId,
    overview: {
      ...existing.data.overview,
      name: `${existing.data.overview.name} (Copy)`,
    },
  };

  await saveProject({
    id: newId,
    name: `${existing.name} (Copy)`,
    data: newData,
    createdAt: now,
    updatedAt: now,
  });

  return newId;
}
