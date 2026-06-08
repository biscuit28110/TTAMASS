import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await prisma.aiConversation.findMany({
      where: { userId: user.id },
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { updatedAt: "desc" },
      take: 20,
    });

    return NextResponse.json(conversations);
  } catch (err) {
    console.error("[AI GET conversations]", err);
    return NextResponse.json({ error: "Erreur serveur: " + String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversation = await prisma.aiConversation.create({
      data: { userId: user.id },
    });

    return NextResponse.json(conversation, { status: 201 });
  } catch (err) {
    console.error("[AI POST conversation]", err);
    return NextResponse.json({ error: "Erreur serveur: " + String(err) }, { status: 500 });
  }
}
