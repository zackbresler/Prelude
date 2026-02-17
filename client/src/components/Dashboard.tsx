import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { PROJECT_TYPE_LABELS, ProjectType, Project } from '@/types/project';
import { Button, Select } from '@/components/common';
import { BulkExportModal } from '@/components/BulkExportModal';
import { getAllProjects, saveProject, clearAllProjects, checkStorageAvailable } from '@/storage/indexedDB';
import { format } from 'date-fns';

export default function Dashboard() {
  const { projectList, loadProjects, createProject, duplicateProject, deleteProject, setCurrentProject, importProject, isLoading, error } = useProjectStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('other');
  const [storageAvailable, setStorageAvailable] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const backupInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    checkStorageAvailable().then(setStorageAvailable);
    loadProjects();
  }, [loadProjects]);

  const handleCreateProject = async () => {
    if (newProjectName.trim()) {
      try {
        await createProject(newProjectName.trim(), newProjectType);
        setShowNewProject(false);
        setNewProjectName('');
        setNewProjectType('other');
      } catch (err) {
        console.error('Failed to create project:', err);
      }
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const project = JSON.parse(event.target?.result as string) as Project;
        const id = await importProject(project);
        await setCurrentProject(id);
      } catch {
        alert('Invalid project file');
      }
    };
    reader.readAsText(file);
  };

  const handleExportAllProjects = async () => {
    try {
      const projects = await getAllProjects();
      const exportData = {
        version: 1,
        exportedAt: new Date().toISOString(),
        projects,
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `prelude-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export projects:', err);
      alert('Failed to export projects');
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const backup = JSON.parse(event.target?.result as string);
        if (!backup.projects || !Array.isArray(backup.projects)) {
          throw new Error('Invalid backup format');
        }

        const confirmImport = confirm(
          `This will import ${backup.projects.length} project(s). Do you want to merge with existing projects or replace all?\n\nOK = Merge (add to existing)\nCancel = Replace all (delete existing first)`
        );

        if (!confirmImport) {
          // Replace all - clear existing first
          await clearAllProjects();
        }

        // Import all projects, handling both lite and self-hosted backup formats
        for (const project of backup.projects) {
          // Self-hosted backups store data as a JSON string; lite stores it as an object
          const data = typeof project.data === 'string' ? JSON.parse(project.data) : project.data;
          await saveProject({
            id: project.id,
            name: project.name,
            data,
            createdAt: project.createdAt,
            updatedAt: project.updatedAt,
          });
        }

        // Reload project list
        await loadProjects();
        alert(`Successfully imported ${backup.projects.length} project(s)`);
      } catch (err) {
        console.error('Failed to import backup:', err);
        alert('Invalid backup file');
      }
    };
    reader.readAsText(file);

    // Reset input
    if (backupInputRef.current) {
      backupInputRef.current.value = '';
    }
  };

  const projectTypeOptions = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="min-h-screen bg-surface-400">
      <header className="bg-surface-300 border-b border-surface-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold font-display">
                <span className="text-primary-400">Pre</span>
                <span className="text-gray-100">lude</span>
                <span className="text-xs ml-2 text-gray-500 font-normal">Lite</span>
              </h1>
              <p className="text-sm text-gray-400">Pre-Production Planning Tool</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImport}
                  accept=".json"
                  className="hidden"
                />
                <input
                  type="file"
                  ref={backupInputRef}
                  onChange={handleImportBackup}
                  accept=".json"
                  className="hidden"
                />
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Import Project
                </Button>
                <Button onClick={() => setShowNewProject(true)}>New Project</Button>
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-surface-100">
                <button
                  onClick={handleExportAllProjects}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  title="Export all projects as a backup file"
                >
                  Export All
                </button>
                <button
                  onClick={() => backupInputRef.current?.click()}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                  title="Import projects from a backup file"
                >
                  Import Backup
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!storageAvailable && (
          <div className="mb-8 bg-yellow-500/10 border border-yellow-500/50 text-yellow-400 px-4 py-3 rounded-lg">
            <p className="font-medium">Storage unavailable</p>
            <p className="text-sm mt-1">
              Your browser may be in private/incognito mode or blocking site data.
              Projects won't be saved between sessions.
            </p>
          </div>
        )}

        {showNewProject && (
          <div className="mb-8 bg-surface-300 rounded-xl shadow-lg border border-surface-100 p-6">
            <h2 className="text-lg font-semibold text-gray-100 font-display mb-4">Create New Project</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-400 mb-1">Project Name</label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Enter project name..."
                  className="block w-full rounded-lg border border-surface-50 bg-surface-300 px-3 py-2 text-gray-100 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 transition-colors"
                  autoFocus
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                />
              </div>
              <div>
                <Select
                  label="Project Type"
                  value={newProjectType}
                  onChange={(e) => setNewProjectType(e.target.value as ProjectType)}
                  options={projectTypeOptions}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3">
              <Button onClick={handleCreateProject} disabled={!newProjectName.trim()}>
                Create Project
              </Button>
              <Button variant="secondary" onClick={() => setShowNewProject(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 mt-4">Loading projects...</p>
          </div>
        ) : projectList.length === 0 ? (
          <div className="text-center py-16">
            <svg
              className="mx-auto h-16 w-16 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
              />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-200">No projects yet</h3>
            <p className="mt-2 text-gray-400">Get started by creating a new project.</p>
            <Button className="mt-4" onClick={() => setShowNewProject(true)}>
              Create Your First Project
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((project) => (
              <div
                key={project.id}
                className="bg-surface-300 rounded-xl shadow-lg border border-surface-100 hover:border-surface-50 transition-all hover:shadow-xl"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-100 truncate font-display">
                        {project.name}
                      </h3>
                    </div>
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    Updated {format(new Date(project.updatedAt), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="px-6 py-3 bg-surface-200 border-t border-surface-100 rounded-b-xl flex gap-2">
                  <Button size="sm" onClick={() => setCurrentProject(project.id)}>
                    Open
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => duplicateProject(project.id)}>
                    Duplicate
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      if (confirm('Are you sure you want to delete this project?')) {
                        await deleteProject(project.id);
                      }
                    }}
                  >
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bulk Export Button */}
        {projectList.length > 0 && (
          <div className="mt-8 text-center">
            <Button variant="secondary" onClick={() => setShowBulkExport(true)}>
              Bulk Export Production Plans
            </Button>
            <p className="mt-4 text-xs text-gray-500">
              Your projects are stored in this browser. Clearing browsing data for this site will delete your work.{' '}
              <button
                onClick={handleExportAllProjects}
                className="text-primary-600 hover:text-primary-500 underline"
              >
                Backup your projects
              </button>{' '}
              before clearing browsing data.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-surface-100 text-center">
          <p className="text-xs text-gray-500">
            You can deploy Prelude as a self-hosted server application with persistent storage and user authentication.{' '}
            <a
              href="https://github.com/zackbresler/Prelude"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-500 underline"
            >
              View the full version of Prelude on GitHub
            </a>
          </p>
        </div>
      </main>

      {/* Bulk Export Modal */}
      {showBulkExport && <BulkExportModal onClose={() => setShowBulkExport(false)} />}
    </div>
  );
}
