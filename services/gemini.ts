
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswer, AnalysisResult } from "../types";

export const analyzeStartupIdea = async (answers: UserAnswer[]): Promise<AnalysisResult> => {
  // Защита от краша, если process.env недоступен
  const apiKey = typeof process !== 'undefined' ? process.env.API_KEY : undefined;
  
  if (!apiKey) {
    throw new Error("API_KEY не обнаружен. Настрой переменную окружения в Vercel.");
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
