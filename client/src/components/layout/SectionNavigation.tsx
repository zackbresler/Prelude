import { useProjectStore } from '@/store/projectStore';

interface SectionNavigationProps {
  sections: Record<string, { label: string; atmosOnly?: boolean }>;
  position: 'top' | 'bottom';
}

export default function SectionNavigation({ sections, position }: SectionNavigationProps) {
  const { currentSection, setCurrentSection, getCurrentProject } = useProjectStore();
  const project = getCurrentProject();
  const isAtmos = project?.overview.projectType === 'atmos';

  // Get ordered list of visible sections
  const visibleSections = Object.entries(sections).filter(
    ([, config]) => !config.atmosOnly || isAtmos
  );

  const currentIndex = visibleSections.findIndex(([key]) => key === currentSection);
  const prevSection = currentIndex > 0 ? visibleSections[currentIndex - 1] : null;
  const nextSection = currentIndex < visibleSections.length - 1 ? visibleSections[currentIndex + 1] : null;

  if (position === 'top') {
    return (
      <div className="flex items-center justify-between mb-6">
        {prevSection ? (
          <button
            onClick={() => setCurrentSection(prevSection[0])}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back to {prevSection[1].label}</span>
          </button>
        ) : (
          <div />
        )}
        {nextSection ? (
          <button
            onClick={() => setCurrentSection(nextSection[0])}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-primary-400 transition-colors"
          >
            <span>Skip to {nextSection[1].label}</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ) : (
          <div />
        )}
      </div>
    );
  }

  // Bottom navigation - more prominent
  return (
    <div className="flex items-center justify-between mt-8 pt-6 border-t border-surface-100">
      {prevSection ? (
        <button
          onClick={() => setCurrentSection(prevSection[0])}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 bg-surface-200 border border-surface-100 rounded-lg hover:bg-surface-100 hover:text-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back to {prevSection[1].label}</span>
        </button>
      ) : (
        <div />
      )}
      {nextSection ? (
        <button
          onClick={() => setCurrentSection(nextSection[0])}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-500 transition-colors shadow-lg shadow-primary-600/20"
        >
          <span>Continue to {nextSection[1].label}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-primary-400 bg-primary-600/20 border border-primary-500/30 rounded-lg">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>All sections complete!</span>
        </div>
      )}
    </div>
  );
}
