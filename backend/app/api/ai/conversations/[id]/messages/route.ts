import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getUser } from "@/lib/auth/get-user";
import { checkDailyLimit, buildSystemPrompt, streamCoachReply } from "@/lib/services/ai";

const sendSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const conversation = await prisma.aiConversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.aiMessage.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(messages);
  } catch (err) {
    console.error("[AI GET messages]", err);
    return NextResponse.json({ error: "Erreur serveur: " + String(err) }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser(req);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const conversation = await prisma.aiConversation.findUnique({ where: { id } });
    if (!conversation) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (conversation.userId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = sendSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const profile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
      select: { plan: true },
    });
    const isPremium = profile?.plan === "PREMIUM";
    const withinLimit = await checkDailyLimit(user.id, isPremium);

    if (!withinLimit) {
      return NextResponse.json(
        { error: "Daily limit reached. Upgrade to Premium for unlimited access." },
        { status: 429 }
      );
    }

    const history = await prisma.aiMessage.findMany({
      where: { conversationId: id, role: { in: ["USER", "ASSISTANT"] } },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const systemPrompt = await buildSystemPrompt(user.id);

    await prisma.aiMessage.create({
      data: { conversationId: id, role: "USER", content: parsed.data.content },
    });

    const { reply, inputTokens, outputTokens } = await streamCoachReply(
      id,
      parsed.data.content,
      systemPrompt,
      history
    );

    const aiMessage = await prisma.aiMessage.create({
      data: {
        conversationId: id,
        role: "ASSISTANT",
        content: reply,
        inputTokens,
        outputTokens,
      },
    });

    await prisma.aiConversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(aiMessage, { status: 201 });
  } catch (err) {
    console.error("[AI POST message]", err);
    return NextResponse.json({ error: "Erreur serveur: " + String(err) }, { status: 500 });
  }
}
