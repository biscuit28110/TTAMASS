import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectedFood, VisionAnalysisResult } from "@/types/vision";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? "");
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const VISION_PROMPT = `Analyse cette photo d'assiette et identifie tous les aliments visibles.

Pour chaque aliment, estime :
- Le nom précis de l'aliment (en français)
- La quantité en grammes
- Les calories
- Les protéines (g)
- Les glucides (g)
- Les lipides (g)
- Ta confiance dans l'estimation : "high" (aliment clairement identifiable), "medium" (probable), "low" (incertain)

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "description": "Description brève de l'assiette en une phrase",
  "foods": [
    {
      "name": "Poulet grillé",
      "quantityG": 150,
      "calories": 248,
      "proteinG": 46.5,
      "carbsG": 0,
      "fatG": 5.4,
      "confidence": "high"
    }
  ]
}

Base tes estimations sur les valeurs nutritionnelles standard françaises. Sois précis mais honnête sur les incertitudes.`;

export async function analyzeImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<VisionAnalysisResult> {
  const result = await model.generateContent([
    {
      inlineData: {
        data: imageBase64,
        mimeType: mediaType,
      },
    },
    VISION_PROMPT,
  ]);

  const rawText = result.response.text();
  const usageMetadata = result.response.usageMetadata;
  const inputTokens = usageMetadata?.promptTokenCount ?? 0;
  const outputTokens = usageMetadata?.candidatesTokenCount ?? 0;

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Gemini n'a pas retourné un JSON valide");
  }

  const parsed = JSON.parse(jsonMatch[0]) as {
    description: string;
    foods: DetectedFood[];
  };

  const foods = parsed.foods ?? [];
  const totalCalories = foods.reduce((s, f) => s + f.calories, 0);
  const totalProteinG = foods.reduce((s, f) => s + f.proteinG, 0);
  const totalCarbsG = foods.reduce((s, f) => s + f.carbsG, 0);
  const totalFatG = foods.reduce((s, f) => s + f.fatG, 0);

  return {
    foods,
    totalCalories: Math.round(totalCalories),
    totalProteinG: Math.round(totalProteinG * 10) / 10,
    totalCarbsG: Math.round(totalCarbsG * 10) / 10,
    totalFatG: Math.round(totalFatG * 10) / 10,
    description: parsed.description ?? "",
    inputTokens,
    outputTokens,
  };
}
