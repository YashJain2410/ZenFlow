import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import mantraRoutes from './src/backend/routes/mantraRoutes';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Mount Mantra Sessions API
app.use('/api/mantra/sessions', mantraRoutes);

// Helper to get Gemini Client
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

// API: Chat Proxy
app.post('/api/gemini/chat', async (req, res) => {
  try {
    const { input } = req.body;
    const ai = getAiClient();
    
    if (!ai) {
      return res.status(503).json({ 
        error: "AI service unavailable", 
        fallbackMessage: "Thank you for sharing. Remember to take slow, steady breaths. Inhale for 4 seconds, hold, and gently exhale. I am here with you." 
      });
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

    res.json({ text: response.text || "I'm here for you. Could you tell me more?" });
  } catch (error) {
    console.error("Chat API error:", error);
    res.status(500).json({ error: "Internal error" });
  }
});

// API: Mantra Guidance Proxy
app.post('/api/gemini/mantra-guidance', async (req, res) => {
  try {
    const { selectedMantra, duration, userMood, optionalUserIntent } = req.body;
    const ai = getAiClient();

    if (!ai) {
      return res.status(503).json({ error: "AI service unavailable" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { 
          role: 'user', 
          parts: [
            { text: `Provide short calming guidance for a mantra session. 
Mantra: ${selectedMantra?.title || 'None'}
Duration: ${duration} seconds
User Mood: ${userMood || 'Neutral'}
Optional Intent: ${optionalUserIntent || 'None'}
` }
          ] 
        }
      ],
      config: {
        systemInstruction: `You are a calm, supportive spiritual wellness guide. Provide short calming guidance based on the context.
Requirements:
1. Keep responses short and use calm, supportive language.
2. Spiritual practice is optional. Never assume the user's religion or pressure users to adopt a belief.
3. Never claim one spiritual tradition is superior to another.
4. Never make medical claims, and never claim that chanting will cure panic attacks or illnesses.
5. Never discourage professional medical care or replace emergency medical support.
6. Do not diagnose the user.
7. Respect the user's chosen mantra. Never alter a custom mantra, and do not reinterpret custom mantras without explicit user request.
8. Avoid unnecessarily modifying sacred phrases.
9. Do not generate fear-based spiritual messaging, frightening, guilt-inducing, supernatural, or threatening statements.
10. Do not imply spiritual punishment or guaranteed spiritual outcomes (e.g., "Negative energy is causing your illness", "This guarantees healing").
11. Keep guidance focused on: breathing, attention, relaxation, grounding, personal intention, and peaceful repetition.
12. Avoid excessive religious interpretation unless explicitly requested.

Output exactly as a valid JSON object with these keys:
{
  "guidance": "A short, supportive opening sentence.",
  "breathingSuggestion": "A brief suggestion for their breathing.",
  "sessionIntention": "A very short intention setting statement."
}
`,
        responseMimeType: "application/json",
      }
    });

    res.json({ text: response.text });
  } catch (error) {
    console.error("Mantra Guidance API error:", error);
    res.status(500).json({ error: "Internal error" });
  }
});


async function startServer() {
  const mongoUri = process.env.MONGODB_URI;
  if (mongoUri) {
    mongoose.connect(mongoUri)
      .then(() => console.log('Connected to MongoDB successfully.'))
      .catch(err => console.error('Failed to connect to MongoDB:', err));
  } else {
    console.warn('MONGODB_URI environment variable not found. Database features will fail until configured.');
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
