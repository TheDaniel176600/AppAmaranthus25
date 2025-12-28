
import { GoogleGenAI } from "@google/genai";

// Always use the correct initialization with named parameter and process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getMaintenanceInsights = async (tickets: any[]) => {
  const prompt = `Analise estes chamados de manutenção de um condomínio e sugira prioridades ou padrões: ${JSON.stringify(tickets)}. Responda de forma curta e profissional.`;
  
  try {
    const response = await ai.models.generateContent({
      // Using gemini-3-pro-preview for complex reasoning tasks like maintenance pattern analysis
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });
    // Property .text returns the string output directly
    return response.text;
  } catch (error) {
    console.error("Error fetching AI insights:", error);
    return "Não foi possível carregar insights inteligentes no momento.";
  }
};