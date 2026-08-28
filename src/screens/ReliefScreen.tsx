import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Card, Button } from '../components/UI';
import { X, Volume2, VolumeX, Play, Pause, RotateCcw, Flower, Grid, Brain, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

import { SimulationScreen } from './SimulationScreen';

export const ReliefScreen = ({ onExit }: { onExit: () => void }) => {
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'relax' | 'box' | 'simulation' | 'guided'>('relax');
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [phase, setPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Rest'>('Inhale');
  const [isAudioOn, setIsAudioOn] = useState(true);

  // Speech helper
  const speak = (text: string) => {
    if (!isAudioOn || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      utterance.pitch = 0.95;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Mute / Unmute handler
  const toggleAudio = () => {
    if (isAudioOn) {
      setIsAudioOn(false);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      setIsAudioOn(true);
      speak("Voice guidance enabled.");
    }
  };

  // Restart session
  const handleRestart = () => {
    setIsActive(false);
    setTimeLeft(300);
    setPhase('Inhale');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0 && mode !== 'simulation') {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft, mode]);

  useEffect(() => {
    let phaseInterval: any;
    if (isActive && mode !== 'simulation') {
      const duration = 4; // 4 seconds per phase
      const phases = mode === 'relax' ? ['Inhale', 'Hold', 'Exhale'] : mode === 'guided' ? ['Inhale', 'Hold', 'Exhale'] : ['Inhale', 'Hold', 'Exhale', 'Rest'];
      
      let currentPhaseIndex = 0;
      setPhase(phases[0] as any);
      
      if (isAudioOn) {
        if (mode === 'guided') {
          speak("Welcome to guided meditation. Breathe in deeply through your nose.");
        } else {
          speak(phases[0]);
        }
      }

      phaseInterval = setInterval(() => {
        currentPhaseIndex = (currentPhaseIndex + 1) % phases.length;
        const nextPhase = phases[currentPhaseIndex] as any;
        setPhase(nextPhase);

        if (isAudioOn) {
          if (mode === 'guided') {
            if (nextPhase === 'Inhale') speak("Breathe in peace and stillness.");
            else if (nextPhase === 'Hold') speak("Hold gently. Notice the calm within.");
            else if (nextPhase === 'Exhale') speak("Release all tension and slowly exhale.");
          } else {
            speak(nextPhase);
          }
        }
      }, duration * 1000);
    } else {
      setPhase('Inhale');
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
    return () => clearInterval(phaseInterval);
  }, [isActive, mode, isAudioOn]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (mode === 'simulation') {
    return (
      <div className="flex flex-col">
        <header className="flex justify-between items-center py-4">
          <button 
            onClick={() => setMode('relax')}
            className="w-10 h-10 flex items-center justify-center rounded-full bg-card/60 backdrop-blur-xl text-on-surface-variant"
          >
            <X size={20} />
          </button>
          <span className="font-bold text-lg">Simulation Mode</span>
          <div className="w-10" />
        </header>
        <SimulationScreen onStart={() => setIsActive(true)} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-12 py-6 relative overflow-hidden">
      {/* Background Texture */}
      <div className="absolute inset-0 z-[-1] opacity-5 grayscale mix-blend-multiply dark:mix-blend-overlay pointer-events-none">
        <img 
          src="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&q=80&w=1000" 
          alt="Nature" 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
      </div>

      <header className="w-full flex justify-between items-center z-10">
        <div className="w-10" />
        <div className="flex flex-col items-center">
          <span className="text-on-surface-variant text-[10px] font-bold tracking-[0.2em] uppercase">
            {isActive ? 'Session In Progress' : 'Ready To Begin'}
          </span>
          <span className="font-bold text-lg tracking-tight">
            {mode === 'guided' ? 'Guided Meditation Voice' : mode === 'box' ? 'Box Breathing' : 'Mindful Breathing'}
          </span>
        </div>
        <button 
          onClick={toggleAudio}
          className={cn(
            "w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-xl transition-all",
            isAudioOn ? "bg-primary/20 text-primary" : "bg-surface-variant text-on-surface-variant/50"
          )}
          title={isAudioOn ? "Mute Voice Guidance" : "Unmute Voice Guidance"}
        >
          {isAudioOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
        </button>
      </header>

      <main className="flex flex-col items-center justify-center space-y-12 text-center py-6">
        <div className="relative flex items-center justify-center">
          <motion.div
            animate={{
              scale: isActive ? (phase === 'Inhale' ? 1.5 : phase === 'Exhale' ? 1 : phase === 'Hold' ? 1.5 : 1) : 1,
            }}
            transition={{
              duration: 4,
              ease: "easeInOut"
            }}
            className="w-64 h-64 md:w-72 md:h-72 rounded-full bg-gradient-to-br from-primary/40 to-secondary/40 backdrop-blur-sm border-4 border-white/50 dark:border-white/10 flex flex-col items-center justify-center shadow-[0_0_80px_rgba(141,168,145,0.2)]"
          >
            <div className="z-10 text-center">
              <span className="block text-5xl font-bold tracking-tighter mb-2">{formatTime(timeLeft)}</span>
              <span className="block text-sm font-bold opacity-60 tracking-[0.2em] uppercase">
                {isActive ? phase : 'Ready?'}
              </span>
            </div>
            <div className="absolute inset-4 rounded-full border border-white/20"></div>
          </motion.div>
          
          <div className="absolute w-[115%] h-[115%] rounded-full border border-dashed border-primary/20 animate-[spin_30s_linear_infinite]"></div>
        </div>

        <p className="text-on-surface-variant text-lg font-medium max-w-xs">
          {isActive 
            ? mode === 'guided' 
              ? 'Listen to the voice guidance and let your shoulders drop...' 
              : phase === 'Inhale' ? 'Breathe in deeply...' : phase === 'Hold' ? 'Hold your breath...' : phase === 'Exhale' ? 'Slowly exhale...' : 'Rest and prepare...'
            : mode === 'guided'
              ? 'Guided Voice Meditation ready. Ensure your volume is up or tap the speaker.'
              : 'Follow the circle as it expands and contracts. Let your body soften.'}
        </p>
      </main>

      <div className="w-full space-y-6">
        <div className="grid grid-cols-4 gap-2">
          <Card 
            onClick={() => { setMode('relax'); handleRestart(); }}
            className={cn(
              "p-3 flex flex-col items-start gap-1 cursor-pointer transition-all",
              mode === 'relax' ? "border-primary ring-2 ring-primary/20" : "opacity-60"
            )}
          >
            <Flower size={18} className="text-primary" />
            <div className="text-left">
              <p className="font-bold text-[11px]">Relax</p>
              <p className="text-[8px] text-on-surface-variant uppercase font-bold">4-4-4</p>
            </div>
          </Card>
          <Card 
            onClick={() => { setMode('box'); handleRestart(); }}
            className={cn(
              "p-3 flex flex-col items-start gap-1 cursor-pointer transition-all",
              mode === 'box' ? "border-primary ring-2 ring-primary/20" : "opacity-60"
            )}
          >
            <Grid size={18} className="text-secondary" />
            <div className="text-left">
              <p className="font-bold text-[11px]">Box</p>
              <p className="text-[8px] text-on-surface-variant uppercase font-bold">Equal</p>
            </div>
          </Card>
          <Card 
            onClick={() => { setMode('simulation'); handleRestart(); }}
            className={cn(
              "p-3 flex flex-col items-start gap-1 cursor-pointer transition-all",
              mode === 'simulation' ? "border-primary ring-2 ring-primary/20" : "opacity-60"
            )}
          >
            <Brain size={18} className="text-tertiary" />
            <div className="text-left">
              <p className="font-bold text-[11px]">Twin</p>
              <p className="text-[8px] text-on-surface-variant uppercase font-bold">Train</p>
            </div>
          </Card>
          <Card 
            onClick={() => { setMode('guided'); handleRestart(); }}
            className={cn(
              "p-3 flex flex-col items-start gap-1 cursor-pointer transition-all",
              mode === 'guided' ? "border-primary ring-2 ring-primary/20" : "opacity-60"
            )}
          >
            <Sparkles size={18} className="text-accent" />
            <div className="text-left">
              <p className="font-bold text-[11px]">Guided</p>
              <p className="text-[8px] text-on-surface-variant uppercase font-bold">Voice</p>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-3">
          <Button 
            size="lg" 
            className="col-span-8 py-5 text-lg font-bold"
            onClick={() => {
              const newActive = !isActive;
              setIsActive(newActive);
              if (newActive && isAudioOn) {
                speak(mode === 'guided' ? "Session started. Listen to the guided voice." : "Session started.");
              }
            }}
          >
            {isActive ? <Pause size={22} fill="currentColor" className="mr-2" /> : <Play size={22} fill="currentColor" className="mr-2" />}
            {isActive ? 'Pause Session' : 'Start Session'}
          </Button>

          <Button 
            variant="secondary"
            size="lg" 
            className="col-span-4 py-5 text-sm font-bold flex items-center justify-center gap-1 bg-surface-variant hover:bg-surface-variant/80 text-on-surface"
            onClick={handleRestart}
            title="Restart Session"
          >
            <RotateCcw size={18} />
            <span>Restart</span>
          </Button>
        </div>

        <div className="space-y-2">
          <div className="h-1.5 w-full bg-surface-variant rounded-full overflow-hidden">
            <motion.div 
              animate={{ width: `${((300 - timeLeft) / 300) * 100}%` }}
              className="h-full bg-primary rounded-full"
            />
          </div>
          <div className="flex justify-between px-1">
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Elapsed: {formatTime(300 - timeLeft)}</span>
            <span className="text-[10px] font-bold text-outline uppercase tracking-wider">Goal: 05:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

