import { Mantra } from '../data/mantras';

export interface MantraGuidanceResponse {
  guidance: string;
  breathingSuggestion: string;
  sessionIntention: string;
}

export interface MantraGuidanceContext {
  selectedMantra: Mantra;
  durationSeconds: number;
  userMood?: string;
  optionalUserIntent?: string;
}

export const generateMantraGuidance = async (context: MantraGuidanceContext): Promise<MantraGuidanceResponse | null> => {
  const generateFallback = (): MantraGuidanceResponse => {
    return {
      guidance: `Take a deep breath and connect with the essence of ${context.selectedMantra.title}. Let its sound and meaning ground you in the present moment.`,
      breathingSuggestion: "Inhale deeply for 4 counts, hold for 4, exhale slowly for 6. Let each breath carry you deeper into stillness.",
      sessionIntention: "May this practice bring you a profound sense of inner peace and clarity."
    };
  };

  try {
    const response = await fetch('/api/gemini/mantra-guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        selectedMantra: context.selectedMantra,
        duration: context.durationSeconds,
        userMood: context.userMood,
        optionalUserIntent: context.optionalUserIntent
      })
    });

    if (!response.ok) {
      console.warn("Mantra guidance fetch failed:", response.status, ". Using local fallback.");
      return generateFallback();
    }

    const data = await response.json();
    const rawText = data.text;
    
    try {
      const cleaned = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      if (parsed.guidance && parsed.breathingSuggestion && parsed.sessionIntention) {
        return parsed as MantraGuidanceResponse;
      }
      return generateFallback();
    } catch (e) {
      console.warn("Failed to parse Mantra guidance JSON:", rawText, ". Using local fallback.");
      return generateFallback();
    }
  } catch (err) {
    console.warn("Mantra guidance network error:", err, ". Using local fallback.");
    return generateFallback();
  }
};
