import { useProjectStore } from '@/store/projectStore';
import { Section, Button } from '@/components/common';
import type { Instrumentation as InstrumentationType } from '@/types/project';

export default function Instrumentation() {
  const { getCurrentProject, addInstrumentation, updateInstrumentation, deleteInstrumentation } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const { instrumentation, personnel, trackList = [] } = project;

  // Get track names that use a given instrument
  const getTrackNamesForInstrument = (instrumentId: string): string[] => {
    return trackList
      .filter(track => track.instruments.includes(instrumentId))
      .sort((a, b) => a.trackNumber - b.trackNumber)
      .map(track => track.title)
      .filter(Boolean);
  };

  const handleAddInstrumentation = () => {
    addInstrumentation({
      instrument: '',
      performer: '',
      performerIds: [],
      trackName: '',
      notes: '',
    });
  };

  const togglePerformer = (instrumentId: string, personId: string, currentPerformerIds: string[]) => {
    const newPerformerIds = currentPerformerIds.includes(personId)
      ? currentPerformerIds.filter(id => id !== personId)
      : [...currentPerformerIds, personId];
    updateInstrumentation(instrumentId, { performerIds: newPerformerIds });
  };

  return (
    <Section
      title="Instrumentation"
      description="List of instruments and who is playing them. Performers are linked from the Personnel section, and track names are auto-populated from the Track List."
    >
      {instrumentation.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-4">No instruments added yet.</p>
          <Button onClick={handleAddInstrumentation}>Add First Instrument</Button>
        </div>
      ) : (
        <div className="space-y-4">
          {instrumentation.map((inst) => (
            <InstrumentCard
              key={inst.id}
              instrument={inst}
              personnel={personnel}
              linkedTrackNames={getTrackNamesForInstrument(inst.id)}
              onUpdate={(updates) => updateInstrumentation(inst.id, updates)}
              onDelete={() => deleteInstrumentation(inst.id)}
              onTogglePerformer={(personId) => togglePerformer(inst.id, personId, inst.performerIds || [])}
            />
          ))}
          <div className="flex justify-center pt-2">
            <Button onClick={handleAddInstrumentation} variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Instrument
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

interface InstrumentCardProps {
  instrument: InstrumentationType;
  personnel: { id: string; name: string; roles: string[] }[];
  linkedTrackNames: string[];
  onUpdate: (updates: Partial<InstrumentationType>) => void;
  onDelete: () => void;
  onTogglePerformer: (personId: string) => void;
}

function InstrumentCard({
  instrument,
  personnel,
  linkedTrackNames,
  onUpdate,
  onDelete,
  onTogglePerformer,
}: InstrumentCardProps) {
  const performerIds = instrument.performerIds || [];

  // Get performer names for display
  const performerNames = performerIds
    .map(id => personnel.find(p => p.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div className="border border-surface-100 rounded-lg p-4 bg-surface-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-400 mb-1">Instrument</label>
          <input
            type="text"
            value={instrument.instrument}
            onChange={(e) => onUpdate({ instrument: e.target.value })}
            placeholder="e.g., Drums, Bass, Lead Vocal"
            className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="text-gray-500 hover:text-red-400 transition-colors p-1 mt-5"
          title="Delete instrument"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Performer Selection */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-2">
          Performer(s)
          {performerNames && <span className="font-normal text-gray-500 ml-2">— {performerNames}</span>}
        </label>
        {personnel.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {personnel.map((person) => {
              const isSelected = performerIds.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onTogglePerformer(person.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
                      : 'bg-surface-300 border-surface-100 text-gray-400 hover:bg-surface-100 hover:text-gray-300'
                  }`}
                >
                  {person.name}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-accent-400">
            Add personnel in the Personnel section to select performers here.
          </p>
        )}
      </div>

      {/* Track Names - Auto-populated from Track List */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Track Name(s)
          {linkedTrackNames.length > 0 && (
            <span className="font-normal text-green-400 ml-2">— Auto-linked from Track List</span>
          )}
        </label>
        {linkedTrackNames.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {linkedTrackNames.map((name, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-sm bg-green-600/20 border border-green-500/30 text-green-400 rounded"
              >
                {name}
              </span>
            ))}
          </div>
        ) : (
          <input
            type="text"
            value={instrument.trackName || ''}
            onChange={(e) => onUpdate({ trackName: e.target.value })}
            placeholder="DAW track name (or select this instrument in Track List)"
            className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
          />
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
        <input
          type="text"
          value={instrument.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Additional info"
          className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
        />
      </div>
    </div>
  );
}
