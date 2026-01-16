import type { Project } from '@/types/project';

export function generateJSONBlob(project: Project): Blob {
  const dataStr = JSON.stringify(project, null, 2);
  return new Blob([dataStr], { type: 'application/json' });
}

export function exportToJSON(project: Project): void {
  const dataStr = JSON.stringify(project, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_prelude.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
