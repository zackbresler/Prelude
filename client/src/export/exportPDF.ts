import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import type { Project } from '@/types/project';
import { PROJECT_TYPE_LABELS, SESSION_TYPE_LABELS } from '@/types/project';

// Convert HTML from rich text editor to plain text with formatting preserved
function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Process lists
  temp.querySelectorAll('ul').forEach((ul) => {
    ul.querySelectorAll('li').forEach((li) => {
      li.textContent = '• ' + li.textContent;
    });
  });

  temp.querySelectorAll('ol').forEach((ol) => {
    ol.querySelectorAll('li').forEach((li, index) => {
      li.textContent = `${index + 1}. ` + li.textContent;
    });
  });

  // Replace block elements with newlines
  temp.querySelectorAll('p, div, li, br').forEach((el) => {
    el.insertAdjacentText('afterend', '\n');
  });

  // Get text and clean up extra whitespace
  return temp.textContent?.replace(/\n{3,}/g, '\n\n').trim() || '';
}

// Internal function that generates the PDF document
async function generatePDFDocument(project: Project): Promise<jsPDF> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  const addTitle = (text: string, fontSize = 16) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text(text, 14, yPos);
    yPos += fontSize * 0.5 + 4;
  };

  const addSubtitle = (text: string) => {
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100);
    doc.text(text, 14, yPos);
    doc.setTextColor(0);
    yPos += 8;
  };

  const addText = (label: string, value: string) => {
    if (yPos > 270) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    const labelText = `${label}:`;
    doc.text(labelText, 14, yPos);
    const labelWidth = doc.getTextWidth(labelText);
    doc.setFont('helvetica', 'normal');
    // Add 3 units of space after the colon for clear separation
    doc.text(value || 'N/A', 14 + labelWidth + 3, yPos);
    yPos += 6;
  };

  const addParagraph = (text: string) => {
    if (!text) return;
    if (yPos > 260) {
      doc.addPage();
      yPos = 20;
    }
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(text, pageWidth - 28);
    doc.text(lines, 14, yPos);
    yPos += lines.length * 5 + 4;
  };

  // Header
  addTitle('PRE-PRODUCTION PLAN', 20);
  addSubtitle(`Generated ${format(new Date(), 'MMMM d, yyyy')}`);
  yPos += 4;

  // Project Overview
  addTitle('Project Overview');
  addText('Project Name', project.overview.name);
  addText('Client', project.overview.client);
  addText('Project Type', PROJECT_TYPE_LABELS[project.overview.projectType]);
  if (project.overview.startDate || project.overview.endDate) {
    addText('Dates', `${project.overview.startDate || 'TBD'} - ${project.overview.endDate || 'TBD'}`);
  }
  if (project.overview.description) {
    yPos += 2;
    addParagraph(htmlToPlainText(project.overview.description));
  }
  if (project.overview.notes) {
    addText('Notes', '');
    addParagraph(project.overview.notes);
  }
  yPos += 6;

  // Personnel
  if (project.personnel.length > 0) {
    addTitle('Personnel');
    autoTable(doc, {
      startY: yPos,
      head: [['Name', 'Roles', 'Instrument', 'Contact', 'Notes']],
      body: project.personnel.map((p) => [p.name, p.roles.join(', '), p.instrument || '', p.contact || '', p.notes || '']),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Venue
  addTitle('Venue');
  addText('Venue Name', project.venue.name);
  addText('Address', project.venue.address);
  if (project.venue.roomName) addText('Room', project.venue.roomName);
  if (project.venue.dimensions) addText('Dimensions', project.venue.dimensions);
  if (project.venue.contactPerson) addText('Contact', `${project.venue.contactPerson} ${project.venue.contactPhone || ''}`);
  if (project.venue.acousticNotes) {
    addText('Acoustic Notes', '');
    addParagraph(htmlToPlainText(project.venue.acousticNotes));
  }
  yPos += 6;

  // Instrumentation
  if (project.instrumentation.length > 0) {
    addTitle('Instrumentation');
    // Helper to get performer names from IDs
    const getPerformerNames = (inst: typeof project.instrumentation[0]) => {
      if (inst.performerIds && inst.performerIds.length > 0) {
        return inst.performerIds
          .map(id => project.personnel.find(p => p.id === id)?.name)
          .filter(Boolean)
          .join(', ');
      }
      return inst.performer || '';
    };
    // Helper to get track names from Track List
    const getLinkedTrackNames = (instId: string) => {
      const trackList = project.trackList || [];
      const names = trackList
        .filter(t => t.instruments.includes(instId))
        .sort((a, b) => a.trackNumber - b.trackNumber)
        .map(t => t.title)
        .filter(Boolean);
      return names.length > 0 ? names.join(', ') : '';
    };
    autoTable(doc, {
      startY: yPos,
      head: [['Instrument', 'Performer', 'Track Name', 'Notes']],
      body: project.instrumentation.map((i) => [
        i.instrument,
        getPerformerNames(i),
        getLinkedTrackNames(i.id) || i.trackName || '',
        i.notes || '',
      ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Track List
  if (project.trackList && project.trackList.length > 0) {
    addTitle('Track List');
    const getPersonnelNames = (ids: string[]) =>
      ids.map(id => project.personnel.find(p => p.id === id)?.name).filter(Boolean).join(', ') || '';
    const getInstrumentNames = (ids: string[]) =>
      ids.map(id => project.instrumentation.find(i => i.id === id)?.instrument).filter(Boolean).join(', ') || '';

    autoTable(doc, {
      startY: yPos,
      head: [['#', 'Title', 'Duration', 'Personnel', 'Instruments', 'Notes']],
      body: project.trackList
        .sort((a, b) => a.trackNumber - b.trackNumber)
        .map((t) => [
          t.trackNumber.toString(),
          t.title,
          t.duration || '',
          getPersonnelNames(t.personnel),
          getInstrumentNames(t.instruments),
          t.notes || '',
        ]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Microphone Plan
  if (project.microphonePlan.length > 0) {
    addTitle('Microphone Plan');
    autoTable(doc, {
      startY: yPos,
      head: [['Source', 'Microphone', 'Qty', 'Position', 'Notes']],
      body: project.microphonePlan.map((m) => [m.source, m.microphone, (m.quantity || 1).toString(), m.position, m.notes || '']),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Input List
  if (project.inputList.length > 0) {
    addTitle('Input List');
    autoTable(doc, {
      startY: yPos,
      head: [['Ch', 'Source', 'Microphone', 'Preamp', 'Notes']],
      body: project.inputList.map((i) => [i.channel.toString(), i.source, i.microphone, i.preamp || '', i.notes || '']),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Setup Notes
  if (project.setupNotes.description) {
    addTitle('Setup Notes');
    addParagraph(htmlToPlainText(project.setupNotes.description));
    yPos += 6;
  }

  // Atmos Config
  if (project.atmosConfig) {
    addTitle('Atmos Configuration');
    addText('Renderer', project.atmosConfig.rendererType);
    addText('Bed Format', project.atmosConfig.bedFormat);
    addText('Max Objects', project.atmosConfig.maxObjects.toString());
    addText('Deliverables', project.atmosConfig.deliverables);
    if (project.atmosConfig.notes) addParagraph(htmlToPlainText(project.atmosConfig.notes));

    if (project.atmosConfig.tracks.length > 0) {
      yPos += 4;
      autoTable(doc, {
        startY: yPos,
        head: [['Track', 'Type', 'Bed Assignment', 'Behavior', 'Height', 'Notes']],
        body: project.atmosConfig.tracks.map((t) => [
          t.name,
          t.type,
          t.bedAssignment || '',
          t.objectBehavior || '',
          t.heightLayer || '',
          t.notes || '',
        ]),
        theme: 'striped',
        headStyles: { fillColor: [14, 165, 233] },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
    }
  }

  // Timeline
  if (project.timeline.length > 0) {
    addTitle('Timeline');
    autoTable(doc, {
      startY: yPos,
      head: [['Phase', 'Description', 'Start', 'End']],
      body: project.timeline.map((t) => [t.phase, t.description, t.startDate, t.endDate]),
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233] },
      margin: { left: 14, right: 14 },
    });
    yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
  }

  // Sessions
  if (project.sessions.length > 0) {
    addTitle('Session Schedule');
    for (const session of project.sessions) {
      if (yPos > 240) {
        doc.addPage();
        yPos = 20;
      }
      const dateStr = session.date ? format(new Date(session.date), 'EEEE, MMMM d, yyyy') : 'Date TBD';
      addSubtitle(`${dateStr} - ${SESSION_TYPE_LABELS[session.type]}`);
      addText('Time', `${session.startTime} - ${session.endTime}`);
      if (session.venue) addText('Venue', session.venue);

      if (session.schedule.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Start', 'End', 'Activity', 'Notes']],
          body: session.schedule.map((s) => [s.startHour, s.endHour, s.activity, s.notes || '']),
          theme: 'striped',
          headStyles: { fillColor: [14, 165, 233] },
          margin: { left: 14, right: 14 },
        });
        yPos = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
      }
    }
  }

  // Equipment Checklist (separate page)
  if (project.equipment.length > 0) {
    doc.addPage();
    yPos = 20;
    addTitle('EQUIPMENT CHECKLIST', 18);
    addSubtitle(`${project.overview.name} - Use this page to verify all equipment is packed/present`);
    yPos += 4;

    // Group equipment by category
    const byCategory = new Map<string, typeof project.equipment>();
    for (const item of project.equipment) {
      const cat = item.category || 'other';
      if (!byCategory.has(cat)) {
        byCategory.set(cat, []);
      }
      byCategory.get(cat)!.push(item);
    }

    // Render each category with checkboxes
    for (const [category, items] of byCategory) {
      if (yPos > 250) {
        doc.addPage();
        yPos = 20;
      }

      // Category header
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
      doc.text(categoryLabel, 14, yPos);
      yPos += 6;

      // Items with checkboxes
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      for (const item of items) {
        if (yPos > 275) {
          doc.addPage();
          yPos = 20;
        }
        // Draw checkbox
        doc.rect(14, yPos - 3, 4, 4);
        // Item text
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
        doc.text(`${item.item}${qty}`, 22, yPos);
        yPos += 6;
      }
      yPos += 4;
    }
  }

  // Take Sheets (one page per track)
  if (project.trackList && project.trackList.length > 0) {
    const sortedTracks = [...project.trackList].sort((a, b) => a.trackNumber - b.trackNumber);

    for (const track of sortedTracks) {
      doc.addPage();
      yPos = 20;

      // Track title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(`TAKE SHEET`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      doc.setFontSize(14);
      doc.text(`Track ${track.trackNumber}: ${track.title || 'Untitled'}`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(100);
      doc.text(project.overview.name, pageWidth / 2, yPos, { align: 'center' });
      doc.setTextColor(0);
      yPos += 10;

      // Track metadata
      doc.setFontSize(10);

      // Duration
      if (track.duration) {
        doc.setFont('helvetica', 'bold');
        doc.text('Duration:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(track.duration, 45, yPos);
        yPos += 6;
      }

      // Personnel
      if (track.personnel.length > 0) {
        const personnelNames = track.personnel
          .map(id => project.personnel.find(p => p.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        if (personnelNames) {
          doc.setFont('helvetica', 'bold');
          doc.text('Personnel:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const personnelLines = doc.splitTextToSize(personnelNames, pageWidth - 60);
          doc.text(personnelLines, 45, yPos);
          yPos += personnelLines.length * 5 + 2;
        }
      }

      // Instrumentation
      if (track.instruments.length > 0) {
        const instrumentNames = track.instruments
          .map(id => project.instrumentation.find(i => i.id === id)?.instrument)
          .filter(Boolean)
          .join(', ');
        if (instrumentNames) {
          doc.setFont('helvetica', 'bold');
          doc.text('Instruments:', 14, yPos);
          doc.setFont('helvetica', 'normal');
          const instrumentLines = doc.splitTextToSize(instrumentNames, pageWidth - 60);
          doc.text(instrumentLines, 45, yPos);
          yPos += instrumentLines.length * 5 + 2;
        }
      }

      // Notes
      if (track.notes) {
        doc.setFont('helvetica', 'bold');
        doc.text('Notes:', 14, yPos);
        doc.setFont('helvetica', 'normal');
        const notesLines = doc.splitTextToSize(track.notes, pageWidth - 28);
        yPos += 5;
        doc.text(notesLines, 14, yPos);
        yPos += notesLines.length * 5 + 2;
      }

      yPos += 6;

      // Take table - fill remaining page
      const pageHeight = doc.internal.pageSize.getHeight();
      const remainingHeight = pageHeight - yPos - 15;
      const rowHeight = 12;
      // Subtract 2 to account for header row and margins
      const numRows = Math.floor(remainingHeight / rowHeight) - 2;

      // Generate take rows
      const takeRows: string[][] = [];
      for (let i = 1; i <= Math.max(numRows, 15); i++) {
        takeRows.push([i.toString(), '', '', '']);
      }

      autoTable(doc, {
        startY: yPos,
        head: [['Take', 'Timecode', 'Circle', 'Notes']],
        body: takeRows,
        theme: 'grid',
        headStyles: { fillColor: [14, 165, 233], fontSize: 10 },
        bodyStyles: { fontSize: 10, minCellHeight: rowHeight },
        columnStyles: {
          0: { cellWidth: 20, halign: 'center' },
          1: { cellWidth: 35 },
          2: { cellWidth: 25, halign: 'center' },
          3: { cellWidth: 'auto' },
        },
        margin: { left: 14, right: 14 },
      });
    }
  }

  return doc;
}

// Generate PDF as Blob (for bulk export)
export async function generatePDFBlob(project: Project): Promise<Blob> {
  const doc = await generatePDFDocument(project);
  return doc.output('blob');
}

// Export PDF (triggers download)
export async function exportToPDF(project: Project): Promise<void> {
  const doc = await generatePDFDocument(project);
  doc.save(`${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_prelude.pdf`);
}
