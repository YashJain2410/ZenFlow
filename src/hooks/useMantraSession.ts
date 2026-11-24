import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  MantraSessionConfig, 
  MantraSessionStatus, 
  MantraSessionState,
  MantraSessionResult 
} from '../types/mantraSession';
import { mantraSessionService } from '../services/mantraSession.service';
import { audioEngine } from '../services/audioEngine';

interface UseMantraSessionProps {
  onCompleted?: (result: MantraSessionResult) => void;
  onInterrupted?: (result: MantraSessionResult) => void;
}

export function useMantraSession({ onCompleted, onInterrupted }: UseMantraSessionProps = {}) {
  // Session Identity & Lifecycle Status
  const [sessionId, setSessionId] = useState<string>('');
  const [status, setStatus] = useState<MantraSessionStatus>('idle');
  const [currentConfig, setCurrentConfig] = useState<MantraSessionConfig | null>(null);

  // Time metrics (rendered to UI)
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);

  // User interactions
  const [repetitionCount, setRepetitionCount] = useState<number>(0);
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'exhale'>('inhale');

  // Confirmation modal for ending early
  const [isConfirmingEnd, setIsConfirmingEnd] = useState<boolean>(false);

  // Guard against accidental multiple starts / rapid button taps
  const [isStarting, setIsStarting] = useState<boolean>(false);
  const isStartingRef = useRef<boolean>(false);

  // High-precision timestamp references (never drift)
  const targetDurationMsRef = useRef<number>(0);
  const intervalStartTimestampRef = useRef<number>(0);
  const accumulatedElapsedMsRef = useRef<number>(0);
  const statusRef = useRef<MantraSessionStatus>('idle');
  const tickerRef = useRef<any>(null);
  const breathIntervalRef = useRef<any>(null);
  const isPausedRef = useRef<boolean>(false);
  const wasPausedBeforeModalRef = useRef<boolean>(false);

  // Keep callback refs stable
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;
  const onInterruptedRef = useRef(onInterrupted);
  onInterruptedRef.current = onInterrupted;

  // Sync status to ref for event handlers
  useEffect(() => {
    statusRef.current = status;
    isPausedRef.current = status === 'paused';
  }, [status]);

  /**
   * Internal routine to calculate current elapsed time and update state
   */
  const evaluateTimeTick = useCallback(() => {
    if (statusRef.current !== 'running') return;

    const now = Date.now();
    const currentIntervalElapsed = now - intervalStartTimestampRef.current;
    const totalElapsedMs = accumulatedElapsedMsRef.current + currentIntervalElapsed;
    const targetMs = targetDurationMsRef.current;

    const remainingMs = Math.max(0, targetMs - totalElapsedMs);
    const calculatedRemainingSec = Math.ceil(remainingMs / 1000);
    const calculatedElapsedSec = Math.min(
      Math.floor(targetMs / 1000), 
      Math.floor(totalElapsedMs / 1000)
    );

    const calculatedProgress = targetMs > 0 ? Math.min(1, totalElapsedMs / targetMs) : 0;

    setRemainingSeconds(calculatedRemainingSec);
    setElapsedSeconds(calculatedElapsedSec);
    setProgress(calculatedProgress);

    // Checkpoint session periodically
    if (sessionId) {
      mantraSessionService.checkpointSession(sessionId, calculatedElapsedSec, repetitionCount);
    }

    // Check for session completion
    if (totalElapsedMs >= targetMs) {
      handleCompleteSession();
    }
  }, [sessionId, repetitionCount]);

  /**
   * Completes the session normally when countdown reaches zero
   */
  const handleCompleteSession = useCallback(() => {
    if (statusRef.current === 'completed' || statusRef.current === 'interrupted') return;

    // Clear tickers
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);

    setStatus('completed');
    statusRef.current = 'completed';

    // Stop ambient drone and play conclusion chime if enabled
    if (currentConfig?.settings.singingBowlChime) {
      audioEngine.stopAmbient();
      audioEngine.playSingingBowl();
    } else {
      audioEngine.stopAmbient();
    }

    const finalElapsed = Math.round(targetDurationMsRef.current / 1000);
    setRemainingSeconds(0);
    setElapsedSeconds(finalElapsed);
    setProgress(1);

    const snapshotState: MantraSessionState = {
      sessionId,
      status: 'completed',
      config: currentConfig!,
      targetDurationSeconds: currentConfig ? currentConfig.targetDurationSeconds : finalElapsed,
      remainingSeconds: 0,
      elapsedSeconds: finalElapsed,
      progress: 1,
      repetitionCount,
      isPaused: false,
      breathPhase,
      startedAt: intervalStartTimestampRef.current,
      endedAt: Date.now(),
      interrupted: false,
    };

    mantraSessionService.clearActiveSession();

    if (onCompletedRef.current) {
      const result = mantraSessionService.buildSessionResult(snapshotState, false);
      onCompletedRef.current(result);
    }
  }, [sessionId, currentConfig, repetitionCount, breathPhase]);

  /**
   * Starts a brand new mantra session with full safety guarantees
   */
  const startSession = useCallback((config: MantraSessionConfig) => {
    // Prevent accidental multiple start calls or concurrent duplicate sessions
    if (isStartingRef.current || statusRef.current === 'running') {
      return;
    }

    try {
      isStartingRef.current = true;
      setIsStarting(true);

      // Clean up any existing tickers or sounds first
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      audioEngine.stopAmbient();

      const newSessionId = mantraSessionService.generateSessionId();
      setSessionId(newSessionId);
      setCurrentConfig(config);

      // Enforce singleton active session in service
      mantraSessionService.registerSession(newSessionId, config);

      const targetMs = config.targetDurationSeconds * 1000;
      targetDurationMsRef.current = targetMs;
      intervalStartTimestampRef.current = Date.now();
      accumulatedElapsedMsRef.current = 0;

      setRemainingSeconds(config.targetDurationSeconds);
      setElapsedSeconds(0);
      setProgress(0);
      setRepetitionCount(0);
      setBreathPhase('inhale');
      setIsConfirmingEnd(false);

      setStatus('running');
      statusRef.current = 'running';

      // Push history state to intercept Android hardware back button
      if (typeof window !== 'undefined' && window.history) {
        try {
          window.history.pushState({ zenflowMantraSession: newSessionId }, '');
        } catch (e) {
          // non-critical
        }
      }

      // Audio setup: Opening chime & ambient track
      if (config.settings.singingBowlChime) {
        audioEngine.playSingingBowl();
      }
      // @ts-ignore
      const ambientTrack = config.settings.ambientTrack || (config.settings.ambientDrone ? 'synthetic_drone' : 'silent');
      if (ambientTrack !== 'silent') {
        audioEngine.playAmbient(ambientTrack as any, config.settings.volume || 0.5);
      }

      // Start reliable ticker (evaluates real elapsed wall-clock time every 200ms)
      tickerRef.current = setInterval(() => {
        evaluateTimeTick();
      }, 200);

      // Setup calming visual breath cadence (default to 6s or mantra cadence)
      const cadenceMs = (config.mantra.cadenceSeconds || 6) * 1000;
      breathIntervalRef.current = setInterval(() => {
        if (statusRef.current === 'running') {
          setBreathPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
        }
      }, cadenceMs / 2);
    } catch (err) {
      console.error('MantraSession: Error starting session:', err);
    } finally {
      // Release start debounce lock after short safety delay
      setTimeout(() => {
        isStartingRef.current = false;
        setIsStarting(false);
      }, 350);
    }
  }, [evaluateTimeTick]);

  /**
   * Pauses the active session accurately
   */
  const pauseSession = useCallback(() => {
    if (statusRef.current !== 'running') return;

    // Snapshot accumulated elapsed time
    const now = Date.now();
    accumulatedElapsedMsRef.current += (now - intervalStartTimestampRef.current);

    if (tickerRef.current) clearInterval(tickerRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);

    setStatus('paused');
    statusRef.current = 'paused';

    // Pause audio
    audioEngine.pause();
  }, []);

  /**
   * Resumes session exactly where it was paused
   */
  const resumeSession = useCallback(() => {
    if (statusRef.current !== 'paused') return;

    intervalStartTimestampRef.current = Date.now();

    setStatus('running');
    statusRef.current = 'running';

    // Resume audio
    audioEngine.resume();

    // Restart ticker
    tickerRef.current = setInterval(() => {
      evaluateTimeTick();
    }, 200);

    // Restart breath cadence
    const cadenceMs = (currentConfig?.mantra.cadenceSeconds || 6) * 1000;
    breathIntervalRef.current = setInterval(() => {
      if (statusRef.current === 'running') {
        setBreathPhase(prev => (prev === 'inhale' ? 'exhale' : 'inhale'));
      }
    }, cadenceMs / 2);
  }, [currentConfig, evaluateTimeTick]);

  /**
   * Toggles pause/resume
   */
  const togglePauseResume = useCallback(() => {
    if (statusRef.current === 'running') {
      pauseSession();
    } else if (statusRef.current === 'paused') {
      resumeSession();
    }
  }, [pauseSession, resumeSession]);

  /**
   * Asks for confirmation before ending early
   */
  const requestEndEarly = useCallback(() => {
    if (statusRef.current !== 'running' && statusRef.current !== 'paused') return;

    wasPausedBeforeModalRef.current = statusRef.current === 'paused';
    if (statusRef.current === 'running') {
      pauseSession();
    }
    setIsConfirmingEnd(true);
  }, [pauseSession]);

  /**
   * Cancels early exit dialog and restores previous state
   */
  const cancelEndEarly = useCallback(() => {
    setIsConfirmingEnd(false);

    // If user cancelled exit on Android, re-push history state so future back buttons are caught
    if (typeof window !== 'undefined' && window.history) {
      try {
        window.history.pushState({ zenflowMantraSession: sessionId }, '');
      } catch (e) {}
    }

    if (!wasPausedBeforeModalRef.current) {
      resumeSession();
    }
  }, [sessionId, resumeSession]);

  /**
   * Confirms ending session early
   */
  const confirmEndEarly = useCallback(() => {
    setIsConfirmingEnd(false);

    if (tickerRef.current) clearInterval(tickerRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    audioEngine.stopAmbient();

    setStatus('interrupted');
    statusRef.current = 'interrupted';

    const currentElapsed = Math.min(
      Math.floor(targetDurationMsRef.current / 1000),
      Math.floor(accumulatedElapsedMsRef.current / 1000)
    );

    const snapshotState: MantraSessionState = {
      sessionId,
      status: 'interrupted',
      config: currentConfig!,
      targetDurationSeconds: currentConfig ? currentConfig.targetDurationSeconds : currentElapsed,
      remainingSeconds,
      elapsedSeconds: currentElapsed,
      progress,
      repetitionCount,
      isPaused: false,
      breathPhase,
      startedAt: intervalStartTimestampRef.current,
      endedAt: Date.now(),
      interrupted: true,
    };

    mantraSessionService.clearActiveSession();

    if (onInterruptedRef.current) {
      const result = mantraSessionService.buildSessionResult(snapshotState, true);
      onInterruptedRef.current(result);
    }
  }, [sessionId, currentConfig, remainingSeconds, progress, repetitionCount, breathPhase]);

  /**
   * Manually tap to increment repetition count (with optional audio & haptics)
   */
  const incrementRepetition = useCallback(() => {
    if (statusRef.current !== 'running' && statusRef.current !== 'paused') return;

    setRepetitionCount(prev => {
      const next = prev + 1;
      if (sessionId) {
        mantraSessionService.checkpointSession(sessionId, elapsedSeconds, next);
      }
      return next;
    });

    if (currentConfig?.settings.repetitionCounter) {
      audioEngine.playBead();
    }
    if (currentConfig?.settings.hapticFeedback) {
      audioEngine.playHaptic();
    }
  }, [sessionId, elapsedSeconds, currentConfig]);

  /**
   * Reset session back to idle
   */
  const resetSession = useCallback(() => {
    if (tickerRef.current) clearInterval(tickerRef.current);
    if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
    audioEngine.stopAmbient();

    mantraSessionService.clearActiveSession();
    setStatus('idle');
    statusRef.current = 'idle';
    setSessionId('');
    setRemainingSeconds(0);
    setElapsedSeconds(0);
    setProgress(0);
    setRepetitionCount(0);
    setIsConfirmingEnd(false);
  }, []);

  // -------------------------------------------------------------
  // App Lifecycle Management (Background/Foreground, Lock Screen)
  // -------------------------------------------------------------
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (typeof document === 'undefined') return;

      if (document.hidden) {
        // App backgrounded or screen locked
        // Do NOT pause if running; user may be chanting with eyes closed or phone in pocket.
        // Wall clock Date.now() keeps running without drift.
      } else {
        // App returned to foreground / unlocked
        // Immediately sync time against Date.now()
        if (statusRef.current === 'running') {
          evaluateTimeTick();
        }
      }
    };

    const handleWindowFocus = () => {
      if (statusRef.current === 'running') {
        evaluateTimeTick();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleWindowFocus);
    window.addEventListener('pageshow', handleWindowFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleWindowFocus);
      window.removeEventListener('pageshow', handleWindowFocus);
    };
  }, [evaluateTimeTick]);

  // -------------------------------------------------------------
  // Android Back Button / Browser Popstate Interception
  // -------------------------------------------------------------
  useEffect(() => {
    const handlePopState = (e: PopStateEvent) => {
      if (statusRef.current === 'running' || statusRef.current === 'paused') {
        // Intercept Android back button during session
        requestEndEarly();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [requestEndEarly]);

  // -------------------------------------------------------------
  // Clean up timers & audio on component unmount
  // -------------------------------------------------------------
  useEffect(() => {
    return () => {
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (breathIntervalRef.current) clearInterval(breathIntervalRef.current);
      audioEngine.stopAmbient();
      mantraSessionService.clearActiveSession();
    };
  }, []);

  return {
    sessionId,
    status,
    config: currentConfig,
    remainingSeconds,
    elapsedSeconds,
    progress,
    repetitionCount,
    breathPhase,
    isConfirmingEnd,
    isStarting,
    startSession,
    pauseSession,
    resumeSession,
    togglePauseResume,
    requestEndEarly,
    cancelEndEarly,
    confirmEndEarly,
    incrementRepetition,
    resetSession,
  };
}
