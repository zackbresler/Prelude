import { ReactNode } from 'react';
import Button from './Button';

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  render?: (item: T, index: number) => ReactNode;
  editable?: boolean;
  type?: 'text' | 'number' | 'select';
  options?: { value: string; label: string }[];
  placeholder?: string;
}

interface TableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<T>) => void;
  onDelete: (id: string) => void;
  addLabel?: string;
  emptyMessage?: string;
}

export default function Table<T extends { id: string }>({
  columns,
  data,
  onAdd,
  onUpdate,
  onDelete,
  addLabel = 'Add Row',
  emptyMessage = 'No items yet. Click the button below to add one.',
}: TableProps<T>) {
  const getValue = (item: T, key: keyof T | string): string | number => {
    if (typeof key === 'string' && key.includes('.')) {
      const keys = key.split('.');
      let value: unknown = item;
      for (const k of keys) {
        value = (value as Record<string, unknown>)?.[k];
      }
      return value as string | number;
    }
    return item[key as keyof T] as string | number;
  };

  const handleChange = (id: string, key: keyof T | string, value: string | number) => {
    onUpdate(id, { [key]: value } as Partial<T>);
  };

  return (
    <div className="w-full">
      <div className="overflow-x-auto border border-surface-100 rounded-lg">
        <table className="min-w-full divide-y divide-surface-100">
          <thead className="bg-surface-200">
            <tr>
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase tracking-wider w-20">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-surface-300 divide-y divide-surface-100">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-4 py-8 text-center text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item, index) => (
                <tr key={item.id} className="hover:bg-surface-200 transition-colors">
                  {columns.map((col) => (
                    <td key={String(col.key)} className="px-4 py-2">
                      {col.render ? (
                        col.render(item, index)
                      ) : col.editable !== false ? (
                        col.type === 'select' && col.options ? (
                          <select
                            value={getValue(item, col.key) as string}
                            onChange={(e) => handleChange(item.id, col.key, e.target.value)}
                            className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                          >
                            <option value="">Select...</option>
                            {col.options.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={col.type || 'text'}
                            value={getValue(item, col.key)}
                            onChange={(e) =>
                              handleChange(
                                item.id,
                                col.key,
                                col.type === 'number' ? Number(e.target.value) : e.target.value
                              )
                            }
                            placeholder={col.placeholder}
                            className="block w-full rounded border-surface-50 bg-surface-300 text-gray-100 placeholder-gray-500 text-sm focus:border-primary-500 focus:ring-primary-500 transition-colors"
                          />
                        )
                      ) : (
                        <span className="text-sm text-gray-100">{getValue(item, col.key)}</span>
                      )}
                    </td>
                  ))}
                  <td className="px-4 py-2 text-right">
                    <Button variant="ghost" size="sm" onClick={() => onDelete(item.id)}>
                      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-4">
        <Button variant="secondary" onClick={onAdd}>
          + {addLabel}
        </Button>
      </div>
    </div>
  );
}
