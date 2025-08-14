// lib/notify.ts
import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY!);

// service-role client (can read auth schema)
const admin = createClient(
	process.env.NEXT_PUBLIC_SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
	{ auth: { persistSession: false } },
);

// small helper to check if an email already has an account
async function userExists(email: string): Promise<boolean> {
	console.log('[notify] checking user by email:', email);
	const { data, error } = await admin
		.from('users', )
		.select('id,email')
		.eq('email', email)
		.maybeSingle();

	if (error) {
		console.error('[notify] auth.users query error:', error);
		return false;
	}
	const exists = !!data?.id;
	console.log('[notify] user exists?', email, exists);
	return exists;
}

export async function notifyExistingUsers(token: string, emails: string[]) {
	const base = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
	const linkUrl = `${base}/s/${token}`;

	for (const email of emails) {
		try {
			if (!(await userExists(email))) continue;

			console.log('[notify] sending Resend email to:', email, 'url:', linkUrl);
			const res = await resend.emails.send({
				from: 'no-reply@your.domain',
				to: email,
				subject: 'You’ve been granted access to a video',
				html: `<p>You can view it here: <a href="${linkUrl}">${linkUrl}</a></p>`,
			});
			console.log('[notify] resend response:', res?.data?.id ?? res);
		} catch (e) {
			console.error('[notify] send failure for', email, e);
		}
	}
}
