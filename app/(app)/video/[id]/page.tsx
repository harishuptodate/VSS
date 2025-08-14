// app/(app)/video/[id]/page.tsx
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signDownloadUrl, signThumbUrl } from '@/lib/storage';
import ShareLinksTable from '@/components/ShareLinksTable';

export default async function VideoPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await requireUser();
	const v = await prisma.video.findFirst({
		where: { id, userId: user.id },
		include: { thumbnails: { orderBy: { timecodeSec: 'asc' } }, shares: true },
	});
	if (!v) return <div className="p-4">Not found</div>;

	const src = await signDownloadUrl(v.objectPath);
	const poster = v.thumbnails[0]
		? await signThumbUrl(v.thumbnails[0].objectPath)
		: undefined;

	return (
		<main className="space-y-8">
			<div className="card-elevated p-6">
				<div className="space-y-4">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
							<svg
								className="w-5 h-5 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
							{v.title || v.id}
						</h2>
					</div>

					<div className="bg-gray-900 rounded-2xl overflow-hidden">
						<video
							controls
							className="w-full"
							src={src}
							poster={poster ?? undefined}
						/>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
						<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
								Status
							</p>
							<p className="font-semibold text-gray-900 dark:text-white">
								{v.status}
							</p>
						</div>
						<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
								Size
							</p>
							<p className="font-semibold text-gray-900 dark:text-white">
								{(Number(v.sizeBytes) / (1024 * 1024)).toFixed(1)} MB
							</p>
						</div>
						<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
							<p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
								Uploaded
							</p>
							<p className="font-semibold text-gray-900 dark:text-white">
								{new Date(v.createdAt).toLocaleDateString()}
							</p>
						</div>
					</div>
				</div>
			</div>

			<section className="section-card">
				<div className="flex items-center space-x-3 mb-6">
					<div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
							/>
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
						Create Share Link
					</h3>
				</div>
				<CreateLinkForm videoId={v.id} />
			</section>

			<section className="section-card">
				<div className="flex items-center space-x-3 mb-6">
					<div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"
							/>
						</svg>
					</div>
					<h3 className="text-xl font-semibold text-gray-900 dark:text-white">
						Share Links
					</h3>
				</div>
				<ShareLinksTable />
			</section>
		</main>
	);
}

function CreateLinkForm({ videoId }: { videoId: string }) {
	async function action(formData: FormData) {
		'use server';
		const visibility = String(formData.get('visibility'));
		const preset = String(formData.get('preset'));
		const emails = String(formData.get('emails') || '')
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

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
