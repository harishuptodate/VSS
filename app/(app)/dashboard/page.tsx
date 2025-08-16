// app/(app)/dashboard/page.tsx
import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { signThumbUrl } from '@/lib/storage';
import UploadDrop from '@/components/UploadDrop';
import VideoCard from '@/components/VideoCard';
import SignOutButton from '@/components/SignOutButton';
import DashboardRealtimeRefresher from '@/components/DashboardRealtimeRefresher';

export default async function DashboardPage() {
	try {
		const user = await requireUser();

		const videos = await prisma.video.findMany({
			where: { userId: user.id },
			orderBy: { createdAt: 'desc' },
			include: { thumbnails: { orderBy: { timecodeSec: 'asc' } } },
		});

		const items = await Promise.all(
			videos.map(async (v) => ({
				id: v.id,
				title: v.title,
				status: v.status,
				createdAt: v.createdAt,
				thumbs: await Promise.all(
					v.thumbnails.slice(0, 3).map((t) => signThumbUrl(t.objectPath)),
				),
			})),
		);

		return (
			<main className="page-container space-y-6 sm:space-y-8 animate-fade-in">
				<DashboardRealtimeRefresher userId={user.id} />

				{/* Header Section */}
				<div className="card-elevated p-4 sm:p-6 lg:p-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
						<div className="space-y-2">
							<h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white">
								Dashboard
							</h1>
							<p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
								Welcome back, {user.email}
							</p>
						</div>
						<SignOutButton />
					</div>
				</div>

				{/* Upload Section */}
				<section className="section-card animate-slide-up">
					<div className="flex items-center space-x-3 mb-4 sm:mb-6">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
							<svg
								className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
						<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
							Upload New Video
						</h2>
					</div>
					<UploadDrop />
				</section>

				{/* Videos Section */}
				<section className="section-card animate-slide-up">
					<div className="flex items-center space-x-3 mb-4 sm:mb-6">
						<div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
							<svg
								className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
						<h2 className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">
							Your Videos
						</h2>
						{videos.length > 0 && (
							<span className="ml-auto bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-1 rounded-full">
								{videos.length} {videos.length === 1 ? 'video' : 'videos'}
							</span>
						)}
					</div>

					{items.length === 0 ? (
						<div className="text-center py-8 sm:py-12 animate-scale-in">
							<div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
								<svg
									className="w-8 h-8 sm:w-10 sm:h-10 text-gray-400"
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
							<p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg font-medium">
								No videos uploaded yet.
							</p>
							<p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
								Start by uploading your first video above.
							</p>
						</div>
					) : (
						<div className="responsive-grid">
							{items.map((v, index) => (
								<div
									key={v.id}
									className="animate-slide-up"
									style={{ animationDelay: `${index * 100}ms` }}>
									<VideoCard {...v} />
								</div>
							))}
						</div>
					)}
				</section>
			</main>
		);
	} catch (error) {
		// If user is not authenticated, redirect to login page
		if (error instanceof Error && error.message === 'UNAUTHENTICATED') {
			redirect('/auth');
		}
		
		// For other errors, you might want to show an error page
		console.error('Dashboard error:', error);
		redirect('/auth');
	}
}