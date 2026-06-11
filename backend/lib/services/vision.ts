import Anthropic from "@anthropic-ai/sdk";
import { DetectedFood, VisionAnalysisResult } from "@/types/vision";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  const response = await client.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: "text",
            text: VISION_PROMPT,
          },
        ],
      },
    ],
  });

  const rawText = response.content[0].type === "text" ? response.content[0].text : "";
  const inputTokens = response.usage.input_tokens;
  const outputTokens = response.usage.output_tokens;

  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Claude n'a pas retourné un JSON valide");
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
