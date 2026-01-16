import { useState, useRef, useEffect } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { PROJECT_TYPE_LABELS, ProjectType, Project } from '@/types/project';
import { Button, Select } from '@/components/common';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { BulkExportModal } from '@/components/BulkExportModal';
import { format } from 'date-fns';

export default function Dashboard() {
  const { projectList, loadProjects, createProject, duplicateProject, deleteProject, setCurrentProject, importProject, isLoading, error } = useProjectStore();
  const { user, logout } = useAuthStore();
  const [showNewProject, setShowNewProject] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectType, setNewProjectType] = useState<ProjectType>('other');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
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
                <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                  Import Project
                </Button>
                <Button onClick={() => setShowNewProject(true)}>New Project</Button>
              </div>
              <div className="flex items-center gap-3 pl-4 border-l border-surface-100">
                <span className="text-sm text-gray-400">{user?.name}</span>
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => setShowAdminPanel(true)}
                    className="text-sm text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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
          </div>
        )}
      </main>

      {/* Admin Panel Modal */}
      {showAdminPanel && <AdminDashboard onClose={() => setShowAdminPanel(false)} />}

      {/* Bulk Export Modal */}
      {showBulkExport && <BulkExportModal onClose={() => setShowBulkExport(false)} />}
    </div>
  );
}
