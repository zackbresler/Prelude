import { useProjectStore } from '@/store/projectStore';
import { Button } from '@/components/common';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import SectionNavigation from '@/components/layout/SectionNavigation';
import ProjectOverview from '@/components/sections/ProjectOverview';
import Personnel from '@/components/sections/Personnel';
import Venue from '@/components/sections/Venue';
import Instrumentation from '@/components/sections/Instrumentation';
import TrackList from '@/components/sections/TrackList';
import MicrophonePlan from '@/components/sections/MicrophonePlan';
import InputList from '@/components/sections/InputList';
import Equipment from '@/components/sections/Equipment';
import SetupNotes from '@/components/sections/SetupNotes';
import AtmosConfig from '@/components/sections/AtmosConfig';
import Timeline from '@/components/sections/Timeline';
import SessionSchedule from '@/components/sections/SessionSchedule';

const SECTIONS: Record<string, { component: React.ComponentType; label: string; atmosOnly?: boolean }> = {
  overview: { component: ProjectOverview, label: 'Project Overview' },
  personnel: { component: Personnel, label: 'Personnel' },
  venue: { component: Venue, label: 'Venue' },
  instrumentation: { component: Instrumentation, label: 'Instrumentation' },
  trackList: { component: TrackList, label: 'Track List' },
  microphonePlan: { component: MicrophonePlan, label: 'Microphone Plan' },
  inputList: { component: InputList, label: 'Input List' },
  equipment: { component: Equipment, label: 'Equipment' },
  setupNotes: { component: SetupNotes, label: 'Setup Notes' },
  atmosConfig: { component: AtmosConfig, label: 'Atmos Config', atmosOnly: true },
  timeline: { component: Timeline, label: 'Timeline' },
  sessions: { component: SessionSchedule, label: 'Session Schedule' },
};

export default function ProjectEditor() {
  const { currentSection, getCurrentProject, setCurrentProject } = useProjectStore();
  const project = getCurrentProject();

  if (!project) {
    return (
      <div className="min-h-screen bg-surface-400 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400">Project not found</p>
          <Button className="mt-4" onClick={() => setCurrentProject(null)}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const sectionConfig = SECTIONS[currentSection];

  // Skip Atmos section if not an Atmos project
  if (sectionConfig?.atmosOnly && project.overview.projectType !== 'atmos') {
    return null;
  }

  const SectionComponent = sectionConfig?.component || ProjectOverview;

  return (
    <div className="min-h-screen bg-surface-400 flex">
      <Sidebar sections={SECTIONS} />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <SectionNavigation sections={SECTIONS} position="top" />
          <SectionComponent />
          <SectionNavigation sections={SECTIONS} position="bottom" />
        </main>
      </div>
    </div>
  );
}
