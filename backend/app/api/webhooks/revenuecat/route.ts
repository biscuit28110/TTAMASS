import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Types des événements RevenueCat pertinents
type RCEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "UNCANCELLATION";

interface RCWebhookBody {
  api_version: string;
  event: {
    type: RCEventType;
    app_user_id: string;
    entitlement_ids: string[] | null;
    environment: "PRODUCTION" | "SANDBOX";
  };
}

const PREMIUM_EVENTS: RCEventType[] = ["INITIAL_PURCHASE", "RENEWAL", "UNCANCELLATION", "PRODUCT_CHANGE"];
const FREE_EVENTS: RCEventType[] = ["CANCELLATION", "EXPIRATION", "BILLING_ISSUE"];

export async function POST(req: NextRequest) {
  // Vérification du secret webhook RevenueCat
  const authHeader = req.headers.get("Authorization");
  const expectedSecret = process.env.REVENUECAT_WEBHOOK_SECRET;

  if (!expectedSecret || authHeader !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: RCWebhookBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { type, app_user_id, entitlement_ids } = body.event;

  const hasPremiumEntitlement = entitlement_ids?.includes("premium") ?? false;
  const shouldBePremium = PREMIUM_EVENTS.includes(type) && hasPremiumEntitlement;
  const shouldBeFree = FREE_EVENTS.includes(type);

  if (!shouldBePremium && !shouldBeFree) {
    return NextResponse.json({ received: true });
  }

  const newPlan = shouldBePremium ? "PREMIUM" : "FREE";

  try {
    await prisma.userProfile.update({
      where: { userId: app_user_id },
      data: { plan: newPlan },
    });
  } catch {
    // L'utilisateur peut ne pas encore avoir de profil (edge case)
    console.error(`[revenuecat-webhook] user ${app_user_id} not found`);
  }

  return NextResponse.json({ received: true });
}
