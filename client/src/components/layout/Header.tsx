import { useProjectStore } from '@/store/projectStore';
import { useAuthStore } from '@/store/authStore';
import { PROJECT_TYPE_LABELS } from '@/types/project';
import { Button } from '@/components/common';
import { exportToPDF } from '@/export/exportPDF';
import { exportToDOCX } from '@/export/exportDOCX';
import { exportToJSON } from '@/export/exportJSON';

export default function Header() {
  const { getCurrentProject } = useProjectStore();
  const { user, logout } = useAuthStore();
  const project = getCurrentProject();

  if (!project) return null;

  const handleExport = async (format: 'pdf' | 'docx' | 'json') => {
    switch (format) {
      case 'pdf':
        await exportToPDF(project);
        break;
      case 'docx':
        await exportToDOCX(project);
        break;
      case 'json':
        exportToJSON(project);
        break;
    }
  };

  return (
    <header className="bg-surface-300 border-b border-surface-100 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 font-display">{project.overview.name}</h1>
          <p className="text-sm text-gray-400">
            {PROJECT_TYPE_LABELS[project.overview.projectType]}
            {project.overview.client && ` • ${project.overview.client}`}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Button variant="secondary" size="sm">
              Export
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </Button>
            <div className="absolute right-0 mt-1 w-40 bg-surface-200 rounded-lg shadow-xl border border-surface-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
              <button
                onClick={() => handleExport('pdf')}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface-100 hover:text-gray-100 rounded-t-lg transition-colors"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('docx')}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface-100 hover:text-gray-100 transition-colors"
              >
                Export as DOCX
              </button>
              <button
                onClick={() => handleExport('json')}
                className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-surface-100 hover:text-gray-100 rounded-b-lg transition-colors"
              >
                Export as JSON
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 pl-4 border-l border-surface-100">
            <span className="text-sm text-gray-400">{user?.name}</span>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
