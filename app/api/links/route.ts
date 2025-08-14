// app/api/links/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { expiryFromPreset, generateToken } from "@/lib/links";
import { getRegisteredRecipients } from "@/lib/supabaseAdmin";
import { sendPrivateShareEmail } from "@/lib/email";

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
    preset: "1h" | "12h" | "1d" | "30d" | "forever",
    emails?: string[]
  };

  if (visibility === "PRIVATE" && (!emails || emails.length === 0)) {
    return NextResponse.json({ error: "At least one email is required for PRIVATE links." }, { status: 400 });
  }

  const token = generateToken();
  const expiresAt = expiryFromPreset(preset);
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video || video.userId !== user.id) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const link = await prisma.shareLink.create({
    data: {
      token,
      videoId,
      createdBy: user.id,
      visibility,
      expiresAt,
      emails: { create: (emails ?? []).map((e) => ({ email: e })) }
    },
    include: { emails: true }
  });

  // Notify registered recipients (PRIVATE only)
  if (visibility === "PRIVATE" && link.emails.length > 0) {
    const recipientEmails = link.emails.map(e => e.email).filter(Boolean);
    const registered = await getRegisteredRecipients(recipientEmails);
    if (registered.length > 0) {
      const linkUrl = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/,"")}/s/${link.token}`;
      await sendPrivateShareEmail({
        to: registered,
        linkUrl,
        videoTitle: video.title ?? video.id,
        expiresAt
      });
    }
  }

  return NextResponse.json(link);
}
