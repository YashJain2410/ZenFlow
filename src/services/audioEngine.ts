import { 
  startAmbientDrone, 
  pauseAmbientDrone, 
  resumeAmbientDrone, 
  stopAmbientDrone, 
  playSingingBowlChime,
  playBeadChime,
  triggerGentleHaptic
} from '../utils/mantraAudio';

export type AmbientTrackId = 'silent' | 'synthetic_drone' | 'rain' | 'river' | 'forest';

/**
 * Service to manage unified audio playback for Mantra Sessions.
 * Handles both offline synthetic Web Audio API sounds and external HTML5 Audio files (like nature sounds).
 */
class AudioEngineService {
  private ambientPlayer: HTMLAudioElement | null = null;
  private currentTrack: AmbientTrackId = 'silent';
  private masterVolume: number = 0.5;
  private isSynthesized: boolean = false;
  
  // Future proofing for guided voice sessions
  private voicePlayer: HTMLAudioElement | null = null;

  private initAmbientPlayer() {
    if (typeof window === 'undefined') return;
    
    if (!this.ambientPlayer) {
      this.ambientPlayer = new Audio();
      this.ambientPlayer.loop = true;
      
      // Handle missing file or loading errors gracefully
      this.ambientPlayer.onerror = () => {
        console.warn(`[AudioEngine] Failed to load track: ${this.ambientPlayer?.src}. Falling back to synthetic drone.`);
        this.playSyntheticDrone();
      };
    }
  }

  public setVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    
    // Scale down ambient volume slightly so it remains a background element
    if (this.ambientPlayer) {
      this.ambientPlayer.volume = this.masterVolume * 0.4;
    }
    if (this.voicePlayer) {
      this.voicePlayer.volume = this.masterVolume;
    }
    
    // We adjust synthetic drone via pausing and resuming with new volume if active
    if (this.isSynthesized && this.currentTrack === 'synthetic_drone') {
      resumeAmbientDrone(this.masterVolume);
    }
  }

  public playAmbient(track: AmbientTrackId, volume: number) {
    this.setVolume(volume);
    this.currentTrack = track;
    this.stopAmbient();

    if (track === 'silent') return;

    if (track === 'synthetic_drone') {
      this.playSyntheticDrone();
      return;
    }

    // Play external file-based ambient track
    this.initAmbientPlayer();
    const url = this.getTrackUrl(track);
    
    if (this.ambientPlayer && url) {
      this.ambientPlayer.src = url;
      this.ambientPlayer.volume = this.masterVolume * 0.4;
      
      const playPromise = this.ambientPlayer.play();
      if (playPromise !== undefined) {
        playPromise.catch(e => {
          console.warn("[AudioEngine] Autoplay prevented or error playing file:", e);
          // Fallback to synthetic drone if browser blocks un-gestured file playback
          this.playSyntheticDrone();
        });
      }
      this.isSynthesized = false;
    }
  }

  public pause() {
    if (this.isSynthesized) {
      pauseAmbientDrone();
    } else if (this.ambientPlayer) {
      this.ambientPlayer.pause();
    }
    
    if (this.voicePlayer) {
      this.voicePlayer.pause();
    }
  }

  public resume() {
    if (this.currentTrack === 'silent') return;
    
    if (this.isSynthesized) {
      resumeAmbientDrone(this.masterVolume);
    } else if (this.ambientPlayer) {
      this.ambientPlayer.play().catch(() => {
        console.warn("[AudioEngine] Could not resume audio file playback.");
      });
    }
    
    if (this.voicePlayer) {
      this.voicePlayer.play().catch(() => {});
    }
  }

  public stopAmbient() {
    stopAmbientDrone();
    if (this.ambientPlayer) {
      this.ambientPlayer.pause();
      this.ambientPlayer.currentTime = 0;
      this.ambientPlayer.removeAttribute('src'); // Fully clear src to release resources
    }
    if (this.voicePlayer) {
      this.voicePlayer.pause();
      this.voicePlayer.currentTime = 0;
      this.voicePlayer.removeAttribute('src');
    }
  }

  public playSingingBowl() {
    // Singing bowl is mixed relatively to master volume
    playSingingBowlChime(432, 5.0 * (0.5 + this.masterVolume * 0.5));
  }

  public playBead() {
    playBeadChime();
  }

  public playHaptic() {
    triggerGentleHaptic(25);
  }

  private playSyntheticDrone() {
    startAmbientDrone(this.masterVolume);
    this.isSynthesized = true;
    this.currentTrack = 'synthetic_drone';
  }

  private getTrackUrl(track: AmbientTrackId): string | null {
    // Designed so future assets can be placed in public/audio/
    switch(track) {
      case 'rain': return '/audio/ambient_rain.mp3';
      case 'river': return '/audio/ambient_river.mp3';
      case 'forest': return '/audio/ambient_forest.mp3';
      default: return null;
    }
  }
}

export const audioEngine = new AudioEngineService();
