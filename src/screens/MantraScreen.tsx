import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from '../components/UI';
import { useAppContext } from '../context/AppContext';
import { 
  Mantra, 
  PREDEFINED_MANTRAS, 
  DURATION_OPTIONS 
} from '../data/mantras';
import { 
  playSingingBowlChime, 
  playBeadChime, 
  speakMantraGuide, 
  stopMantraSpeech 
} from '../utils/mantraAudio';
import { 
  MantraSessionSettings, 
  MantraSessionResult 
} from '../types/mantraSession';
import { useMantraSession } from '../hooks/useMantraSession';
import { generateMantraGuidance, MantraGuidanceResponse } from '../services/mantraGuidance';
import { MantraHistoryScreen } from './MantraHistoryScreen';
import { 
  Sparkles, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  CheckCircle2, 
  ArrowLeft, 
  Plus, 
  Info, 
  Heart, 
  Shield, 
  ChevronRight,
  BookmarkCheck,
  Feather,
  Disc3,
  Vibrate,
  AlertTriangle,
  Loader2,
  Wind
} from 'lucide-react';
import { cn } from '../lib/utils';

type Step = 'landing' | 'select_mantra' | 'custom_mantra' | 'select_duration' | 'preparation' | 'active_session' | 'completion';

type FeelingOption = 'Much calmer' | 'A little calmer' | 'About the same' | 'Still unsettled';

