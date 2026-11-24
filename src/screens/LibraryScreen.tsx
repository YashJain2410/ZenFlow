import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, Button } from '../components/UI';
import { Search, Play, PlayCircle, SkipForward, Pause, Music, Headphones, Sparkles, Clock, Heart } from 'lucide-react';
import { cn } from '../lib/utils';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  img: string;
  url: string;
  type: string;
}

const guidedMeditations: Track[] = [
  { 
    id: 'g1', 
    title: 'Morning Clarity', 
    artist: 'ZenBot Guide', 
    duration: '10:00', 
    type: 'Guided',
    img: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=500',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
  },
  { 
    id: 'g2', 
    title: 'Deep Sleep Journey', 
    artist: 'ZenBot Guide', 
    duration: '25:00', 
    type: 'Guided',
    img: 'https://images.unsplash.com/photo-1511295742364-917e703b5ca0?auto=format&fit=crop&q=80&w=500',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  },
  { 
    id: 'g3', 
    title: 'Panic De-escalation', 
    artist: 'ZenBot Guide', 
    duration: '05:00', 
    type: 'Guided',
    img: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf477?auto=format&fit=crop&q=80&w=500',
    url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
  }
];

const musicTracks: Track[] = [
  { id: 'm1', title: 'Midnight Rain', artist: 'Nature Sounds', duration: '45:00', type: 'Nature', img: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&q=80&w=500', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
  { id: 'm2', title: 'Pacific Tides', artist: 'Nature Sounds', duration: '60:00', type: 'Nature', img: 'https://images.unsplash.com/photo-1505118380757-91f5f45d8de4?auto=format&fit=crop&q=80&w=500', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' },
  { id: 'm3', title: 'Deep Focus', artist: 'Ambient', duration: '120:00', type: 'Focus', img: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=500', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3' },
  { id: 'm4', title: 'Zen Garden', artist: 'Meditation', duration: '30:00', type: 'Meditation', img: 'https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&q=80&w=500', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3' },
  { id: 'm5', title: 'Starlight Sleep', artist: 'Lullaby', duration: '90:00', type: 'Sleep', img: 'https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&q=80&w=500', url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3' },
];

export const LibraryScreen = () => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [currentTrack, setCurrentTrack] = useState<Track | null>(musicTracks[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const categories = ['All', 'Guided', 'Nature', 'Focus', 'Sleep', 'Meditation'];

  const filteredTracks = [...guidedMeditations, ...musicTracks].filter(track => {
    const matchesCategory = activeCategory === 'All' || track.type === activeCategory;
    const matchesSearch = track.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         track.artist.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const featured = filteredTracks.slice(0, 2);
  const popular = filteredTracks.slice(2);

  return (
    <div className="space-y-8 pb-40">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">Sanctuary</h1>
        <p className="text-on-surface-variant text-lg">Curated auditory journeys for your peace of mind.</p>
      </section>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" size={20} />
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for peace..."
          className="w-full h-14 pl-12 pr-6 bg-surface-variant/50 border-none rounded-full focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/60 transition-all"
        />
      </div>

      <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
        {categories.map((cat) => (
          <button 
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "px-6 py-2.5 rounded-full font-bold text-sm transition-all whitespace-nowrap",
              activeCategory === cat ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-surface-variant text-on-surface-variant hover:bg-surface-variant/80"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {featured.length > 0 && (
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold tracking-tight">Featured for You</h2>
            <button className="text-primary font-bold text-sm hover:underline">View All</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {featured.map((item) => (
              <div 
                key={item.id} 
                onClick={() => { setCurrentTrack(item); setIsPlaying(true); }}
                className="relative group aspect-[16/10] rounded-[2rem] overflow-hidden soft-shadow cursor-pointer"
              >
                <img 
                  src={item.img} 
                  alt={item.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full flex items-center gap-1">
                  <Clock size={12} className="text-white" />
                  <span className="text-[10px] font-bold text-white">{item.duration}</span>
                </div>
                <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-white/80 mb-1 block">
                      {item.type} • {item.artist}
                    </span>
                    <h3 className="text-2xl font-bold text-white">{item.title}</h3>
                  </div>
                  <button className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white hover:text-primary transition-all active:scale-90">
                    {currentTrack?.id === item.id && isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {popular.length > 0 && (
        <section className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight">Popular Explorations</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {popular.map((item) => (
              <Card 
                key={item.id} 
                className={cn(
                  "p-4 group cursor-pointer transition-all",
                  currentTrack?.id === item.id ? "ring-2 ring-primary bg-primary/5" : ""
                )}
                onClick={() => { setCurrentTrack(item); setIsPlaying(true); }}
              >
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 relative">
                  <img 
                    src={item.img} 
                    alt={item.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    {currentTrack?.id === item.id && isPlaying ? (
                      <Pause className="text-white" size={40} fill="currentColor" />
                    ) : (
                      <PlayCircle className="text-white opacity-0 group-hover:opacity-100 transition-opacity" size={40} />
                    )}
                  </div>
                </div>
                <h4 className="font-bold text-on-surface mb-1 truncate">{item.title}</h4>
                <div className="flex justify-between items-center">
                  <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-widest">{item.type}</p>
                  <Heart size={14} className="text-on-surface-variant/40 hover:text-error transition-colors" />
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {filteredTracks.length === 0 && (
        <div className="py-20 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-surface-variant flex items-center justify-center mx-auto text-on-surface-variant/40">
            <Music size={40} />
          </div>
          <p className="text-on-surface-variant font-bold">No tracks found in this sanctuary.</p>
        </div>
      )}

      {/* Mini Player */}
      <AnimatePresence>
        {currentTrack && (
          <div className="fixed bottom-24 left-6 right-6 z-[60]">
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="bg-card/80 backdrop-blur-2xl rounded-3xl p-3 soft-shadow border border-border/50 flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 relative">
                <img 
                  src={currentTrack.img} 
                  alt="Playing" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <motion.div 
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 bg-primary rounded-full"
                    />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-sm font-bold text-on-surface truncate">{currentTrack.title}</h5>
                <p className="text-[10px] font-bold text-primary uppercase tracking-tighter">
                  {isPlaying ? 'Now Playing' : 'Paused'} • {currentTrack.artist}
                </p>
                <div className="w-full bg-surface-variant h-1 rounded-full mt-2 overflow-hidden">
                  <motion.div 
                    animate={{ width: isPlaying ? '100%' : '28%' }}
                    transition={{ duration: isPlaying ? 300 : 0.5, ease: "linear" }}
                    className="bg-primary h-full rounded-full"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                  <SkipForward size={20} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center hover:scale-105 transition-transform"
                >
                  {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
