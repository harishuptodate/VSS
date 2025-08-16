// app/api/videos/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { supabaseService } from '@/worker/supabase';

export async function DELETE(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> },
) {
	try {
		const user = await requireUser();
		const { id } = await params;

		// Get the video to check ownership and get file paths
		const video = await prisma.video.findFirst({
			where: {
				id,
				userId: user.id,
			},
			include: {
				thumbnails: true,
				shares: true,
			},
		});

		if (!video) {
			return NextResponse.json(
				{ message: 'Video not found or access denied' },
				{ status: 404 },
			);
		}

		// Delete from Supabase Storage
		try {
			// Delete video file
			await supabaseService.storage
				.from('videos')
				.remove([`${user.id}/${id}.mp4`]);

			// Delete thumbnails
			for (const thumb of video.thumbnails) {
				await supabaseService.storage
					.from('thumbnails')
					.remove([`${user.id}/${thumb.id}.jpg`]);
			}
		} catch (storageError) {
			console.error('Storage deletion failed:', storageError);
			// Continue with database cleanup even if storage fails
		}

		// Delete from database (cascades to thumbnails and shares)
		await prisma.video.delete({
			where: { id },
		});

		return NextResponse.json({ message: 'Video deleted successfully' });
	} catch (error) {
		console.error('Delete video failed:', error);
		return NextResponse.json(
			{ message: 'Failed to delete video' },
			{ status: 500 },
		);
	}
}
