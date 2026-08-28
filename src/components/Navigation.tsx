import React from 'react';
import { Home, Wind, BarChart2, BookOpen, MessageCircle, Settings } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

export type Tab = 'home' | 'relief' | 'insights' | 'library' | 'chat';

interface BottomNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

export const BottomNav = ({ activeTab, setActiveTab }: BottomNavProps) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'relief', icon: Wind, label: 'Relief' },
    { id: 'insights', icon: BarChart2, label: 'Insights' },
    { id: 'library', icon: BookOpen, label: 'Library' },
    { id: 'chat', icon: MessageCircle, label: 'Chat' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/90 backdrop-blur-2xl border-t border-border/50 px-2 pt-3 pb-8 rounded-t-[30px] soft-shadow">
      <div className="flex justify-around items-center max-w-lg mx-auto">
        {tabs.map(({ id, icon: Icon, label }) => {
          const isActive = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex flex-col items-center justify-center py-2 rounded-2xl transition-all duration-300 min-w-[64px]",
                isActive ? "bg-primary text-white scale-105 shadow-md" : "text-on-surface-variant hover:bg-surface-variant"
              )}
            >
              <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[9px] font-bold mt-1 uppercase tracking-tight text-center">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export const TopBar = ({ onSettingsClick, onLogoClick }: { onSettingsClick: () => void, onLogoClick?: () => void }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl px-6 py-4 flex justify-between items-center border-b border-border/10">
      <div className="flex items-center gap-3 cursor-pointer" onClick={onLogoClick}>
        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary/20 ring-2 ring-primary/10">
          <img 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAaHyNkQM6nLjuKIfwb12dovUwK4ebAFv0fUYuOfjUxmP1XEaI1WCooVlzaeT9ddkxrphunDBkjJGG4teKH9YvtwBg3XU4CvVX4_cc4ygG9jobIG90EgK0Sk5Wlowh6Jlgzy6yochN3iqTymGEDhl3QP6o6D2QnhEmqpZi9DT95sHbl2eAgz0K8t_2l1hWKhoC4NB4S7HmKMJseHAxSjUP29kdWjtBvXKcJZ1Ed1DRAo3zXdW-XrGeTrz6NKfo3N-qeIuSTGycpl1Y" 
            alt="User" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>
        <span className="text-2xl font-bold text-primary font-headline tracking-tight">ZenFlow</span>
      </div>
      <button 
        onClick={onSettingsClick}
        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-variant transition-colors text-on-surface-variant"
      >
        <Settings size={24} />
      </button>
    </header>
  );
};
