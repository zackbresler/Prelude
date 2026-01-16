export type ProjectType =
  | 'band'
  | 'classical'
  | 'largeJazz'
  | 'smallJazz'
  | 'hipHopElectronic'
  | 'singerSongwriter'
  | 'atmos'
  | 'other';

export interface ProjectOverview {
  name: string;
  client: string;
  description: string;
  projectType: ProjectType;
  startDate: string;
  endDate: string;
  notes: string;
}

export interface Personnel {
  id: string;
  name: string;
  roles: string[];
  instrument?: string;
  contact?: string;
  notes?: string;
}

export interface VenueImage {
  id: string;
  url: string;
  caption: string;
}

export interface Venue {
  name: string;
  address: string;
  roomName?: string;
  dimensions?: string;
  acousticNotes: string;
  contactPerson?: string;
  contactPhone?: string;
  images: VenueImage[];
}

export interface Instrumentation {
  id: string;
  instrument: string;
  performer: string;  // Legacy - kept for backward compatibility
  performerIds: string[];  // References to Personnel IDs
  trackName?: string;  // Can be auto-populated from Track List
  notes?: string;
}

export interface Track {
  id: string;
  trackNumber: number;
  title: string;
  duration?: string;
  personnel: string[];  // IDs of personnel involved
  instruments: string[];  // IDs of instrumentation involved
  notes?: string;
}

export interface MicrophonePlanItem {
  id: string;
  source: string;
  microphone: string;
  quantity: number;
  position: string;
  notes?: string;
}

export interface InputListItem {
  id: string;
  channel: number;
  source: string;
  microphone: string;
  preamp?: string;
  notes?: string;
}

export interface EquipmentItem {
  id: string;
  category: string;
  item: string;
  quantity: number;
  serialNumber?: string;
  notes?: string;
}

export interface SetupDiagram {
  id: string;
  url: string;
  caption: string;
}

export interface SetupNotes {
  description: string;
  diagrams: SetupDiagram[];
}

export type AtmosTrackType = 'bed' | 'object';
export type HeightLayer = 'floor' | 'mid' | 'overhead';

export interface AtmosTrack {
  id: string;
  name: string;
  type: AtmosTrackType;
  bedAssignment?: string;
  objectBehavior?: string;
  heightLayer?: HeightLayer;
  notes?: string;
}

export interface AtmosConfig {
  rendererType: string;
  bedFormat: string;
  maxObjects: number;
  deliverables: string;
  notes: string;
  tracks: AtmosTrack[];
}

export interface TimelinePhase {
  id: string;
  phase: string;
  description: string;
  startDate: string;
  endDate: string;
}

export type SessionType = 'recording' | 'mixing' | 'mastering' | 'other';

export interface ScheduleBlock {
  id: string;
  startHour: string;
  endHour: string;
  activity: string;
  notes?: string;
}

export interface Session {
  id: string;
  date: string;
  type: SessionType;
  venue?: string;
  startTime: string;
  endTime: string;
  schedule: ScheduleBlock[];
}

export interface Project {
  id: string;
  createdAt: string;
  updatedAt: string;
  overview: ProjectOverview;
  personnel: Personnel[];
  venue: Venue;
  instrumentation: Instrumentation[];
  trackList: Track[];
  microphonePlan: MicrophonePlanItem[];
  inputList: InputListItem[];
  equipment: EquipmentItem[];
  setupNotes: SetupNotes;
  atmosConfig?: AtmosConfig;
  timeline: TimelinePhase[];
  sessions: Session[];
}

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  band: 'Band Recording',
  classical: 'Classical/Orchestral',
  largeJazz: 'Large Jazz Ensemble',
  smallJazz: 'Small Jazz Ensemble',
  hipHopElectronic: 'Hip Hop & Electronic',
  singerSongwriter: 'Singer-Songwriter / Acoustic',
  atmos: 'Dolby Atmos',
  other: 'Other',
};

export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  recording: 'Recording',
  mixing: 'Mixing',
  mastering: 'Mastering',
  other: 'Other',
};
