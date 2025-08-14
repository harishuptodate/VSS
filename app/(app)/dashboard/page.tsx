// app/(app)/dashboard/page.tsx
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signThumbUrl } from '@/lib/storage';
import UploadDrop from '@/components/UploadDrop';
import VideoCard from '@/components/VideoCard';
import SignOutButton from '@/components/SignOutButton';

export default async function DashboardPage() {
	const user = await requireUser();

	const videos = await prisma.video.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
		include: { thumbnails: { take: 1, orderBy: { timecodeSec: 'asc' } } },
	});

	const items = await Promise.all(
		videos.map(async (v) => ({
			id: v.id,
			title: v.title,
			status: v.status,
			createdAt: v.createdAt,
			thumbUrl: v.thumbnails[0]
				? await signThumbUrl(v.thumbnails[0].objectPath)
				: null,
		})),
	);

	return (
		<main className="space-y-8">
			<div className="card-elevated p-6">
				<div className="flex items-center justify-between">
					<div className="space-y-1">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white">
							Dashboard
						</h1>
						<p className="text-gray-600 dark:text-gray-300">
							Welcome back, {user.email}
						</p>
					</div>
					<SignOutButton />
				</div>
			</div>

			<section className="section-card">
				<div className="flex items-center space-x-3 mb-6">
					<div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
						<svg
							className="w-4 h-4 text-white"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Upload New Video
					</h2>
				</div>
				<UploadDrop />
			</section>

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
								d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
							/>
						</svg>
					</div>
					<h2 className="text-xl font-semibold text-gray-900 dark:text-white">
						Your Videos
					</h2>
				</div>
				{items.length === 0 ? (
					<div className="text-center py-12">
						<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-8 h-8 text-gray-400"
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
						<p className="text-gray-500 dark:text-gray-400 text-lg">
							No videos uploaded yet.
						</p>
						<p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
							Start by uploading your first video above.
						</p>
					</div>
				) : (
					<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
						{items.map((v) => (
							<VideoCard key={v.id} {...v} />
						))}
					</div>
				)}
			</section>
		</main>
	);
}
