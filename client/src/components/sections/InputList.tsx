import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { InputListItem } from '@/types/project';

export default function InputList() {
  const { getCurrentProject, addInputList, updateInputList, deleteInputList } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const getNextChannel = () => {
    if (project.inputList.length === 0) return 1;
    return Math.max(...project.inputList.map((i) => i.channel)) + 1;
  };

  const columns: Column<InputListItem>[] = [
    { key: 'channel', header: 'Ch', type: 'number', width: '80px' },
    { key: 'source', header: 'Source', placeholder: 'e.g., Kick In, Snare Top' },
    { key: 'microphone', header: 'Microphone', placeholder: 'e.g., D112, SM57' },
    { key: 'preamp', header: 'Preamp', placeholder: 'e.g., Neve 1073, API 512' },
    { key: 'notes', header: 'Notes', placeholder: 'Insert, processing, etc.' },
  ];

  return (
    <Section
      title="Input List"
      description="Channel assignments from source to console/interface"
    >
      <Table
        columns={columns}
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
        addLabel="Add Channel"
        emptyMessage="No channels assigned yet. Click 'Add Channel' to build your input list."
      />
    </Section>
  );
}
