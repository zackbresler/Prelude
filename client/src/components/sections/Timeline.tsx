import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { TimelinePhase } from '@/types/project';

const PHASE_OPTIONS = [
  { value: 'pre-production', label: 'Pre-Production' },
  { value: 'setup', label: 'Setup' },
  { value: 'recording', label: 'Recording' },
  { value: 'overdubs', label: 'Overdubs' },
  { value: 'editing', label: 'Editing' },
  { value: 'mixing', label: 'Mixing' },
  { value: 'mastering', label: 'Mastering' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other', label: 'Other' },
];

export default function Timeline() {
  const { getCurrentProject, addTimeline, updateTimeline, deleteTimeline } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const columns: Column<TimelinePhase>[] = [
    { key: 'phase', header: 'Phase', type: 'select', options: PHASE_OPTIONS, width: '150px' },
    {
      key: 'description',
      header: 'Description',
      render: (item) => (
        <textarea
          value={item.description}
          onChange={(e) => updateTimeline(item.id, { description: e.target.value })}
          placeholder="What happens in this phase"
          rows={3}
          className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 text-sm focus:border-primary-500 focus:ring-primary-500 resize-y transition-colors"
        />
      ),
    },
    {
      key: 'startDate',
      header: 'Start',
      width: '140px',
      render: (item) => (
        <input
          type="date"
          value={item.startDate}
          onChange={(e) => updateTimeline(item.id, { startDate: e.target.value })}
          className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
        />
      ),
    },
    {
      key: 'endDate',
      header: 'End',
      width: '140px',
      render: (item) => (
        <input
          type="date"
          value={item.endDate}
          onChange={(e) => updateTimeline(item.id, { endDate: e.target.value })}
          className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
        />
      ),
    },
  ];

  return (
    <Section
      title="Project Timeline"
      description="Major phases and milestones for the project"
    >
      <Table
        columns={columns}
        data={project.timeline}
        onAdd={() =>
          addTimeline({
            phase: 'recording',
            description: '',
            startDate: '',
            endDate: '',
          })
        }
        onUpdate={updateTimeline}
        onDelete={deleteTimeline}
        addLabel="Add Phase"
        emptyMessage="No timeline phases added yet. Click 'Add Phase' to plan your project timeline."
      />
    </Section>
  );
}
