
import { GoogleGenAI, Type } from "@google/genai";
import { UserAnswer, AnalysisResult } from "../types";

export const validateApiKey = async (): Promise<{ valid: boolean; error?: string }> => {
  // Пытаемся получить ключ из разных возможных мест (стандартный процесс)
  const apiKey = process.env.API_KEY;
  
  console.log("Checking API_KEY availability...");

  if (!apiKey || apiKey === "undefined" || apiKey.length < 5) {
    return { 
      valid: false, 
      error: "Ключ не найден в коде. В Vercel переменные прописываются ПЕРЕД сборкой. Если ты добавил ключ только что — нажми кнопку 'Redeploy' во вкладке Deployments." 
    };
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    // Делаем минимальный запрос для реальной проверки работоспособности ключа
    await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: "hi",
    });
    return { valid: true };
  } catch (e: any) {
    console.error("Gemini Validation Error:", e);
    const errStr = e.toString().toLowerCase();
    let message = "Ошибка API: ";
    
    if (errStr.includes("api key not valid") || errStr.includes("401")) {
      message = "API ключ невалиден. Проверь, нет ли лишних пробелов в настройках Vercel.";
    } else if (errStr.includes("quota") || errStr.includes("429")) {
      message = "Закончились лимиты (Quota Exceeded). Попробуй другой ключ.";
    } else {
      message += e.message || "Неизвестная ошибка связи с Google.";
    }
    return { valid: false, error: message };
  }
};

export const analyzeStartupIdea = async (answers: UserAnswer[]): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY missing at runtime");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `
    User startup idea analysis. 
    Answers:
    ${answers.map(a => `Q: ${a.questionText}\nA: ${a.answer}`).join('\n\n')}
    
    Respond in Russian. Tone: Professional but brutal, sarcastic, uses mild Russian profanity for style.
    Provide actionable business advice hidden inside the sarcasm.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
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
      systemInstruction: "Ты — венчурный инвестор-мизантроп. Ты видел тысячи провальных стартапов и теперь ненавидишь человеческую глупость. Твоя цель — разнести идею, но если в ней есть зерно истины, подсказать как не сдохнуть в первый месяц. Используй слова 'херня', 'проеб', 'бабки'."
    }
  });

  return JSON.parse(response.text.trim());
};
