import { MantraSessionConfig, MantraSessionResult, MantraSessionState } from '../types/mantraSession';

const ACTIVE_SESSION_STORAGE_KEY = 'zenflow_active_mantra_session';

/**
 * Service to manage active mantra sessions, enforce singleton active session rules,
 * prevent duplicate sessions, and handle persistent session lifecycle checkpoints.
 */
class MantraSessionService {
  private activeSessionId: string | null = null;

  /**
   * Generates a collision-resistant unique session identifier
   */
  public generateSessionId(): string {
    return `ms_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Checks if an active session is currently registered
   */
  public hasActiveSession(): boolean {
    if (this.activeSessionId) return true;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
        return Boolean(stored);
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Registers a new session, invalidating any lingering stale session first
   */
  public registerSession(sessionId: string, config: MantraSessionConfig): void {
    try {
      // If a previous session wasn't properly ended, clear it first
      if (this.activeSessionId && this.activeSessionId !== sessionId) {
        this.clearActiveSession();
      }

      this.activeSessionId = sessionId;
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const payload = {
          sessionId,
          mantraId: config.mantra.id,
          targetDurationSeconds: config.targetDurationSeconds,
          startedAt: Date.now(),
        };
        window.sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(payload));
      }
    } catch (e) {
      console.warn('MantraSessionService: Failed to register session in storage:', e);
    }
  }

  /**
   * Updates an in-flight checkpoint
   */
  public checkpointSession(sessionId: string, elapsedSeconds: number, repetitionCount: number): void {
    if (typeof window === 'undefined' || !window.sessionStorage) return;
    if (this.activeSessionId !== sessionId) return;

    try {
      const existingStr = window.sessionStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
      if (existingStr) {
        const parsed = JSON.parse(existingStr);
        parsed.elapsedSeconds = elapsedSeconds;
        parsed.repetitionCount = repetitionCount;
        parsed.updatedAt = Date.now();
        window.sessionStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(parsed));
      }
    } catch (e) {
      // non-blocking
    }
  }

  /**
   * Safely clears active session markers to prevent any duplicate session state
   */
  public clearActiveSession(): void {
    this.activeSessionId = null;
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Finalizes and constructs a standardized result record
   */
  public buildSessionResult(
    state: MantraSessionState,
    interrupted: boolean,
    feelingAfter?: string,
    reflection?: string
  ): MantraSessionResult {
    return {
      sessionId: state.sessionId,
      mantraId: state.config.mantra.id,
      mantraTitle: state.config.mantra.title,
      mantraText: state.config.mantra.transliteration,
      plannedDurationSeconds: state.targetDurationSeconds,
      actualDurationSeconds: state.elapsedSeconds,
      repetitionCount: state.repetitionCount,
      completedAt: new Date().toISOString(),
      interrupted,
      feelingAfter,
      reflection: reflection?.trim() || undefined,
    };
  }
}

export const mantraSessionService = new MantraSessionService();
