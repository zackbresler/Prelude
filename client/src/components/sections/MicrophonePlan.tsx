import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { MicrophonePlanItem } from '@/types/project';

export default function MicrophonePlan() {
  const { getCurrentProject, addMicrophonePlan, updateMicrophonePlan, deleteMicrophonePlan, reorderMicrophonePlan } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const columns: Column<MicrophonePlanItem>[] = [
    { key: 'source', header: 'Source', placeholder: 'e.g., Kick, Snare Top, Vocal' },
    { key: 'microphone', header: 'Microphone', placeholder: 'e.g., SM57, U87, RE20' },
    { key: 'quantity', header: 'Qty', type: 'number', width: '70px' },
    { key: 'position', header: 'Position', placeholder: 'e.g., 2" from cone, 6" above' },
    { key: 'notes', header: 'Notes', placeholder: 'Polar pattern, pad, etc.' },
  ];

  return (
    <Section
      title="Microphone Plan"
      description="Microphone selection and positioning for each source"
    >
      <Table
        columns={columns}
        data={project.microphonePlan}
        onAdd={() => addMicrophonePlan({ source: '', microphone: '', quantity: 1, position: '', notes: '' })}
        onUpdate={updateMicrophonePlan}
        onDelete={deleteMicrophonePlan}
        onReorder={reorderMicrophonePlan}
        addLabel="Add Microphone"
        emptyMessage="No microphones planned yet. Click 'Add Microphone' to build your mic plan."
      />
    </Section>
  );
}
