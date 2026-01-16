import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { getProject } from '@/api/projects';
import { bulkExport, ExportFormat } from '@/export/bulkExport';
import { Button } from '@/components/common';
import type { Project } from '@/types/project';

interface BulkExportModalProps {
  onClose: () => void;
}

export function BulkExportModal({ onClose }: BulkExportModalProps) {
  const { projectList } = useProjectStore();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [error, setError] = useState('');

  const allSelected = selectedIds.size === projectList.length && projectList.length > 0;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(projectList.map((p) => p.id)));
    }
  };

  const toggleProject = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return;

    setIsExporting(true);
    setError('');
    setProgress({ current: 0, total: selectedIds.size });

    try {
      // Fetch full project data for each selected project
      const projects: Project[] = [];
      const ids = Array.from(selectedIds);

      for (let i = 0; i < ids.length; i++) {
        setProgress({ current: i, total: ids.length });
        const project = await getProject(ids[i]);
        project.id = ids[i]; // Ensure ID is set
        projects.push(project);
      }

      // Generate and download zip
      setProgress({ current: 0, total: projects.length });
      await bulkExport(projects, format, (current, total) => {
        setProgress({ current, total });
      });

      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const formatOptions = [
    { value: 'pdf', label: 'PDF' },
    { value: 'docx', label: 'Word Document (DOCX)' },
    { value: 'json', label: 'JSON' },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-surface-300 rounded-xl shadow-2xl border border-surface-100 w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-100 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-100 font-display">Bulk Export Production Plans</h2>
          <button
            onClick={onClose}
            disabled={isExporting}
            className="text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {error && (
            <div className="mb-4 bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Format Selection */}
          <div className="mb-6">
            <label className="label">Export Format</label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as ExportFormat)}
              disabled={isExporting}
              className="input"
            >
              {formatOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Project Selection */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <label className="label mb-0">Select Projects</label>
              <button
                onClick={toggleSelectAll}
                disabled={isExporting}
                className="text-sm text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
              >
                {allSelected ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="border border-surface-100 rounded-lg max-h-64 overflow-auto">
              {projectList.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No projects available</div>
              ) : (
                projectList.map((project) => (
                  <label
                    key={project.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-surface-200/50 cursor-pointer border-b border-surface-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(project.id)}
                      onChange={() => toggleProject(project.id)}
                      disabled={isExporting}
                      className="w-4 h-4 rounded border-surface-50 bg-surface-400 text-primary-500 focus:ring-primary-500 focus:ring-offset-0"
                    />
                    <span className="text-gray-200 flex-1">{project.name}</span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Progress */}
          {isExporting && (
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm text-gray-400 mb-2">
                <span>Exporting...</span>
                <span>
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-300"
                  style={{ width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-100 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting || selectedIds.size === 0}>
            {isExporting ? 'Exporting...' : `Export ${selectedIds.size} Project${selectedIds.size !== 1 ? 's' : ''}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
