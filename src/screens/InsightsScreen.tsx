import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, ProgressRing, Button } from '../components/UI';
import { TrendingUp, Moon, Coffee, Smile, Sparkles, Calendar, HelpCircle, CheckCircle2, X, Plus, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { cn } from '../lib/utils';

const data = [
  { name: 'Mon', value: 40 },
  { name: 'Tue', value: 35 },
  { name: 'Wed', value: 55 },
  { name: 'Thu', value: 45 },
  { name: 'Fri', value: 60 },
  { name: 'Sat', value: 75 },
  { name: 'Sun', value: 65 },
];

export const InsightsScreen = ({ onBeginRelief }: { onBeginRelief: () => void }) => {
  const [activeVitalModal, setActiveVitalModal] = useState<'sleep' | 'mood' | 'caffeine' | null>(null);
  const [showExposureInfo, setShowExposureInfo] = useState(false);

  // Vitals State
  const [vitals, setVitals] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zenflow_vitals');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return {
      sleep: '7.5 hrs',
      mood: '😊 Calm',
      caffeine: '1 cup',
      lastLogged: 'Today, 8:30 AM'
    };
  });

  // Inputs for modals
  const [sleepVal, setSleepVal] = useState('8.0');
  const [moodVal, setMoodVal] = useState('😊 Calm');
  const [caffeineVal, setCaffeineVal] = useState('1');
  const [logSuccess, setLogSuccess] = useState('');

  const saveVitals = (newVitals: Partial<typeof vitals>) => {
    const updated = {
      ...vitals,
      ...newVitals,
      lastLogged: 'Just now'
    };
    setVitals(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenflow_vitals', JSON.stringify(updated));
    }
    setLogSuccess('Vitals logged successfully!');
    setTimeout(() => setLogSuccess(''), 3000);
    setActiveVitalModal(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Daily Horizon</h1>
        <p className="text-on-surface-variant text-lg">Visualize your journey to inner peace.</p>
      </section>

      {logSuccess && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-primary/20 border border-primary text-primary px-4 py-3 rounded-2xl flex items-center gap-3 font-bold text-sm"
        >
          <CheckCircle2 size={18} />
          {logSuccess}
        </motion.div>
      )}

      <Card className="flex flex-col items-center justify-center py-10 relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-tertiary/10 rounded-full blur-3xl"></div>
        
        <ProgressRing value={75} label="RESILIENCE" size={180} />
        
        <div className="text-center mt-6 space-y-2">
          <h2 className="text-2xl font-bold text-on-surface">Steady Progress</h2>
          <p className="text-on-surface-variant text-sm max-w-xs mx-auto leading-relaxed">
            Your emotional regulation is showing strong recovery patterns today.
          </p>
        </div>
      </Card>

      {/* Log Your Vitals Display & Actions */}
      <section className="space-y-4">
        <div className="flex justify-between items-center px-1">
          <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest">Log Your Vitals</h3>
          <span className="text-[10px] text-outline font-bold uppercase">Last: {vitals.lastLogged}</span>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <button 
            onClick={() => setActiveVitalModal('sleep')}
            className="bg-card hover:bg-surface-variant/40 rounded-2xl p-4 soft-shadow hover:scale-105 transition-all flex flex-col items-center gap-2 border border-outline-variant/10 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <Moon size={20} />
            </div>
            <span className="text-xs font-bold text-on-surface">Sleep</span>
            <span className="text-[10px] text-primary font-bold">{vitals.sleep}</span>
          </button>

          <button 
            onClick={() => setActiveVitalModal('mood')}
            className="bg-card hover:bg-surface-variant/40 rounded-2xl p-4 soft-shadow hover:scale-105 transition-all flex flex-col items-center gap-2 border border-outline-variant/10 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-full bg-tertiary/10 text-tertiary flex items-center justify-center group-hover:bg-tertiary group-hover:text-white transition-colors">
              <Smile size={20} />
            </div>
            <span className="text-xs font-bold text-on-surface">Mood</span>
            <span className="text-[10px] text-tertiary font-bold truncate max-w-[80px]">{vitals.mood}</span>
          </button>

          <button 
            onClick={() => setActiveVitalModal('caffeine')}
            className="bg-card hover:bg-surface-variant/40 rounded-2xl p-4 soft-shadow hover:scale-105 transition-all flex flex-col items-center gap-2 border border-outline-variant/10 group cursor-pointer text-center"
          >
            <div className="w-10 h-10 rounded-full bg-orange-500/10 text-orange-500 flex items-center justify-center group-hover:bg-orange-500 group-hover:text-white transition-colors">
              <Coffee size={20} />
            </div>
            <span className="text-xs font-bold text-on-surface">Caffeine</span>
            <span className="text-[10px] text-orange-500 font-bold">{vitals.caffeine}</span>
          </button>
        </div>
      </section>

      {/* Explanation Card for Exposure Steps */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-secondary/10 border-primary/20 space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary text-white rounded-xl">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="font-bold text-on-surface text-base">What are Exposure Steps?</h3>
              <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider">CBT Panic Therapy Guide</p>
            </div>
          </div>
          <button 
            onClick={() => setShowExposureInfo(!showExposureInfo)}
            className="text-primary font-bold text-xs bg-primary/10 px-3 py-1.5 rounded-full hover:bg-primary/20 transition-all"
          >
            {showExposureInfo ? 'Hide Details' : 'Learn More'}
          </button>
        </div>

        <p className="text-sm text-on-surface-variant leading-relaxed">
          <strong className="text-on-surface">Exposure Steps</strong> are a proven Cognitive Behavioral Therapy (CBT) technique. They help you safely break down frightening panic triggers (like driving, cafes, or crowded places) into small, manageable steps.
        </p>

        {showExposureInfo && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3 pt-2 border-t border-outline-variant/20 text-xs text-on-surface-variant"
          >
            <p className="font-semibold text-on-surface">How Exposure Therapy works in ZenFlow:</p>
            <ol className="list-decimal list-inside space-y-1.5 pl-1">
              <li><strong>Step 1:</strong> Start with mild triggers (e.g., visiting a quiet cafe for 5 minutes).</li>
              <li><strong>Step 2:</strong> Practice your breathing skills while facing the situation.</li>
              <li><strong>Step 3:</strong> Mark completed steps in your Therapy tab to retrain your nervous system that panic signals are false alarms.</li>
            </ol>
          </motion.div>
        )}
      </Card>

      <div className="grid grid-cols-2 gap-4">
        <Card className="bg-surface-variant/30 border-none p-5 flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <Moon size={20} className="text-primary fill-primary" />
            <span className="text-[10px] font-bold px-2 py-1 bg-white/50 dark:bg-black/20 rounded-full text-primary tracking-tight">OPTIMAL</span>
          </div>
          <div>
            <p className="text-xs font-bold text-on-surface-variant mb-1">Rest Quality</p>
            <p className="text-xl font-bold text-on-surface">{vitals.sleep}</p>
          </div>
          <p className="text-[10px] text-outline mt-4">Log daily for Cortisol analysis</p>
        </Card>

        <Card className="bg-tertiary/10 border-none p-5 flex flex-col justify-between">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={20} className="text-tertiary" />
            <span className="text-[10px] font-bold text-tertiary tracking-widest uppercase">Trend Alert</span>
          </div>
          <div>
            <p className="text-sm font-bold text-on-surface mb-1">Morning Peaks</p>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Cortisol levels typically rise at 8:15 AM. Plan your deep breathing then.
            </p>
          </div>
        </Card>
      </div>

      <Card className="p-6 space-y-6">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h2 className="text-lg font-bold text-on-surface">Weekly Outlook</h2>
            <p className="text-xs text-on-surface-variant">Stress Level Volatility</p>
          </div>
          <Calendar size={20} className="text-on-surface-variant" />
        </div>

        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1" >
                  <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--primary)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
              />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 'bold', fill: 'var(--on-surface-variant)' }}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 40px rgba(0,0,0,0.1)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Button onClick={onBeginRelief} className="w-full py-5 text-lg shadow-xl">
        Begin Relief
        <Sparkles size={20} />
      </Button>

      {/* Vitals Logging Modals */}
      <AnimatePresence>
        {activeVitalModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-sm rounded-3xl p-6 soft-shadow border border-outline-variant/20 space-y-6"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                    {activeVitalModal === 'sleep' && <Moon size={22} />}
                    {activeVitalModal === 'mood' && <Smile size={22} />}
                    {activeVitalModal === 'caffeine' && <Coffee size={22} />}
                  </div>
                  <h3 className="font-bold text-lg text-on-surface capitalize">Log {activeVitalModal}</h3>
                </div>
                <button 
                  onClick={() => setActiveVitalModal(null)}
                  className="p-2 text-on-surface-variant hover:text-on-surface"
                >
                  <X size={20} />
                </button>
              </div>

              {activeVitalModal === 'sleep' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase">Hours of Sleep</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="range" 
                      min="3" 
                      max="12" 
                      step="0.5"
                      value={sleepVal}
                      onChange={(e) => setSleepVal(e.target.value)}
                      className="w-full accent-primary h-2 bg-surface-variant rounded-lg cursor-pointer"
                    />
                    <span className="text-xl font-bold text-primary min-w-[70px]">{sleepVal} hrs</span>
                  </div>
                  <Button 
                    className="w-full py-4 text-sm font-bold"
                    onClick={() => saveVitals({ sleep: `${sleepVal} hrs` })}
                  >
                    Save Sleep Log
                  </Button>
                </div>
              )}

              {activeVitalModal === 'mood' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase">Select Current Mood</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      '😊 Calm',
                      '🧘 Peaceful',
                      '😐 Neutral',
                      '😰 Anxious',
                      '😴 Tired',
                      '⚡ Energetic'
                    ].map((m) => (
                      <button
                        key={m}
                        onClick={() => setMoodVal(m)}
                        className={cn(
                          "p-3 rounded-xl border text-sm font-bold text-left transition-all",
                          moodVal === m ? "bg-tertiary text-white border-tertiary" : "bg-surface-variant/30 border-outline-variant/20 text-on-surface hover:bg-surface-variant"
                        )}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                  <Button 
                    className="w-full py-4 text-sm font-bold bg-tertiary hover:bg-tertiary/90 text-white"
                    onClick={() => saveVitals({ mood: moodVal })}
                  >
                    Save Mood Log
                  </Button>
                </div>
              )}

              {activeVitalModal === 'caffeine' && (
                <div className="space-y-4">
                  <label className="block text-xs font-bold text-on-surface-variant uppercase">Cups of Caffeine Today</label>
                  <div className="flex items-center justify-center gap-4 py-2">
                    {[0, 1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        onClick={() => setCaffeineVal(num.toString())}
                        className={cn(
                          "w-12 h-12 rounded-2xl font-bold text-base transition-all",
                          caffeineVal === num.toString() 
                            ? "bg-orange-500 text-white shadow-lg scale-110" 
                            : "bg-surface-variant text-on-surface hover:bg-surface-variant/80"
                        )}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                  <Button 
                    className="w-full py-4 text-sm font-bold bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => saveVitals({ caffeine: `${caffeineVal} cup${caffeineVal === '1' ? '' : 's'}` })}
                  >
                    Save Caffeine Log
                  </Button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

