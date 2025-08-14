// app/api/links/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expiryFromPreset, generateToken } from "@/lib/links";

export async function GET() {
  const user = await requireUser();
  const links = await prisma.shareLink.findMany({
    where: { createdBy: user.id },
    orderBy: { createdAt: "desc" }
  });
  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { videoId, visibility, preset, emails } = body as {
    videoId: string,
    visibility: "PUBLIC" | "PRIVATE",
    preset: "1h"|"12h"|"1d"|"30d"|"forever",
    emails?: string[]
  };

  const token = generateToken();
  const expiresAt = expiryFromPreset(preset);

  const link = await prisma.shareLink.create({
    data: {
      token,
      videoId,
      createdBy: user.id,
      visibility,
      expiresAt,
      emails: { create: (emails ?? []).map((e) => ({ email: e })) }
    }
  });

  // TODO: If PRIVATE and email exists in auth.users, send email (Resend). Skipped for brevity.

  return NextResponse.json(link);
}
