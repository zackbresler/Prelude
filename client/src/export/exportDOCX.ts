import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  HeadingLevel,
  WidthType,
  BorderStyle,
  AlignmentType,
  PageBreak,
} from 'docx';
import { format } from 'date-fns';
import type { Project } from '@/types/project';
import { PROJECT_TYPE_LABELS, SESSION_TYPE_LABELS } from '@/types/project';

// Convert HTML from rich text editor to plain text with formatting preserved
function htmlToPlainText(html: string): string {
  if (!html) return '';

  // Create a temporary element to parse HTML
  const temp = document.createElement('div');
  temp.innerHTML = html;

  // Remove style and script tags (e.g., from Word-pasted content)
  temp.querySelectorAll('style, script').forEach((el) => el.remove());

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

const createTableRow = (cells: string[], isHeader = false): TableRow => {
  return new TableRow({
    children: cells.map(
      (text) =>
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text,
                  bold: isHeader,
                  size: 20,
                }),
              ],
            }),
          ],
          shading: isHeader ? { fill: '0EA5E9' } : undefined,
        })
    ),
  });
};

const createTable = (headers: string[], rows: string[][]): Table => {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
    },
    rows: [createTableRow(headers, true), ...rows.map((row) => createTableRow(row))],
  });
};

// Internal function that generates the DOCX document
async function generateDOCXDocument(project: Project): Promise<Document> {
  const children: (Paragraph | Table)[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'PRE-PRODUCTION PLAN', bold: true, size: 40 })],
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: `Generated ${format(new Date(), 'MMMM d, yyyy')}`, italics: true, size: 20 }),
      ],
      alignment: AlignmentType.CENTER,
    })
  );
  children.push(new Paragraph({ text: '' }));

  // Project Overview
  children.push(new Paragraph({ text: 'Project Overview', heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Project Name: ', bold: true }),
        new TextRun({ text: project.overview.name }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Client: ', bold: true }),
        new TextRun({ text: project.overview.client || 'N/A' }),
      ],
    })
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({ text: 'Project Type: ', bold: true }),
        new TextRun({ text: PROJECT_TYPE_LABELS[project.overview.projectType] }),
      ],
    })
  );
  if (project.overview.startDate || project.overview.endDate) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Dates: ', bold: true }),
          new TextRun({ text: `${project.overview.startDate || 'TBD'} - ${project.overview.endDate || 'TBD'}` }),
        ],
      })
    );
  }
  if (project.overview.description) {
    children.push(new Paragraph({ text: '' }));
    children.push(new Paragraph({ text: htmlToPlainText(project.overview.description) }));
  }
  if (project.overview.notes) {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Notes: ', bold: true })],
      })
    );
    children.push(new Paragraph({ text: project.overview.notes }));
  }
  children.push(new Paragraph({ text: '' }));

  // Personnel
  if (project.personnel.length > 0) {
    children.push(new Paragraph({ text: 'Personnel', heading: HeadingLevel.HEADING_1 }));
    children.push(
      createTable(
        ['Name', 'Roles', 'Instrument', 'Contact', 'Notes'],
        project.personnel.map((p) => [p.name, p.roles.join(', '), p.instrument || '', p.contact || '', p.notes || ''])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Venue
  children.push(new Paragraph({ text: 'Venue', heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Venue Name: ', bold: true }), new TextRun({ text: project.venue.name || 'N/A' })],
    })
  );
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Address: ', bold: true }), new TextRun({ text: project.venue.address || 'N/A' })],
    })
  );
  if (project.venue.roomName) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Room: ', bold: true }), new TextRun({ text: project.venue.roomName })],
      })
    );
  }
  if (project.venue.dimensions) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Dimensions: ', bold: true }), new TextRun({ text: project.venue.dimensions })],
      })
    );
  }
  if (project.venue.contactPerson) {
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Contact: ', bold: true }),
          new TextRun({ text: `${project.venue.contactPerson} ${project.venue.contactPhone || ''}` }),
        ],
      })
    );
  }
  if (project.venue.acousticNotes) {
    children.push(new Paragraph({ text: '' }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Acoustic Notes: ', bold: true })],
      })
    );
    children.push(new Paragraph({ text: htmlToPlainText(project.venue.acousticNotes) }));
  }
  children.push(new Paragraph({ text: '' }));

  // Instrumentation
  if (project.instrumentation.length > 0) {
    children.push(new Paragraph({ text: 'Instrumentation', heading: HeadingLevel.HEADING_1 }));
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
    children.push(
      createTable(
        ['Instrument', 'Performer', 'Track Name', 'Notes'],
        project.instrumentation.map((i) => [
          i.instrument,
          getPerformerNames(i),
          getLinkedTrackNames(i.id) || i.trackName || '',
          i.notes || '',
        ])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Track List
  if (project.trackList && project.trackList.length > 0) {
    children.push(new Paragraph({ text: 'Track List', heading: HeadingLevel.HEADING_1 }));
    const getPersonnelNames = (ids: string[]) =>
      ids.map(id => project.personnel.find(p => p.id === id)?.name).filter(Boolean).join(', ') || '';
    const getInstrumentNames = (ids: string[]) =>
      ids.map(id => project.instrumentation.find(i => i.id === id)?.instrument).filter(Boolean).join(', ') || '';

    children.push(
      createTable(
        ['#', 'Title', 'Duration', 'Personnel', 'Instruments', 'Notes'],
        project.trackList
          .sort((a, b) => a.trackNumber - b.trackNumber)
          .map((t) => [
            t.trackNumber.toString(),
            t.title,
            t.duration || '',
            getPersonnelNames(t.personnel),
            getInstrumentNames(t.instruments),
            t.notes || '',
          ])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Microphone Plan
  if (project.microphonePlan.length > 0) {
    children.push(new Paragraph({ text: 'Microphone Plan', heading: HeadingLevel.HEADING_1 }));
    children.push(
      createTable(
        ['Source', 'Microphone', 'Qty', 'Position', 'Notes'],
        project.microphonePlan.map((m) => [m.source, m.microphone, (m.quantity || 1).toString(), m.position, m.notes || ''])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Input List
  if (project.inputList.length > 0) {
    children.push(new Paragraph({ text: 'Input List', heading: HeadingLevel.HEADING_1 }));
    children.push(
      createTable(
        ['Ch', 'Source', 'Microphone', 'Preamp', 'Notes'],
        project.inputList.map((i) => [i.channel.toString(), i.source, i.microphone, i.preamp || '', i.notes || ''])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Setup Notes
  if (project.setupNotes.description) {
    children.push(new Paragraph({ text: 'Setup Notes', heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: htmlToPlainText(project.setupNotes.description) }));
    children.push(new Paragraph({ text: '' }));
  }

  // Atmos Config
  if (project.atmosConfig) {
    children.push(new Paragraph({ text: 'Atmos Configuration', heading: HeadingLevel.HEADING_1 }));
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Renderer: ', bold: true }), new TextRun({ text: project.atmosConfig.rendererType })],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Bed Format: ', bold: true }), new TextRun({ text: project.atmosConfig.bedFormat })],
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Max Objects: ', bold: true }),
          new TextRun({ text: project.atmosConfig.maxObjects.toString() }),
        ],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Deliverables: ', bold: true }), new TextRun({ text: project.atmosConfig.deliverables })],
      })
    );
    if (project.atmosConfig.notes) {
      children.push(new Paragraph({ text: htmlToPlainText(project.atmosConfig.notes) }));
    }
    if (project.atmosConfig.tracks.length > 0) {
      children.push(new Paragraph({ text: '' }));
      children.push(
        createTable(
          ['Track', 'Type', 'Bed Assignment', 'Behavior', 'Height', 'Notes'],
          project.atmosConfig.tracks.map((t) => [
            t.name,
            t.type,
            t.bedAssignment || '',
            t.objectBehavior || '',
            t.heightLayer || '',
            t.notes || '',
          ])
        )
      );
    }
    children.push(new Paragraph({ text: '' }));
  }

  // Timeline
  if (project.timeline.length > 0) {
    children.push(new Paragraph({ text: 'Timeline', heading: HeadingLevel.HEADING_1 }));
    children.push(
      createTable(
        ['Phase', 'Description', 'Start', 'End'],
        project.timeline.map((t) => [t.phase, t.description, t.startDate, t.endDate])
      )
    );
    children.push(new Paragraph({ text: '' }));
  }

  // Sessions
  if (project.sessions.length > 0) {
    children.push(new Paragraph({ text: 'Session Schedule', heading: HeadingLevel.HEADING_1 }));
    for (const session of project.sessions) {
      const dateStr = session.date ? format(new Date(session.date), 'EEEE, MMMM d, yyyy') : 'Date TBD';
      children.push(
        new Paragraph({
          text: `${dateStr} - ${SESSION_TYPE_LABELS[session.type]}`,
          heading: HeadingLevel.HEADING_2,
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Time: ', bold: true }), new TextRun({ text: `${session.startTime} - ${session.endTime}` })],
        })
      );
      if (session.venue) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: 'Venue: ', bold: true }), new TextRun({ text: session.venue })],
          })
        );
      }
      if (session.schedule.length > 0) {
        children.push(new Paragraph({ text: '' }));
        children.push(
          createTable(
            ['Start', 'End', 'Activity', 'Notes'],
            session.schedule.map((s) => [s.startHour, s.endHour, s.activity, s.notes || ''])
          )
        );
      }
      children.push(new Paragraph({ text: '' }));
    }
  }

  // Equipment Checklist (separate page)
  if (project.equipment.length > 0) {
    children.push(
      new Paragraph({
        children: [new PageBreak()],
      })
    );
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'EQUIPMENT CHECKLIST', bold: true, size: 36 })],
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `${project.overview.name} - Use this page to verify all equipment is packed/present`,
            italics: true,
            size: 20,
          }),
        ],
        alignment: AlignmentType.CENTER,
      })
    );
    children.push(new Paragraph({ text: '' }));

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
      const categoryLabel = category.charAt(0).toUpperCase() + category.slice(1);
      children.push(
        new Paragraph({
          children: [new TextRun({ text: categoryLabel, bold: true, size: 24 })],
        })
      );

      for (const item of items) {
        const qty = item.quantity > 1 ? ` (x${item.quantity})` : '';
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `☐  ${item.item}${qty}`, size: 22 })],
          })
        );
      }
      children.push(new Paragraph({ text: '' }));
    }
  }

  // Take Sheets (one page per track)
  if (project.trackList && project.trackList.length > 0) {
    const sortedTracks = [...project.trackList].sort((a, b) => a.trackNumber - b.trackNumber);

    for (const track of sortedTracks) {
      // Page break before each take sheet
      children.push(
        new Paragraph({
          children: [new PageBreak()],
        })
      );

      // Title
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'TAKE SHEET', bold: true, size: 36 })],
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Track ${track.trackNumber}: ${track.title || 'Untitled'}`, bold: true, size: 28 })],
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(
        new Paragraph({
          children: [new TextRun({ text: project.overview.name, italics: true, size: 20 })],
          alignment: AlignmentType.CENTER,
        })
      );
      children.push(new Paragraph({ text: '' }));

      // Metadata
      if (track.duration) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Duration: ', bold: true }),
              new TextRun({ text: track.duration }),
            ],
          })
        );
      }

      if (track.personnel.length > 0) {
        const personnelNames = track.personnel
          .map(id => project.personnel.find(p => p.id === id)?.name)
          .filter(Boolean)
          .join(', ');
        if (personnelNames) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Personnel: ', bold: true }),
                new TextRun({ text: personnelNames }),
              ],
            })
          );
        }
      }

      if (track.instruments.length > 0) {
        const instrumentNames = track.instruments
          .map(id => project.instrumentation.find(i => i.id === id)?.instrument)
          .filter(Boolean)
          .join(', ');
        if (instrumentNames) {
          children.push(
            new Paragraph({
              children: [
                new TextRun({ text: 'Instruments: ', bold: true }),
                new TextRun({ text: instrumentNames }),
              ],
            })
          );
        }
      }

      if (track.notes) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: 'Notes: ', bold: true }),
              new TextRun({ text: track.notes }),
            ],
          })
        );
      }

      children.push(new Paragraph({ text: '' }));

      // Take table
      const takeRows: TableRow[] = [];

      // Header row
      takeRows.push(
        new TableRow({
          children: ['Take', 'Timecode', 'Circle', 'Notes'].map(
            (text) =>
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text, bold: true, size: 20 })],
                  }),
                ],
                shading: { fill: '0EA5E9' },
              })
          ),
        })
      );

      // Data rows (20 takes)
      for (let i = 1; i <= 20; i++) {
        takeRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [new Paragraph({ children: [new TextRun({ text: i.toString(), size: 20 })] })],
              }),
              new TableCell({
                children: [new Paragraph({ text: '' })],
              }),
              new TableCell({
                children: [new Paragraph({ text: '' })],
              }),
              new TableCell({
                children: [new Paragraph({ text: '' })],
              }),
            ],
          })
        );
      }

      children.push(
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            left: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            right: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
            insideVertical: { style: BorderStyle.SINGLE, size: 1, color: 'CCCCCC' },
          },
          rows: takeRows,
        })
      );
    }
  }

  const doc = new Document({
    sections: [{ children }],
  });

  return doc;
}

// Generate DOCX as Blob (for bulk export)
export async function generateDOCXBlob(project: Project): Promise<Blob> {
  const doc = await generateDOCXDocument(project);
  return Packer.toBlob(doc);
}

// Export DOCX (triggers download)
export async function exportToDOCX(project: Project): Promise<void> {
  const blob = await generateDOCXBlob(project);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_prelude.docx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
