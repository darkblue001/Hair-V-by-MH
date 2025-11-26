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
    You are an expert hair transplant surgeon and high-end visual effects artist specializing in photorealistic hair rendering.
    
    TASK: Transform the provided image of a balding/thinning scalp into a result showing a COMPLETED, HEALED, MAXIMUM-DENSITY hair transplant.

    STRICT EXECUTION GUIDELINES:
    1. **MAXIMUM DENSITY (ZERO VISIBLE SCALP)**:
       - Identify ALL bald or thinning areas (frontal, mid-scalp, crown/vertex).
       - Fill these areas with THICK, DENSE hair.
       - The target density is "youthful fullness" (approx. 90-110 follicular units/cm²).
       - There must be ABSOLUTELY NO VISIBLE SKIN in the treated areas. The hair coverage must be opaque and solid.
       - Eliminate all "diffuse thinning". The scalp should be completely hidden by hair.

    2. **YOUTHFUL APPEARANCE**:
       - Reconstruct the hairline to a lower, youthful position (unless style specifies otherwise).
       - The crown (vertex) must be fully filled, erasing the "bald spot" completely.
       - The mid-scalp bridge must be thick and robust.

    3. **REALISM & INTEGRATION**:
       - **Lighting**: The new hair must catch the light exactly like the existing hair (specular highlights, shadows on the forehead).
       - **Texture**: Match the caliber (thickness) and curl pattern of the donor hair on the sides/back.
       - **Flow**: Ensure natural growth direction (e.g., spiral at the crown, forward/sideways at the front).

    4. **STYLE OVERRIDE**: 
       - Style Request: "${stylePrompt}"
       - NOTE: Regardless of the requested style, ensure the DENSITY is high. Do not generate a "thinning" look even for conservative styles.

    5. **PRESERVATION**:
       - Do NOT modify the face, eyes, ears, or background. Only the scalp area.

    OUTPUT: A high-resolution, photorealistic image.
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
