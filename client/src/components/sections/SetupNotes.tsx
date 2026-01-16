import { useProjectStore } from '@/store/projectStore';
import { Section, ImageUpload, RichTextEditor } from '@/components/common';

export default function SetupNotes() {
  const { getCurrentProject, updateSetupNotes, addSetupDiagram, updateSetupDiagram, deleteSetupDiagram } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const { setupNotes } = project;

  return (
    <div className="space-y-6">
      <Section title="Setup Notes" description="Detailed setup description and notes">
        <RichTextEditor
          label="Setup Description"
          value={setupNotes.description}
          onChange={(description) => updateSetupNotes({ description })}
          placeholder="Describe the overall setup, signal flow, special configurations, isolation needs, etc."
          rows={8}
        />
      </Section>

      <Section title="Setup Diagrams" description="Visual references for the setup">
        <ImageUpload
          images={setupNotes.diagrams}
          onAdd={addSetupDiagram}
          onUpdate={updateSetupDiagram}
          onDelete={deleteSetupDiagram}
          label="Upload setup diagrams, stage plots, or reference images"
        />
      </Section>
    </div>
  );
}
