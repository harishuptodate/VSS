// app/(app)/video/[id]/page.tsx
import { Suspense } from 'react';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signDownloadUrl, signThumbUrl } from '@/lib/storage';
import ShareLinksTable from '@/components/ShareLinksTable';
import CreateLinkForm from '@/components/CreateLinkForm';
import VideoPlayer from '@/components/VideoPlayer';
import VideoStats from '@/components/VideoStats';

// Loading component
function VideoPageLoading() {
	return (
		<main className="page-container space-y-6 sm:space-y-8 animate-fade-in">
			<div className="card-elevated p-4 sm:p-6 lg:p-8">
				<div className="space-y-4 sm:space-y-6">
					{/* Header Skeleton */}
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
						<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-64 animate-pulse" />
					</div>

					{/* Video Player Skeleton */}
					<div className="w-full max-w-4xl mx-auto">
						<div className="bg-gray-200 dark:bg-gray-700 rounded-2xl h-96 animate-pulse" />
					</div>

					{/* Stats Skeleton */}
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="h-20 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
							/>
						))}
					</div>
				</div>
			</div>
		</main>
	);
}

export default async function VideoPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;
	const user = await requireUser();

	// Parallel data fetching for better performance
	const [video, downloadUrl, posterUrl] = await Promise.all([
		prisma.video.findFirst({
			where: { id, userId: user.id },
			select: {
				id: true,
				title: true,
				status: true,
				sizeBytes: true,
				createdAt: true,
				objectPath: true,
				thumbnails: {
					select: { objectPath: true },
					orderBy: { timecodeSec: 'asc' },
					take: 1, // Only get first thumbnail for poster
				},
			},
		}),
		signDownloadUrl(`${user.id}/${id}.mp4`), // Optimized path
		// Get poster URL if thumbnail exists
		(async () => {
			const thumb = await prisma.thumbnail.findFirst({
				where: { videoId: id },
				select: { objectPath: true },
				orderBy: { timecodeSec: 'asc' },
			});
			return thumb ? signThumbUrl(thumb.objectPath) : null;
		})(),
	]);

	if (!video) return <div className="p-4">Video not found</div>;

	return (
		<Suspense fallback={<VideoPageLoading />}>
			<main className="page-container space-y-6 sm:space-y-8 animate-fade-in">
				{/* Video Player Section */}
				<div className="card-elevated p-4 sm:p-6 lg:p-8">
					<div className="space-y-4 sm:space-y-6">
						{/* Header */}
						<div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
							<div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
								<svg
									className="w-5 h-5 sm:w-6 sm:h-6 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2 2v8a2 2 0 002 2z"
									/>
								</svg>
							</div>
							<div className="min-w-0 flex-1">
								<h1
									className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white break-words leading-tight"
									title={video.title || video.id}>
									{video.title || video.id}
								</h1>
							</div>
						</div>

						{/* Video Player */}
						<VideoPlayer
							src={downloadUrl}
							poster={posterUrl}
							title={video.title || video.id}
						/>

						{/* Video Stats */}
						<VideoStats video={video} />
					</div>
				</div>

				{/* Share Links Section */}
				<section className="section-card animate-slide-up">
					<div className="flex items-center gap-2 mb-3">
						<div className="w-7 h-7 bg-gradient-to-br from-green-500 to-green-600 rounded-lg grid place-items-center">
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
						<h2 className="text-lg font-semibold text-gray-900 dark:text-white">
							Share This Video
						</h2>
					</div>
					<CreateLinkForm videoId={id} />
				</section>

				{/* Existing Links Section */}
				<section className="section-card animate-slide-up">
					<div className="flex items-center space-x-3 mb-4 sm:mb-6">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
							<svg
								className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
						<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
							Existing Share Links
						</h2>
					</div>
					<ShareLinksTable />
				</section>
			</main>
		</Suspense>
	);
}