export const MantraScreen = ({ onExit }: { onExit: () => void }) => {
  const { lastMantraSession, logMantraSession, setStressLevel } = useAppContext();

  const handleEmergencySOS = () => {
    stopMantraSpeech();
    setStressLevel('crisis');
  };

  // Navigation step
  const [currentStep, setCurrentStep] = useState<Step>('landing');
  const [showHistory, setShowHistory] = useState(false);

  // Selected config
  const [selectedMantra, setSelectedMantra] = useState<Mantra>(PREDEFINED_MANTRAS[0]);
  const [durationSeconds, setDurationSeconds] = useState<number>(300); // default 5 min
  const [customDurationMinutes, setCustomDurationMinutes] = useState<string>('5');
  const [isCustomDuration, setIsCustomDuration] = useState(false);

  // Custom Mantra form state
  const [customTitle, setCustomTitle] = useState('');
  const [customText, setCustomText] = useState('');
  const [customMeaning, setCustomMeaning] = useState('');
  const [customError, setCustomError] = useState('');

  // Active Session Settings (Audio, Japa beads, Haptics)
  const [sessionSettings, setSessionSettings] = useState<MantraSessionSettings>({
    singingBowlChime: true,
    ambientTrack: 'synthetic_drone',
    volume: 0.5,
    repetitionCounter: true,
    hapticFeedback: true,
  });

  // Completed Session Result snapshot
  const [completedResult, setCompletedResult] = useState<MantraSessionResult | null>(null);

  // Completion Form State
  const [feeling, setFeeling] = useState<FeelingOption | null>(null);
  const [reflection, setReflection] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Filter category in selection
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // AI Guidance State
  const [aiGuidance, setAiGuidance] = useState<MantraGuidanceResponse | null>(null);
  const [isFetchingGuidance, setIsFetchingGuidance] = useState(false);

  // Unified Drift-Free, Lifecycle-Aware Mantra Engine Hook
  const {
    sessionId,
    status: sessionStatus,
    remainingSeconds,
    elapsedSeconds,
    progress,
    repetitionCount,
    breathPhase,
    isConfirmingEnd,
    isStarting,
    startSession,
    pauseSession,
    resumeSession,
    togglePauseResume,
    requestEndEarly,
    cancelEndEarly,
    confirmEndEarly,
    incrementRepetition,
    resetSession,
  } = useMantraSession({
    onCompleted: (result) => {
      setCompletedResult(result);
      setCurrentStep('completion');
    },
    onInterrupted: (result) => {
      setCompletedResult(result);
      setCurrentStep('completion');
    },
  });

  // Cleanup speech if active on exit
  useEffect(() => {
    return () => {
      stopMantraSpeech();
    };
  }, []);

  // Sync real-time volume changes during active session
  useEffect(() => {
    if (sessionStatus === 'running' || sessionStatus === 'paused') {
      import('../services/audioEngine').then(({ audioEngine }) => {
        audioEngine.setVolume(sessionSettings.volume);
      });
    }
  }, [sessionSettings.volume, sessionStatus]);

  // Format seconds to MM:SS
  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // -------------------------------------------------------------
  // Step 1: Start Preparation
  // -------------------------------------------------------------
  const handleProceedToPrep = () => {
    setCurrentStep('preparation');
    // Fetch guidance in background
    setIsFetchingGuidance(true);
    setAiGuidance(null);
    generateMantraGuidance({
      selectedMantra,
      durationSeconds,
      userMood: 'Neutral' // Could be expanded to take actual mood if we add a selector earlier
    }).then(guidance => {
      setAiGuidance(guidance);
      setIsFetchingGuidance(false);
    });
  };

  // -------------------------------------------------------------
  // Step 2: Start Session with Engine Hook
  // -------------------------------------------------------------
  const handleStartSession = () => {
    startSession({
      mantra: selectedMantra,
      targetDurationSeconds: durationSeconds,
      settings: sessionSettings,
    });
    setCurrentStep('active_session');
  };

  // Save session & return to landing
  const handleSaveAndFinish = async () => {
    setIsSaving(true);
    try {
      const finalDuration = completedResult?.actualDurationSeconds ?? elapsedSeconds;
      const finalCount = completedResult?.repetitionCount ?? repetitionCount;

      await logMantraSession({
        mantraId: selectedMantra.id,
        mantraTitle: selectedMantra.title,
        mantraText: selectedMantra.transliteration,
        durationSeconds: finalDuration,
        targetDurationSeconds: durationSeconds,
        status: completedResult?.interrupted ? 'interrupted' : 'completed',
        repetitionCount: finalCount,
        feelingAfter: feeling || undefined,
        reflection: reflection.trim() || undefined,
      });
    } catch (e) {
      console.warn("Failed to log session:", e);
    }
    setIsSaving(false);
    resetSession();
    setCurrentStep('landing');
  };

  // Custom Mantra validation
  const handleSaveCustomMantra = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = customText.trim();
    if (!cleanText) {
      setCustomError('Please provide the mantra words or sacred phrase.');
      return;
    }
    if (cleanText.length > 140) {
      setCustomError('Mantra text cannot exceed 140 characters.');
      return;
    }

    const newMantra: Mantra = {
      id: `custom_${Date.now()}`,
      title: customTitle.trim() || 'Personal Sacred Affirmation',
      tradition: 'Personal Sacred Practice',
      transliteration: cleanText,
      phonetic: cleanText,
      meaning: customMeaning.trim() || 'A personal sacred intention created for inner grounding and calm.',
      intention: 'Inner peace and personal tranquility.',
      cadenceSeconds: 6,
      isCustom: true,
    };

    setSelectedMantra(newMantra);
    setCustomError('');
    setCurrentStep('select_duration');
  };

  // Predefined filter options
  const filteredMantras = PREDEFINED_MANTRAS.filter(m => {
    if (categoryFilter === 'all') return true;
    if (categoryFilter === 'universal') return m.tradition.includes('Universal') || m.tradition.includes('Peace') || m.tradition.includes('Kindness');
    if (categoryFilter === 'vedic') return m.tradition.includes('Vedic') || m.tradition.includes('Healing');
    if (categoryFilter === 'breath') return m.tradition.includes('Breath') || m.tradition.includes('Stillness');
    return true;
  });

  if (showHistory) {
    return <MantraHistoryScreen onBack={() => setShowHistory(false)} />;
  }

  return (
    <div className="w-full max-w-xl mx-auto px-2 py-4">
      <AnimatePresence mode="wait">
        
        {/* ========================================================= */}
        {/* SCREEN 1: SPIRITUAL CALM LANDING SCREEN                  */}
        {/* ========================================================= */}
        {currentStep === 'landing' && (
          <motion.div
            key="step-landing"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Header / Back bar */}
            <div className="flex items-center justify-between">
              <button 
                onClick={onExit}
                className="flex items-center gap-2 text-sm font-bold text-on-surface-variant hover:text-primary transition-colors py-2 px-3 rounded-full hover:bg-surface-variant/50"
                aria-label="Back to Sanctuary"
              >
                <ArrowLeft size={18} />
                <span>Return to ZenFlow</span>
              </button>
              <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-semibold text-primary">
                <Sparkles size={14} />
                <span>Spiritual Calm</span>
              </div>
            </div>

            {/* Sacred Visual & Title */}
            <div className="text-center pt-2 pb-4 space-y-4">
              <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
                {/* Subtle outer breathing ring */}
                <motion.div 
                  animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.65, 0.35] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary/30 to-secondary/30 blur-md"
                />
                <div className="relative w-24 h-24 rounded-full bg-card/80 backdrop-blur-xl border border-primary/30 flex items-center justify-center shadow-lg shadow-primary/10">
                  <span className="text-4xl text-primary font-serif select-none" aria-hidden="true">ॐ</span>
                </div>
              </div>

              <div className="space-y-2">
                <h1 className="text-3xl font-bold font-headline text-on-surface tracking-tight">
                  Spiritual Mantra Calm
                </h1>
                <p className="text-sm md:text-base text-on-surface-variant leading-relaxed max-w-md mx-auto">
                  A peaceful, voluntary sanctuary to sit comfortably, chant a chosen sacred mantra, and settle into emotional tranquility.
                </p>
              </div>
            </div>

            {/* Previous Session Card (if available) */}
            {lastMantraSession && (
              <Card className="p-5 bg-surface/80 border-primary/20 backdrop-blur-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-bold text-primary uppercase tracking-wider">
                      <BookmarkCheck size={14} />
                      <span>Previous Practice</span>
                    </div>
                    <p className="font-semibold text-on-surface">
                      {lastMantraSession.mantraTitle}
                    </p>
                    <p className="text-xs text-on-surface-variant">
                      {Math.round(lastMantraSession.durationSeconds / 60)} min session • {lastMantraSession.completedAt}
                    </p>
                    {lastMantraSession.feelingAfter && (
                      <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-primary/15 text-primary">
                        Felt: {lastMantraSession.feelingAfter}
                      </span>
                    )}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs shrink-0 rounded-full border-primary/30 text-primary"
                    onClick={() => {
                      const prev = PREDEFINED_MANTRAS.find(m => m.id === lastMantraSession.mantraId);
                      if (prev) setSelectedMantra(prev);
                      setCurrentStep('select_duration');
                    }}
                  >
                    Repeat
                  </Button>
                </div>
              </Card>
            )}

            {/* Quick overview of features */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-surface-variant/40 border border-border/40 text-left space-y-1">
                <div className="w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center mb-2">
                  <Feather size={16} />
                </div>
                <p className="text-xs font-bold text-on-surface">Universal & Sacred</p>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  Diverse, non-dogmatic mantras from ancient Vedic, Buddhist, and universal peace traditions.
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-surface-variant/40 border border-border/40 text-left space-y-1">
                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary flex items-center justify-center mb-2">
                  <Clock size={16} />
                </div>
                <p className="text-xs font-bold text-on-surface">Gentle Pacing</p>
                <p className="text-[11px] text-on-surface-variant leading-normal">
                  Timed duration with singing bowl chimes, rhythmic focus orb, and repetition counter.
                </p>
              </div>
            </div>

            {/* Medical Disclaimer Banner */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-card border border-border/50 text-xs text-on-surface-variant leading-relaxed">
              <Shield size={16} className="text-primary mt-0.5 shrink-0" />
              <span>
                <strong className="text-on-surface font-semibold">Peaceful Wellness Notice:</strong> Spiritual practice is completely optional. This feature is a voluntary wellness and relaxation exercise. It is not a substitute for professional medical care, diagnosis, or emergency mental health support.
              </span>
            </div>

            {/* CTAs */}
            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 text-base font-bold shadow-md shadow-primary/20 rounded-2xl flex items-center justify-center gap-2"
                onClick={() => setCurrentStep('select_mantra')}
              >
                <Sparkles size={18} />
                <span>Begin Practice</span>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full py-4 text-base font-bold rounded-2xl flex items-center justify-center gap-2 border-border/50 text-on-surface hover:bg-surface-variant"
                onClick={() => setShowHistory(true)}
              >
                <BookmarkCheck size={18} className="text-primary" />
                <span>View Practice History</span>
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 2: MANTRA SELECTION SCREEN                        */}
        {/* ========================================================= */}
        {currentStep === 'select_mantra' && (
          <motion.div
            key="step-selection"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep('landing')}
                className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface"
              >
                <ArrowLeft size={18} />
                <span>Back</span>
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 1 of 3</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-headline text-on-surface">
                Choose a Sacred Mantra
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant">
                Select a sacred phrase that resonates with your personal spiritual path or enter your own.
              </p>
            </div>

            {/* Category Filter Chips */}
            <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
              {[
                { id: 'all', label: 'All Mantras' },
                { id: 'universal', label: 'Peace & Metta' },
                { id: 'vedic', label: 'Vedic & Sacred' },
                { id: 'breath', label: 'Breath & Stillness' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full font-semibold transition-colors shrink-0 whitespace-nowrap",
                    categoryFilter === cat.id 
                      ? "bg-primary text-white shadow-sm" 
                      : "bg-surface-variant/60 text-on-surface-variant hover:bg-surface-variant"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Mantra Cards Grid */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 no-scrollbar">
              {filteredMantras.map(mantra => {
                const isSelected = selectedMantra.id === mantra.id;
                return (
                  <div
                    key={mantra.id}
                    onClick={() => setSelectedMantra(mantra)}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all cursor-pointer relative",
                      isSelected 
                        ? "bg-primary/10 border-primary shadow-sm" 
                        : "bg-card/70 border-border/60 hover:border-primary/40 hover:bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                          {mantra.tradition}
                        </span>
                        <h3 className="text-base font-bold text-on-surface">
                          {mantra.title}
                        </h3>
                      </div>
                      {mantra.originalScript && (
                        <span className="text-lg text-primary/70 font-serif" aria-hidden="true">
                          {mantra.originalScript.length > 10 ? 'ॐ' : mantra.originalScript}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-on-surface/90 italic mb-2">
                      "{mantra.transliteration}"
                    </p>

                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {mantra.meaning}
                    </p>

                    <div className="mt-2.5 pt-2 border-t border-border/40 flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span className="flex items-center gap-1 text-primary">
                        <Heart size={12} />
                        <span>{mantra.intention}</span>
                      </span>
                      {isSelected && (
                        <span className="flex items-center gap-1 font-bold text-primary">
                          <CheckCircle2 size={14} /> Selected
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Custom Mantra Option Card */}
              <div
                onClick={() => setCurrentStep('custom_mantra')}
                className="p-4 rounded-2xl border border-dashed border-primary/50 hover:border-primary bg-primary/5 hover:bg-primary/10 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                    <Plus size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-on-surface">Custom Mantra</h3>
                    <p className="text-xs text-on-surface-variant">Enter your own sacred words, prayer, or affirmation</p>
                  </div>
                </div>
                <ChevronRight size={18} className="text-on-surface-variant" />
              </div>
            </div>

            {/* Continue to Duration */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2"
                onClick={() => setCurrentStep('select_duration')}
              >
                <span>Continue with {selectedMantra.title}</span>
                <ChevronRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 3: CUSTOM MANTRA ENTRY                             */}
        {/* ========================================================= */}
        {currentStep === 'custom_mantra' && (
          <motion.div
            key="step-custom-mantra"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep('select_mantra')}
                className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface"
              >
                <ArrowLeft size={18} />
                <span>Back to Mantras</span>
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Custom Sacred Words</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-headline text-on-surface">
                Create Your Sacred Mantra
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant">
                Enter your personal prayer, spiritual phrase, or calming affirmation. Your words will remain exactly as written.
              </p>
            </div>

            <form onSubmit={handleSaveCustomMantra} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Mantra Title (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Inner Peace, Peace Within"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  maxLength={40}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Sacred Phrase / Chanting Words *
                  </label>
                  <span className="text-[11px] text-on-surface-variant">
                    {customText.length}/140
                  </span>
                </div>
                <textarea
                  placeholder="Enter the exact words you wish to chant or silently hold..."
                  value={customText}
                  onChange={(e) => {
                    setCustomText(e.target.value);
                    if (customError) setCustomError('');
                  }}
                  maxLength={140}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface resize-none leading-relaxed"
                />
                {customError && (
                  <p className="text-xs text-error font-medium">{customError}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                  Personal Intention / Meaning (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Reminding myself of divine calm during turbulent moments"
                  value={customMeaning}
                  onChange={(e) => setCustomMeaning(e.target.value)}
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface"
                />
              </div>

              <div className="p-3 bg-surface-variant/40 rounded-xl text-xs text-on-surface-variant flex items-start gap-2">
                <Info size={16} className="text-primary shrink-0 mt-0.5" />
                <span>ZenFlow respects your personal beliefs. Your custom mantra is stored securely on your device and will never be altered.</span>
              </div>

              <div className="pt-2 flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 py-3 rounded-xl"
                  onClick={() => setCurrentStep('select_mantra')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  className="flex-1 py-3 rounded-xl font-bold"
                >
                  Use This Mantra
                </Button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 4: DURATION SELECTION                             */}
        {/* ========================================================= */}
        {currentStep === 'select_duration' && (
          <motion.div
            key="step-duration"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep('select_mantra')}
                className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface"
              >
                <ArrowLeft size={18} />
                <span>Change Mantra</span>
              </button>
              <span className="text-xs font-bold text-primary uppercase tracking-wider">Step 2 of 3</span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold font-headline text-on-surface">
                Practice Duration
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant">
                Select how long you wish to immerse in your practice with <strong className="text-on-surface font-semibold">{selectedMantra.title}</strong>.
              </p>
            </div>

            {/* Selected Mantra preview pill */}
            <div className="p-3.5 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary uppercase tracking-wider">{selectedMantra.tradition}</p>
                <p className="text-sm font-bold text-on-surface truncate">{selectedMantra.title}</p>
              </div>
              <span className="text-xs text-on-surface-variant max-w-[150px] truncate text-right">
                {selectedMantra.transliteration}
              </span>
            </div>

            {/* Duration Buttons */}
            <div className="grid grid-cols-2 gap-3">
              {DURATION_OPTIONS.map(opt => {
                const isSelected = !isCustomDuration && durationSeconds === opt.seconds;
                return (
                  <button
                    key={opt.seconds}
                    onClick={() => {
                      setIsCustomDuration(false);
                      setDurationSeconds(opt.seconds);
                    }}
                    className={cn(
                      "p-4 rounded-2xl border text-left transition-all",
                      isSelected
                        ? "bg-primary text-white border-primary shadow-md scale-[1.02]"
                        : "bg-card border-border/60 hover:border-primary/40 text-on-surface"
                    )}
                  >
                    <p className={cn("text-xl font-bold font-headline", isSelected ? "text-white" : "text-on-surface")}>
                      {opt.label}
                    </p>
                    <p className={cn("text-xs mt-1", isSelected ? "text-white/80" : "text-on-surface-variant")}>
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Custom Duration Toggle */}
            <div className="pt-2">
              <div 
                onClick={() => setIsCustomDuration(!isCustomDuration)}
                className={cn(
                  "p-4 rounded-2xl border cursor-pointer transition-all",
                  isCustomDuration ? "bg-surface border-primary" : "bg-card/50 border-border/60"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-on-surface">Custom Minutes</span>
                  <span className="text-xs text-primary font-semibold">
                    {isCustomDuration ? `${customDurationMinutes} min selected` : 'Specify'}
                  </span>
                </div>

                {isCustomDuration && (
                  <div className="mt-4 space-y-2" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="1"
                        max="30"
                        step="1"
                        value={customDurationMinutes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setCustomDurationMinutes(val);
                          setDurationSeconds(parseInt(val, 10) * 60);
                        }}
                        className="w-full accent-primary h-2 bg-surface-variant rounded-lg"
                      />
                      <span className="text-sm font-bold text-primary w-12 text-right">
                        {customDurationMinutes} min
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      Choose between 1 and 30 minutes for your practice.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Proceed to Prep */}
            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-3.5 font-bold rounded-2xl flex items-center justify-center gap-2"
                onClick={handleProceedToPrep}
              >
                <span>Ready to Prepare</span>
                <ChevronRight size={18} />
              </Button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 5: PREPARATION SCREEN                             */}
        {/* ========================================================= */}
        {currentStep === 'preparation' && (
          <motion.div
            key="step-preparation"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setCurrentStep('select_duration')}
                className="flex items-center gap-1.5 text-sm font-bold text-on-surface-variant hover:text-on-surface"
              >
                <ArrowLeft size={18} />
                <span>Adjust Time</span>
              </button>
              <div className="flex items-center gap-1 text-xs font-bold text-primary uppercase">
                <Clock size={14} />
                <span>{Math.round(durationSeconds / 60)} Minutes</span>
              </div>
            </div>

            {/* Centered guidance card */}
            <Card className="p-8 text-center space-y-6 bg-surface/90 border-primary/20 backdrop-blur-xl">
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-widest text-primary">
                  Sacred Preparation
                </span>
                <h2 className="text-2xl md:text-3xl font-bold font-headline text-on-surface">
                  Settle into Stillness
                </h2>
              </div>

              {/* AI Guidance or Fallback */}
              <div className="space-y-4 text-left max-w-sm mx-auto py-2">
                {isFetchingGuidance ? (
                  <div className="flex flex-col items-center justify-center py-6 text-on-surface-variant gap-3">
                    <Loader2 size={24} className="animate-spin text-primary" />
                    <p className="text-sm font-medium">Seeking gentle guidance...</p>
                  </div>
                ) : aiGuidance ? (
                  <>
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                        <Sparkles size={14} />
                      </div>
                      <p className="text-sm font-medium text-on-surface pt-0.5">{aiGuidance.guidance}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-secondary/15 text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                        <Feather size={14} />
                      </div>
                      <p className="text-sm font-medium text-on-surface pt-0.5">{aiGuidance.breathingSuggestion}</p>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-7 h-7 rounded-full bg-tertiary/15 text-tertiary text-xs font-bold flex items-center justify-center shrink-0">
                        <Heart size={14} />
                      </div>
                      <p className="text-sm font-medium text-on-surface pt-0.5">{aiGuidance.sessionIntention}</p>
                    </div>
                  </>
                ) : (
                  <>
                    {[
                      { step: '1', text: 'Find a comfortable position.' },
                      { step: '2', text: 'Relax your shoulders.' },
                      { step: '3', text: 'Take a slow breath.' },
                      { step: '4', text: "When you're ready, begin." },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-full bg-primary/15 text-primary text-xs font-bold flex items-center justify-center shrink-0">
                          {item.step}
                        </div>
                        <p className="text-sm font-medium text-on-surface">
                          {item.text}
                        </p>
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* Selected Mantra Focus Pill */}
              <div className="p-4 rounded-2xl bg-surface-variant/40 border border-border/50 text-center space-y-1">
                {selectedMantra.originalScript && (
                  <p className="text-lg font-serif text-primary/80">
                    {selectedMantra.originalScript}
                  </p>
                )}
                <p className="text-base font-bold text-on-surface">
                  {selectedMantra.transliteration}
                </p>
                <p className="text-xs text-on-surface-variant italic">
                  {selectedMantra.phonetic}
                </p>
              </div>

              {/* Session Audio & Focus Settings */}
              <div className="p-4 rounded-2xl bg-surface-variant/30 border border-border/40 space-y-3 text-left">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-on-surface uppercase tracking-wider">
                    Session Environment
                  </span>
                  {sessionSettings.singingBowlChime && (
                    <button
                      type="button"
                      onClick={() => playSingingBowlChime(432, 3.5)}
                      className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                    >
                      <Volume2 size={13} />
                      <span>Preview Chime</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  {/* Singing Bowl */}
                  <button
                    type="button"
                    onClick={() => setSessionSettings(s => ({ ...s, singingBowlChime: !s.singingBowlChime }))}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center gap-2 transition-all font-medium text-left",
                      sessionSettings.singingBowlChime 
                        ? "bg-primary/10 border-primary/40 text-primary" 
                        : "bg-surface border-border/60 text-on-surface-variant"
                    )}
                  >
                    <Volume2 size={15} />
                    <span className="truncate">Singing Bowl</span>
                  </button>

                  {/* Ambient Track Selector */}
                  <select
                    value={sessionSettings.ambientTrack}
                    onChange={(e) => setSessionSettings(s => ({ ...s, ambientTrack: e.target.value as any }))}
                    className="p-2.5 rounded-xl border bg-surface border-border/60 text-on-surface-variant font-medium col-span-1 focus:ring-primary focus:border-primary"
                    aria-label="Select ambient sound"
                  >
                    <option value="silent">Silent Background</option>
                    <option value="synthetic_drone">432Hz Ambient Drone</option>
                    <option value="rain">Gentle Rain</option>
                    <option value="river">Flowing River</option>
                    <option value="forest">Forest Ambience</option>
                  </select>

                  {/* Repetition Counter */}
                  <button
                    type="button"
                    onClick={() => setSessionSettings(s => ({ ...s, repetitionCounter: !s.repetitionCounter }))}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center gap-2 transition-all font-medium text-left",
                      sessionSettings.repetitionCounter 
                        ? "bg-primary/10 border-primary/40 text-primary" 
                        : "bg-surface border-border/60 text-on-surface-variant"
                    )}
                  >
                    <Feather size={15} />
                    <span className="truncate">Bead Counter</span>
                  </button>

                  {/* Haptic Feedback */}
                  <button
                    type="button"
                    onClick={() => setSessionSettings(s => ({ ...s, hapticFeedback: !s.hapticFeedback }))}
                    className={cn(
                      "p-2.5 rounded-xl border flex items-center gap-2 transition-all font-medium text-left",
                      sessionSettings.hapticFeedback 
                        ? "bg-primary/10 border-primary/40 text-primary" 
                        : "bg-surface border-border/60 text-on-surface-variant"
                    )}
                  >
                    <Vibrate size={15} />
                    <span className="truncate">Haptic Pulse</span>
                  </button>
                </div>

                {/* Volume Slider */}
                {sessionSettings.ambientTrack !== 'silent' && (
                  <div className="pt-2 flex items-center gap-3 text-on-surface-variant">
                    <VolumeX size={14} />
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05"
                      value={sessionSettings.volume}
                      onChange={(e) => setSessionSettings(s => ({ ...s, volume: parseFloat(e.target.value) }))}
                      className="w-full h-1.5 bg-border rounded-lg appearance-none cursor-pointer accent-primary"
                      aria-label="Master volume"
                    />
                    <Volume2 size={14} />
                  </div>
                )}
              </div>
            </Card>

            {/* Clear Start Button */}
            <div className="space-y-2">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 text-lg font-bold rounded-2xl shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
                onClick={handleStartSession}
                disabled={isStarting}
              >
                <Play size={20} fill="currentColor" />
                <span>{isStarting ? 'Preparing Session...' : 'Begin Practice'}</span>
              </Button>

              <button
                type="button"
                onClick={() => setCurrentStep('landing')}
                className="w-full text-center text-xs font-semibold text-on-surface-variant hover:text-on-surface py-2"
              >
                Cancel and return
              </button>

              <button
                type="button"
                onClick={handleEmergencySOS}
                className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 py-2 flex items-center justify-center gap-1.5"
              >
                <Wind size={14} />
                <span>I need immediate calming relief instead</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 6: ACTIVE MANTRA SESSION SCREEN                    */}
        {/* ========================================================= */}
        {currentStep === 'active_session' && (
          <motion.div
            key="step-active"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="relative space-y-6 pt-2 pb-6 flex flex-col items-center justify-center min-h-[72vh] text-center select-none"
          >
            {/* Top Minimal Bar */}
            <div className="w-full flex items-center justify-between px-2 text-xs text-on-surface-variant">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "w-2.5 h-2.5 rounded-full transition-colors",
                  sessionStatus === 'running' ? "bg-primary animate-pulse" : "bg-warning"
                )} />
                <span className="font-semibold uppercase tracking-wider text-[11px] text-primary">
                  {sessionStatus === 'running' ? 'Chanting' : 'Session Paused'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Quick sound toggle */}
                <button
                  type="button"
                  onClick={() => setSessionSettings(s => ({ ...s, volume: s.volume > 0 ? 0 : 0.5 }))}
                  className={cn(
                    "px-2.5 py-1 rounded-full border text-[11px] font-semibold flex items-center gap-1.5 transition-colors",
                    sessionSettings.volume > 0 
                      ? "bg-primary/15 text-primary border-primary/30" 
                      : "bg-surface-variant text-on-surface-variant border-transparent"
                  )}
                  aria-label="Toggle volume"
                >
                  {sessionSettings.volume > 0 ? <Volume2 size={13} /> : <VolumeX size={13} />}
                  <span>{sessionSettings.volume > 0 ? 'Sound On' : 'Muted'}</span>
                </button>

                {/* Counter toggle */}
                <button
                  type="button"
                  onClick={() => setSessionSettings(s => ({ ...s, repetitionCounter: !s.repetitionCounter }))}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-colors",
                    sessionSettings.repetitionCounter 
                      ? "bg-primary/15 text-primary border-primary/30" 
                      : "bg-surface-variant text-on-surface-variant border-transparent"
                  )}
                >
                  {sessionSettings.repetitionCounter ? 'Beads On' : 'Beads Off'}
                </button>
              </div>
            </div>

            {/* Digital Countdown Timer */}
            <div className="space-y-1.5">
              <div className="text-5xl md:text-6xl font-mono font-bold tracking-tight text-on-surface">
                {formatTime(remainingSeconds)}
              </div>
              <div className="flex items-center justify-center gap-2 text-xs text-on-surface-variant">
                <span>{Math.round(elapsedSeconds / 60)}m elapsed</span>
                <span>•</span>
                <span>{Math.round(durationSeconds / 60)}m target</span>
              </div>

              {/* Visual Slim Progress Indicator */}
              <div className="w-44 h-1.5 bg-surface-variant rounded-full mx-auto overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300 rounded-full" 
                  style={{ width: `${Math.round(progress * 100)}%` }} 
                />
              </div>
            </div>

            {/* Central Sacred Breathing / Focus Orb */}
            <div className="relative my-3 flex items-center justify-center">
              {/* Outer gentle pulsating ripple (resilient, pauses when paused) */}
              <motion.div
                animate={{
                  scale: sessionStatus === 'paused' ? 1 : breathPhase === 'inhale' ? 1.18 : 0.95,
                  opacity: sessionStatus === 'paused' ? 0.25 : breathPhase === 'inhale' ? 0.45 : 0.2,
                }}
                transition={{
                  duration: sessionStatus === 'paused' ? 0.5 : (selectedMantra.cadenceSeconds || 6) / 2,
                  ease: "easeInOut",
                }}
                className="absolute w-56 h-56 md:w-64 md:h-64 rounded-full bg-gradient-to-tr from-primary/25 via-secondary/20 to-primary/15 blur-xl"
              />

              {/* Main Focus Ring / Tap to Count Japa Bead */}
              <motion.div
                whileTap={{ scale: 0.96 }}
                onClick={incrementRepetition}
                className="relative w-48 h-48 md:w-56 md:h-56 rounded-full bg-card/90 backdrop-blur-2xl border-2 border-primary/30 flex flex-col items-center justify-center p-6 cursor-pointer shadow-xl shadow-primary/10 transition-colors hover:border-primary/60 active:border-primary"
                role="button"
                aria-label="Tap to count mantra repetition"
                tabIndex={0}
              >
                {selectedMantra.originalScript && (
                  <span className="text-3xl md:text-4xl text-primary font-serif mb-1 opacity-90 select-none">
                    {selectedMantra.originalScript.length > 8 ? 'ॐ' : selectedMantra.originalScript}
                  </span>
                )}
                <span className="text-sm font-bold text-on-surface max-w-[170px] truncate leading-tight">
                  {selectedMantra.title}
                </span>

                {sessionSettings.repetitionCounter && (
                  <div className="mt-2 text-center">
                    <span className="text-2xl font-mono font-bold text-primary">
                      {repetitionCount}
                    </span>
                    <span className="block text-[9px] uppercase tracking-wider font-bold text-on-surface-variant opacity-70">
                      Chants (Tap to Count)
                    </span>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Mantra Display Text */}
            <div className="max-w-md px-4 space-y-2">
              <p className="text-lg md:text-xl font-medium text-on-surface leading-relaxed font-serif">
                "{selectedMantra.transliteration}"
              </p>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {selectedMantra.meaning}
              </p>
              {selectedMantra.phonetic && (
                <p className="text-[11px] text-primary/80 font-medium italic">
                  {selectedMantra.phonetic}
                </p>
              )}
            </div>

            {/* Controls Bar: Pause, Resume, End Session */}
            <div className="w-full max-w-xs pt-3 flex flex-col items-center justify-center gap-4">
              <div className="w-full flex items-center justify-center gap-3">
                <Button
                  variant={sessionStatus === 'paused' ? "primary" : "secondary"}
                  size="md"
                  className="flex-1 py-3.5 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-sm"
                  onClick={togglePauseResume}
                >
                  {sessionStatus === 'paused' ? <Play size={18} fill="currentColor" /> : <Pause size={18} />}
                  <span>{sessionStatus === 'paused' ? 'Resume' : 'Pause'}</span>
                </Button>

                <Button
                  variant="outline"
                  size="md"
                  className="py-3.5 px-4 rounded-2xl text-xs font-bold text-on-surface-variant hover:text-error border-border hover:border-error/40"
                  onClick={requestEndEarly}
                >
                  End Session
                </Button>
              </div>

              <button
                type="button"
                onClick={handleEmergencySOS}
                className="text-[11px] font-semibold text-on-surface-variant hover:text-primary flex items-center justify-center gap-1.5 transition-colors"
              >
                <Wind size={14} />
                <span>Feeling overwhelmed? Get immediate relief</span>
              </button>
            </div>

            {/* Early End Confirmation Modal Overlay */}
            {isConfirmingEnd && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-sm rounded-3xl bg-card border border-border p-6 text-center space-y-4 shadow-2xl"
                >
                  <div className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center mx-auto">
                    <Heart size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-on-surface">
                      Practice Paused
                    </h3>
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      You can stop anytime. Choose whatever feels most comfortable right now. Your peaceful minutes are still saved.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button
                      variant="primary"
                      size="md"
                      className="w-full py-3 rounded-xl font-bold"
                      onClick={cancelEndEarly}
                    >
                      Resume Practice
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      className="w-full py-3 rounded-xl font-semibold text-xs text-on-surface-variant border-border hover:bg-surface-variant"
                      onClick={confirmEndEarly}
                    >
                      End Practice
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* SCREEN 7: COMPLETION & EMOTIONAL CHECK-IN SCREEN          */}
        {/* ========================================================= */}
        {currentStep === 'completion' && (
          <motion.div
            key="step-completion"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.35 }}
            className="space-y-6 pt-2"
          >
            {/* Completion Hero */}
            <div className="text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto shadow-lg shadow-primary/20">
                <CheckCircle2 size={36} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold font-headline text-on-surface">
                {completedResult?.interrupted ? 'Practice Paused' : 'Your Practice is Complete'}
              </h2>
              <p className="text-xs md:text-sm text-on-surface-variant max-w-sm mx-auto">
                {completedResult?.interrupted 
                  ? 'You can stop anytime. Choose whatever feels most comfortable right now. Your peaceful minutes are safely captured.'
                  : 'Take a quiet moment to absorb the stillness and inner harmony created by this sacred chant.'
                }
              </p>
            </div>

            {/* Practice Summary Pill */}
            <Card className="p-4 bg-surface/70 border-border/60 flex items-center justify-around text-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Mantra</p>
                <p className="text-sm font-bold text-on-surface">{selectedMantra.title}</p>
              </div>
              <div className="h-8 w-px bg-border/50" />
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Time</p>
                <p className="text-sm font-bold text-on-surface">
                  {formatTime(completedResult?.actualDurationSeconds ?? elapsedSeconds)}
                </p>
              </div>
              {(completedResult?.repetitionCount ?? repetitionCount) > 0 && (
                <>
                  <div className="h-8 w-px bg-border/50" />
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Chants</p>
                    <p className="text-sm font-bold text-primary">{completedResult?.repetitionCount ?? repetitionCount}</p>
                  </div>
                </>
              )}
            </Card>

            {/* Emotional Check-In */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-on-surface">
                How do you feel now?
              </label>

              <div className="grid grid-cols-2 gap-2.5">
                {(['Much calmer', 'A little calmer', 'About the same', 'Still unsettled'] as FeelingOption[]).map((opt) => {
                  const isSelected = feeling === opt;
                  return (
                    <button
                      key={opt}
                      onClick={() => setFeeling(opt)}
                      className={cn(
                        "p-3 rounded-xl border text-sm font-semibold transition-all text-left flex items-center justify-between",
                        isSelected
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-card border-border/60 text-on-surface hover:border-primary/40"
                      )}
                    >
                      <span>{opt}</span>
                      {isSelected && <CheckCircle2 size={16} />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Short Reflection Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-on-surface uppercase tracking-wider">
                Personal Reflection (Optional)
              </label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                placeholder="Any sensations, insights, or thoughts you'd like to remember..."
                maxLength={240}
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-surface border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none text-sm text-on-surface resize-none leading-relaxed"
              />
            </div>

            {/* Save & Finish Button */}
            <div className="pt-2 space-y-3">
              <Button
                variant="primary"
                size="lg"
                className="w-full py-4 font-bold rounded-2xl shadow-md shadow-primary/20 flex items-center justify-center gap-2"
                onClick={handleSaveAndFinish}
                disabled={isSaving}
              >
                <span>{isSaving ? 'Saving Practice...' : 'Save & Return'}</span>
              </Button>

              {(feeling === 'Still unsettled' || completedResult?.interrupted) && (
                <button
                  type="button"
                  onClick={handleEmergencySOS}
                  className="w-full text-center text-xs font-semibold text-primary hover:text-primary/80 py-2 flex items-center justify-center gap-1.5"
                >
                  <Wind size={14} />
                  <span>I still need immediate calming relief</span>
                </button>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};
