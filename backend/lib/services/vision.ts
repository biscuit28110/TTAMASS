import { groq } from "@/lib/groq";
import { DetectedFood, VisionAnalysisResult } from "@/types/vision";

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

// Llama peut produire du JSON imparfait (fences markdown, virgules traînantes).
// On extrait le bloc {...} et on nettoie avant parsing.
function parseVisionJson(rawText: string): unknown {
  const match = rawText.match(/\{[\s\S]*\}/);
  if (!match) {
    throw new Error("Llama Vision n'a pas retourné un JSON valide");
  }
  const cleaned = match[0]
    .replace(/,\s*([}\]])/g, "$1") // virgules traînantes
    .replace(/\/\/[^\n\r]*/g, ""); // commentaires de ligne
  return JSON.parse(cleaned);
}

export async function analyzeImage(
  imageBase64: string,
  mediaType: "image/jpeg" | "image/png" | "image/webp"
): Promise<VisionAnalysisResult> {
  const response = await groq.chat.completions.create({
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    max_tokens: 1024,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:${mediaType};base64,${imageBase64}`,
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

  const rawText = response.choices[0]?.message?.content ?? "";
  const inputTokens = response.usage?.prompt_tokens ?? 0;
  const outputTokens = response.usage?.completion_tokens ?? 0;

  const parsed = parseVisionJson(rawText) as {
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
