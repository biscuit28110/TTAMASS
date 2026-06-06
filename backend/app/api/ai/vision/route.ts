import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { analyzeImage } from "@/lib/services/vision";
import type { VisionMealType } from "@/types/vision";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

const VisionSchema = z.object({
  image: z.string().min(1),
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  mealType: z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]),
});

export async function POST(req: NextRequest) {
  const user = await getUser(req);
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { userId: user.id },
    select: { plan: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = VisionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { image, mediaType, mealType } = parsed.data as {
    image: string;
    mediaType: "image/jpeg" | "image/png" | "image/webp";
    mealType: VisionMealType;
  };

  const imageSizeBytes = Buffer.byteLength(image, "base64");
  if (imageSizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image trop volumineuse (max 5 MB)" },
      { status: 413 }
    );
  }

  try {
    const result = await analyzeImage(image, mediaType);
    return NextResponse.json({ ...result, mealType });
  } catch (err) {
    console.error("[vision] analyzeImage error:", err);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de l'image" },
      { status: 500 }
    );
  }
}
