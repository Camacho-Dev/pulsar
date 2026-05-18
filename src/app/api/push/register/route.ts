import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { registerPushToken } from "@/lib/push-notifications";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { token, platform } = await req.json();
  if (typeof token !== "string" || !token.trim()) {
    return NextResponse.json({ error: "Token requerido" }, { status: 400 });
  }

  await registerPushToken(
    session.user.id,
    token,
    typeof platform === "string" ? platform : "web"
  );

  return NextResponse.json({ ok: true });
}
