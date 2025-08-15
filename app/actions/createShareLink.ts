// app/actions/createShareLink.ts
'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { expiryFromPreset, generateToken } from '@/lib/links';

type State = { ok: boolean; error?: string; message?: string };

export async function normEmails(
	raw: string | FormDataEntryValue | null,
): Promise<string[]> {
	const s = (typeof raw === 'string' ? raw : '') || '';
	return Array.from(
		new Set(
			s
				.split(',')
				.map((x) => x.trim().toLowerCase())
				.filter(Boolean),
		),
	);
}

function isEmail(e: string) {
	return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
}

export async function createShareLink(
	prev: State,
	formData: FormData,
): Promise<State> {
	try {
		const user = await requireUser();

		const videoId = String(formData.get('videoId') || '');
		const visibility = String(
			formData.get('visibility') || 'PUBLIC',
		).toUpperCase();
		const preset = String(formData.get('preset') || '1h');
		const emails = await normEmails(formData.get('emails'));

		console.log('[CreateShareLink] IN', {
			user: user.id,
			videoId,
			visibility,
			preset,
			emails,
		});

		if (!videoId) return { ok: false, error: 'Missing video id.' };
		if (!['PUBLIC', 'PRIVATE'].includes(visibility))
			return { ok: false, error: 'Invalid visibility.' };
		if (!['1h', '12h', '1d', '30d', 'forever'].includes(preset))
			return { ok: false, error: 'Invalid expiry preset.' };

		if (visibility === 'PRIVATE') {
			if (emails.length === 0) {
				console.warn('[CreateShareLink] private without emails');
				return {
					ok: false,
					error: 'At least one email is required for PRIVATE links.',
				};
			}
			const bad = emails.filter((e) => !isEmail(e));
			if (bad.length)
				return { ok: false, error: `Invalid emails: ${bad.join(', ')}` };
		}

		// ownership check
		const owned = await prisma.video.findFirst({
			where: { id: videoId, userId: user.id },
			select: { id: true },
		});
		if (!owned) {
			console.warn('[CreateShareLink] video not owned/not found', {
				user: user.id,
				videoId,
			});
			return { ok: false, error: 'Video not found.' };
		}

		const token = generateToken();
		const expiresAt = expiryFromPreset(
			preset as '1h' | '12h' | '1d' | '30d' | 'forever',
		);

		const link = await prisma.shareLink.create({
			data: {
				token,
				videoId,
				createdBy: user.id,
				visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
				expiresAt,
				emails: { create: emails.map((email) => ({ email })) },
			},
			include: { emails: true },
		});

		console.log('[CreateShareLink] CREATED', {
			id: link.id,
			token: link.token,
			emails: link.emails.map((e) => e.email),
		});

		// fire-and-forget notifications
		if (visibility === 'PRIVATE' && link.emails.length > 0) {
			import('@/lib/notify')
				.then(async ({ notifyExistingUsers }) => {
					console.log('[CreateShareLink] notify START', {
						token: link.token,
						emails: link.emails.map((e) => e.email),
					});
					await notifyExistingUsers(
						link.token,
						link.emails.map((e) => e.email),
					);
					console.log('[CreateShareLink] notify DONE');
				})
				.catch((err) => console.error('[CreateShareLink] notify ERROR', err));
		}

		return { ok: true, message: 'Share link created.' };
	} catch (err: unknown) {
		console.error('[CreateShareLink] ERROR', err);
		return {
			ok: false,
			error: 'Something went wrong while creating the link.',
		};
	}
}
