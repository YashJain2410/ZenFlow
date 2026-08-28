import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Card, Button } from '../components/UI';
import { Brain, Zap, Activity, Info, ChevronRight, Play } from 'lucide-react';

export const SimulationScreen = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="space-y-8 pb-10">
      <header className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-on-surface">Practice Calm</h1>
        <p className="text-on-surface-variant text-lg">Train your digital twin to master tranquility under pressure.</p>
      </header>

      <Card className="p-8 bg-surface-variant/30 border-none relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-tertiary/10 rounded-full blur-2xl"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Brain size={20} className="text-primary" />
            <span className="text-[10px] font-bold tracking-[0.2em] text-primary uppercase">Simulation Mode</span>
          </div>
          <h2 className="text-2xl font-bold mb-4">High-Fidelity Stress Training</h2>
          <p className="text-on-surface-variant mb-8 max-w-md leading-relaxed">
            Our twin AI replicates your physiological responses to help you practice de-escalation techniques in a controlled, safe environment.
          </p>
          <Button size="lg" className="w-full sm:w-auto" onClick={onStart}>
            <Play size={20} fill="currentColor" />
            Start Training
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-6 space-y-3">
          <Zap size={28} className="text-primary" />
          <h3 className="font-bold text-lg">Cognitive Recall</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Strengthen mental pathways to access calm states faster during real-world stressors.
          </p>
        </Card>
        <Card className="p-6 space-y-3">
          <Activity size={28} className="text-tertiary" />
          <h3 className="font-bold text-lg">Bio-Feedback</h3>
          <p className="text-sm text-on-surface-variant leading-relaxed">
            Real-time analysis of simulated heart-rate variability and breath cadence mapping.
          </p>
        </Card>
      </div>

      <section className="space-y-4">
        <h3 className="text-xl font-bold px-2">How It Works</h3>
        <div className="space-y-3">
          {[
            { step: 1, title: 'Sync Baseline', desc: 'Calibrate the trainer to your current resting heart rate and mood.' },
            { step: 2, title: 'Enter Simulation', desc: 'Engage with scenarios designed to trigger mild, manageable stress levels.' },
            { step: 3, title: 'Practice Release', desc: 'Apply guided breathing to return the twin to its "Zen" state.' },
          ].map((item) => (
            <div key={item.step} className="flex items-center gap-6 p-5 bg-card rounded-2xl soft-shadow">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary font-extrabold text-xl">
                {item.step}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-on-surface">{item.title}</h4>
                <p className="text-sm text-on-surface-variant">{item.desc}</p>
              </div>
              <ChevronRight size={20} className="text-on-surface-variant/30" />
            </div>
          ))}
        </div>
      </section>

      <div className="p-5 bg-primary/5 border border-primary/10 rounded-2xl flex gap-4 items-start">
        <Info size={20} className="text-primary flex-shrink-0 mt-1" />
        <p className="text-xs text-on-surface-variant leading-relaxed font-medium">
          This simulation is designed for educational purposes. If you feel overwhelmed at any point, use the "Instant Exit" button or close the app immediately.
        </p>
      </div>
    </div>
  );
};
