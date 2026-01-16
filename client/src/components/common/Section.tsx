import { ReactNode } from 'react';

interface SectionProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function Section({ title, description, children, className = '' }: SectionProps) {
  return (
    <div className={`bg-surface-300 rounded-xl shadow-lg border border-surface-100 ${className}`}>
      <div className="px-6 py-4 border-b border-surface-100">
        <h2 className="text-lg font-semibold text-gray-100 font-display">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-400">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
