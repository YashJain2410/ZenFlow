/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ThemeProvider } from './context/ThemeContext';
import { AppProvider, useAppContext } from './context/AppContext';
import { TopBar, BottomNav, Tab } from './components/Navigation';
import { HomeScreen } from './screens/HomeScreen';
import { ReliefScreen } from './screens/ReliefScreen';
import { InsightsScreen } from './screens/InsightsScreen';
import { LibraryScreen } from './screens/LibraryScreen';
import { ChatScreen } from './screens/ChatScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { CrisisScreen } from './screens/CrisisScreen';
import { TherapyScreen } from './screens/TherapyScreen';
import { Wind } from 'lucide-react';
import { cn } from './lib/utils';
import { LoginScreen } from './screens/LoginScreen';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('home');
  const [showSettings, setShowSettings] = useState(false);
  const { user, loading, stressLevel, setStressLevel } = useAppContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="text-primary"
        >
          <Wind size={48} />
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  const renderScreen = () => {
    if (showSettings) return <SettingsScreen onBack={() => setShowSettings(false)} />;
    
    switch (activeTab) {
      case 'home': return <HomeScreen onSOS={() => setStressLevel('crisis')} onNavigate={(tab) => setActiveTab(tab)} />;
      case 'relief': return <ReliefScreen onExit={() => setActiveTab('home')} />;
      case 'insights': return (
        <div className="space-y-12">
          <InsightsScreen onBeginRelief={() => setActiveTab('relief')} />
          <div className="h-px bg-border/50" />
          <TherapyScreen />
        </div>
      );
      case 'library': return <LibraryScreen />;
      case 'chat': return <ChatScreen onNavigate={(tab) => setActiveTab(tab)} />;
      default: return <HomeScreen onSOS={() => setStressLevel('crisis')} onNavigate={(tab) => setActiveTab(tab)} />;
    }
  };

  const isFullScreen = stressLevel === 'crisis';

  return (
    <div className="min-h-screen bg-background text-on-surface font-sans selection:bg-primary/20">
      <AnimatePresence>
        {stressLevel === 'crisis' && (
          <CrisisScreen onExit={() => setStressLevel('normal')} />
        )}
      </AnimatePresence>

      {!isFullScreen && (
        <TopBar 
          onSettingsClick={() => setShowSettings(true)} 
          onLogoClick={() => {
            setActiveTab('home');
            setShowSettings(false);
          }}
        />
      )}

      <main className={cn(
        "max-w-2xl mx-auto px-6 transition-all duration-500",
        !isFullScreen ? "pt-24 pb-32" : "p-0"
      )}>
        <AnimatePresence mode="wait">
          <motion.div
            key={showSettings ? 'settings' : activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
          >
            {renderScreen()}
          </motion.div>
        </AnimatePresence>
      </main>

      {!isFullScreen && !showSettings && (
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </ThemeProvider>
  );
}
