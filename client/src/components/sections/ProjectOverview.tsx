import { useProjectStore } from '@/store/projectStore';
import { PROJECT_TYPE_LABELS, ProjectType } from '@/types/project';
import { Section, Input, TextArea, Select, RichTextEditor } from '@/components/common';

export default function ProjectOverview() {
  const { getCurrentProject, updateOverview } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const { overview } = project;

  const projectTypeOptions = Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="space-y-6">
      <Section title="Project Overview" description="Basic information about this recording project">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Project Name"
            value={overview.name}
            onChange={(e) => updateOverview({ name: e.target.value })}
            placeholder="Enter project name"
          />
          <Input
            label="Client"
            value={overview.client}
            onChange={(e) => updateOverview({ client: e.target.value })}
            placeholder="Client or artist name"
          />
          <Select
            label="Project Type"
            value={overview.projectType}
            onChange={(e) => updateOverview({ projectType: e.target.value as ProjectType })}
            options={projectTypeOptions}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={overview.startDate}
              onChange={(e) => updateOverview({ startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={overview.endDate}
              onChange={(e) => updateOverview({ endDate: e.target.value })}
            />
          </div>
        </div>
        <div className="mt-6">
          <RichTextEditor
            label="Project Description"
            value={overview.description}
            onChange={(description) => updateOverview({ description })}
            placeholder="Describe the project, goals, and any important context..."
            rows={4}
          />
        </div>
        <div className="mt-6">
          <TextArea
            label="Additional Notes"
            value={overview.notes}
            onChange={(e) => updateOverview({ notes: e.target.value })}
            placeholder="Any other notes about the project..."
            rows={3}
          />
        </div>
      </Section>
    </div>
  );
}
