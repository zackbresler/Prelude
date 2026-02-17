import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Project } from '@/types/project';

interface ProjectRecord {
  id: string;
  name: string;
  data: Project;
  createdAt: string;
  updatedAt: string;
}

interface PreludeLiteDB extends DBSchema {
  projects: {
    key: string;
    value: ProjectRecord;
    indexes: { 'by-updated': string };
  };
}

let dbPromise: Promise<IDBPDatabase<PreludeLiteDB>> | null = null;
let storageAvailable: boolean | null = null;

function getDB(): Promise<IDBPDatabase<PreludeLiteDB>> {
  if (!dbPromise) {
    dbPromise = openDB<PreludeLiteDB>('prelude-lite', 1, {
      upgrade(db) {
        const store = db.createObjectStore('projects', { keyPath: 'id' });
        store.createIndex('by-updated', 'updatedAt');
      },
    });
  }
  return dbPromise;
}

export async function checkStorageAvailable(): Promise<boolean> {
  if (storageAvailable !== null) {
    return storageAvailable;
  }

  try {
    const db = await getDB();
    // Try a simple operation to verify it works
    await db.count('projects');
    storageAvailable = true;
    return true;
  } catch (err) {
    console.error('IndexedDB unavailable:', err);
    storageAvailable = false;
    return false;
  }
}

export async function getAllProjects(): Promise<ProjectRecord[]> {
  const db = await getDB();
  const projects = await db.getAll('projects');
  // Sort by updatedAt descending (most recent first)
  return projects.sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
}

export async function getProjectById(id: string): Promise<ProjectRecord | undefined> {
  const db = await getDB();
  return db.get('projects', id);
}

export async function saveProject(record: ProjectRecord): Promise<void> {
  const db = await getDB();
  await db.put('projects', record);
}

export async function deleteProjectById(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('projects', id);
}

export async function clearAllProjects(): Promise<void> {
  const db = await getDB();
  await db.clear('projects');
}
