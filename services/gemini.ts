
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswer, AnalysisResult } from "../types";

export const validateApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return { 
      valid: false, 
      error: "API_KEY не обнаружен в process.env. На Vercel убедись, что переменная добавлена в Settings -> Environment Variables и нажми Redeploy." 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Простейший запрос для проверки валидности ключа
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "test",
    });
    return { valid: true };
  } catch (e: any) {
    console.error("API Key validation failed", e);
    let message = "Ошибка API Gemini: ";
    const errStr = e.toString().toLowerCase();
    
    if (errStr.includes("401") || errStr.includes("unauthorized") || errStr.includes("key not valid")) {
      message += "Ключ недействителен. Проверь его в Google AI Studio.";
    } else if (errStr.includes("403") || errStr.includes("forbidden")) {
      message += "Доступ запрещен. Возможно, регион не поддерживается или ключ заблокирован.";
    } else if (errStr.includes("429") || errStr.includes("quota")) {
      message += "Исчерпан лимит запросов (Quota Exceeded).";
    } else {
      message += e.message || "Не удалось связаться с сервером Google.";
    }
    return { valid: false, error: message };
  }
};

export const analyzeStartupIdea = async (answers: UserAnswer[]): Promise<AnalysisResult> => {
  // Создаем экземпляр прямо перед вызовом, чтобы использовать актуальный ключ
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
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
          title: { type: Type.STRING },
          verdict: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          monetization: { type: Type.STRING },
          risks: { type: Type.ARRAY, items: { type: Type.STRING } },
          nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
          sarcasticComment: { type: Type.STRING }
        },
        required: ["title", "verdict", "techStack", "monetization", "risks", "nextSteps", "sarcasticComment"]
      },
      systemInstruction: "Ты — циничный серийный предприниматель и венчурный инвестор. Твоя задача — разнести бизнес-идею пользователя в пух и прах, но при этом дать реально работающие советы по реализации. Используй мат для стилистики. Если идея не про IT, предлагай бизнес-инструменты."
    }
  });

  try {
    const result = JSON.parse(response.text.trim());
    return result as AnalysisResult;
  } catch (e) {
    throw new Error("AI вернул некорректный формат данных. Попробуй еще раз.");
  }
};
