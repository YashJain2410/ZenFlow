import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, ProgressRing, Button } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { Wind, Brain, Target, AlertCircle, Flame } from 'lucide-react';
import { cn } from '../lib/utils';

export const HomeScreen = ({ onSOS, onNavigate }: { onSOS: () => void, onNavigate: (tab: any) => void }) => {
  const { userName, calmScore, streak, mood, lastEntry, stressLevel, setStressLevel } = useAppContext();

  const isHighStress = stressLevel === 'high';

  return (
    <div className="space-y-8 pb-10">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">
          {isHighStress ? `Stay with us, ${userName || 'Elena'}.` : `Hello, ${userName || 'Elena'}`}
        </h1>
        <p className="text-on-surface-variant text-lg">
          {isHighStress ? 'Focus on your breath. We are here.' : "Your mind is a quiet garden today."}
        </p>
      </section>

      <AnimatePresence mode="wait">
        {!isHighStress ? (
          <motion.div 
            key="normal-ui"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-8"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="flex flex-col items-center justify-center py-10">
                <span className="text-sm font-bold text-on-surface-variant mb-4 uppercase tracking-widest">Calm Score</span>
                <ProgressRing value={calmScore} />
              </Card>

              <div className="space-y-6">
                <Card className="bg-surface-variant/30 border-none">
                  <div className="flex justify-between items-center mb-4">
                    <span className="font-bold text-on-surface">Stress Level</span>
                    <div className="flex gap-2">
                      <button onClick={() => setStressLevel('low')} className={cn("px-2 py-1 rounded-md text-[10px] font-bold", stressLevel === 'low' ? "bg-primary text-white" : "bg-surface-variant")}>LOW</button>
                      <button onClick={() => setStressLevel('normal')} className={cn("px-2 py-1 rounded-md text-[10px] font-bold", stressLevel === 'normal' ? "bg-primary text-white" : "bg-surface-variant")}>NORM</button>
                      <button onClick={() => setStressLevel('high')} className={cn("px-2 py-1 rounded-md text-[10px] font-bold", stressLevel === 'high' ? "bg-primary text-white" : "bg-surface-variant")}>HIGH</button>
                    </div>
                  </div>
                  <div className="w-full h-3 bg-surface-variant rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: stressLevel === 'low' ? '20%' : stressLevel === 'normal' ? '50%' : '80%' }}
                      className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    />
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    Your stress levels are {stressLevel === 'low' ? '25% lower' : 'stable'} compared to yesterday.
                  </p>
                </Card>

                <Button 
                  variant="danger" 
                  size="lg" 
                  className="w-full py-5 text-xl"
                  onClick={onSOS}
                >
                  <AlertCircle size={24} fill="currentColor" />
                  Quick SOS Relief
                </Button>
              </div>
            </div>

            <section className="space-y-4">
              <h2 className="text-xl font-bold text-on-surface px-1">Quick Relief</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: Wind, label: 'Breathing', color: 'text-primary', bg: 'bg-primary/10', action: () => onNavigate('relief') },
                  { icon: Brain, label: 'Grounding', color: 'text-tertiary', bg: 'bg-tertiary/10', action: () => onNavigate('relief') },
                  { icon: Target, label: 'Focus', color: 'text-secondary', bg: 'bg-secondary/10', action: () => onNavigate('relief') },
                ].map((item, i) => (
                  <Card 
                    key={i} 
                    className="p-5 flex flex-col items-center gap-3 text-center cursor-pointer hover:scale-105 transition-transform"
                    onClick={item.action}
                  >
                    <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", item.bg, item.color)}>
                      <item.icon size={28} />
                    </div>
                    <span className="text-sm font-bold">{item.label}</span>
                  </Card>
                ))}
              </div>
            </section>

            <Card className="bg-gradient-to-br from-secondary/10 to-tertiary/10 border-none p-8 relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <h2 className="text-xl font-bold text-on-surface">Your Mind Today</h2>
                  <p className="text-on-surface-variant">Daily Streak: {streak} Days</p>
                </div>
                <div className="bg-white/50 dark:bg-black/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2">
                  <Flame size={20} className="text-orange-500 fill-orange-500" />
                  <span className="font-bold text-on-surface">{streak}</span>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-stretch">
                <div className="flex-shrink-0 w-20 h-20 bg-white/40 dark:bg-black/20 rounded-2xl flex flex-col items-center justify-center gap-1 border border-white/20">
                  <span className="text-3xl">{mood || '😐'}</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Mood</span>
                </div>
                <div className="w-full flex-1 px-6 py-4 bg-white/60 dark:bg-surface-variant/60 backdrop-blur-sm rounded-2xl flex flex-col justify-center min-h-[80px] soft-shadow border border-white/20">
                  <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1 opacity-60">Last Entry</span>
                  <span className="font-bold text-on-surface truncate block w-full">{lastEntry || 'No entries yet'}</span>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div 
            key="high-stress-ui"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="space-y-12 py-10"
          >
            <div className="flex flex-col gap-6">
              <Button 
                variant="danger" 
                size="lg" 
                className="w-full py-10 text-3xl rounded-[3rem]"
                onClick={onSOS}
              >
                <AlertCircle size={40} fill="currentColor" />
                EMERGENCY SOS
              </Button>
              
              <Button 
                variant="primary" 
                size="lg" 
                className="w-full py-10 text-3xl rounded-[3rem] bg-accent"
                onClick={() => setStressLevel('normal')}
              >
                <Wind size={40} />
                GUIDED BREATHING
              </Button>
            </div>

            <Card className="p-8 text-center bg-primary/5 border-primary/20">
              <p className="text-xl font-medium text-on-surface leading-relaxed">
                "This feeling is temporary. You have survived this before, and you will survive this now."
              </p>
            </Card>

            <Button 
              variant="ghost" 
              className="w-full text-on-surface-variant font-bold"
              onClick={() => setStressLevel('normal')}
            >
              I feel a bit better now
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
