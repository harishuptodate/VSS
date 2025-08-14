// app/(app)/upload/page.tsx
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import UploadDrop from '@/components/UploadDrop';
import VideoCard from '@/components/VideoCard';

export default async function UploadPage() {
	const user = await requireUser();

	const videos = await prisma.video.findMany({
		where: { userId: user.id },
		orderBy: { createdAt: 'desc' },
		include: { thumbnails: { orderBy: { timecodeSec: 'asc' } } },
	});

	const initial = videos.map((v) => ({
		id: v.id,
		title: v.title,
		status: v.status,
		createdAt: v.createdAt.toISOString(),
		thumbnails: v.thumbnails.map((t) => ({
			id: t.id,
			objectPath: t.objectPath,
			timecodeSec: t.timecodeSec,
		})),
	}));

	return (
		<main className="space-y-8">
			<section className="rounded-2xl border p-6 bg-white shadow-sm">
				<h2 className="text-lg font-semibold mb-2">Upload a Video</h2>
				<p className="text-sm text-gray-600 mb-4">
					Max size:{' '}
					{(
						Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES ?? 500_000_000) /
						(1024 * 1024)
					).toFixed(0)}{' '}
					MB
				</p>
				<UploadDrop />
			</section>

			<section className="space-y-3">
				<h2 className="text-lg font-semibold">Your Videos</h2>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{initial.map((video) => (
						<VideoCard
							key={video.id}
							id={video.id}
							title={video.title}
							status={video.status}
							thumbUrl={video.thumbnails[0]?.objectPath || null}
							createdAt={video.createdAt}
						/>
					))}
				</div>
			</section>
		</main>
	);
}
