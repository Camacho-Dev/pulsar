import { NextRequest, NextResponse } from "next/server";
import type { Ambiance } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const { ambiance } = await req.json();
  await prisma.moverProfile.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      preferredAmbiance: ambiance as Ambiance,
    },
    update: { preferredAmbiance: ambiance as Ambiance },
  });

  return NextResponse.json({ ok: true });
}
