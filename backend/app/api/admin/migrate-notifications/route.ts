import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Route temporaire — à supprimer après exécution.
// Protégée par MIGRATION_TOKEN (env var Coolify, hors git).
export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.MIGRATION_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
  const client = new PrismaClient({ adapter });

  try {
    await client.$executeRawUnsafe(`
      ALTER TABLE "user_profiles"
        ADD COLUMN IF NOT EXISTS "expoPushToken" TEXT,
        ADD COLUMN IF NOT EXISTS "notifStreakReminder" BOOLEAN NOT NULL DEFAULT false;
    `);
    return NextResponse.json({ success: true, message: "Colonnes expoPushToken + notifStreakReminder ajoutées" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    await client.$disconnect();
  }
}
