import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Project, ProjectType } from '@/types/project';
import * as api from '@/api/projects';

// Project list item (metadata only, for dashboard)
interface ProjectListItem {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface ProjectStore {
  // State
  projectList: ProjectListItem[];
  currentProject: Project | null;
  currentProjectId: string | null;
  currentSection: string;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Project list actions
  loadProjects: () => Promise<void>;
  createProject: (name: string, projectType: ProjectType) => Promise<string>;
  duplicateProject: (id: string) => Promise<string | null>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (id: string | null) => Promise<void>;
  getCurrentProject: () => Project | null;

  // Section navigation
  setCurrentSection: (section: string) => void;

  // Update actions (these update local state and trigger save)
  updateOverview: (overview: Partial<Project['overview']>) => void;
  updateVenue: (venue: Partial<Project['venue']>) => void;
  updateSetupNotes: (setupNotes: Partial<Project['setupNotes']>) => void;
  updateAtmosConfig: (atmosConfig: Partial<Project['atmosConfig']>) => void;

  // Array item actions
  addPersonnel: (item: Omit<Project['personnel'][0], 'id'>) => void;
  updatePersonnel: (id: string, item: Partial<Project['personnel'][0]>) => void;
  deletePersonnel: (id: string) => void;

  addInstrumentation: (item: Omit<Project['instrumentation'][0], 'id'>) => void;
  updateInstrumentation: (id: string, item: Partial<Project['instrumentation'][0]>) => void;
  deleteInstrumentation: (id: string) => void;

  addTrack: (item: Omit<Project['trackList'][0], 'id'>) => void;
  updateTrack: (id: string, item: Partial<Project['trackList'][0]>) => void;
  deleteTrack: (id: string) => void;

  addMicrophonePlan: (item: Omit<Project['microphonePlan'][0], 'id'>) => void;
  updateMicrophonePlan: (id: string, item: Partial<Project['microphonePlan'][0]>) => void;
  deleteMicrophonePlan: (id: string) => void;
  reorderMicrophonePlan: (id: string, direction: 'up' | 'down') => void;

  addInputList: (item: Omit<Project['inputList'][0], 'id'>) => void;
  updateInputList: (id: string, item: Partial<Project['inputList'][0]>) => void;
  deleteInputList: (id: string) => void;
  reorderInputList: (id: string, direction: 'up' | 'down') => void;

  addEquipment: (item: Omit<Project['equipment'][0], 'id'>) => void;
  updateEquipment: (id: string, item: Partial<Project['equipment'][0]>) => void;
  deleteEquipment: (id: string) => void;
  reorderEquipment: (id: string, direction: 'up' | 'down') => void;

  addPreamp: (item: Omit<Project['preamps'][0], 'id'>) => void;
  updatePreamp: (id: string, item: Partial<Project['preamps'][0]>) => void;
  deletePreamp: (id: string) => void;
  reorderPreamp: (id: string, direction: 'up' | 'down') => void;

  addTimeline: (item: Omit<Project['timeline'][0], 'id'>) => void;
  updateTimeline: (id: string, item: Partial<Project['timeline'][0]>) => void;
  deleteTimeline: (id: string) => void;
  reorderTimeline: (id: string, direction: 'up' | 'down') => void;

  addSession: (item: Omit<Project['sessions'][0], 'id'>) => void;
  updateSession: (id: string, item: Partial<Project['sessions'][0]>) => void;
  deleteSession: (id: string) => void;
  reorderSession: (id: string, direction: 'up' | 'down') => void;

  addScheduleBlock: (sessionId: string, item: Omit<Project['sessions'][0]['schedule'][0], 'id'>) => void;
  updateScheduleBlock: (sessionId: string, blockId: string, item: Partial<Project['sessions'][0]['schedule'][0]>) => void;
  deleteScheduleBlock: (sessionId: string, blockId: string) => void;
  reorderScheduleBlock: (sessionId: string, blockId: string, direction: 'up' | 'down') => void;

