import { Mantra } from '../data/mantras';

export type MantraSessionStatus = 
  | 'idle' 
  | 'preparing' 
  | 'running' 
  | 'paused' 
  | 'completed' 
  | 'interrupted';

export type AmbientTrackId = 'silent' | 'synthetic_drone' | 'rain' | 'river' | 'forest';

export interface MantraSessionSettings {
  singingBowlChime: boolean;     // Opening and concluding 432 Hz bronze chime
  ambientTrack: AmbientTrackId;  // Unified ambient sound choice
  volume: number;                // Master volume 0.0 to 1.0
  repetitionCounter: boolean;    // Interactive Japa bead counter
  hapticFeedback: boolean;       // Gentle vibration on counting
}

export interface MantraSessionConfig {
  mantra: Mantra;
  targetDurationSeconds: number;
  settings: MantraSessionSettings;
}

export interface MantraSessionState {
  sessionId: string;
  status: MantraSessionStatus;
  config: MantraSessionConfig;
  targetDurationSeconds: number;
  remainingSeconds: number;
  elapsedSeconds: number;
  progress: number; // 0 to 1
  repetitionCount: number;
  isPaused: boolean;
  breathPhase: 'inhale' | 'exhale';
  startedAt: number | null;
  endedAt: number | null;
  interrupted: boolean;
}

export interface MantraSessionResult {
  sessionId: string;
  mantraId: string;
  mantraTitle: string;
  mantraText: string;
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  repetitionCount: number;
  completedAt: string;
  interrupted: boolean;
  feelingAfter?: string;
  reflection?: string;
}
