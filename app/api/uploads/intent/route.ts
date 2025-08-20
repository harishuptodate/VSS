// app/api/uploads/intent/route.ts
import { NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabaseServer';
import { prisma } from '@/lib/prisma';
import { randomUUID } from 'crypto';

// Security: Validate environment variables at module level
const uploadMaxBytes = process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES;
const bucketVideos = process.env.BUCKET_VIDEOS;
const tusEndpoint = process.env.TUS_ENDPOINT;

if (!bucketVideos) {
	throw new Error('Missing BUCKET_VIDEOS environment variable');
}

if (!tusEndpoint) {
	throw new Error('Missing TUS_ENDPOINT environment variable');
}

// Parse upload max bytes with fallback
const maxSize = Number(uploadMaxBytes ?? 52_428_800); // 50MB default

export async function POST(req: Request) {
	try {
		const supabase = await createRouteClient();
		const {
			data: { user },
		} = await supabase.auth.getUser();
		if (!user) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { filename, type, size } = await req.json();

		// Enhanced size validation
		if (!size || size <= 0) {
			return NextResponse.json({ error: 'Invalid file size' }, { status: 400 });
		}

		if (size > maxSize) {
			const maxSizeMB = (maxSize / 1024 / 1024).toFixed(0);
			return NextResponse.json(
				{
					error: `File size (${(size / 1024 / 1024).toFixed(
						1,
					)}MB) exceeds ${maxSizeMB}MB limit`,
				},
				{ status: 400 },
			);
		}

		// Validate file type
		if (!type || !type.startsWith('video/')) {
			return NextResponse.json(
				{ error: 'Invalid file type. Only video files are allowed.' },
				{ status: 400 },
			);
		}

		const videoId = randomUUID();
		const objectPath = `${user.id}/${videoId}.mp4`;

		// Create database entry only after all validations pass
		const video = await prisma.video.create({
			data: {
				id: videoId,
				title: filename,
				userId: user.id,
				objectPath,
				sizeBytes: BigInt(size),
				mimeType: type,
				status: 'UPLOADING',
			},
		});

		const { data, error } = await supabase.storage
			.from(bucketVideos!)
			.createSignedUploadUrl(`${user.id}/${videoId}.mp4`);

		if (error) {
			console.error('Storage error:', error);
			return NextResponse.json(
				{ error: 'Failed to create upload URL' },
				{ status: 500 },
			);
		}

		console.log('=== INTENT CREATED ===');
		console.log('Bucket:', bucketVideos);
		console.log('Object path:', objectPath);
		console.log('Video ID:', videoId);
		console.log('====================');

		return NextResponse.json({
			uploadUrl: data.signedUrl,
			videoId: videoId,
			objectPath: objectPath,
			bucket: bucketVideos,
		});
	} catch (error) {
		console.error('Intent creation failed:', error);
		return NextResponse.json(
			{
				error: 'Failed to create upload intent',
			},
			{ status: 500 },
		);
	}
}
