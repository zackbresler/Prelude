import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { InputListItem, Preamp } from '@/types/project';

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

  const getNextChannel = () => {
    if (project.inputList.length === 0) return 1;
    return Math.max(...project.inputList.map((i) => i.channel)) + 1;
  };

  // Generate preamp channel options from the preamps list
  const preampChannelOptions = (() => {
    const options: { value: string; label: string }[] = [];
    const preamps = project.preamps || [];

    for (const preamp of preamps) {
      for (let unit = 1; unit <= preamp.quantity; unit++) {
        for (let channel = 1; channel <= preamp.channelsPerUnit; channel++) {
          const unitSuffix = preamp.quantity > 1 ? `-${unit}` : '';
          const value = `${preamp.name}${unitSuffix} ${channel}`;
          options.push({ value, label: value });
        }
      }
    }

    return options;
  })();

  const inputColumns: Column<InputListItem>[] = [
    { key: 'channel', header: 'Ch', type: 'number', width: '80px' },
    { key: 'source', header: 'Source', placeholder: 'e.g., Kick In, Snare Top' },
    { key: 'microphone', header: 'Microphone', placeholder: 'e.g., D112, SM57' },
    preampChannelOptions.length > 0
      ? { key: 'preamp', header: 'Preamp', type: 'select', options: preampChannelOptions, width: '180px' }
      : { key: 'preamp', header: 'Preamp', placeholder: 'Add preamps below first' },
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
        title="Input List"
        description="Channel assignments from source to console/interface"
      >
        <Table
          columns={inputColumns}
          data={project.inputList}
          onAdd={() =>
            addInputList({
              channel: getNextChannel(),
              source: '',
              microphone: '',
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

      <Section
        title="Preamp Configuration"
        description="Define your preamps to enable channel selection in the input list above"
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
    </div>
  );
}
