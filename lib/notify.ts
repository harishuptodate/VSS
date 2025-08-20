// lib/notify.ts
import { Resend } from 'resend';
import { createServerClient } from './supabaseServer';

// Security: Validate all environment variables
const resendApiKey = process.env.RESEND_API_KEY;
const resendFrom = process.env.RESEND_FROM;
const supabaseUrl =
	process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!resendApiKey) {
	throw new Error('Missing RESEND_API_KEY environment variable');
}

if (!supabaseUrl || !supabaseServiceKey) {
	throw new Error('Missing Supabase environment variables');
}

const resend = new Resend(resendApiKey);

// Security: Use validated environment variables
const FROM = resendFrom || 'noreply@yourdomain.com';
if (!resendFrom) {
	console.warn('RESEND_FROM not set, using fallback email');
}

// Security: Server-side only operations
const supabase = createServerClient();

const REQUIRE_CONFIRMED_EMAIL =
	(process.env.REQUIRE_CONFIRMED_EMAIL || 'false').toLowerCase() === 'true';

function norm(email: string) {
	return email.trim().toLowerCase();
}

/** Try admin.getUserByEmail if available, else paginate listUsers (up to a small cap) */
async function getUserViaAdmin(email: string) {
	try {
		// Try direct getUserByEmail if the SDK has it
		const anyAdmin = (
			(await supabase).auth as unknown as {
				admin?: { getUserByEmail?: (email: string) => Promise<unknown> };
			}
		).admin;
		if (anyAdmin?.getUserByEmail) {
			console.log('[notify] admin.getUserByEmail()', email);
			const { data, error } = (await anyAdmin.getUserByEmail(email)) as {
				data?: {
					user?: {
						id: string;
						email?: string;
						email_confirmed_at?: string | null;
						confirmed_at?: string | null;
					};
				};
				error?: unknown;
			};
			if (error) {
				console.error('[notify] getUserByEmail error:', error);
			} else if (data?.user) {
				const u = data.user;
				return {
					id: u.id,
					email: u.email ?? email,
					email_confirmed_at:
						(u.email_confirmed_at as string | null) ??
						(u.confirmed_at as string | null) ??
						null,
				};
			}
		}

		// Fallback: scan a few pages of listUsers (client-side match)
		console.log('[notify] admin.listUsers scan for', email);
		const PER_PAGE = 100;
		const MAX_PAGES = 5; // scan up to 500 users; raise if needed
		for (let page = 1; page <= MAX_PAGES; page++) {
			const { data, error } = await (await supabase).auth.admin.listUsers({
				page,
				perPage: PER_PAGE,
			});
			if (error) {
				console.error('[notify] listUsers error:', error);
				return null;
			}
			const found = data?.users?.find((u) => u.email?.toLowerCase() === email);
			if (found) {
				return {
					id: found.id,
					email: found.email ?? email,
					email_confirmed_at:
						(found.email_confirmed_at as string | null) ??
						(found.confirmed_at as string | null) ??
						null,
				};
			}
			if (!data || data.users.length < PER_PAGE) break; // no more pages
		}
		return null;
	} catch (e) {
		console.error('[notify] admin API exception:', e);
		return null;
	}
}

/** auth.users fallback with correct v2 syntax */
async function getUserViaAuthSchema(email: string) {
	try {
		console.log('[notify] auth.users fallback for', email);
		// ✅ v2 syntax: .schema('auth').from('users')
		const { data, error } = await (await supabase)
			.schema('public')
			.from('users')
			.select('id,email,email_confirmed_at')
			.eq('email', email)
			.maybeSingle();

		if (error) {
			console.error('[notify] auth.users error:', error);
			return null;
		}
		return data ?? null;
	} catch (e) {
		console.error('[notify] auth.users exception:', e);
		return null;
	}
}

async function getRegisteredUser(emailRaw: string) {
	const email = norm(emailRaw);
	console.log('[notify] lookup email:', email);

	const viaAdmin = await getUserViaAdmin(email);
	if (viaAdmin) {
		console.log('[notify] found via admin:', viaAdmin);
		return viaAdmin;
	}

	const viaAuth = await getUserViaAuthSchema(email);
	if (viaAuth) {
		console.log('[notify] found via auth.users:', viaAuth);
		return viaAuth;
	}

	console.log('[notify] not registered:', email);
	return null;
}

export async function notifyExistingUsers(token: string, rawEmails: string[]) {
	const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
	const linkUrl = `${base}/s/${token}`;

	const emails = Array.from(new Set(rawEmails.map(norm).filter(Boolean)));

	console.log(
		'[notify] START',
		JSON.stringify({
			token,
			linkUrl,
			inputCount: rawEmails.length,
			normalizedCount: emails.length,
			FROM,
			REQUIRE_CONFIRMED_EMAIL,
		}),
	);

	// 🚦 In dev with fallback sender, Resend only allows sending to your own account email.
	if (FROM === 'noreply@yourdomain.com') {
		console.warn(
			'[notify] Using fallback sender. Resend will ONLY deliver to your account email. Verify a domain and set RESEND_FROM in prod.',
		);
	}

	for (const email of emails) {
		try {
			const user = await getRegisteredUser(email);
			if (!user) {
				console.log('[notify] SKIP (no user):', email);
				continue;
			}

			if (REQUIRE_CONFIRMED_EMAIL && !user.email_confirmed_at) {
				console.log('[notify] SKIP (unconfirmed):', email);
				continue;
			}

			console.log('[notify] SEND →', { to: email, url: linkUrl, from: FROM });
			const res = await resend.emails.send({
				from: FROM,
				to: email,
				subject: 'You’ve been granted access to a video',
				html: `<p>You can view it here: <a href="${linkUrl}">${linkUrl}</a></p>`,
			});

			if (res?.error) {
				console.error('[notify] Resend error:', res.error);
			} else {
				console.log('[notify] Resend ok:', res?.data ?? res);
			}
		} catch (e) {
			console.error('[notify] SEND exception for', email, e);
		}
	}

	console.log('[notify] DONE');
}
