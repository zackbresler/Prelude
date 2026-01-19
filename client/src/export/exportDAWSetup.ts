import type { Project } from '@/types/project';

// Generate a CSV file with track setup information for any DAW
function generateDAWSetupCSV(project: Project): string {
  const headers = ['Track #', 'Track Name', 'Format', 'Color', 'Microphone', 'Preamp', 'Notes'];

  const rows = project.inputList.map((item, index) => {
    const trackNum = index + 1;
    const trackName = item.source || `Track ${trackNum}`;
    const format = item.trackFormat === 'stereo' ? 'Stereo' : 'Mono';
    const color = item.trackColor || '';
    const microphone = item.microphone || '';
    const preamp = item.preamp || '';
    const notes = item.notes || '';

    // Escape CSV fields that might contain commas or quotes
    const escapeCSV = (str: string) => {
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    return [trackNum, trackName, format, color, microphone, preamp, notes]
      .map(field => escapeCSV(String(field)))
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// Generate a formatted text file with track setup information
function generateDAWSetupText(project: Project): string {
  const lines: string[] = [];

  lines.push('=' .repeat(60));
  lines.push('DAW TRACK SETUP SHEET');
  lines.push(`Project: ${project.overview.name}`);
  lines.push('=' .repeat(60));
  lines.push('');
  lines.push('Use this reference when creating tracks in your DAW.');
  lines.push('');
  lines.push('-'.repeat(60));

  for (const [index, item] of project.inputList.entries()) {
    const trackNum = index + 1;
    const trackName = item.source || `Track ${trackNum}`;
    const format = item.trackFormat === 'stereo' ? 'Stereo' : 'Mono';

    lines.push('');
    lines.push(`Track ${trackNum}: ${trackName}`);
    lines.push(`  Format: ${format}`);
    if (item.trackColor) {
      lines.push(`  Color: ${item.trackColor}`);
    }
    if (item.channel) {
      lines.push(`  Input Channel: ${item.channel}`);
    }
    if (item.microphone) {
      lines.push(`  Microphone: ${item.microphone}`);
    }
    if (item.preamp) {
      lines.push(`  Preamp: ${item.preamp}`);
    }
    if (item.notes) {
      lines.push(`  Notes: ${item.notes}`);
    }
  }

  lines.push('');
  lines.push('-'.repeat(60));
  lines.push(`Total Tracks: ${project.inputList.length}`);
  lines.push(`Mono Tracks: ${project.inputList.filter(i => i.trackFormat !== 'stereo').length}`);
  lines.push(`Stereo Tracks: ${project.inputList.filter(i => i.trackFormat === 'stereo').length}`);
  lines.push('');

  return lines.join('\n');
}

// Export as CSV (for spreadsheet import or programmatic use)
export function exportDAWSetupCSV(project: Project): void {
  const content = generateDAWSetupCSV(project);
  const blob = new Blob([content], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_daw_setup.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Export as formatted text (for printing or easy reading)
export function exportDAWSetupText(project: Project): void {
  const content = generateDAWSetupText(project);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_daw_setup.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
