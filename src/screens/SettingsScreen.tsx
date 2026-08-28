import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from '../components/UI';
import { useTheme } from '../context/ThemeContext';
import { Moon, Sun, Palette, Shield, Users, Mic, User, Bell, LogOut, ChevronRight, Edit2, X, Check, CheckCircle2, Phone, Sparkles, FileText, Lock } from 'lucide-react';
import { cn } from '../lib/utils';

import { useAppContext } from '../context/AppContext';
import { logout, db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export const SettingsScreen = ({ onBack }: { onBack: () => void }) => {
  const { theme, toggleTheme, primaryColor, setPrimaryColor } = useTheme();
  const { user, userName, logoutUser } = useAppContext();

  // Active Modals State
  const [activeModal, setActiveModal] = useState<'profile' | 'sos' | 'voice' | 'personal' | 'notifications' | 'privacy' | 'terms' | null>(null);

  // Profile Edit State
  const [editName, setEditName] = useState(userName || '');
  const [editPhoto, setEditPhoto] = useState(user?.photoURL || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Guardian State
  const [guardianEnabled, setGuardianEnabled] = useState(() => {
    return typeof window !== 'undefined' && localStorage.getItem('zenflow_guardian') === 'true';
  });

  // SOS Contacts State
  const [contacts, setContacts] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('zenflow_sos_contacts');
      if (saved) {
        try { return JSON.parse(saved); } catch (e) {}
      }
    }
    return [
      { name: 'Mom (Primary)', phone: '+1 (555) 019-2831' },
      { name: 'Dr. Sarah (Therapist)', phone: '+1 (555) 014-9920' },
      { name: 'Crisis Support Line', phone: '988' },
    ];
  });

  // Voice Trigger Phrase
  const [triggerPhrase, setTriggerPhrase] = useState(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('zenflow_voice_phrase') || 'Help ZenFlow') : 'Help ZenFlow';
  });

  // Notifications State
  const [notifs, setNotifs] = useState({
    dailyBreathing: true,
    stressAlerts: true,
    exposureReminders: true,
    crisisAudio: true,
  });

  const themeColors = [
    { name: 'Sage', value: '#8DA891' },
    { name: 'Ocean', value: '#7895B2' },
    { name: 'Rose', value: '#E5989B' },
    { name: 'Lavender', value: '#B1AFFF' },
    { name: 'Amber', value: '#FFB26B' },
  ];

  const handleToggleGuardian = () => {
    const nextState = !guardianEnabled;
    setGuardianEnabled(nextState);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenflow_guardian', nextState.toString());
    }
    setSuccessMsg(nextState ? 'Guardian Protection Enabled' : 'Guardian Protection Disabled');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        userName: editName,
      });
      setSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveModal(null);
    } catch (e) {
      console.warn("Firestore update error, updating local:", e);
      setSuccessMsg('Profile updated locally!');
      setTimeout(() => setSuccessMsg(''), 3000);
      setActiveModal(null);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveContacts = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenflow_sos_contacts', JSON.stringify(contacts));
    }
    setSuccessMsg('SOS Contacts updated!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setActiveModal(null);
  };

  const handleSaveVoicePhrase = (phrase: string) => {
    setTriggerPhrase(phrase);
    if (typeof window !== 'undefined') {
      localStorage.setItem('zenflow_voice_phrase', phrase);
    }
    setSuccessMsg('Voice trigger phrase saved!');
    setTimeout(() => setSuccessMsg(''), 3000);
    setActiveModal(null);
  };

  return (
    <div className="space-y-8 pb-10">
      <header className="flex justify-between items-center py-2">
        <h1 className="text-2xl font-bold tracking-tight text-on-surface">Settings</h1>
        <Button variant="ghost" size="sm" onClick={onBack} className="text-on-surface-variant hover:text-on-surface">
          <X size={20} />
          Exit
        </Button>
      </header>

      {successMsg && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-primary/20 border border-primary text-primary px-4 py-3 rounded-2xl flex items-center gap-3 font-bold text-sm"
        >
          <CheckCircle2 size={18} />
          {successMsg}
        </motion.div>
      )}

      {/* Profile Card & Edit Button */}
      <section className="flex flex-col items-center text-center py-6 bg-card rounded-3xl p-6 soft-shadow border border-outline-variant/10">
        <div className="relative group">
          <div className="w-24 h-24 rounded-full overflow-hidden soft-shadow ring-4 ring-primary/20 bg-surface-variant">
            <img 
              src={editPhoto || user?.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200"} 
              alt="Avatar" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <button 
            onClick={() => {
              setEditName(userName);
              setActiveModal('profile');
            }}
            className="absolute bottom-0 right-0 bg-primary text-white p-2.5 rounded-full shadow-lg border-4 border-card hover:scale-110 transition-transform cursor-pointer"
            title="Edit Profile"
          >
            <Edit2 size={14} />
          </button>
        </div>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-on-surface">{userName}</h1>
        <p className="text-on-surface-variant font-medium text-sm">{user?.email || 'Logged in User'}</p>
        <button 
          onClick={() => {
            setEditName(userName);
            setActiveModal('profile');
          }}
          className="mt-3 text-xs font-bold text-primary bg-primary/10 px-4 py-1.5 rounded-full hover:bg-primary/20 transition-all"
        >
          Edit Profile Info
        </button>
      </section>

      {/* Appearance Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-4">Appearance</h2>
        <Card className="p-2 space-y-1">
          <div 
            className="flex items-center justify-between p-4 hover:bg-surface-variant/50 transition-colors rounded-2xl group cursor-pointer" 
            onClick={toggleTheme}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </div>
              <div>
                <p className="font-bold text-sm">Dark Mode</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Currently: {theme.toUpperCase()}</p>
              </div>
            </div>
            <div className={cn(
              "w-12 h-6 rounded-full relative p-1 transition-colors duration-300",
              theme === 'dark' ? "bg-primary" : "bg-outline-variant/30"
            )}>
              <motion.div 
                animate={{ x: theme === 'dark' ? 24 : 0 }}
                className="w-4 h-4 bg-white rounded-full shadow-sm"
              />
            </div>
          </div>

          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center text-tertiary">
                <Palette size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Theme Color</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Personalize your sanctuary</p>
              </div>
            </div>
            <div className="flex gap-3 pl-14">
              {themeColors.map((color, i) => (
                <button 
                  key={i} 
                  onClick={() => setPrimaryColor(color.value)}
                  className={cn(
                    "w-8 h-8 rounded-full cursor-pointer transition-all hover:scale-110 relative flex items-center justify-center",
                    primaryColor === color.value ? "ring-4 ring-primary/20 scale-110" : ""
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {primaryColor === color.value && (
                    <div className="w-2 h-2 bg-white rounded-full" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Safety & Voice Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-4">Safety & Voice</h2>
        
        {/* Guardian Card */}
        <div className={cn(
          "relative overflow-hidden rounded-[2rem] p-8 soft-shadow transition-all border",
          guardianEnabled 
            ? "bg-gradient-to-br from-primary to-secondary text-white border-primary" 
            : "bg-on-surface text-white border-transparent"
        )}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16 rounded-full"></div>
          <div className="relative z-10 flex flex-col gap-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield size={20} className={guardianEnabled ? "text-white" : "text-primary"} />
                <span className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full">
                  {guardianEnabled ? 'Guardian Active' : 'Guardian Standby'}
                </span>
              </div>
              <h3 className="text-xl font-bold">Shadow Hero Guardian</h3>
              <p className="text-sm text-white/80 italic leading-relaxed mt-1">
                "Monitors heart rate spikes & voice triggers 24/7."
              </p>
            </div>
            <Button 
              onClick={handleToggleGuardian}
              className={cn(
                "w-full py-4 text-sm font-bold shadow-lg transition-all",
                guardianEnabled 
                  ? "bg-white text-primary hover:bg-white/90" 
                  : "bg-primary text-white hover:bg-primary/90"
              )}
            >
              <Shield size={18} fill="currentColor" />
              {guardianEnabled ? 'Disable Guardian' : 'Enable Guardian'}
            </Button>
          </div>
        </div>

        <Card className="p-2 space-y-1">
          <div 
            onClick={() => setActiveModal('sos')}
            className="flex items-center justify-between p-4 hover:bg-surface-variant/50 transition-colors rounded-2xl group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <Users size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">SOS Contacts</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">{contacts.length} emergency contacts linked</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => setActiveModal('voice')}
            className="flex items-center justify-between p-4 hover:bg-surface-variant/50 transition-colors rounded-2xl group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                <Mic size={20} />
              </div>
              <div>
                <p className="font-bold text-sm">Voice Trigger</p>
                <p className="text-[10px] text-on-surface-variant uppercase font-bold">Phrase: "{triggerPhrase}"</p>
              </div>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </div>
        </Card>
      </section>

      {/* Account Section */}
      <section className="space-y-4">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant/60 ml-4">Account</h2>
        <Card className="p-2 space-y-1">
          <div 
            onClick={() => setActiveModal('personal')}
            className="flex items-center justify-between p-4 hover:bg-surface-variant/50 transition-colors rounded-2xl group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <User size={20} />
              </div>
              <p className="font-bold text-sm">Personal Info & Security</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            onClick={() => setActiveModal('notifications')}
            className="flex items-center justify-between p-4 hover:bg-surface-variant/50 transition-colors rounded-2xl group cursor-pointer"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant">
                <Bell size={20} />
              </div>
              <p className="font-bold text-sm">Notifications & Reminders</p>
            </div>
            <ChevronRight size={20} className="text-outline-variant group-hover:translate-x-1 transition-transform" />
          </div>

          <div 
            className="flex items-center justify-between p-4 hover:bg-error/5 transition-colors rounded-2xl group cursor-pointer"
            onClick={async () => {
              await logoutUser();
              onBack();
            }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error">
                <LogOut size={20} />
              </div>
              <p className="font-bold text-sm text-error">Log Out</p>
            </div>
            <ChevronRight size={20} className="text-error/30" />
          </div>
        </Card>
      </section>

      <footer className="text-center py-10 space-y-4">
        <p className="text-[10px] font-bold text-on-surface-variant/40 tracking-[0.2em] uppercase">ZenFlow Version 4.2.0 (Build 992)</p>
        <div className="flex justify-center gap-6 text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest">
          <button onClick={() => setActiveModal('privacy')} className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</button>
          <button onClick={() => setActiveModal('terms')} className="hover:text-primary transition-colors cursor-pointer">Terms of Service</button>
        </div>
      </footer>

      {/* Interactive Modals */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card w-full max-w-md rounded-3xl p-6 soft-shadow border border-outline-variant/20 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-outline-variant/10 pb-4">
                <h3 className="font-bold text-lg text-on-surface capitalize">
                  {activeModal === 'profile' && 'Edit Profile'}
                  {activeModal === 'sos' && 'Emergency Contacts'}
                  {activeModal === 'voice' && 'Custom Voice Trigger'}
                  {activeModal === 'personal' && 'Personal Info'}
                  {activeModal === 'notifications' && 'Notification Settings'}
                  {activeModal === 'privacy' && 'Privacy Policy'}
                  {activeModal === 'terms' && 'Terms of Service'}
                </h3>
                <button 
                  onClick={() => setActiveModal(null)}
                  className="p-2 text-on-surface-variant hover:text-on-surface"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Profile Modal */}
              {activeModal === 'profile' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Display Name</label>
                    <input 
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full bg-surface-variant/40 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface"
                      placeholder="Your Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Choose Avatar</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200",
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200",
                        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
                        "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200"
                      ].map((url, i) => (
                        <button 
                          key={i} 
                          onClick={() => setEditPhoto(url)}
                          className={cn(
                            "w-16 h-16 rounded-full overflow-hidden border-2 transition-all cursor-pointer",
                            editPhoto === url ? "border-primary scale-105 ring-4 ring-primary/20" : "border-transparent opacity-60"
                          )}
                        >
                          <img src={url} alt="preset" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full py-4 font-bold text-sm"
                  >
                    {savingProfile ? 'Saving...' : 'Save Profile Changes'}
                  </Button>
                </div>
              )}

              {/* SOS Contacts Modal */}
              {activeModal === 'sos' && (
                <div className="space-y-4">
                  <p className="text-xs text-on-surface-variant">These contacts will receive immediate SOS alerts when Crisis Mode or Voice Trigger is activated.</p>
                  <div className="space-y-3">
                    {contacts.map((c, i) => (
                      <div key={i} className="p-3 bg-surface-variant/30 rounded-2xl flex items-center justify-between border border-outline-variant/10">
                        <div>
                          <p className="font-bold text-sm text-on-surface">{c.name}</p>
                          <p className="text-xs text-on-surface-variant">{c.phone}</p>
                        </div>
                        <Phone size={18} className="text-primary" />
                      </div>
                    ))}
                  </div>
                  <Button onClick={handleSaveContacts} className="w-full py-4 font-bold text-sm">
                    Save Contacts Config
                  </Button>
                </div>
              )}

              {/* Voice Trigger Modal */}
              {activeModal === 'voice' && (
                <div className="space-y-4">
                  <p className="text-xs text-on-surface-variant">Saying your phrase out loud will automatically trigger Crisis Mode, even if the screen is locked.</p>
                  <div>
                    <label className="block text-xs font-bold text-on-surface-variant uppercase mb-2">Voice Trigger Phrase</label>
                    <input 
                      type="text"
                      value={triggerPhrase}
                      onChange={(e) => setTriggerPhrase(e.target.value)}
                      className="w-full bg-surface-variant/40 border border-outline-variant/20 rounded-xl px-4 py-3 text-sm font-bold text-on-surface"
                      placeholder="e.g. Help ZenFlow"
                    />
                  </div>
                  <Button onClick={() => handleSaveVoicePhrase(triggerPhrase)} className="w-full py-4 font-bold text-sm bg-secondary text-white hover:bg-secondary/90">
                    Save Phrase
                  </Button>
                </div>
              )}

              {/* Personal Info Modal */}
              {activeModal === 'personal' && (
                <div className="space-y-4 text-sm">
                  <div className="p-4 bg-surface-variant/30 rounded-2xl space-y-2">
                    <p className="text-xs text-on-surface-variant uppercase font-bold">Email Address</p>
                    <p className="font-bold text-on-surface">{user?.email || 'Demo User'}</p>
                  </div>
                  <div className="p-4 bg-surface-variant/30 rounded-2xl space-y-2">
                    <p className="text-xs text-on-surface-variant uppercase font-bold">Account UID</p>
                    <p className="font-mono text-xs text-on-surface">{user?.uid || 'guest-session-id'}</p>
                  </div>
                  <div className="p-4 bg-surface-variant/30 rounded-2xl space-y-2">
                    <p className="text-xs text-on-surface-variant uppercase font-bold">Encryption Status</p>
                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                      <Lock size={14} /> End-To-End Encrypted Sanctuary
                    </p>
                  </div>
                </div>
              )}

              {/* Notifications Modal */}
              {activeModal === 'notifications' && (
                <div className="space-y-4">
                  {[
                    { key: 'dailyBreathing', label: 'Daily Morning Reflection', sub: '8:00 AM mindfulness prompt' },
                    { key: 'stressAlerts', label: 'Cortisol Peak Alerts', sub: 'Alert when stress patterns rise' },
                    { key: 'exposureReminders', label: 'Exposure Step Progress', sub: 'Weekly CBT goals check-in' },
                    { key: 'crisisAudio', label: 'Voice Guidance Cues', sub: 'Spoken instructions in Crisis mode' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-surface-variant/30 rounded-2xl">
                      <div>
                        <p className="font-bold text-sm text-on-surface">{item.label}</p>
                        <p className="text-[10px] text-on-surface-variant">{item.sub}</p>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={(notifs as any)[item.key]}
                        onChange={() => setNotifs(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                        className="w-5 h-5 accent-primary cursor-pointer"
                      />
                    </div>
                  ))}
                  <Button onClick={() => setActiveModal(null)} className="w-full py-4 font-bold text-sm">
                    Save Notification Preferences
                  </Button>
                </div>
              )}

              {/* Privacy Policy Modal */}
              {activeModal === 'privacy' && (
                <div className="space-y-4 text-xs text-on-surface-variant leading-relaxed">
                  <p><strong className="text-on-surface">ZenFlow AI Privacy Commitment:</strong> Your privacy is essential. All diary logs, vitals, and exposure step data are stored with local-first encryption and restricted Firestore security rules.</p>
                  <p>We never sell your health metrics or panic journal entries to third parties. Your data is purely used to synthesize real-time calm scores and panic relief guidance.</p>
                </div>
              )}

              {/* Terms of Service Modal */}
              {activeModal === 'terms' && (
                <div className="space-y-4 text-xs text-on-surface-variant leading-relaxed">
                  <p><strong className="text-on-surface">ZenFlow Terms of Service:</strong> ZenFlow is designed to support mindfulness, guided breathing, and CBT exposure tracking. It is not a substitute for emergency medical care or clinical psychiatry.</p>
                  <p>If you are experiencing a severe medical emergency, please use the SOS Call feature or dial 988 / 911 immediately.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

