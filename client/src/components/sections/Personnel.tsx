import { useState } from 'react';
import { useProjectStore } from '@/store/projectStore';
import { Section, Table, Column } from '@/components/common';
import type { Personnel as PersonnelType } from '@/types/project';

const ROLE_OPTIONS = [
  { value: 'performer', label: 'Performer' },
  { value: 'composer', label: 'Composer' },
  { value: 'engineer', label: 'Engineer' },
  { value: 'producer', label: 'Producer' },
  { value: 'assistant', label: 'Assistant Engineer' },
  { value: 'tech', label: 'Tech/Maintenance' },
  { value: 'runner', label: 'Runner' },
  { value: 'manager', label: 'Manager' },
];

const PREDEFINED_ROLE_VALUES = ROLE_OPTIONS.map(r => r.value);

function MultiRoleSelect({
  roles,
  onChange
}: {
  roles: string[] | string | undefined;
  onChange: (roles: string[]) => void;
}) {
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherValue, setOtherValue] = useState('');

  // Handle legacy data where roles might be a string or undefined
  const normalizedRoles = Array.isArray(roles) ? roles : (roles ? [roles] : []);

  // Separate predefined roles from custom roles
  const customRoles = normalizedRoles.filter(r => !PREDEFINED_ROLE_VALUES.includes(r));

  const toggleRole = (value: string) => {
    if (normalizedRoles.includes(value)) {
      onChange(normalizedRoles.filter((r) => r !== value));
    } else {
      onChange([...normalizedRoles, value]);
    }
  };

  const addCustomRole = () => {
    const trimmed = otherValue.trim();
    if (trimmed && !normalizedRoles.includes(trimmed)) {
      onChange([...normalizedRoles, trimmed]);
    }
    setOtherValue('');
    setShowOtherInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addCustomRole();
    } else if (e.key === 'Escape') {
      setOtherValue('');
      setShowOtherInput(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 items-center">
      {/* Predefined role buttons */}
      {ROLE_OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggleRole(option.value)}
          className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
            normalizedRoles.includes(option.value)
              ? 'bg-primary-600/20 border-primary-500/30 text-primary-400'
              : 'bg-surface-300 border-surface-100 text-gray-400 hover:bg-surface-200 hover:text-gray-300'
          }`}
        >
          {option.label}
        </button>
      ))}

      {/* Custom role buttons */}
      {customRoles.map((role) => (
        <button
          key={role}
          type="button"
          onClick={() => toggleRole(role)}
          className="px-2 py-0.5 text-xs rounded-full border bg-accent-600/20 border-accent-500/30 text-accent-400 flex items-center gap-1"
        >
          {role}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}

      {/* Other button / input */}
      {showOtherInput ? (
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={otherValue}
            onChange={(e) => setOtherValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (otherValue.trim()) {
                addCustomRole();
              } else {
                setShowOtherInput(false);
              }
            }}
            placeholder="Type role..."
            autoFocus
            className="w-24 px-2 py-0.5 text-xs border border-surface-50 bg-surface-300 text-gray-100 rounded focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowOtherInput(true)}
          className="px-2 py-0.5 text-xs rounded-full border bg-surface-300 border-dashed border-surface-50 text-gray-500 hover:bg-surface-200 hover:text-gray-400"
        >
          + Other
        </button>
      )}
    </div>
  );
}

export default function Personnel() {
  const { getCurrentProject, addPersonnel, updatePersonnel, deletePersonnel } = useProjectStore();
  const project = getCurrentProject();

  if (!project) return null;

  const columns: Column<PersonnelType>[] = [
    { key: 'name', header: 'Name', placeholder: 'Full name' },
    {
      key: 'roles',
      header: 'Roles',
      width: '280px',
      render: (item) => (
        <MultiRoleSelect
          roles={item.roles}
          onChange={(roles) => updatePersonnel(item.id, { roles })}
        />
      ),
    },
    { key: 'instrument', header: 'Instrument', placeholder: 'If applicable' },
    { key: 'contact', header: 'Contact', placeholder: 'Phone/Email' },
    { key: 'notes', header: 'Notes', placeholder: 'Additional info' },
  ];

  return (
    <Section
      title="Personnel"
      description="List of all people involved in this project"
    >
      <Table
        columns={columns}
        data={project.personnel}
        onAdd={() => addPersonnel({ name: '', roles: [], instrument: '', contact: '', notes: '' })}
        onUpdate={updatePersonnel}
        onDelete={deletePersonnel}
        addLabel="Add Person"
        emptyMessage="No personnel added yet. Click 'Add Person' to add team members."
      />
    </Section>
  );
}
