import { GoogleGenAI, Type } from "@google/genai";

// Use a getter to ensure we don't crash if process is missing during evaluation
const getAI = () => {
  const apiKey = (typeof process !== 'undefined' && process.env?.API_KEY) || '';
  return new GoogleGenAI({ apiKey });
};

export const generateProfessionalMessage = async (teacherName: string, studentNames: string[], date: string) => {
  const prompt = `As a professional teacher named ${teacherName}, write a concise summary message to a school supervisor about the following students who were absent today (${date}): ${studentNames.join(', ')}. The tone should be formal and informative.`;
  
  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Failed to generate professional message.";
  }
};

export const getAttendanceInsights = async (absences: any[]) => {
  const prompt = `Analyze the following attendance data and provide 3 key insights or trends for the school supervisor: ${JSON.stringify(absences)}. Return the response in a structured JSON format.`;

  try {
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["insights"]
        }
      }
    });
    return JSON.parse(response.text || '{"insights":[]}');
  } catch (error) {
    console.error("Gemini Error:", error);
    return { insights: ["Unable to analyze data at this time."] };
  }
};