// app/api/links/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { expiryFromPreset, generateToken } from '@/lib/links';
import { notifyExistingUsers } from '@/lib/notify';

export const revalidate = 0;
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requireUser();
  const { searchParams } = new URL(req.url);
  const videoId = searchParams.get("videoId");

  const where = videoId
    ? { createdBy: user.id, videoId }
    : { createdBy: user.id };

  const links = await prisma.shareLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { video: { select: { id: true, title: true } } }
  });

  console.log("[links:GET]", JSON.stringify({
    user: user.id,
    videoId,
    count: links.length
  }));

  return NextResponse.json(links);
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json();
  const { videoId, visibility, preset, emails } = body as {
    videoId: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    preset: '1h' | '12h' | '1d' | '30d' | 'forever';
    emails?: string[];
  };

  console.log("[links:POST] IN", JSON.stringify({
    user: user.id,
    videoId,
    visibility,
    preset,
    emails
  }));

  // Owns the video?
  const owned = await prisma.video.findFirst({
    where: { id: videoId, userId: user.id },
    select: { id: true }
  });
  if (!owned) {
    console.warn("[links:POST] 403 not owner or video not found", { user: user.id, videoId });
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  const list = (emails ?? []).map((e) => e.trim()).filter(Boolean);
  if (visibility === 'PRIVATE' && list.length === 0) {
    console.warn("[links:POST] 400 private without emails");
    return NextResponse.json(
      { error: 'At least one email is required for PRIVATE links.' },
      { status: 400 },
    );
  }

  const token = generateToken();
  const expiresAt = expiryFromPreset(preset);

  const link = await prisma.shareLink.create({
    data: {
      token,
      videoId,
      createdBy: user.id,
      visibility,
      expiresAt,
      emails: { create: list.map((e) => ({ email: e })) },
    },
    include: { emails: true },
  });

  console.log("[links:POST] CREATED", JSON.stringify({
    id: link.id,
    token: link.token,
    emails: link.emails.map(e => e.email),
    visibility: link.visibility,
    expiresAt: link.expiresAt
  }));

  if (visibility === 'PRIVATE' && link.emails.length > 0) {
    // Don’t block the response; log start + end of async
    console.log("[links:POST] notifyExistingUsers START", JSON.stringify({
      token: link.token,
      emails: link.emails.map(e => e.email)
    }));
    notifyExistingUsers(
      link.token,
      link.emails.map((e) => e.email),
    )
      .then(() => console.log("[links:POST] notifyExistingUsers DONE"))
      .catch((err) => console.error('[links:POST] notifyExistingUsers ERROR', err));
  }

  return NextResponse.json(link);
}
