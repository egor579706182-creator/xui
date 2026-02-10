
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswer, AnalysisResult } from "../types";

const getApiKey = () => typeof process !== 'undefined' ? process.env.API_KEY : undefined;

export const validateApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  const apiKey = getApiKey();
  if (!apiKey) {
    return { 
      valid: false, 
      error: "API_KEY не обнаружен в переменных окружения. Если ты на Vercel, проверь Settings -> Environment Variables. Без ключа магии не будет." 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Делаем минимальный запрос для проверки работоспособности ключа
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "ping",
    });
    return { valid: true };
  } catch (e: any) {
    console.error("API Key validation failed", e);
    let message = "Проблема с API ключом: ";
    if (e.message?.includes("401") || e.message?.toLowerCase().includes("unauthorized")) {
      message += "Ключ невалиден. Проверь, правильно ли ты его скопировал из AI Studio.";
    } else if (e.message?.includes("403") || e.message?.toLowerCase().includes("forbidden")) {
      message += "Доступ запрещен. Возможно, API Gemini недоступен в твоем регионе или для этого ключа.";
    } else if (e.message?.includes("429")) {
      message += "Слишком много запросов (Quota exceeded). Подожди немного.";
    } else {
      message += e.message || "Неизвестная ошибка при проверке связи с Google Gemini.";
    }
    return { valid: false, error: message };
  }
};

export const analyzeStartupIdea = async (answers: UserAnswer[]): Promise<AnalysisResult> => {
  const apiKey = getApiKey();
  
  if (!apiKey) {
    throw new Error("API_KEY не обнаружен.");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    User has a business idea (could be IT, offline, services, manufacturing, etc.). They answered 10 questions.
    Analyze their idea with brutal honesty, sarcasm, and professional business depth.
    Use Russian language. Keep the sarcastic and slightly profane tone (use words like 'хуйня', 'залупа', 'ебать' where appropriate but stay insightful).
    
    Answers:
    ${answers.map(a => `Q: ${a.questionText}\nA: ${a.answer}`).join('\n\n')}
    
    Return a JSON response strictly following the schema.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "Catchy, sarcastic name for the project idea." },
          verdict: { type: Type.STRING, description: "A brutal reality check. Is it good or total trash?" },
          techStack: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Suggested operations/tools/tech (e.g., Shopify, CRM, or just a heavy shovel)."
          },
          monetization: { type: Type.STRING, description: "How to actually make money." },
          risks: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Why this will likely fail."
          },
          nextSteps: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Concrete actions to take now."
          },
          sarcasticComment: { type: Type.STRING, description: "Final punchline." }
        },
        required: ["title", "verdict", "techStack", "monetization", "risks", "nextSteps", "sarcasticComment"]
      },
      systemInstruction: "Ты — циничный серийный предприниматель и венчурный инвестор с плохим настроением. Твоя задача — разнести бизнес-идею пользователя в пух и прах, но при этом дать реально работающие советы по реализации. Используй мат для стилистики, но оставайся профессионалом в плане экономики и бизнес-процессов. Если идея не про IT, не предлагай писать код, предлагай бизнес-инструменты."
    }
  });

  try {
    const result = JSON.parse(response.text.trim());
    return result as AnalysisResult;
  } catch (e) {
    console.error("Failed to parse AI response", e);
    throw new Error("AI выдал какую-то дичь, попробуй еще раз.");
  }
};
