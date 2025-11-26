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

  const fullPrompt = `
    Act as a professional hair restoration specialist and digital artist. 
    Edit this image to simulate a realistic hair transplant result.
    
    Target Style: ${stylePrompt}.
    
    Strict Execution Guidelines for Hyper-Realism:
    1. Lighting Integration: Analyze the original light source (direction, hardness, temperature). Ensure the new hair catches this light accurately (specular highlights) and casts realistic micro-shadows onto the scalp.
    2. Natural Hairline Design: Create a hairline that is age-appropriate. It must NOT be a perfectly straight line. Add micro-irregularities and single-hair grafts at the front for a soft, natural transition from the forehead skin.
    3. Texture & Flow: Match the caliber, curl pattern, and growth direction of the subject's existing hair (sides/back). The hair should flow naturally according to gravity and head shape.
    4. Scalp Visibility: For a natural look, ensure slight scalp visibility is maintained where appropriate (especially at the hairline partings) so it doesn't look like a solid wig or helmet.
    5. Identity Preservation: Maintain the exact facial features, skin texture, expression, background, and clothing. Only the balding/thinning areas should be populated with new hair.
    
    Output: A high-resolution, photorealistic image indistinguishable from a real photograph.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: fullPrompt }
        ]
      },
      config: {
        // gemini-2.5-flash-image does not strictly support responseMimeType for images in the same way as text,
        // but we rely on it returning an image part.
      }
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