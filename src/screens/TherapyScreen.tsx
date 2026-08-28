import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, Button } from '../components/UI';
import { Edit3, CheckCircle2, Circle, ChevronRight, Sun, Moon, Sparkles, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../context/AppContext';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const TherapyScreen = () => {
  const { user, addDiaryEntry, deleteDiaryEntry, toggleExposureStep } = useAppContext();
  const [steps, setSteps] = useState<any[]>([]);
  const [entries, setEntries] = useState<any[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) return;

    const initialSteps = [
      { id: '1', title: 'Visit a quiet cafe', completed: true, order: 1 },
      { id: '2', title: 'Drive for 15 minutes', completed: true, order: 2 },
      { id: '3', title: 'Sit in a crowded mall', completed: true, order: 3 },
      { id: '4', title: 'Order food in person', completed: false, order: 4 },
      { id: '5', title: 'Attend a small social gathering', completed: false, order: 5 },
    ];
    setSteps(initialSteps);

    let unsubSteps: (() => void) | undefined;
    let unsubEntries: (() => void) | undefined;

    try {
      const stepsQuery = query(collection(db, 'users', user.uid, 'exposureSteps'), orderBy('order', 'asc'));
      unsubSteps = onSnapshot(stepsQuery, (snapshot) => {
        if (!snapshot.empty) {
          setSteps(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }, (err) => {
        console.warn("Steps snapshot error (using local state):", err.message);
      });

      const entriesQuery = query(collection(db, 'users', user.uid, 'diary'), orderBy('timestamp', 'desc'));
      unsubEntries = onSnapshot(entriesQuery, (snapshot) => {
        if (!snapshot.empty) {
          setEntries(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
      }, (err) => {
        console.warn("Entries snapshot error (using local state):", err.message);
      });
    } catch (e) {
      console.warn("Therapy query setup warning:", e);
    }

    return () => {
      if (unsubSteps) unsubSteps();
      if (unsubEntries) unsubEntries();
    };
  }, [user]);

  const handleSaveEntry = async () => {
    if (!newContent.trim()) return;
    setIsSaving(true);
    try {
      await addDiaryEntry(newTitle || 'Untitled Entry', newContent);
      setNewTitle('');
      setNewContent('');
    } catch (error) {
      console.error("Error saving entry:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteEntry = async (id: string) => {
    try {
      await deleteDiaryEntry(id);
    } catch (error) {
      console.error("Error deleting entry:", error);
    }
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progress = steps.length > 0 ? (completedCount / steps.length) * 100 : 0;

  return (
    <div className="space-y-8 pb-10">
      <header className="text-center md:text-left">
        <h1 className="text-4xl font-extrabold text-on-surface tracking-tight mb-2">Healing is a journey</h1>
        <p className="text-on-surface-variant text-lg">Every step forward is a victory. Today is for growth.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-7 space-y-6">
          <Card className="p-8">
            <label className="block text-[10px] font-bold text-on-surface-variant mb-4 uppercase tracking-[0.2em]">Panic Diary</label>
            <div className="space-y-4">
              <input 
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Entry Title (optional)"
                className="w-full bg-surface-variant/30 border-none rounded-xl px-6 py-3 text-sm focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40 text-on-surface font-bold"
              />
              <div className="relative">
                <textarea 
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  className="w-full bg-surface-variant/30 border-none rounded-2xl p-6 min-h-[160px] focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-on-surface-variant/40 resize-none text-on-surface"
                  placeholder="Describe how you feel right now..."
                />
                <div className="absolute bottom-4 right-4">
                  <Button 
                    size="sm" 
                    className="px-6"
                    onClick={handleSaveEntry}
                    disabled={isSaving || !newContent.trim()}
                  >
                    {isSaving ? 'Saving...' : 'Save Entry'}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <section className="space-y-4">
            <h2 className="text-xl font-bold text-on-surface px-2">Recent Entries</h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="p-6 border-l-4 border-primary group relative">
                  <button 
                    onClick={() => handleDeleteEntry(entry.id)}
                    className="absolute top-4 right-4 p-2 text-on-surface-variant/40 hover:text-error transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <X size={16} />
                  </button>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-on-surface">{entry.title || entry.mood || 'Reflection'}</h3>
                      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
                        {typeof entry.timestamp?.toDate === 'function' 
                          ? entry.timestamp.toDate().toLocaleString() 
                          : (typeof entry.timestamp === 'string' ? entry.timestamp : 'Just now')}
                      </span>
                    </div>
                    <Sparkles size={20} className="text-primary" />
                  </div>
                  <p className="text-sm text-on-surface-variant leading-relaxed">
                    {entry.content}
                  </p>
                </Card>
              ))}
              {entries.length === 0 && (
                <p className="text-center text-on-surface-variant py-10 italic">No entries yet. Start writing your journey.</p>
              )}
            </div>
          </section>
        </div>

        <div className="md:col-span-5 space-y-6">
          <Card className="p-8 bg-surface-variant/20 border-none">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-on-surface">Exposure Steps</h2>
              <span className="text-[10px] font-bold text-primary bg-primary/10 px-3 py-1 rounded-full uppercase tracking-widest">
                {Math.round(progress)}% Done
              </span>
            </div>
            
            <div className="w-full h-3 bg-surface-variant rounded-full mb-8 overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-primary to-tertiary rounded-full"
              />
            </div>

            <ul className="space-y-4">
              {steps.map((step) => (
                <li 
                  key={step.id} 
                  onClick={() => toggleExposureStep(step.id, !step.completed)}
                  className="flex items-center gap-4 group cursor-pointer"
                >
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                    step.completed ? "bg-primary text-white shadow-md" : "border-2 border-primary/30 bg-card"
                  )}>
                    {step.completed && <CheckCircle2 size={16} strokeWidth={3} />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-all",
                    step.completed ? "text-on-surface/50 line-through decoration-primary/50" : "text-on-surface"
                  )}>
                    {step.title}
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <div className="relative overflow-hidden rounded-[2rem] p-8 h-48 flex items-end soft-shadow">
            <img 
              src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000" 
              alt="Nature" 
              className="absolute inset-0 w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <p className="relative text-white font-medium italic z-10">"The only way out is through."</p>
          </div>
        </div>
      </div>
    </div>
  );
};
