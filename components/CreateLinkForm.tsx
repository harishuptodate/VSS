export default function CreateLinkForm({ videoId }: { videoId: string }) {
	async function action(formData: FormData) {
		'use server';
		const visibility = String(formData.get('visibility'));
		const preset = String(formData.get('preset'));
		const emails = String(formData.get('emails') || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		if (visibility === 'PRIVATE' && emails.length === 0) {
			return {
				ok: false,
				error: 'Something went wrong while creating the link.',
			};
		}

		const { requireUser } = await import('@/lib/auth');
		const { prisma } = await import('@/lib/prisma');
		const { expiryFromPreset, generateToken } = await import('@/lib/links');

		const user = await requireUser();
		const token = generateToken();
		const expiresAt = expiryFromPreset(
			preset as '1h' | '12h' | '1d' | '30d' | 'forever',
		);

		await prisma.shareLink.create({
			data: {
				token,
				videoId,
				createdBy: user.id,
				visibility: visibility === 'PRIVATE' ? 'PRIVATE' : 'PUBLIC',
				expiresAt,
				emails: { create: emails.map((email) => ({ email })) },
			},
		});
	}

	return (
		<form action={action} className="space-y-4 max-w-lg">
			<div className="grid grid-cols-2 gap-4">
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Visibility
					</label>
					<select name="visibility" className="input-field">
						<option value="PUBLIC">Public</option>
						<option value="PRIVATE">Private</option>
					</select>
				</div>
				<div>
					<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
						Expires
					</label>
					<select name="preset" className="input-field">
						<option value="1h">1 hour</option>
						<option value="12h">12 hours</option>
						<option value="1d">1 day</option>
						<option value="30d">30 days</option>
						<option value="forever">Forever</option>
					</select>
				</div>
			</div>
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
					Private Emails (comma-separated)
				</label>
				<input
					name="emails"
					placeholder="email1@example.com, email2@example.com"
					className="input-field"
				/>
			</div>
			<button className="btn-primary">Create Share Link</button>
		</form>
	);
}
