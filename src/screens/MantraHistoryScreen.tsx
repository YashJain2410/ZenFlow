import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card } from '../components/UI';
import { auth } from '../lib/firebase';
import { 
  History, 
  Calendar, 
  Clock, 
  Award, 
  Sparkles, 
  ChevronLeft,
  Loader2,
  AlertCircle,
  Wind
} from 'lucide-react';
import { cn } from '../lib/utils';
import { PREDEFINED_MANTRAS } from '../data/mantras';

interface Session {
  _id: string;
  mantraId: string;
  customMantra?: string;
  duration: number;
  actualDuration: number;
  status: 'completed' | 'interrupted' | 'abandoned';
  moodBefore?: string;
  moodAfter?: string;
  createdAt: string;
}

interface Stats {
  totalSessions: number;
  totalMinutes: number;
  streak: number;
  mostUsedMantra: string;
}

export const MantraHistoryScreen = ({ onBack }: { onBack: () => void }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          setError('Authentication required to view history.');
          setLoading(false);
          return;
        }

        let fetchedSessions: Session[] = [];
        
        try {
          const response = await fetch('/api/mantra/sessions?limit=50', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            fetchedSessions = data.sessions || [];
          }
        } catch (networkErr) {
          console.warn("Network error fetching history, falling back to local data.", networkErr);
        }

        // Merge offline queue
        try {
          const offlineQueue = JSON.parse(localStorage.getItem('zenflow_offline_mantras') || '[]');
          const offlineSessions: Session[] = offlineQueue.map((p: any, idx: number) => ({
            _id: `offline_${Date.now()}_${idx}`,
            mantraId: p.mantraId,
            customMantra: p.customMantra,
            duration: p.duration,
            actualDuration: p.actualDuration,
            status: p.status,
            moodAfter: p.moodAfter,
            createdAt: new Date().toISOString()
          }));
          
          fetchedSessions = [...offlineSessions, ...fetchedSessions];
        } catch (e) {
          console.warn("Failed to parse offline queue", e);
        }

        setSessions(fetchedSessions);
        
        // Calculate stats
        const completedSessions = fetchedSessions.filter(s => s.status === 'completed');
        
        let totalMins = 0;
        const mantraCounts: Record<string, number> = {};
        
        completedSessions.forEach(s => {
          totalMins += Math.floor(s.actualDuration / 60);
          mantraCounts[s.mantraId] = (mantraCounts[s.mantraId] || 0) + 1;
        });

        let mostUsedId = '';
        let maxCount = 0;
        for (const [mId, count] of Object.entries(mantraCounts)) {
          if (count > maxCount) {
            mostUsedId = mId;
            maxCount = count;
          }
        }
        
        let mostUsedMantraTitle = 'None yet';
        if (mostUsedId) {
          const predefined = PREDEFINED_MANTRAS.find(m => m.id === mostUsedId);
          if (predefined) {
            mostUsedMantraTitle = predefined.title;
          } else {
            const customSession = completedSessions.find(s => s.mantraId === mostUsedId);
            mostUsedMantraTitle = customSession?.customMantra || 'Custom Mantra';
          }
        }

        // Calculate a simple gentle streak
        let currentStreak = 0;
        if (completedSessions.length > 0) {
          // Just a basic day-by-day check
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          
          const uniqueDays = new Set(
            completedSessions.map(s => {
              const d = new Date(s.createdAt);
              d.setHours(0, 0, 0, 0);
              return d.getTime();
            })
          );

          let checkDate = today.getTime();
          if (uniqueDays.has(checkDate)) {
            currentStreak = 1;
            checkDate -= 86400000; // minus 1 day
          } else {
            // Check if they practiced yesterday to keep streak alive
            checkDate -= 86400000;
            if (uniqueDays.has(checkDate)) {
              currentStreak = 1;
              checkDate -= 86400000;
            }
          }

          while (uniqueDays.has(checkDate) && currentStreak > 0) {
            currentStreak++;
            checkDate -= 86400000;
          }
        }

        setStats({
          totalSessions: completedSessions.length,
          totalMinutes: totalMins,
          streak: currentStreak,
          mostUsedMantra: mostUsedMantraTitle
        });

      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Unable to load history right now.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 size={32} className="animate-spin text-primary" />
        <p className="text-on-surface-variant font-medium">Loading your journey...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center px-6">
        <AlertCircle size={48} className="text-error/70" />
        <p className="text-on-surface font-medium">{error}</p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-surface-variant text-on-surface-variant rounded-full text-sm font-bold hover:bg-surface-variant/80 transition-colors"
        >
          Return
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8 pb-10"
    >
      <header className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-variant text-on-surface hover:scale-105 transition-transform"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-on-surface">Practice History</h1>
          <p className="text-sm text-on-surface-variant">Your journey of peaceful moments</p>
        </div>
      </header>

      {sessions.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 px-6 text-center border-dashed border-2 border-primary/20 bg-primary/5">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
            <Wind size={32} />
          </div>
          <h3 className="text-xl font-bold text-on-surface mb-2">A fresh beginning</h3>
          <p className="text-sm text-on-surface-variant mb-6 max-w-xs mx-auto leading-relaxed">
            Every journey begins with a single breath. Your practice history will appear here once you complete your first session.
          </p>
          <button 
            onClick={onBack}
            className="px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-md hover:scale-105 transition-transform"
          >
            Start a Session
          </button>
        </Card>
      ) : (
        <>
          {/* Gentle Stats */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 flex flex-col justify-center bg-surface/50 border border-primary/10">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <History size={16} className="text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Sessions</span>
                </div>
                <span className="text-2xl font-bold text-on-surface">{stats.totalSessions}</span>
              </Card>
              
              <Card className="p-4 flex flex-col justify-center bg-surface/50 border border-secondary/10">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <Clock size={16} className="text-secondary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Minutes</span>
                </div>
                <span className="text-2xl font-bold text-on-surface">{stats.totalMinutes}</span>
              </Card>

              <Card className="p-4 flex flex-col justify-center bg-surface/50 border border-tertiary/10">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <Award size={16} className="text-tertiary" />
                  <span className="text-xs font-bold uppercase tracking-widest">Streak</span>
                </div>
                <span className="text-2xl font-bold text-on-surface">
                  {stats.streak} {stats.streak === 1 ? 'day' : 'days'}
                </span>
              </Card>

              <Card className="p-4 flex flex-col justify-center bg-surface/50 border border-accent/10">
                <div className="flex items-center gap-2 text-on-surface-variant mb-2">
                  <Sparkles size={16} className="text-accent" />
                  <span className="text-xs font-bold uppercase tracking-widest">Favorite</span>
                </div>
                <span className="text-sm font-bold text-on-surface truncate">{stats.mostUsedMantra}</span>
              </Card>
            </div>
          )}

          {/* Session List */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-on-surface px-1">Recent Sessions</h3>
            <div className="space-y-3">
              {sessions.map((session) => {
                const isCompleted = session.status === 'completed';
                const mantraTitle = PREDEFINED_MANTRAS.find(m => m.id === session.mantraId)?.title || session.customMantra || session.mantraId;
                
                return (
                  <Card key={session._id} className="p-4 flex items-center justify-between border border-border/50 hover:bg-surface-variant/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                        isCompleted ? "bg-primary/15 text-primary" : "bg-surface-variant text-on-surface-variant"
                      )}>
                        {isCompleted ? <Wind size={20} /> : <Clock size={20} />}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-sm">{mantraTitle}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Calendar size={12} />
                            {new Date(session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                          <span className="text-xs text-on-surface-variant/50">•</span>
                          <span className="text-xs text-on-surface-variant flex items-center gap-1">
                            <Clock size={12} />
                            {Math.floor((isCompleted ? session.actualDuration : session.duration) / 60)} min
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md",
                        isCompleted ? "bg-primary/10 text-primary" : "bg-surface-variant text-on-surface-variant"
                      )}>
                        {isCompleted ? 'Completed' : 'Partial'}
                      </span>
                      {session.moodAfter && (
                        <span className="text-xs text-on-surface-variant italic">
                          Felt {session.moodAfter.toLowerCase()}
                        </span>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};
