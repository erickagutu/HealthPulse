import { UserProfile, HealthEntry } from "./storage";

const GEMINI_API_URL = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api/health-tips`;

export async function fetchHealthTips(
  profile: UserProfile | null,
  recentEntries: HealthEntry[]
): Promise<string[]> {
  try {
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile, recentEntries }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data = await response.json() as { tips: string[] };
    return data.tips;
  } catch (error) {
    return getFallbackTips(profile);
  }
}

function getFallbackTips(profile: UserProfile | null): string[] {
  const tips = [
    "Drink at least 8 glasses of water daily to stay hydrated and support all body functions.",
    "Aim for 7-9 hours of quality sleep each night — it's essential for physical and mental recovery.",
    "A 30-minute walk daily can significantly improve your cardiovascular health and mood.",
    "Practice mindful breathing for 5 minutes each morning to reduce stress and anxiety.",
    "Include a variety of colorful vegetables in your meals for a broad range of essential nutrients.",
    "Limit screen time 1 hour before bed to improve sleep quality.",
    "Regular stretching improves flexibility, reduces tension, and prevents injury.",
    "Take short movement breaks every hour if you have a sedentary job.",
    "Connect with friends or family regularly — social connection supports mental well-being.",
    "Track your mood and energy levels daily to spot patterns and make healthier choices.",
  ];

  if (profile?.occupation?.toLowerCase().includes("desk") ||
      profile?.occupation?.toLowerCase().includes("office") ||
      profile?.occupation?.toLowerCase().includes("engineer") ||
      profile?.occupation?.toLowerCase().includes("developer")) {
    tips.unshift("For desk workers: use the 20-20-20 rule — every 20 minutes, look at something 20 feet away for 20 seconds.");
  }

  return tips.slice(0, 5);
}
