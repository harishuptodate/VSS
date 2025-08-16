'use server';

import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseService } from '@/worker/supabase';

export async function deleteVideo(videoId: string) {
	try {
		const user = await requireUser();

		// Get the video to check ownership and get file paths
		const video = await prisma.video.findFirst({
			where: {
				id: videoId,
				userId: user.id,
			},
			include: {
				thumbnails: true,
				shares: true,
			},
		});

		if (!video) {
			return { error: 'Video not found or access denied' };
		}

		// Delete from Supabase storage first
		try {
			// Delete main video file
			await supabaseService.storage
				.from(process.env.BUCKET_VIDEOS!)
				.remove([video.objectPath]);

			// Delete thumbnail files
			const thumbnailPaths = video.thumbnails.map((t) => t.objectPath);
			if (thumbnailPaths.length > 0) {
				await supabaseService.storage
					.from(process.env.BUCKET_THUMBS!)
					.remove(thumbnailPaths);
			}
		} catch (storageError) {
			console.error('Failed to delete storage files:', storageError);
			// Continue with database deletion even if storage deletion fails
		}

		// Delete from database (this will cascade delete thumbnails and shares)
		await prisma.video.delete({
			where: { id: videoId },
		});

		return { success: true };
	} catch (error) {
		console.error('Failed to delete video:', error);
		return { error: 'Failed to delete video' };
	}
}
