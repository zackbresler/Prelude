import { useProjectStore } from '@/store/projectStore';
import { Section, Input, Select, Table, Column, RichTextEditor, Button } from '@/components/common';
import type { AtmosTrack } from '@/types/project';

const BED_FORMAT_OPTIONS = [
  { value: '7.1.4', label: '7.1.4' },
  { value: '7.1.2', label: '7.1.2' },
  { value: '5.1.4', label: '5.1.4' },
  { value: '5.1.2', label: '5.1.2' },
  { value: '5.1', label: '5.1' },
];

const TRACK_TYPE_OPTIONS = [
  { value: 'bed', label: 'Bed' },
  { value: 'object', label: 'Object' },
];

const HEIGHT_LAYER_OPTIONS = [
  { value: 'floor', label: 'Floor' },
  { value: 'mid', label: 'Mid' },
  { value: 'overhead', label: 'Overhead' },
];

const BED_ASSIGNMENT_OPTIONS = [
  { value: 'L', label: 'Left' },
  { value: 'R', label: 'Right' },
  { value: 'C', label: 'Center' },
  { value: 'LFE', label: 'LFE' },
  { value: 'Ls', label: 'Left Surround' },
  { value: 'Rs', label: 'Right Surround' },
  { value: 'Lrs', label: 'Left Rear Surround' },
  { value: 'Rrs', label: 'Right Rear Surround' },
  { value: 'Ltf', label: 'Left Top Front' },
  { value: 'Rtf', label: 'Right Top Front' },
  { value: 'Ltr', label: 'Left Top Rear' },
  { value: 'Rtr', label: 'Right Top Rear' },
];

const OBJECT_BEHAVIOR_OPTIONS = [
  { value: 'static', label: 'Static' },
  { value: 'dynamic', label: 'Dynamic' },
];

export default function AtmosConfig() {
  const { getCurrentProject, updateAtmosConfig, addAtmosTrack, updateAtmosTrack, deleteAtmosTrack, reorderAtmosTrack } = useProjectStore();
  const project = getCurrentProject();

  if (!project || !project.atmosConfig) return null;

  const { atmosConfig } = project;

  const columns: Column<AtmosTrack>[] = [
    { key: 'name', header: 'Track Name', placeholder: 'e.g., Lead Vocal, Drums' },
    { key: 'type', header: 'Type', type: 'select', options: TRACK_TYPE_OPTIONS, width: '100px' },
    { key: 'bedAssignment', header: 'Bed Assignment', type: 'select', options: BED_ASSIGNMENT_OPTIONS, width: '140px' },
    { key: 'objectBehavior', header: 'Object Behavior', type: 'select', options: OBJECT_BEHAVIOR_OPTIONS, width: '120px' },
    { key: 'heightLayer', header: 'Height Layer', type: 'select', options: HEIGHT_LAYER_OPTIONS, width: '110px' },
    { key: 'notes', header: 'Notes', placeholder: 'Position, automation, etc.' },
  ];

  const importFromInputList = () => {
    // Get existing track names in atmos config (case-insensitive)
    const existingTracks = new Set(
      atmosConfig.tracks.map((t) => t.name.toLowerCase())
    );

    // Add sources from input list that aren't already in the atmos tracks
    let added = 0;
    for (const input of project.inputList) {
      if (input.source && !existingTracks.has(input.source.toLowerCase())) {
        addAtmosTrack({
          name: input.source,
          type: 'object',
          bedAssignment: '',
          objectBehavior: 'static',
          heightLayer: 'floor',
          notes: `Ch ${input.channel}`,
        });
        existingTracks.add(input.source.toLowerCase());
        added++;
      }
    }

    if (added === 0) {
      alert('All sources from the input list are already in the Atmos track allocation.');
    }
  };

  const hasInputsToImport = project.inputList.some((i) => i.source);

  return (
    <div className="space-y-6">
      <Section title="Atmos Configuration" description="Dolby Atmos renderer and format settings">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Renderer Type"
            value={atmosConfig.rendererType}
            onChange={(e) => updateAtmosConfig({ rendererType: e.target.value })}
            placeholder="e.g., Dolby Atmos Renderer, Pro Tools"
          />
          <Select
            label="Bed Format"
            value={atmosConfig.bedFormat}
            onChange={(e) => updateAtmosConfig({ bedFormat: e.target.value })}
            options={BED_FORMAT_OPTIONS}
          />
          <Input
            label="Max Objects"
            type="number"
            value={atmosConfig.maxObjects}
            onChange={(e) => updateAtmosConfig({ maxObjects: Number(e.target.value) })}
          />
          <Input
            label="Deliverables"
            value={atmosConfig.deliverables}
            onChange={(e) => updateAtmosConfig({ deliverables: e.target.value })}
            placeholder="e.g., ADM BWF, Binaural, 7.1.4"
          />
        </div>
        <div className="mt-6">
          <RichTextEditor
            label="Atmos Notes"
            value={atmosConfig.notes}
            onChange={(notes) => updateAtmosConfig({ notes })}
            placeholder="Special considerations for immersive mix, panning strategies, etc."
            rows={4}
          />
        </div>
      </Section>

      <Section title="Atmos Track Allocation" description="Bed and object assignments for each element">
        {hasInputsToImport && (
          <div className="mb-4">
            <Button variant="secondary" size="sm" onClick={importFromInputList}>
              Import Sources from Input List
            </Button>
          </div>
        )}
        <Table
          columns={columns}
          data={atmosConfig.tracks}
          onAdd={() =>
            addAtmosTrack({
              name: '',
              type: 'bed',
              bedAssignment: '',
              objectBehavior: '',
              heightLayer: 'floor',
              notes: '',
            })
          }
          onUpdate={updateAtmosTrack}
          onDelete={deleteAtmosTrack}
          onReorder={reorderAtmosTrack}
          addLabel="Add Track"
          emptyMessage="No tracks allocated yet. Click 'Add Track' to plan your Atmos layout."
        />
      </Section>
    </div>
  );
}
