import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

export async function POST(req: NextRequest) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.MIGRATION_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL! });
  const client = new PrismaClient({ adapter });

  try {
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "FoodUnit" AS ENUM ('G', 'ML');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    await client.$executeRawUnsafe(`
      ALTER TABLE "foods"
        ADD COLUMN IF NOT EXISTS "unit" "FoodUnit" NOT NULL DEFAULT 'G',
        ADD COLUMN IF NOT EXISTS "defaultQuantity" DOUBLE PRECISION NOT NULL DEFAULT 100;
    `);
    return NextResponse.json({ success: true, message: "Colonnes unit + defaultQuantity ajoutées" });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  } finally {
    await client.$disconnect();
  }
}
