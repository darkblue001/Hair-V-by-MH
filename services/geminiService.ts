import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

const apiKey = process.env.API_KEY || '';

// Helper to remove data URL prefix
const stripBase64Prefix = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64: string) => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

export const analyzeScalpImage = async (base64Image: string, lang: Language): Promise<AnalysisResult> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  
  // Clean base64 string
  const data = stripBase64Prefix(base64Image);
  const mimeType = getMimeType(base64Image);

  const prompt = `
    Analyze this scalp image for hair transplant assessment.
    1. Estimate the Norwood Scale (1-7).
    2. Estimate the TOTAL number of grafts needed for a good cosmetic result.
    3. Break down the grafts by zone: Frontal Hairline, Mid-Scalp, and Crown.
    4. Estimate a cost range in USD based on average hair transplant prices in Egypt (typically approx $0.80 to $1.50 USD per graft).
    5. Provide a short 2-sentence summary of the condition in ${lang === 'ar' ? 'Arabic' : 'English'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            norwoodScale: { type: Type.INTEGER },
            totalGrafts: { type: Type.INTEGER },
            distribution: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  zone: { type: Type.STRING },
                  count: { type: Type.INTEGER }
                }
              }
            },
            estimatedCostMin: { type: Type.INTEGER },
            estimatedCostMax: { type: Type.INTEGER },
            summary: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as AnalysisResult;
    } else {
      throw new Error("No data returned from analysis.");
    }
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw error;
  }
};

export const generateRestorationPreview = async (
  originalBase64: string,
  stylePrompt: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const ai = new GoogleGenAI({ apiKey });
  const data = stripBase64Prefix(originalBase64);
  const mimeType = getMimeType(originalBase64);

  // We use gemini-2.5-flash-image for fast image editing/generation capabilities.
  const prompt = `
    Act as a professional hair restoration specialist and digital artist.
    Task: Edit the input image to simulate a complete, high-density hair transplant result.
    
    CRITICAL INSTRUCTIONS:
    1. Identify ALL exposed scalp skin on the top of the head, including the receding hairline, temples, mid-scalp, and crown vertex.
    2. FILL these bald areas COMPLETELY with thick, dense hair. No scalp skin should be visible in the treated zones.
    3. Construct a new, natural hairline that frames the face lower down on the forehead, connecting the temples properly.
    4. Ensure the new hair seamlessly blends with the existing hair on the sides and back in terms of color, texture, flow, and lighting.
    5. Style Directive: ${stylePrompt}.
    6. Maintain the original face identity, lighting conditions, and background. Do not alter facial features.
    
    The output must look like a photorealistic "After" photo of a successful hair restoration surgery.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data } },
        ]
      },
      // No config needed for basic image editing with flash-image
    });

    // Check for inlineData (image) in parts
    const parts = response.candidates?.[0]?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    throw error;
  }
};