  addAtmosTrack: (item: Omit<NonNullable<Project['atmosConfig']>['tracks'][0], 'id'>) => void;
  updateAtmosTrack: (id: string, item: Partial<NonNullable<Project['atmosConfig']>['tracks'][0]>) => void;
  deleteAtmosTrack: (id: string) => void;
  reorderAtmosTrack: (id: string, direction: 'up' | 'down') => void;

  // Image actions
  addVenueImage: (image: Omit<Project['venue']['images'][0], 'id'>) => void;
  updateVenueImage: (id: string, image: Partial<Project['venue']['images'][0]>) => void;
  deleteVenueImage: (id: string) => void;

  addSetupDiagram: (diagram: Omit<Project['setupNotes']['diagrams'][0], 'id'>) => void;
  updateSetupDiagram: (id: string, diagram: Partial<Project['setupNotes']['diagrams'][0]>) => void;
  deleteSetupDiagram: (id: string) => void;

  // Import/Export
  importProject: (project: Project) => Promise<string>;
  exportProject: (id: string) => Project | null;
}

const createEmptyProject = (name: string, projectType: ProjectType): Project => ({
  id: uuidv4(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  overview: {
    name,
    client: '',
    description: '',
    projectType,
    startDate: '',
    endDate: '',
    notes: '',
  },
  personnel: [],
  venue: {
    name: '',
    address: '',
    roomName: '',
    dimensions: '',
    acousticNotes: '',
    contactPerson: '',
    contactPhone: '',
    images: [],
  },
  instrumentation: [],
  trackList: [],
  microphonePlan: [],
  inputList: [],
  equipment: [],
  preamps: [],
  setupNotes: {
    description: '',
    diagrams: [],
  },
  atmosConfig: projectType === 'atmos' ? {
    rendererType: '',
    bedFormat: '7.1.4',
    maxObjects: 118,
    deliverables: '',
    notes: '',
    tracks: [],
  } : undefined,
  timeline: [],
  sessions: [],
});

// Debounce save to avoid too many API calls
let saveTimeout: ReturnType<typeof setTimeout> | null = null;

const saveProject = async (project: Project) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(async () => {
    try {
      await api.updateProject(project.id, project.overview.name, project);
    } catch (error) {
      console.error('Failed to save project:', error);
    }
  }, 500);
};

// Helper to reorder an array by moving an item up or down
const reorderArray = <T extends { id: string }>(arr: T[], id: string, direction: 'up' | 'down'): T[] => {
  const index = arr.findIndex((item) => item.id === id);
  if (index === -1) return arr;
  if (direction === 'up' && index === 0) return arr;
  if (direction === 'down' && index === arr.length - 1) return arr;

  const newArr = [...arr];
  const swapIndex = direction === 'up' ? index - 1 : index + 1;
  [newArr[index], newArr[swapIndex]] = [newArr[swapIndex], newArr[index]];
  return newArr;
};

export const useProjectStore = create<ProjectStore>()((set, get) => ({
  projectList: [],
  currentProject: null,
  currentProjectId: null,
  currentSection: 'overview',
  isLoading: false,
  isSaving: false,
  error: null,

  loadProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const projects = await api.listProjects();
      set({ projectList: projects, isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load projects', isLoading: false });
    }
  },

  createProject: async (name, projectType) => {
    const project = createEmptyProject(name, projectType);
    try {
      const serverId = await api.createProject(name, project);
      // Update project with server-assigned ID
      project.id = serverId;
      set((state) => ({
        projectList: [...state.projectList, { id: serverId, name, createdAt: project.createdAt, updatedAt: project.updatedAt }],
        currentProject: project,
        currentProjectId: serverId,
      }));
      return serverId;
    } catch (error) {
      console.error('Failed to create project:', error);
      throw error;
    }
  },

  duplicateProject: async (id) => {
    try {
      const newId = await api.duplicateProject(id);
      await get().loadProjects();
      return newId;
    } catch (error) {
      console.error('Failed to duplicate project:', error);
      return null;
    }
  },

  deleteProject: async (id) => {
    try {
      await api.deleteProject(id);
      set((state) => ({
        projectList: state.projectList.filter((p) => p.id !== id),
        currentProject: state.currentProjectId === id ? null : state.currentProject,
        currentProjectId: state.currentProjectId === id ? null : state.currentProjectId,
      }));
    } catch (error) {
      console.error('Failed to delete project:', error);
      throw error;
    }
  },

  setCurrentProject: async (id) => {
    if (!id) {
      set({ currentProjectId: null, currentProject: null, currentSection: 'overview' });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const project = await api.getProject(id);
      // Ensure project has the correct ID from the server
      project.id = id;
      set({ currentProject: project, currentProjectId: id, currentSection: 'overview', isLoading: false });
    } catch (error) {
      set({ error: 'Failed to load project', isLoading: false });
    }
  },

  getCurrentProject: () => {
    return get().currentProject;
  },

  setCurrentSection: (section) => {
    set({ currentSection: section });
  },

  // Helper to update current project and trigger save
  _updateProject: (updater: (project: Project) => Project) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = updater({
      ...currentProject,
      updatedAt: new Date().toISOString(),
    });
    set({ currentProject: updated });
    saveProject(updated);
  },

  updateOverview: (overview) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      overview: { ...currentProject.overview, ...overview },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  updateVenue: (venue) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      venue: { ...currentProject.venue, ...venue },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  updateSetupNotes: (setupNotes) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      setupNotes: { ...currentProject.setupNotes, ...setupNotes },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  updateAtmosConfig: (atmosConfig) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.atmosConfig) return;

    const updated = {
      ...currentProject,
      atmosConfig: { ...currentProject.atmosConfig, ...atmosConfig },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Personnel
  addPersonnel: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      personnel: [...currentProject.personnel, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updatePersonnel: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      personnel: currentProject.personnel.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deletePersonnel: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      personnel: currentProject.personnel.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Instrumentation
  addInstrumentation: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      instrumentation: [...currentProject.instrumentation, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateInstrumentation: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      instrumentation: currentProject.instrumentation.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteInstrumentation: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      instrumentation: currentProject.instrumentation.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Track List
  addTrack: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      trackList: [...(currentProject.trackList || []), { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateTrack: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      trackList: (currentProject.trackList || []).map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteTrack: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      trackList: (currentProject.trackList || []).filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Microphone Plan
  addMicrophonePlan: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      microphonePlan: [...currentProject.microphonePlan, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateMicrophonePlan: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      microphonePlan: currentProject.microphonePlan.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteMicrophonePlan: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      microphonePlan: currentProject.microphonePlan.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderMicrophonePlan: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      microphonePlan: reorderArray(currentProject.microphonePlan, id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Input List
  addInputList: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      inputList: [...currentProject.inputList, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateInputList: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      inputList: currentProject.inputList.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteInputList: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      inputList: currentProject.inputList.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderInputList: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      inputList: reorderArray(currentProject.inputList, id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Equipment
  addEquipment: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      equipment: [...currentProject.equipment, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateEquipment: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      equipment: currentProject.equipment.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteEquipment: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      equipment: currentProject.equipment.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderEquipment: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      equipment: reorderArray(currentProject.equipment, id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Preamps
  addPreamp: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      preamps: [...(currentProject.preamps || []), { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updatePreamp: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      preamps: (currentProject.preamps || []).map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deletePreamp: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      preamps: (currentProject.preamps || []).filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderPreamp: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      preamps: reorderArray(currentProject.preamps || [], id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Timeline
  addTimeline: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      timeline: [...currentProject.timeline, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateTimeline: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      timeline: currentProject.timeline.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteTimeline: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      timeline: currentProject.timeline.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderTimeline: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      timeline: reorderArray(currentProject.timeline, id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Sessions
  addSession: (item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: [...currentProject.sessions, { ...item, id: uuidv4() }],
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateSession: (id, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.map((i) => (i.id === id ? { ...i, ...item } : i)),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteSession: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.filter((i) => i.id !== id),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderSession: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: reorderArray(currentProject.sessions, id, direction),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Schedule blocks
  addScheduleBlock: (sessionId, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.map((s) =>
        s.id === sessionId ? { ...s, schedule: [...s.schedule, { ...item, id: uuidv4() }] } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateScheduleBlock: (sessionId, blockId, item) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.map((s) =>
        s.id === sessionId ? { ...s, schedule: s.schedule.map((b) => (b.id === blockId ? { ...b, ...item } : b)) } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteScheduleBlock: (sessionId, blockId) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.map((s) =>
        s.id === sessionId ? { ...s, schedule: s.schedule.filter((b) => b.id !== blockId) } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderScheduleBlock: (sessionId, blockId, direction) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      sessions: currentProject.sessions.map((s) =>
        s.id === sessionId ? { ...s, schedule: reorderArray(s.schedule, blockId, direction) } : s
      ),
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Atmos tracks
  addAtmosTrack: (item) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.atmosConfig) return;

    const updated = {
      ...currentProject,
      atmosConfig: { ...currentProject.atmosConfig, tracks: [...currentProject.atmosConfig.tracks, { ...item, id: uuidv4() }] },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateAtmosTrack: (id, item) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.atmosConfig) return;

    const updated = {
      ...currentProject,
      atmosConfig: {
        ...currentProject.atmosConfig,
        tracks: currentProject.atmosConfig.tracks.map((t) => (t.id === id ? { ...t, ...item } : t)),
      },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteAtmosTrack: (id) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.atmosConfig) return;

    const updated = {
      ...currentProject,
      atmosConfig: { ...currentProject.atmosConfig, tracks: currentProject.atmosConfig.tracks.filter((t) => t.id !== id) },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  reorderAtmosTrack: (id, direction) => {
    const { currentProject } = get();
    if (!currentProject || !currentProject.atmosConfig) return;

    const updated = {
      ...currentProject,
      atmosConfig: { ...currentProject.atmosConfig, tracks: reorderArray(currentProject.atmosConfig.tracks, id, direction) },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Venue images
  addVenueImage: (image) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      venue: { ...currentProject.venue, images: [...currentProject.venue.images, { ...image, id: uuidv4() }] },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateVenueImage: (id, image) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      venue: { ...currentProject.venue, images: currentProject.venue.images.map((i) => (i.id === id ? { ...i, ...image } : i)) },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteVenueImage: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      venue: { ...currentProject.venue, images: currentProject.venue.images.filter((i) => i.id !== id) },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Setup diagrams
  addSetupDiagram: (diagram) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      setupNotes: { ...currentProject.setupNotes, diagrams: [...currentProject.setupNotes.diagrams, { ...diagram, id: uuidv4() }] },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  updateSetupDiagram: (id, diagram) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      setupNotes: {
        ...currentProject.setupNotes,
        diagrams: currentProject.setupNotes.diagrams.map((d) => (d.id === id ? { ...d, ...diagram } : d)),
      },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },
  deleteSetupDiagram: (id) => {
    const { currentProject } = get();
    if (!currentProject) return;

    const updated = {
      ...currentProject,
      setupNotes: { ...currentProject.setupNotes, diagrams: currentProject.setupNotes.diagrams.filter((d) => d.id !== id) },
      updatedAt: new Date().toISOString(),
    };
    set({ currentProject: updated });
    saveProject(updated);
  },

  // Import/Export
  importProject: async (project) => {
    const newProject: Project = {
      ...project,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    try {
      const serverId = await api.createProject(newProject.overview.name, newProject);
      newProject.id = serverId;
      set((state) => ({
        projectList: [...state.projectList, {
          id: serverId,
          name: newProject.overview.name,
          createdAt: newProject.createdAt,
          updatedAt: newProject.updatedAt,
        }],
      }));
      return serverId;
    } catch (error) {
      console.error('Failed to import project:', error);
      throw error;
    }
  },

  exportProject: (id) => {
    const { currentProject, currentProjectId } = get();
    if (currentProjectId === id && currentProject) {
      return currentProject;
    }
    return null;
  },
}));
