// app/api/links/route.ts
import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { expiryFromPreset, generateToken } from '@/lib/links';
import { notifyExistingUsers } from '@/lib/notify';

export const revalidate = 0;           // prevent caching
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
    include: { video: { select: { id: true, title: true } } }  // ⬅ include title
  });

  console.log("[links:GET]", { user: user.id, videoId, count: links.length });
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

	console.log(
		'[links:POST] user:',
		user.id,
		'video:',
		videoId,
		'visibility:',
		visibility,
		'preset:',
		preset,
		'emails:',
		emails,
	);

	const list = (emails ?? []).map((e) => e.trim()).filter(Boolean);
	if (visibility === 'PRIVATE' && list.length === 0) {
		console.warn('[links:POST] private link without emails → 400');
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

	console.log(
		'[links:POST] created link:',
		link.id,
		'token:',
		link.token,
		'emails:',
		link.emails.map((e) => e.email),
	);

	// fire-and-forget notifications (don’t block API latency)
	if (visibility === 'PRIVATE' && link.emails.length > 0) {
		notifyExistingUsers(
			link.token,
			link.emails.map((e) => e.email),
		).catch((err) => console.error('[links:POST] notify error:', err));
	}

	return NextResponse.json(link);
}
