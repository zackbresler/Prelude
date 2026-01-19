import type { Project, TrackColor } from '@/types/project';

// REAPER color mapping (native REAPER colors in decimal format)
// REAPER uses RGBA format stored as a single integer: R + G*256 + B*65536 + A*16777216
const REAPER_COLORS: Record<TrackColor, number> = {
  '': 0, // Default (no color)
  'red': 16843860,
  'orange': 16826468,
  'yellow': 16842700,
  'green': 6750054,
  'cyan': 10551200,
  'blue': 16744448,
  'purple': 16711884,
  'pink': 16761035,
};

function escapeRPPString(str: string): string {
  // REAPER strings in quotes need minimal escaping
  return str.replace(/"/g, '\\"');
}

function generateTrackRPP(
  trackName: string,
  isStereo: boolean,
  color: TrackColor
): string {
  const colorValue = REAPER_COLORS[color] || 0;
  const nchan = isStereo ? 2 : 1;

  // Track GUID - generate a simple unique ID
  const guid = `{${crypto.randomUUID().toUpperCase()}}`;
  const trackGuid = `{${crypto.randomUUID().toUpperCase()}}`;

  return `  <TRACK ${trackGuid}
    NAME "${escapeRPPString(trackName)}"
    PEAKCOL ${colorValue}
    BEAT -1
    AUTOMODE 0
    VOLPAN 1 0 -1 -1 1
    MUTESOLO 0 0 0
    IPHASE 0
    PLAYOFFS 0 1
    ISBUS 0 0
    BUSCOMP 0 0 0 0 0
    SHOWINMIX 1 0.6667 0.5 1 0.5 0 0 0
    SEL 0
    REC 0 0 1 0 0 0 0 0
    VU 2
    TRACKHEIGHT 0 0 0 0 0 0
    INQ 0 0 0 0.5 100 0 0 100
    NCHAN ${nchan}
    FX 1
    TRACKID ${guid}
    PERF 0
    MIDIOUT -1
    MAINSEND 1 0
  >
`;
}

function generateProjectRPP(project: Project): string {
  const sampleRate = 48000; // Default sample rate

  // Generate tracks from input list
  const tracks = project.inputList
    .map((item, index) => {
      const trackName = item.source || `Track ${index + 1}`;
      const isStereo = item.trackFormat === 'stereo';
      const color = item.trackColor || '';
      return generateTrackRPP(trackName, isStereo, color);
    })
    .join('\n');

  return `<REAPER_PROJECT 0.1 "7.0" 1704067200
  RIPPLE 0
  GROUPOVERRIDE 0 0 0
  AUTOXFADE 1
  ENVATTACH 1
  POOLEDENVATTACH 0
  MIXERUIFLAGS 11 48
  PEAKGAIN 1
  FEEDBACK 0
  PANLAW 1
  PROJOFFS 0 0 0
  MAXPROJLEN 0 600
  GRID 3199 8 1 8 1 0 0 0
  TIMEMODE 1 5 -1 30 0 0 -1
  VIDEO_CONFIG 0 0 256
  PANMODE 3
  CURSOR 0
  ZOOM 100 0 0
  VZOOMEX 6 0
  USE_REC_CFG 0
  RECMODE 1
  SMPTESYNC 0 30 100 40 1000 300 0 0 1 0 0
  LOOP 0
  LOOPGRAN 0 4
  RECORD_PATH "" ""
  <RECORD_CFG
  >
  <APPLYFX_CFG
  >
  RENDER_FILE ""
  RENDER_PATTERN ""
  RENDER_FMT 0 2 0
  RENDER_1X 0
  RENDER_RANGE 1 0 0 18 1000
  RENDER_RESAMPLE 3 0 1
  RENDER_ADDTOPROJ 0
  RENDER_STEMS 0
  RENDER_DITHER 0
  TIMELOCKMODE 1
  TEMPOENVLOCKMODE 1
  ITEMMIX 1
  DEFPITCHMODE 589824 0
  TAESSION 1
  TAESSION2 0 ""
  POOLEDENVLANE 0
  ENVPOOLLANE 0
  MARKERSEDITMODE 0
  SAMPLERATE ${sampleRate} 0 0
  <RENDER_CFG
  >
  LOCK 0
  <METRONOME 6 2
    VOL 0.25 0.125
    FREQ 800 1600 1
    BEATLEN 4
    SAMPLES "" ""
    PATTERN 2863311530 2863311529
    MULT 1
  >
  GLOBAL_AUTO -1
  TEMPO 120 4 4
  PLAYRATE 1 0 0.25 4
  SELECTION 0 0
  SELECTION2 0 0
  MASTERAUTOMODE 0
  MASTERTRACKHEIGHT 0 0
  MASTERPEAKCOL 16576
  MASTERMUTESOLO 0
  MASTERTRACKVIEW 0 0.6667 0.5 0.5 0 0 0 0 0 0 0 0 0
  MASTERHWOUT 0 0 1 0 0 0 0 -1
  MASTER_NCH 2 2
  MASTER_VOLUME 1 0 -1 -1 1
  MASTER_PANMODE 3
  MASTER_FX 1
  MASTER_SEL 0
  <MASTERPLAYSPEEDENV
    EGUID ${`{${crypto.randomUUID().toUpperCase()}}`}
    ACT 0 -1
    VIS 0 1 1
    LANEHEIGHT 0 0
    ARM 0
    DEFSHAPE 0 -1 -1
  >
  <TEMPOENVEX
    EGUID ${`{${crypto.randomUUID().toUpperCase()}}`}
    ACT 0 -1
    VIS 1 0 1
    LANEHEIGHT 0 0
    ARM 0
    DEFSHAPE 1 -1 -1
  >
${tracks}>
`;
}

// Generate REAPER project as Blob
export function generateREAPERBlob(project: Project): Blob {
  const rppContent = generateProjectRPP(project);
  return new Blob([rppContent], { type: 'text/plain' });
}

// Export REAPER project (triggers download)
export function exportToREAPER(project: Project): void {
  const blob = generateREAPERBlob(project);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${project.overview.name.replace(/[^a-z0-9]/gi, '_')}_prelude.rpp`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
