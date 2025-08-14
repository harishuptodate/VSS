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
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Dashboard</h1>
					<p className="text-gray-600">Welcome, {user.email}</p>
				</div>
				<SignOutButton />
			</div>

			<section>
				<h2 className="text-lg font-semibold mb-3">Upload</h2>
				<UploadDrop />
			</section>

			<section>
				<h2 className="text-lg font-semibold mb-3">Your Videos</h2>
				{items.length === 0 ? (
					<p className="text-sm text-gray-500">No videos uploaded yet.</p>
				) : (
					<div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
						{items.map((v) => (
							<VideoCard key={v.id} {...v} />
						))}
					</div>
				)}
			</section>
		</main>
	);
}
