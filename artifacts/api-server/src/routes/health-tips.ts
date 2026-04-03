import { Router, Request, Response } from "express";
import { logger } from "../lib/logger";

const router = Router();

interface UserProfile {
  age?: string;
  height?: string;
  weight?: string;
  occupation?: string;
  gender?: string;
  conditions?: string;
  goal?: string;
}

interface HealthEntry {
  mood: number;
  energy: number;
  sleep: number;
  water: number;
  symptoms: string[];
  notes?: string;
}

router.post("/", async (req: Request, res: Response) => {
  const { profile, recentEntries } = req.body as {
    profile: UserProfile | null;
    recentEntries: HealthEntry[];
  };

  const geminiBaseUrl = process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"];
  const geminiApiKey = process.env["AI_INTEGRATIONS_GEMINI_API_KEY"];

  if (!geminiBaseUrl || !geminiApiKey) {
    logger.warn("Gemini env vars missing, returning fallback tips");
    return res.json({ tips: getFallbackTips() });
  }

  try {
    const avgMood =
      recentEntries.length > 0
        ? (recentEntries.reduce((a, e) => a + e.mood, 0) / recentEntries.length).toFixed(1)
        : null;
    const avgEnergy =
      recentEntries.length > 0
        ? (recentEntries.reduce((a, e) => a + e.energy, 0) / recentEntries.length).toFixed(1)
        : null;
    const avgSleep =
      recentEntries.length > 0
        ? (recentEntries.reduce((a, e) => a + e.sleep, 0) / recentEntries.length).toFixed(1)
        : null;
    const avgWater =
      recentEntries.length > 0
        ? (recentEntries.reduce((a, e) => a + e.water, 0) / recentEntries.length).toFixed(1)
        : null;

    const commonSymptoms: Record<string, number> = {};
    recentEntries.forEach((e) => {
      e.symptoms.forEach((s) => {
        commonSymptoms[s] = (commonSymptoms[s] ?? 0) + 1;
      });
    });
    const topSymptoms = Object.entries(commonSymptoms)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([s]) => s);

    const profileText = profile
      ? `Age: ${profile.age || "unknown"}, Height: ${profile.height || "unknown"}cm, Weight: ${profile.weight || "unknown"}kg, Occupation: ${profile.occupation || "unknown"}, Gender: ${profile.gender || "unknown"}, Medical conditions: ${profile.conditions || "none"}, Health goal: ${profile.goal || "general wellness"}`
      : "No profile provided";

    const metricsText = recentEntries.length > 0
      ? `Average over last ${recentEntries.length} check-ins: Mood ${avgMood}/10, Energy ${avgEnergy}/10, Sleep quality ${avgSleep}/10, Water intake ${avgWater} glasses/day. Recurring symptoms: ${topSymptoms.join(", ") || "none"}.`
      : "No check-in data available.";

    const prompt = `You are a health wellness advisor. Based on the following user profile and recent health metrics, provide exactly 5 practical, personalized health tips. Each tip should be a single clear sentence (max 30 words). Focus on their specific concerns and goals.

User Profile: ${profileText}
Recent Health Data: ${metricsText}

Return ONLY a JSON array of exactly 5 strings, with no other text. Example format:
["Tip 1 here.", "Tip 2 here.", "Tip 3 here.", "Tip 4 here.", "Tip 5 here."]`;

    const response = await fetch(
      `${geminiBaseUrl}/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "[]";
    const tips = JSON.parse(raw) as string[];

    if (!Array.isArray(tips) || tips.length === 0) {
      throw new Error("Invalid response from Gemini");
    }

    return res.json({ tips: tips.slice(0, 5) });
  } catch (err) {
    logger.error({ err }, "Gemini health tips error, using fallback");
    return res.json({ tips: getFallbackTips() });
  }
});

function getFallbackTips(): string[] {
  return [
    "Drink at least 8 glasses of water daily to stay properly hydrated and support all body functions.",
    "Aim for 7-9 hours of quality sleep each night — it's essential for physical and mental recovery.",
    "A 30-minute walk daily can significantly improve your cardiovascular health and mood.",
    "Practice mindful breathing for 5 minutes each morning to reduce stress and anxiety levels.",
    "Include a variety of colorful vegetables in your meals for a broad range of essential nutrients.",
  ];
}

export default router;
