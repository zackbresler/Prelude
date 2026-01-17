import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Section, Button, Input, Select, Table, Column } from '@/components/common';
import { SESSION_TYPE_LABELS, SessionType, ScheduleBlock, Session } from '@/types/project';
import { format } from 'date-fns';

const SESSION_TYPE_OPTIONS = Object.entries(SESSION_TYPE_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function SessionSchedule() {
  const {
    getCurrentProject,
    addSession,
    updateSession,
    deleteSession,
    reorderSession,
    addScheduleBlock,
    updateScheduleBlock,
    deleteScheduleBlock,
    reorderScheduleBlock,
  } = useProjectStore();
  const project = getCurrentProject();
  const [expandedSession, setExpandedSession] = useState<string | null>(null);

  if (!project) return null;

  const handleAddSession = () => {
    addSession({
      date: '',
      type: 'recording',
      venue: '',
      startTime: '10:00',
      endTime: '18:00',
      schedule: [],
    });
  };

  const scheduleColumns: Column<ScheduleBlock>[] = [
    { key: 'startHour', header: 'Start', placeholder: '10:00', width: '100px' },
    { key: 'endHour', header: 'End', placeholder: '11:00', width: '100px' },
    { key: 'activity', header: 'Activity', placeholder: 'e.g., Drum tracking, Lunch break' },
    { key: 'notes', header: 'Notes', placeholder: 'Additional details' },
  ];

  return (
    <Section title="Session Schedule" description="Detailed day-by-day session planning">
      <div className="space-y-4">
        {project.sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <p>No sessions scheduled yet. Click 'Add Session' to plan your recording days.</p>
          </div>
        ) : (
          project.sessions.map((session, index) => (
            <SessionCard
              key={session.id}
              session={session}
              isExpanded={expandedSession === session.id}
              onToggle={() => setExpandedSession(expandedSession === session.id ? null : session.id)}
              onUpdate={(updates) => updateSession(session.id, updates)}
              onDelete={() => deleteSession(session.id)}
              onReorder={(direction) => reorderSession(session.id, direction)}
              isFirst={index === 0}
              isLast={index === project.sessions.length - 1}
              scheduleColumns={scheduleColumns}
              onAddBlock={() =>
                addScheduleBlock(session.id, {
                  startHour: '',
                  endHour: '',
                  activity: '',
                  notes: '',
                })
              }
              onUpdateBlock={(blockId, updates) => updateScheduleBlock(session.id, blockId, updates)}
              onDeleteBlock={(blockId) => deleteScheduleBlock(session.id, blockId)}
              onReorderBlock={(blockId, direction) => reorderScheduleBlock(session.id, blockId, direction)}
            />
          ))
        )}
        <Button variant="secondary" onClick={handleAddSession}>
          + Add Session
        </Button>
      </div>
    </Section>
  );
}

interface SessionCardProps {
  session: Session;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Session>) => void;
  onDelete: () => void;
  onReorder: (direction: 'up' | 'down') => void;
  isFirst: boolean;
  isLast: boolean;
  scheduleColumns: Column<ScheduleBlock>[];
  onAddBlock: () => void;
  onUpdateBlock: (blockId: string, updates: Partial<ScheduleBlock>) => void;
  onDeleteBlock: (blockId: string) => void;
  onReorderBlock: (blockId: string, direction: 'up' | 'down') => void;
}

function SessionCard({
  session,
  isExpanded,
  onToggle,
  onUpdate,
  onDelete,
  onReorder,
  isFirst,
  isLast,
  scheduleColumns,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onReorderBlock,
}: SessionCardProps) {
  const formattedDate = session.date ? format(new Date(session.date), 'EEEE, MMMM d, yyyy') : 'Date not set';

  return (
    <div className="border border-surface-100 rounded-lg overflow-hidden">
      <div
        className="bg-surface-200 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-surface-100 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-4">
          <svg
            className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div>
            <p className="font-medium text-gray-100">{formattedDate}</p>
            <p className="text-sm text-gray-400">
              {SESSION_TYPE_LABELS[session.type]} • {session.startTime} - {session.endTime}
              {session.venue && ` • ${session.venue}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReorder('up');
            }}
            disabled={isFirst}
            title="Move up"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onReorder('down');
            }}
            disabled={isLast}
            title="Move down"
          >
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              if (confirm('Delete this session?')) onDelete();
            }}
            title="Delete"
          >
            <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </Button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-6 bg-surface-300">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              label="Date"
              type="date"
              value={session.date}
              onChange={(e) => onUpdate({ date: e.target.value })}
            />
            <Select
              label="Session Type"
              value={session.type}
              onChange={(e) => onUpdate({ type: e.target.value as SessionType })}
              options={SESSION_TYPE_OPTIONS}
            />
            <Input
              label="Start Time"
              type="time"
              value={session.startTime}
              onChange={(e) => onUpdate({ startTime: e.target.value })}
            />
            <Input
              label="End Time"
              type="time"
              value={session.endTime}
              onChange={(e) => onUpdate({ endTime: e.target.value })}
            />
          </div>
          <Input
            label="Venue"
            value={session.venue || ''}
            onChange={(e) => onUpdate({ venue: e.target.value })}
            placeholder="Location for this session"
          />

          <div>
            <h4 className="text-sm font-medium text-gray-400 mb-2">Hour-by-Hour Schedule</h4>
            <Table
              columns={scheduleColumns}
              data={session.schedule}
              onAdd={onAddBlock}
              onUpdate={onUpdateBlock}
              onDelete={onDeleteBlock}
              onReorder={onReorderBlock}
              addLabel="Add Time Block"
              emptyMessage="No schedule blocks yet. Add time blocks to plan your session."
            />
          </div>
        </div>
      )}
    </div>
  );
}
