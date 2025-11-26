import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, Language } from "../types";

// Helper to remove data URL prefix
const stripBase64Prefix = (base64: string) => {
  return base64.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

const getMimeType = (base64: string) => {
  const match = base64.match(/^data:(image\/[a-zA-Z]+);base64,/);
  return match ? match[1] : 'image/jpeg';
};

// Helper to detect Quota errors
const isQuotaError = (error: any): boolean => {
  const msg = error.message || JSON.stringify(error);
  return msg.includes('429') || msg.includes('Quota') || msg.includes('RESOURCE_EXHAUSTED');
};

// Helper to resize large images to prevent timeouts/latency issues
const resizeImage = (base64Str: string, maxWidth = 1024): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // Calculate new dimensions
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        // Compress to JPEG 0.8 quality
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      } else {
        resolve(base64Str); // Fallback
      }
    };
    img.onerror = () => resolve(base64Str); // Fallback
  });
};

export const analyzeScalpImage = async (base64Image: string, lang: Language): Promise<AnalysisResult> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Resize image before sending to improve speed and reduce payload size
  const resizedImage = await resizeImage(base64Image);
  const data = stripBase64Prefix(resizedImage);
  const mimeType = 'image/jpeg'; // resizeImage outputs jpeg

  const prompt = `
    Analyze this scalp image for hair transplant assessment.
    1. Estimate the Norwood Scale (1-7).
    2. Estimate the TOTAL number of grafts needed.
    3. Break down the grafts by zone: Frontal Hairline, Mid-Scalp, and Crown.
    4. Estimate a cost range in USD based on average hair transplant prices in Egypt (approx $0.80 to $1.50 USD per graft).
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
  } catch (error: any) {
    console.error("Gemini Analysis Error:", error);
    if (isQuotaError(error)) {
        throw new Error("QUOTA_EXCEEDED");
    }
    // Check for Safety block
    if (error.message && error.message.includes('SAFETY')) {
        throw new Error("SAFETY_BLOCK");
    }
    throw error;
  }
};

export const generateRestorationPreview = async (
  originalBase64: string,
  stylePrompt: string
): Promise<string> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Resize large images to prevent timeouts
  const resizedImage = await resizeImage(originalBase64);
  const data = stripBase64Prefix(resizedImage);
  const mimeType = 'image/jpeg';

  // Simplified prompt to be more token-efficient while maintaining quality
  const prompt = `
    Role: Professional VFX Artist.
    Task: Edit image to add full, dense hair to all bald areas.
    Style: ${stylePrompt}.
    Rules:
    - Eliminate all visible scalp skin.
    - Match lighting/texture of original.
    - Keep face unchanged.
    - Output: Photorealistic result.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          // CRITICAL: Image must come BEFORE text for edit tasks in some models/pipelines
          { inlineData: { mimeType, data } },
          { text: prompt },
        ]
      },
    });

    const candidate = response.candidates?.[0];
    
    // Explicitly check for safety finish reason
    if (candidate?.finishReason === 'SAFETY') {
        throw new Error("SAFETY_BLOCK");
    }
    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      throw new Error(`Generation stopped: ${candidate.finishReason}`);
    }

    const parts = candidate?.content?.parts;
    if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
            }
        }
    }
    
    throw new Error("Model returned no image data.");

  } catch (error: any) {
    console.error("Gemini Generation Error:", error);
    if (isQuotaError(error)) {
        throw new Error("QUOTA_EXCEEDED");
    }
    if (error.message && error.message.includes('SAFETY')) {
        throw new Error("SAFETY_BLOCK");
    }
    throw error;
  }
};
