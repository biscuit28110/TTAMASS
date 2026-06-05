import { NextRequest } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export async function getUser(req: NextRequest) {
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  if (!token) return null;
  const {
    data: { user },
  } = await supabaseAdmin.auth.getUser(token);
  return user ?? null;
}
