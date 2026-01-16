import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column, Button } from '@/components/common';
import type { EquipmentItem } from '@/types/project';

const CATEGORY_OPTIONS = [
  { value: 'microphone', label: 'Microphone' },
  { value: 'preamp', label: 'Preamp' },
  { value: 'compressor', label: 'Compressor' },
  { value: 'eq', label: 'EQ' },
  { value: 'reverb', label: 'Reverb' },
  { value: 'delay', label: 'Delay' },
  { value: 'di', label: 'DI Box' },
  { value: 'cable', label: 'Cable' },
  { value: 'stand', label: 'Stand' },
  { value: 'headphones', label: 'Headphones' },
  { value: 'monitor', label: 'Monitor' },
  { value: 'interface', label: 'Interface' },
  { value: 'instrument', label: 'Instrument' },
  { value: 'amp', label: 'Amplifier' },
  { value: 'other', label: 'Other' },
];

export default function Equipment() {
  const { getCurrentProject, addEquipment, updateEquipment, deleteEquipment } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const columns: Column<EquipmentItem>[] = [
    { key: 'category', header: 'Category', type: 'select', options: CATEGORY_OPTIONS, width: '140px' },
    { key: 'item', header: 'Item', placeholder: 'e.g., Neumann U87, API 2500' },
    { key: 'quantity', header: 'Qty', type: 'number', width: '70px' },
    { key: 'serialNumber', header: 'Serial #', placeholder: 'If tracking' },
    { key: 'notes', header: 'Notes', placeholder: 'Rental, borrowed, etc.' },
  ];

  const importFromMicPlan = () => {
    // Aggregate microphones by name and sum quantities
    const micCounts = new Map<string, number>();
    for (const mic of project.microphonePlan) {
      if (mic.microphone) {
        const current = micCounts.get(mic.microphone) || 0;
        micCounts.set(mic.microphone, current + (mic.quantity || 1));
      }
    }

    // Get existing microphones in equipment list
    const existingMics = new Set(
      project.equipment
        .filter((e) => e.category === 'microphone')
        .map((e) => e.item.toLowerCase())
    );

    // Add new microphones that aren't already in the list
    let added = 0;
    for (const [micName, quantity] of micCounts) {
      if (!existingMics.has(micName.toLowerCase())) {
        addEquipment({
          category: 'microphone',
          item: micName,
          quantity,
          serialNumber: '',
          notes: 'From mic plan',
        });
        added++;
      }
    }

    if (added === 0) {
      alert('All microphones from the mic plan are already in the equipment list.');
    }
  };

  const hasMicsToImport = project.microphonePlan.some((m) => m.microphone);

  return (
    <Section
      title="Equipment"
      description="Full equipment list for the project"
    >
      {hasMicsToImport && (
        <div className="mb-4">
          <Button variant="secondary" size="sm" onClick={importFromMicPlan}>
            Import Microphones from Mic Plan
          </Button>
        </div>
      )}
      <Table
        columns={columns}
        data={project.equipment}
        onAdd={() =>
          addEquipment({
            category: '',
            item: '',
            quantity: 1,
            serialNumber: '',
            notes: '',
          })
        }
        onUpdate={updateEquipment}
        onDelete={deleteEquipment}
        addLabel="Add Equipment"
        emptyMessage="No equipment listed yet. Click 'Add Equipment' to build your gear list."
      />
    </Section>
  );
}
