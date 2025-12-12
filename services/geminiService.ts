import { GoogleGenAI, Type } from "@google/genai";
import { AppMode } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export interface NLPResult {
  action: 'CREATE_TRANSACTION' | 'CREATE_EVENT' | 'CREATE_TASK' | 'CREATE_GOAL' | 'ANSWER' | 'NOTE';
  conversationalResponse?: string; // The text the AI replies with (if any)
  data?: any; // The structured data for the item
}

// Helper to determine what the user is typing about
export const parseUserInput = async (text: string, currentMode: AppMode): Promise<NLPResult> => {
  if (!apiKey) {
    console.warn("No API Key provided. Returning raw text.");
    return { action: 'NOTE', data: { content: text } };
  }

  const model = 'gemini-2.5-flash';
  
  const systemInstruction = `
    You are Nexus, an intelligent personal operating system assistant.
    The user is currently in the "${currentMode}" context.
    
    Your goal is to categorize the user's input into structured actions OR provide a helpful answer.

    RULES:
    1. If the user describes a financial activity (spending, earning, saving), return action "CREATE_TRANSACTION" or "CREATE_GOAL".
    2. If the user describes a future plan or meeting, return action "CREATE_EVENT".
    3. If the user describes a task or to-do, return action "CREATE_TASK".
    4. If the user asks a question or wants information, return action "ANSWER" and provide the answer in 'conversationalResponse'.
    5. If it's just a thought or note, return action "NOTE".
    
    Current Date: ${new Date().toISOString()}
  `;

  const prompt = `User Input: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['CREATE_TRANSACTION', 'CREATE_EVENT', 'CREATE_TASK', 'CREATE_GOAL', 'ANSWER', 'NOTE'] },
            conversationalResponse: { type: Type.STRING, description: "Your reply to the user if it is a question or chat." },
            data: { 
              type: Type.OBJECT,
              properties: {
                // Transaction fields
                amount: { type: Type.NUMBER },
                currency: { type: Type.STRING },
                category: { type: Type.STRING },
                isExpense: { type: Type.BOOLEAN },
                description: { type: Type.STRING },
                
                // Event fields
                title: { type: Type.STRING },
                startTimeISO: { type: Type.STRING },
                endTimeISO: { type: Type.STRING },
                location: { type: Type.STRING },
                
                // Task fields
                dueDateISO: { type: Type.STRING },
                status: { type: Type.STRING },
                
                // Goal fields
                targetAmount: { type: Type.NUMBER },
                currentAmount: { type: Type.NUMBER },
                
                // General
                content: { type: Type.STRING },
                suggestedTags: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    });

    return JSON.parse(response.text || '{}') as NLPResult;
  } catch (e) {
    console.error("Gemini Parse Error", e);
    return { action: 'NOTE', data: { content: text } };
  }
};