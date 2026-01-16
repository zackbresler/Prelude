import JSZip from 'jszip';
import type { Project } from '@/types/project';
import { generatePDFBlob } from './exportPDF';
import { generateDOCXBlob } from './exportDOCX';
import { generateJSONBlob } from './exportJSON';

export type ExportFormat = 'pdf' | 'docx' | 'json';

export async function bulkExport(
  projects: Project[],
  format: ExportFormat,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip();

  for (let i = 0; i < projects.length; i++) {
    const project = projects[i];
    const safeName = project.overview.name.replace(/[^a-z0-9]/gi, '_');
    const filename = `${safeName}_prelude.${format}`;

    let blob: Blob;
    switch (format) {
      case 'pdf':
        blob = await generatePDFBlob(project);
        break;
      case 'docx':
        blob = await generateDOCXBlob(project);
        break;
      case 'json':
        blob = generateJSONBlob(project);
        break;
    }

    zip.file(filename, blob);
    onProgress?.(i + 1, projects.length);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });

  // Download the zip
  const url = URL.createObjectURL(zipBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prelude_export_${new Date().toISOString().split('T')[0]}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
