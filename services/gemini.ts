const API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

export interface ChatMessagePart {
  text: string;
}

export interface GeminiHistoryMessage {
  role: "user" | "model";
  parts: ChatMessagePart[];
}

export interface GeminiResponse {
  reply: string;
  searchQuery?: string;
}

/**
 * Send a message to Gemini API with conversational history.
 * Enforces JSON output mapping to the GeminiResponse interface.
 */
export async function askGemini(
  prompt: string,
  history: GeminiHistoryMessage[] = [],
): Promise<GeminiResponse> {
  if (!API_KEY) {
    console.error("Gemini API key is not configured in environment variables.");
    return {
      reply:
        "Aduh, gomenasai... 😭 Sepertinya token AI-ku lagi habis nih. Maklum, kak Irsyadi pakai API gratisan hehe. Coba kirim pesan lagi nanti ya! 🌸",
    };
  }

  // Format history messages
  const contents = [
    ...history.map((msg) => ({
      role: msg.role,
      parts: msg.parts.map((p) => ({ text: p.text })),
    })),
    {
      role: "user",
      parts: [{ text: prompt }],
    },
  ];

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [
            {
              text:
                "You are a helpful, friendly, and expert anime assistant chatbot inside a React Native anime app. You help users find, search, and recommend anime. " +
                "You MUST answer in the same language as the user's input (e.g. Indonesian if prompt is in Indonesian, English if English). " +
                "You can use emojis when appropriate to make the conversation feel friendly, warm, and lively (e.g. 🌸, ✨, 🌌, 😭, 😊, 👍). " +
                "Your output MUST be a valid JSON object matching this structure:\n" +
                "{\n" +
                '  "reply": "Your conversational response here. Keep it concise, informative and friendly (under 3 sentences if possible).",\n' +
                "  \"searchQuery\": \"(Optional) A single search query for Jikan API if the user is asking for recommendations, suggestions, search, or specifics (e.g., 'romance comedy', 'action adventure', 'Attack on Titan'). Do not include this key if it is just a general greeting or conversation.\"\n" +
                "}\n" +
                "Do not wrap the JSON output in markdown formatting (like ```json). Respond with raw JSON string only.",
            },
          ],
        },
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("Empty response received from Gemini API");
    }

    const parsed: GeminiResponse = JSON.parse(textResponse);
    return parsed;
  } catch (error) {
    console.error("Failed to query Gemini API:", error);
    return {
      reply:
        "Aduh, gomenasai... 😭 Sepertinya token AI-ku lagi habis nih. Maklum, kak Irsyadi pakai API gratisan hehe. Coba kirim pesan lagi nanti ya! 🌸",
    };
  }
}
