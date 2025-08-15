// worker/thumb.worker.ts
import { Worker } from 'bullmq';
import { prisma } from '../lib/prisma'; // re-use app's prisma
import { supabaseService } from './supabase';
import { tmpFile, saveToFile, safeUnlink } from './utils/tmp';
import { probeDuration, extractJpeg } from './utils/ffmpeg';

const connection = { connection: { url: process.env.REDIS_URL! } };

export const worker = new Worker(
	'thumbs',
	async (job) => {
		const { videoId } = job.data as { videoId: string };
		const video = await prisma.video.findUnique({ where: { id: videoId } });
		if (!video) return;

		// get signed url to download
		const { data: signed } = await supabaseService.storage
			.from(process.env.BUCKET_VIDEOS!)
			.createSignedUrl(video.objectPath, 60 * 10);

		if (!signed?.signedUrl) throw new Error('Cannot sign source video');

		const localPath = tmpFile('.mp4');
		const resp = await fetch(signed.signedUrl);
		await saveToFile(resp as unknown as Response, localPath);

		const duration = Math.max(1, await probeDuration(localPath));
		const marks = [0.2, 0.5, 0.8].map((m) =>
			Math.max(1, Math.floor(duration * m)),
		);

		const outs: string[] = [];
		for (let i = 0; i < marks.length; i++) {
			const out = tmpFile('.jpg');
			await extractJpeg(localPath, out, marks[i]);
			outs.push(out);
		}

		// upload thumbs
		// worker/thumb.worker.ts (only the path lines shown)
		const paths: string[] = [];
		for (let i = 0; i < outs.length; i++) {
			const objectPath = `${videoId}/t${i + 1}.jpg`; // ✅ no bucket prefix
			const file = await import('fs').then((fs) => fs.readFileSync(outs[i]));
			const { error } = await supabaseService.storage
				.from(process.env.BUCKET_THUMBS!)
				.upload(objectPath, file, { contentType: 'image/jpeg', upsert: true });
			if (error) throw error;
			paths.push(objectPath);
		}

		await prisma.$transaction([
			...paths.map((p, i) =>
				prisma.thumbnail.create({
					data: { videoId, objectPath: p, timecodeSec: marks[i] },
				}),
			),
			prisma.video.update({
				where: { id: videoId },
				data: { status: 'READY', durationSec: duration },
			}),
		]);

		await safeUnlink(localPath);
		await Promise.all(outs.map((o) => safeUnlink(o)));
	},
	connection,
);
