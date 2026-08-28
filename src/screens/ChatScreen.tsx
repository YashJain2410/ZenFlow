import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { Card, Button } from '../components/UI';
import { Send, Bot, Users, AlertTriangle, BookOpen, Music, Moon, Edit3, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  try {
    const key = process.env.GEMINI_API_KEY;
    if (key && typeof key === 'string' && key.trim() !== '') {
      return new GoogleGenAI({ apiKey: key });
    }
  } catch (e) {
    console.warn("AI client initialization fallback:", e);
  }
  return null;
};

export const ChatScreen = ({ onNavigate }: { onNavigate: (tab: any) => void }) => {
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hello! I'm ZenBot. How are you feeling today?" },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const ai = getAiClient();
      if (!ai) {
        // Fallback empathetic responses when offline or API key is not yet set
        setTimeout(() => {
          setMessages(prev => [...prev, { 
            role: 'bot', 
            text: "Thank you for sharing. Remember to take slow, steady breaths. Inhale for 4 seconds, hold, and gently exhale. I am here with you." 
          }]);
          setIsTyping(false);
        }, 800);
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [
          { role: 'user', parts: [{ text: `You are ZenBot, a compassionate mental wellness companion. Help the user with their concerns. User says: ${input}` }] }
        ],
        config: {
          systemInstruction: "You are ZenBot, a calm, empathetic, and supportive AI companion for a mental wellness app called ZenFlow. Your goal is to provide immediate comfort, mindfulness tips, and a safe space for users. Keep responses concise, warm, and helpful. If a user is in crisis, gently suggest professional help or the SOS feature.",
        }
      });

      const botMessage = { role: 'bot', text: response.text || "I'm here for you. Could you tell me more?" };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages(prev => [...prev, { role: 'bot', text: "I'm here for you. Take a slow, grounding breath and focus on the present moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <section className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight text-on-surface">How can we help?</h1>
        <p className="text-on-surface-variant text-lg">Our team and community are here to support your journey.</p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 flex flex-col h-[500px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white">
              <Bot size={24} />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">ZenBot</h3>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Always Online</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
            {messages.map((msg, i) => (
              <div key={i} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                <div className={cn(
                  "px-4 py-3 rounded-2xl max-w-[85%] text-sm leading-relaxed",
                  msg.role === 'user' 
                    ? "bg-primary text-white rounded-tr-none soft-shadow" 
                    : "bg-surface-variant text-on-surface-variant rounded-tl-none"
                )}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-surface-variant text-on-surface-variant px-4 py-3 rounded-2xl rounded-tl-none">
                  <Loader2 size={16} className="animate-spin" />
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Type your message..."
              className="w-full bg-surface-variant/50 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-primary/20 text-on-surface placeholder:text-on-surface-variant/60"
            />
            <button 
              onClick={handleSend}
              disabled={isTyping}
              className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
        </Card>

        <div className="space-y-4">
          <div className="bg-error/10 border border-error/20 rounded-[2rem] p-6 flex flex-col justify-between h-[215px]">
            <div className="flex items-center gap-2 text-error font-bold mb-2">
              <AlertTriangle size={20} />
              <span className="text-sm uppercase tracking-widest">Emergency</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">Immediate help is available 24/7 if you are in crisis.</p>
            <Button variant="danger" className="w-full py-3 text-sm">
              Call Support
            </Button>
          </div>

          <div className="bg-tertiary/10 border border-tertiary/20 rounded-[2rem] p-6 flex flex-col justify-between h-[215px]">
            <div className="flex items-center gap-2 text-tertiary font-bold mb-2">
              <Users size={20} />
              <span className="text-sm uppercase tracking-widest">Community</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">Connect with others who understand your journey.</p>
            <Button variant="secondary" className="w-full py-3 text-sm bg-tertiary hover:bg-tertiary/90">
              Join Discussion
            </Button>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-on-surface">Helpful Resources</h2>
          <button className="text-sm font-bold text-primary">View All</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: BookOpen, label: 'Anxiety Guide', desc: 'Step-by-step relief', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary', tab: 'library' },
            { icon: Music, label: 'Calm Sounds', desc: 'Nature & ambient', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary', tab: 'library' },
            { icon: Moon, label: 'Sleep Better', desc: 'Restorative habits', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary', tab: 'library' },
            { icon: Edit3, label: 'Daily Journal', desc: 'Track your mood', color: 'text-on-surface-variant', bg: 'bg-surface-variant', border: 'border-border', tab: 'insights' },
          ].map((item, i) => (
            <Card 
              key={i} 
              className={cn("p-5 border-b-4 transition-all hover:-translate-y-1 cursor-pointer", item.border)}
              onClick={() => onNavigate(item.tab)}
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center mb-3", item.bg, item.color)}>
                <item.icon size={20} />
              </div>
              <h4 className="font-bold text-sm text-on-surface mb-1">{item.label}</h4>
              <p className="text-[10px] text-on-surface-variant font-medium uppercase tracking-widest">{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      <div className="relative h-56 rounded-[2rem] overflow-hidden bg-on-surface group soft-shadow">
        <img 
          src="https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000" 
          alt="Tips" 
          className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:scale-110 transition-transform duration-700"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-8 flex flex-col justify-end">
          <span className="text-primary text-[10px] font-bold tracking-[0.2em] uppercase mb-2">Daily Wisdom</span>
          <p className="text-white text-xl font-bold leading-tight">"Calmness is the cradle of power."</p>
          <p className="text-white/60 text-sm mt-2">Read our latest blog on mindfulness at work.</p>
        </div>
      </div>
    </div>
  );
};
