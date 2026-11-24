import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, Card } from '../components/UI';
import { 
  X, 
  Heart, 
  Phone, 
  MessageCircle, 
  AlertCircle, 
  Volume2, 
  VolumeX, 
  Timer,
  ChevronRight,
  ShieldCheck,
  ZapOff,
  Eye,
  Hand,
  Ear,
  Leaf
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';

type PanicPhase = 'distress' | 'breathing' | 'grounding' | 'recovery';

export const CrisisScreen = ({ onExit }: { onExit: () => void }) => {
  const { userName } = useAppContext();
  const [phase, setPhase] = useState<PanicPhase>('distress');
  const [bpm, setBpm] = useState(135);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [breathingPhase, setBreathingPhase] = useState<'In' | 'Hold' | 'Out'>('In');
  const [timerSeconds, setTimerSeconds] = useState(300); // 5 min countdown
  const [groundingStep, setGroundingStep] = useState(0);
  const [showHeartSensor, setShowHeartSensor] = useState(false);
  const [fingerDetectionProgress, setFingerDetectionProgress] = useState(0);
  const [isAlertingContacts, setIsAlertingContacts] = useState(false);
  const [didAlertSucceed, setDidAlertSucceed] = useState(false);

  // Audio References
  const ttsTimeoutRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Rain background sound
    audioRef.current = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-rain-drops-splashing-on-a-surface-2435.mp3');
    audioRef.current.loop = true;
    if (isAudioOn) {
      audioRef.current.play().catch(() => {});
    }
    return () => {
      audioRef.current?.pause();
    };
  }, [isAudioOn]);

  const handleSOSAlert = () => {
    setIsAlertingContacts(true);
    // Simulate sending location + SOS to contacts
    setTimeout(() => {
      setIsAlertingContacts(false);
      setDidAlertSucceed(true);
      speak("Emergency contacts have been notified of your location.");
    }, 2000);
  };

  // 4-7-8 Timing (adjusted for better ease)
  const timings = {
    'In': 4000,
    'Hold': 7000,
    'Out': 8000
  };

  const speak = useCallback((text: string) => {
    if (!isAudioOn) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [isAudioOn]);

  // Breathing Loop
  useEffect(() => {
    if (phase === 'breathing' || phase === 'distress') {
      const loop = () => {
        setBreathingPhase('In');
        speak('Breathe in');
        
        ttsTimeoutRef.current = setTimeout(() => {
          setBreathingPhase('Hold');
          speak('Hold it');
          
          ttsTimeoutRef.current = setTimeout(() => {
            setBreathingPhase('Out');
            speak('Breathe out slowly');
            
            ttsTimeoutRef.current = setTimeout(loop, timings['Out']);
          }, timings['Hold']);
        }, timings['In']);
      };
      
      loop();
      return () => {
        clearTimeout(ttsTimeoutRef.current);
        window.speechSynthesis.cancel();
      };
    }
  }, [phase, speak]);

  // BPM Reduction Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setBpm(prev => {
        const target = phase === 'recovery' ? 70 : phase === 'grounding' ? 85 : 100;
        if (prev > target) return prev - 1;
        return prev + (Math.random() > 0.5 ? 1 : -1);
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [phase]);

  // Timer Countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const getPhaseMessage = () => {
    switch(phase) {
      case 'distress': return "Focus only on the circle.";
      case 'breathing': return "You are doing great. Keep breathing.";
      case 'grounding': return "Let's find 5 things you can see.";
      case 'recovery': return "The peak has passed. You are safe.";
      default: return "";
    }
  };

  const groundingSteps = [
    { title: "5 things you SEE", icon: Eye, color: "text-blue-400" },
    { title: "4 things you TOUCH", icon: Hand, color: "text-purple-400" },
    { title: "3 things you HEAR", icon: Ear, color: "text-green-400" },
    { title: "2 things you SMELL", icon: ZapOff, color: "text-yellow-400" },
    { title: "1 thing you TASTE", icon: Leaf, color: "text-red-400" },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-slate-950 flex flex-col items-center justify-between p-6 overflow-hidden safe-area-inset"
    >
      {/* Background Calm Patterns */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <header className="w-full relative z-10 flex justify-between items-center pt-8">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
          <span className="text-[10px] font-bold text-white/40 uppercase tracking-[0.3em]">Crisis Mode Active</span>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsAudioOn(!isAudioOn)}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60"
          >
            {isAudioOn ? <Volume2 size={20} /> : <VolumeX size={20} />}
          </button>
          <button 
            onClick={onExit}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-white/5 border border-white/10 text-white/60"
          >
            <X size={20} />
          </button>
        </div>
      </header>

      <main className="flex-1 w-full flex flex-col items-center justify-center relative z-10 space-y-12">
        
        {/* Progress Timeline (Hope Engine) */}
        <div className="w-full max-w-xs space-y-4">
          <div className="flex justify-between items-end">
            <div className="text-left">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Status</p>
              <h2 className="text-lg font-bold text-white leading-tight">
                {timerSeconds > 180 ? "Peak intensity" : timerSeconds > 60 ? "Calming down" : "Recovery"}
              </h2>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Time Left</p>
              <p className="text-xl font-mono text-primary font-bold">{formatTime(timerSeconds)}</p>
            </div>
          </div>
          <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '100%' }}
              animate={{ width: `${(timerSeconds / 300) * 100}%` }}
              className="h-full bg-gradient-to-r from-primary to-accent"
            />
          </div>
        </div>

        {/* Adaptive Content Area */}
        <div className="relative flex flex-col items-center justify-center w-full min-h-[400px]">
          
          <AnimatePresence mode="wait">
            {phase === 'distress' || phase === 'breathing' ? (
              <motion.div 
                key="breathing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="relative flex items-center justify-center"
              >
                {/* 4-7-8 Breathing Circle */}
                <motion.div
                  animate={{
                    scale: breathingPhase === 'In' ? 1.6 : breathingPhase === 'Hold' ? 1.6 : 1,
                  }}
                  transition={{
                    duration: timings[breathingPhase] / 1000,
                    ease: "easeInOut"
                  }}
                  className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent flex items-center justify-center relative shadow-[0_0_80px_rgba(141,168,145,0.3)]"
                >
                  <div className="absolute inset-0 rounded-full border-4 border-white/20"></div>
                  <div className="text-center z-10">
                    <span className="text-2xl font-black text-white uppercase tracking-tighter drop-shadow-md">
                      {breathingPhase === 'In' ? 'Inhale' : breathingPhase === 'Hold' ? 'Hold' : 'Exhale'}
                    </span>
                  </div>
                </motion.div>

                {/* Pulse Rings */}
                {[1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: breathingPhase === 'In' ? [1, 2.5] : [1, 1],
                      opacity: breathingPhase === 'In' ? [0.4, 0] : 0
                    }}
                    transition={{
                      duration: timings['In'] / 1000,
                      repeat: Infinity,
                      delay: i * 0.5
                    }}
                    className="absolute w-48 h-48 rounded-full border-2 border-primary/30 pointer-events-none"
                  />
                ))}
              </motion.div>
            ) : phase === 'grounding' ? (
              <motion.div 
                key="grounding"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="w-full max-w-sm"
              >
                <div className="text-center mb-8">
                  <h3 className="text-4xl font-black text-white mb-2">Focus on Reality</h3>
                  <p className="text-white/40 text-sm">Ground yourself in the present moment.</p>
                </div>

                <div className="space-y-4">
                  {groundingSteps.map((step, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: idx <= groundingStep ? 1 : 0.2, 
                        x: 0,
                        scale: idx === groundingStep ? 1.05 : 1
                      }}
                      className={cn(
                        "p-5 rounded-3xl flex items-center gap-4 transition-all border",
                        idx === groundingStep ? "bg-white/10 border-white/20 shadow-xl" : "bg-white/5 border-transparent"
                      )}
                      onClick={() => idx === groundingStep && setGroundingStep(prev => prev < 4 ? prev + 1 : prev)}
                    >
                      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center bg-white/5", step.color)}>
                        <step.icon size={24} />
                      </div>
                      <span className="flex-1 font-bold text-white text-lg">{step.title}</span>
                      {idx < groundingStep && <ShieldCheck className="text-primary" />}
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="recovery"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-8"
              >
                <div className="w-32 h-32 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck size={64} className="text-primary" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-5xl font-black text-white">You Made It.</h2>
                  <p className="text-white/60 text-lg">Your body is calm. Your mind is safe.</p>
                </div>
                <Button size="lg" className="px-12 py-6 text-xl rounded-full" onClick={onExit}>
                  Complete Session
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Live Vitals Display */}
        <div 
          className="flex flex-col items-center gap-4 cursor-pointer group"
          onClick={() => setShowHeartSensor(true)}
        >
          <div className="flex items-center gap-3 px-6 py-3 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 transition-colors">
            <Heart size={20} className={cn("text-error fill-error", bpm > 110 ? "animate-[ping_0.8s_linear_infinite]" : "animate-pulse")} />
            <span className="text-2xl font-black text-white font-mono tabular-nums leading-none">
              {bpm} <span className="text-[10px] font-bold opacity-30 uppercase tracking-widest ml-1">BPM</span>
            </span>
          </div>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] group-hover:text-primary transition-colors">
            Tap to check vitals
          </p>
        </div>
      </main>

      <footer className="w-full max-w-md relative z-10 pb-12 flex flex-col gap-6">
        
        {/* Affirmation Text */}
        <div className="text-center h-8 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.p 
              key={getPhaseMessage()}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-sm font-medium text-white/60 italic px-6 text-center"
            >
              {getPhaseMessage()}
            </motion.p>
          </AnimatePresence>
        </div>

        {/* Adaptive Controls */}
        <div className="grid grid-cols-2 gap-4">
          {phase === 'distress' || phase === 'breathing' ? (
            <>
              <Button 
                variant={didAlertSucceed ? "secondary" : "danger"}
                className={cn("py-6 rounded-3xl flex flex-col items-center gap-1 shadow-2xl transition-all", didAlertSucceed && "bg-primary/20 text-primary border-primary/20")}
                onClick={handleSOSAlert}
                disabled={isAlertingContacts || didAlertSucceed}
              >
                {isAlertingContacts ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><AlertCircle size={24} /></motion.div> : didAlertSucceed ? <ShieldCheck size={24} /> : <MessageCircle size={24} />}
                <span className="text-[10px] font-black uppercase tracking-tight">
                  {isAlertingContacts ? 'Notifying...' : didAlertSucceed ? 'Contacts Alerted' : 'Notify Contacts'}
                </span>
              </Button>
              <Button 
                variant="secondary" 
                className="py-6 rounded-3xl flex flex-col items-center gap-1 bg-white/10 hover:bg-white/20 border-white/5 text-white"
                onClick={() => setPhase('grounding')}
              >
                <Hand size={24} />
                <span className="text-[10px] font-black uppercase tracking-tight">Grounding</span>
              </Button>
            </>
          ) : phase === 'grounding' ? (
            <>
              <Button 
                variant="ghost"
                className="py-6 rounded-3xl text-white/40"
                onClick={() => setPhase('breathing')}
              >
                Back to Breathing
              </Button>
              <Button 
                variant="primary" 
                className="py-6 rounded-3xl bg-primary text-white"
                onClick={() => groundingStep === 4 ? setPhase('recovery') : setGroundingStep(s => s + 1)}
              >
                {groundingStep === 4 ? "Done" : "Next (Tap to progress)"}
              </Button>
            </>
          ) : null}
        </div>
      </footer>

      {/* Heart Rate Sensor Modal */}
      <AnimatePresence>
        {showHeartSensor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950 flex flex-col items-center justify-center p-8"
          >
            <div className="text-center space-y-4 mb-12">
              <h3 className="text-3xl font-black text-white uppercase tracking-tight">Physiological Check</h3>
              <p className="text-white/40 max-w-xs mx-auto">Place your finger over the camera or heart icon to measure stabilization.</p>
            </div>

            <div className="relative w-64 h-64 flex items-center justify-center">
              <motion.div 
                className="absolute inset-0 rounded-full border-4 border-primary/20"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <button 
                className="w-48 h-48 rounded-full bg-error/10 border-4 border-error/30 flex items-center justify-center flex-col gap-2 relative overflow-hidden"
                onMouseDown={() => {
                  const timer = setInterval(() => {
                    setFingerDetectionProgress(p => {
                      if (p >= 100) {
                        clearInterval(timer);
                        setTimeout(() => setShowHeartSensor(false), 800);
                        return 100;
                      }
                      return p + 2;
                    });
                  }, 50);
                }}
                onMouseUp={() => setFingerDetectionProgress(0)}
                onTouchStart={() => {
                   const timer = setInterval(() => {
                    setFingerDetectionProgress(p => {
                      if (p >= 100) {
                        clearInterval(timer);
                        setTimeout(() => setShowHeartSensor(false), 800);
                        return 100;
                      }
                      return p + 2;
                    });
                  }, 50);
                }}
                onTouchEnd={() => setFingerDetectionProgress(0)}
              >
                <Heart size={64} className={cn("text-error fill-error", fingerDetectionProgress > 0 && "animate-pulse")} />
                <span className="text-[10px] font-black text-error uppercase tracking-widest">Hold to Detect</span>
                
                <div className="absolute bottom-0 left-0 h-2 bg-error" style={{ width: `${fingerDetectionProgress}%` }}></div>
              </button>
            </div>

            <div className="mt-12 text-center h-12">
              <AnimatePresence>
                {fingerDetectionProgress > 0 && (
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-primary font-bold tracking-widest uppercase text-xs"
                  >
                    Syncing with biological feedback...
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            <Button variant="ghost" className="mt-8 text-white/40" onClick={() => setShowHeartSensor(false)}>
              Cancel
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
