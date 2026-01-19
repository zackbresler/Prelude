import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { InputListItem, Preamp, TrackFormat, TrackColor } from '@/types/project';
import { TRACK_COLOR_OPTIONS } from '@/types/project';

const TRACK_FORMAT_OPTIONS = [
  { value: 'mono', label: 'Mono' },
  { value: 'stereo', label: 'Stereo' },
];

export default function InputList() {
  const {
    getCurrentProject,
    addInputList,
    updateInputList,
    deleteInputList,
    reorderInputList,
    addPreamp,
    updatePreamp,
    deletePreamp,
    reorderPreamp,
  } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  // Get the next available channel(s) based on existing assignments
  const getNextChannel = (format: TrackFormat = 'mono'): string => {
    if (project.inputList.length === 0) {
      return format === 'stereo' ? '1-2' : '1';
    }

    // Find the highest channel number used
    let maxChannel = 0;
    for (const item of project.inputList) {
      const channelStr = item.channel || '0';
      // Handle both "5" and "5-6" formats
      const parts = channelStr.split('-');
      const highest = Math.max(...parts.map(p => parseInt(p) || 0));
      if (highest > maxChannel) maxChannel = highest;
    }

    const nextChannel = maxChannel + 1;
    return format === 'stereo' ? `${nextChannel}-${nextChannel + 1}` : String(nextChannel);
  };

  // Generate preamp channel options - both mono and stereo pairs
  const generatePreampOptions = (format: TrackFormat) => {
    const options: { value: string; label: string }[] = [];
    const preamps = project.preamps || [];

    for (const preamp of preamps) {
      for (let unit = 1; unit <= preamp.quantity; unit++) {
        const unitSuffix = preamp.quantity > 1 ? `-${unit}` : '';
        const baseName = `${preamp.name}${unitSuffix}`;

        if (format === 'mono') {
          // Single channels
          for (let channel = 1; channel <= preamp.channelsPerUnit; channel++) {
            const value = `${baseName} ${channel}`;
            options.push({ value, label: value });
          }
        } else {
          // Stereo pairs (1-2, 3-4, etc.)
          for (let channel = 1; channel < preamp.channelsPerUnit; channel += 2) {
            const value = `${baseName} ${channel}-${channel + 1}`;
            options.push({ value, label: value });
          }
        }
      }
    }

    return options;
  };

  const monoPreampOptions = generatePreampOptions('mono');
  const stereoPreampOptions = generatePreampOptions('stereo');

  const inputColumns: Column<InputListItem>[] = [
    { key: 'channel', header: 'Ch', width: '80px', placeholder: '1 or 1-2' },
    { key: 'trackFormat', header: 'Format', type: 'select', options: TRACK_FORMAT_OPTIONS, width: '100px' },
    { key: 'source', header: 'Source', placeholder: 'e.g., Kick In, Snare Top' },
    { key: 'microphone', header: 'Microphone', placeholder: 'e.g., D112, SM57' },
    {
      key: 'preamp',
      header: 'Preamp',
      width: '180px',
      render: (item) => {
        const options = item.trackFormat === 'stereo' ? stereoPreampOptions : monoPreampOptions;
        if (options.length === 0) {
          return (
            <input
              type="text"
              value={item.preamp || ''}
              onChange={(e) => updateInputList(item.id, { preamp: e.target.value })}
              placeholder="Add preamps above first"
              className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
            />
          );
        }
        return (
          <select
            value={item.preamp || ''}
            onChange={(e) => updateInputList(item.id, { preamp: e.target.value })}
            className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
          >
            <option value="">Select...</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      },
    },
    {
      key: 'trackColor',
      header: 'Color',
      width: '100px',
      render: (item) => (
        <div className="relative">
          <select
            value={item.trackColor || ''}
            onChange={(e) => updateInputList(item.id, { trackColor: e.target.value as TrackColor })}
            className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
            title="Color may not be supported in all DAWs"
          >
            {TRACK_COLOR_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {item.trackColor && (
            <div
              className="absolute right-8 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-surface-50"
              style={{ backgroundColor: item.trackColor }}
            />
          )}
        </div>
      ),
    },
    { key: 'notes', header: 'Notes', placeholder: 'Insert, processing, etc.' },
  ];

  const preampColumns: Column<Preamp>[] = [
    { key: 'name', header: 'Preamp Model', placeholder: 'e.g., Grace m103, Neve 1073' },
    { key: 'channelsPerUnit', header: 'Channels', type: 'number', width: '100px' },
    { key: 'quantity', header: 'Qty', type: 'number', width: '80px' },
  ];

  return (
    <div className="space-y-8">
      <Section
        title="Preamp Configuration"
        description="Define your preamps to enable channel selection in the input list below"
      >
        <Table
          columns={preampColumns}
          data={project.preamps || []}
          onAdd={() =>
            addPreamp({
              name: '',
              channelsPerUnit: 8,
              quantity: 1,
            })
          }
          onUpdate={updatePreamp}
          onDelete={deletePreamp}
          onReorder={reorderPreamp}
          addLabel="Add Preamp"
          emptyMessage="No preamps defined yet. Add preamps to enable channel selection in the input list."
        />
      </Section>

      <Section
        title="Input List"
        description="Channel assignments from source to console/interface. Track color may not be supported in all DAWs."
      >
        <Table
          columns={inputColumns}
          data={project.inputList}
          onAdd={() =>
            addInputList({
              channel: getNextChannel('mono'),
              source: '',
              microphone: '',
              trackFormat: 'mono',
              trackColor: '',
              preamp: '',
              notes: '',
            })
          }
          onUpdate={updateInputList}
          onDelete={deleteInputList}
          onReorder={reorderInputList}
          addLabel="Add Channel"
          emptyMessage="No channels assigned yet. Click 'Add Channel' to build your input list."
        />
      </Section>
    </div>
  );
}
