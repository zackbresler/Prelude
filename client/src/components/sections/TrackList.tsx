import { useProjectStore } from '@/store/projectStore';
import { Section, Button } from '@/components/common';
import type { Track } from '@/types/project';

export default function TrackList() {
  const { getCurrentProject, addTrack, updateTrack, deleteTrack } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const { trackList = [], personnel, instrumentation } = project;

  const handleAddTrack = () => {
    const nextTrackNumber = trackList.length > 0
      ? Math.max(...trackList.map(t => t.trackNumber)) + 1
      : 1;
    addTrack({
      trackNumber: nextTrackNumber,
      title: '',
      duration: '',
      personnel: [],
      instruments: [],
      notes: '',
    });
  };

  const togglePersonnel = (trackId: string, personId: string, currentPersonnel: string[]) => {
    const newPersonnel = currentPersonnel.includes(personId)
      ? currentPersonnel.filter(id => id !== personId)
      : [...currentPersonnel, personId];
    updateTrack(trackId, { personnel: newPersonnel });
  };

  const toggleInstrument = (trackId: string, instrumentId: string, currentInstruments: string[]) => {
    const newInstruments = currentInstruments.includes(instrumentId)
      ? currentInstruments.filter(id => id !== instrumentId)
      : [...currentInstruments, instrumentId];
    updateTrack(trackId, { instruments: newInstruments });
  };

  return (
    <Section
      title="Track List"
      description="Document the tracks for this project, including contributing personnel and instrumentation"
    >
      {trackList.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <p className="mb-4">No tracks added yet.</p>
          <Button onClick={handleAddTrack}>Add First Track</Button>
        </div>
      ) : (
        <div className="space-y-6">
          {trackList
            .sort((a, b) => a.trackNumber - b.trackNumber)
            .map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                personnel={personnel}
                instrumentation={instrumentation}
                onUpdate={(updates) => updateTrack(track.id, updates)}
                onDelete={() => deleteTrack(track.id)}
                onTogglePersonnel={(personId) => togglePersonnel(track.id, personId, track.personnel)}
                onToggleInstrument={(instrumentId) => toggleInstrument(track.id, instrumentId, track.instruments)}
              />
            ))}
          <div className="flex justify-center">
            <Button onClick={handleAddTrack} variant="secondary">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Track
            </Button>
          </div>
        </div>
      )}
    </Section>
  );
}

interface TrackCardProps {
  track: Track;
  personnel: { id: string; name: string; roles: string[] }[];
  instrumentation: { id: string; instrument: string; performer: string }[];
  onUpdate: (updates: Partial<Track>) => void;
  onDelete: () => void;
  onTogglePersonnel: (personId: string) => void;
  onToggleInstrument: (instrumentId: string) => void;
}

function TrackCard({
  track,
  personnel,
  instrumentation,
  onUpdate,
  onDelete,
  onTogglePersonnel,
  onToggleInstrument,
}: TrackCardProps) {
  return (
    <div className="border border-surface-100 rounded-lg p-4 bg-surface-200">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Track Number */}
          <div className="flex-shrink-0">
            <label className="block text-xs font-medium text-gray-400 mb-1">Track #</label>
            <input
              type="number"
              value={track.trackNumber}
              onChange={(e) => onUpdate({ trackNumber: parseInt(e.target.value) || 1 })}
              className="w-16 px-2 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 rounded text-center text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
              min={1}
            />
          </div>

          {/* Title */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-400 mb-1">Title</label>
            <input
              type="text"
              value={track.title}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Track title"
              className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>

          {/* Duration */}
          <div className="w-24">
            <label className="block text-xs font-medium text-gray-400 mb-1">Duration</label>
            <input
              type="text"
              value={track.duration || ''}
              onChange={(e) => onUpdate({ duration: e.target.value })}
              placeholder="e.g., 3:45"
              className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            />
          </div>
        </div>

        {/* Delete Button */}
        <button
          onClick={onDelete}
          className="text-gray-500 hover:text-red-400 transition-colors p-1"
          title="Delete track"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Personnel Selection */}
      {personnel.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2">Personnel</label>
          <div className="flex flex-wrap gap-2">
            {personnel.map((person) => {
              const isSelected = track.personnel.includes(person.id);
              return (
                <button
                  key={person.id}
                  type="button"
                  onClick={() => onTogglePersonnel(person.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
                      : 'bg-surface-300 border-surface-100 text-gray-400 hover:bg-surface-100 hover:text-gray-300'
                  }`}
                >
                  {person.name}
                  {person.roles.length > 0 && (
                    <span className="text-xs opacity-70 ml-1">
                      ({person.roles.join(', ')})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Instrumentation Selection */}
      {instrumentation.length > 0 && (
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2">Instrumentation</label>
          <div className="flex flex-wrap gap-2">
            {instrumentation.map((inst) => {
              const isSelected = track.instruments.includes(inst.id);
              return (
                <button
                  key={inst.id}
                  type="button"
                  onClick={() => onToggleInstrument(inst.id)}
                  className={`px-3 py-1 text-sm rounded-full border transition-colors ${
                    isSelected
                      ? 'bg-green-600/20 border-green-500/30 text-green-400'
                      : 'bg-surface-300 border-surface-100 text-gray-400 hover:bg-surface-100 hover:text-gray-300'
                  }`}
                >
                  {inst.instrument}
                  {inst.performer && (
                    <span className="text-xs opacity-70 ml-1">
                      ({inst.performer})
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">Notes</label>
        <textarea
          value={track.notes || ''}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          placeholder="Additional notes about this track..."
          rows={2}
          className="w-full px-3 py-1.5 border border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 rounded text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-y transition-colors"
        />
      </div>

      {/* Show warning if no personnel or instrumentation are defined */}
      {personnel.length === 0 && instrumentation.length === 0 && (
        <p className="text-xs text-accent-400 mt-3">
          Tip: Add personnel and instrumentation in the previous sections to select them here.
        </p>
      )}
    </div>
  );
}
