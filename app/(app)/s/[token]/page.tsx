// app/(app)/s/[token]/page.tsx
import { prisma } from '@/lib/prisma';
import { createServerClient } from '@/lib/supabaseServer';
import { signDownloadUrl, signThumbUrl } from '@/lib/storage';
import { redirect } from 'next/navigation';

export default async function TokenView({
	params,
}: {
	params: Promise<{ token: string }>;
}) {
	const { token } = await params;
	const supabase = await createServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	const link = await prisma.shareLink.findFirst({
		where: { token },
		include: {
			video: { include: { thumbnails: { orderBy: { timecodeSec: 'asc' } } } },
			emails: true,
		},
	});
	if (!link)
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="card-elevated p-8 text-center">
					<div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-red-600 dark:text-red-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Invalid Link
					</h2>
					<p className="text-gray-600 dark:text-gray-300">
						This share link could not be found.
					</p>
				</div>
			</div>
		);

	// expiry check
	if (link.expiresAt && link.expiresAt <= new Date())
		return (
			<div className="min-h-screen flex items-center justify-center">
				<div className="card-elevated p-8 text-center">
					<div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
						<svg
							className="w-8 h-8 text-amber-600 dark:text-amber-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
							/>
						</svg>
					</div>
					<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
						Link Expired
					</h2>
					<p className="text-gray-600 dark:text-gray-300">
						This share link has expired and is no longer accessible.
					</p>
				</div>
			</div>
		);

	if (link.visibility === 'PRIVATE') {
		if (!user)
			return (
				<div className="min-h-screen flex items-center justify-center">
					<div className="card-elevated p-8 text-center">
						<div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-8 h-8 text-blue-600 dark:text-blue-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
							Sign In Required
						</h2>
						<p className="text-gray-600 dark:text-gray-300">
							Please sign in to view this private video.
						</p>
					</div>
				</div>
			);
		const allowed = link.emails.some(
			(e) => e.email.toLowerCase() === (user.email ?? '').toLowerCase(),
		);
		if (!allowed)
			return (
				<div className="min-h-screen flex items-center justify-center">
					<div className="card-elevated p-8 text-center">
						<div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-8 h-8 text-red-600 dark:text-red-400"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
							Access Denied
						</h2>
						<p className="text-gray-600 dark:text-gray-300">
							Your account is not authorized to view this video.
						</p>
					</div>
				</div>
			);
	}

	// Update lastViewedAt
	await prisma.shareLink.update({
		where: { id: link.id },
		data: { lastViewedAt: new Date() },
	});

	const src = await signDownloadUrl(link.video.objectPath);
	const poster = link.video.thumbnails[0]
		? await signThumbUrl(link.video.thumbnails[0].objectPath)
		: undefined;

	return (
		<main className="space-y-8">
			<div className="card-elevated p-6">
				<div className="space-y-4">
					<div className="flex items-center space-x-3">
						<div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-600 rounded-xl flex items-center justify-center">
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
							Shared Video
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

					<div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
						<div className="flex items-center space-x-4">
							<span
								className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
									link.visibility === 'PUBLIC'
										? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
										: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
								}`}>
								{link.visibility === 'PUBLIC' ? (
									<svg
										className="w-3 h-3 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
										/>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
										/>
									</svg>
								) : (
									<svg
										className="w-3 h-3 mr-1"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
										/>
									</svg>
								)}
								{link.visibility}
							</span>
							<span>
								{link.expiresAt
									? `Expires: ${new Date(link.expiresAt).toLocaleDateString()}`
									: 'Never expires'}
							</span>
						</div>
					</div>
				</div>
			</div>
		</main>
	);
}
