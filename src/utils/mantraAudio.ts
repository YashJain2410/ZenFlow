/**
 * Web Audio API synthesizer for peaceful mantra chimes, singing bowls, and ambient drone.
 * 100% offline, zero latency, and zero dependency on external audio assets.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Ambient drone node references for smooth fade-in/fade-out/pause
 */
interface DroneEngine {
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  masterGain: GainNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  isPlaying: boolean;
}

let activeDrone: DroneEngine | null = null;

/**
 * Starts a warm, peaceful 432 Hz grounding ambient harmonic drone.
 * Emulates the gentle, continuous hum of Tibetan bronze bowls and tanpura.
 */
export function startAmbientDrone(volume = 0.25): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  // Stop any existing drone safely first
  stopAmbientDrone();

  try {
    const now = ctx.currentTime;
    const baseFreq = 216; // A3 sub-harmonic (432 / 2) for deep, non-harsh foundation

    // Fundamental + harmonics: 216Hz, 432Hz (fundamental), 648Hz (fifth harmonic)
    const freqs = [baseFreq, baseFreq * 2, baseFreq * 3, baseFreq * 4];
    const gains = [0.4, 0.35, 0.15, 0.08];

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];

    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, now);
    masterGain.gain.exponentialRampToValueAtTime(Math.max(0.01, volume * 0.3), now + 2.0); // Gentle 2-second swell

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, now);
    filter.Q.setValueAtTime(1.5, now);

    // Ultra-slow breathing LFO on the filter cutoff (0.1 Hz ~ 10s period)
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(0.1, now);
    lfoGain.gain.setValueAtTime(120, now);
    lfo.connect(filter.frequency);
    lfo.start(now);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      // Add microscopic detuning for rich natural chorus
      const detuneCents = (idx % 2 === 0 ? 1 : -1) * (idx + 1) * 2;
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detuneCents, now);

      gain.gain.setValueAtTime(gains[idx] || 0.1, now);

      osc.connect(gain);
      gain.connect(filter);
      osc.start(now);

      oscillators.push(osc);
      gainNodes.push(gain);
    });

    activeDrone = {
      oscillators,
      gainNodes,
      masterGain,
      filter,
      lfo,
      isPlaying: true,
    };
  } catch (err) {
    console.warn('Could not start ambient drone:', err);
  }
}

/**
 * Temporarily pause the drone (fade gain to near 0)
 */
export function pauseAmbientDrone(): void {
  if (!activeDrone || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    activeDrone.masterGain.gain.cancelScheduledValues(now);
    activeDrone.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
    activeDrone.isPlaying = false;
  } catch (e) {
    // ignore
  }
}

/**
 * Resumes drone from pause (fade gain back up)
 */
export function resumeAmbientDrone(volume = 0.25): void {
  if (!activeDrone || !audioCtx) {
    startAmbientDrone(volume);
    return;
  }
  try {
    const now = audioCtx.currentTime;
    activeDrone.masterGain.gain.cancelScheduledValues(now);
    activeDrone.masterGain.gain.linearRampToValueAtTime(Math.max(0.01, volume * 0.3), now + 0.8);
    activeDrone.isPlaying = true;
  } catch (e) {
    // ignore
  }
}

/**
 * Permanently stop the ambient drone and free audio nodes
 */
export function stopAmbientDrone(): void {
  if (!activeDrone) return;
  try {
    if (audioCtx && audioCtx.state !== 'closed') {
      const now = audioCtx.currentTime;
      activeDrone.masterGain.gain.cancelScheduledValues(now);
      activeDrone.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.5);

      setTimeout(() => {
        try {
          activeDrone?.oscillators.forEach(osc => {
            try { osc.stop(); osc.disconnect(); } catch (e) {}
          });
          activeDrone?.lfo.stop();
          activeDrone?.lfo.disconnect();
          activeDrone?.masterGain.disconnect();
          activeDrone?.filter.disconnect();
          activeDrone = null;
        } catch (e) {}
      }, 550);
    } else {
      activeDrone = null;
    }
  } catch (e) {
    activeDrone = null;
  }
}

/**
 * Synthesizes a resonant Himalayan singing bowl strike at 432 Hz with warm overtones.
 */
export function playSingingBowlChime(fundamentalFreq = 432, duration = 4.5): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    
    // Primary fundamental tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamentalFreq, now);

    // Subtle gentle vibrato
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.setValueAtTime(2.5, now); // 2.5Hz gentle pulse
    lfoGain.gain.setValueAtTime(1.2, now);
    lfo.connect(osc1.frequency);
    lfo.start(now);
    lfo.stop(now + duration);

    // Warm overtone 1 (octave + fifth harmonic ratio ~ 2.76)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(fundamentalFreq * 2.756, now);

    // Warm overtone 2 (high harmonic shimmer ~ 5.4)
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(fundamentalFreq * 5.404, now);

    // Gentle lowpass filter to emulate the bronze bowl acoustics
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, now);
    filter.Q.setValueAtTime(2, now);

    // Exponential decay envelopes
    gain1.gain.setValueAtTime(0.0001, now);
    gain1.gain.exponentialRampToValueAtTime(0.35, now + 0.08); // quick strike
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    gain2.gain.setValueAtTime(0.0001, now);
    gain2.gain.exponentialRampToValueAtTime(0.12, now + 0.05);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

    gain3.gain.setValueAtTime(0.0001, now);
    gain3.gain.exponentialRampToValueAtTime(0.04, now + 0.03);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4);

    // Master session gain to prevent any clipping
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.6, now);

    // Connections
    osc1.connect(gain1);
    osc2.connect(gain2);
    osc3.connect(gain3);

    gain1.connect(filter);
    gain2.connect(filter);
    gain3.connect(filter);

    filter.connect(masterGain);
    masterGain.connect(ctx.destination);

    // Start & stop oscillators
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  } catch (e) {
    console.warn('Singing bowl audio error:', e);
  }
}

/**
 * Gentle wooden bead tick sound for Japa repetition counters
 */
export function playBeadChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(580, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.07);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.15, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.09);
  } catch (e) {
    console.warn('Bead chime error:', e);
  }
}

/**
 * Subtle tactile haptic vibration (supported on mobile browsers & Android)
 */
export function triggerGentleHaptic(durationMs = 25): void {
  if (typeof window !== 'undefined' && 'navigator' in window && typeof navigator.vibrate === 'function') {
    try {
      navigator.vibrate(durationMs);
    } catch (e) {
      // ignore
    }
  }
}

/**
 * Optional voice pronunciation assistance
 */
export function speakMantraGuide(text: string): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 0.95;
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('Speech error:', e);
  }
}

export function stopMantraSpeech(): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
  } catch (e) {
    // ignore
  }
}

/**
 * Complete master stop for all mantra audio, drone, and speech
 */
export function stopAllMantraAudio(): void {
  stopAmbientDrone();
  stopMantraSpeech();
}

