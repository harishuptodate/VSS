import type { SQSHandler, SQSRecord } from 'aws-lambda';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { tmpdir } from 'node:os';
import { createWriteStream, existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import path from 'node:path';
import { execa } from 'execa';
import { randomUUID } from 'crypto';

/* ---------- Env ---------- */
const SUPABASE_URL = env('NEXT_PUBLIC_SUPABASE_URL');
const SERVICE_KEY = env('SUPABASE_SERVICE_ROLE_KEY');
const BUCKET_VIDEOS = process.env.BUCKET_VIDEOS || 'videos';
const BUCKET_THUMBS = process.env.BUCKET_THUMBS || 'thumbnails';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

/* ---------- FFmpeg paths (layer‑safe) ---------- */
// We guarantee these match the layer we will upload:
//   Layer zip root contains: bin/ffmpeg and bin/ffprobe
//   => runtime paths: /opt/bin/ffmpeg and /opt/bin/ffprobe
const DEFAULT_FFMPEG = '/opt/bin/ffmpeg';
const DEFAULT_FFPROBE = '/opt/bin/ffprobe';

// Allow override, but still validate path exists:
const FFMPEG_PATH =
	process.env.FFMPEG_PATH && existsSync(process.env.FFMPEG_PATH)
		? process.env.FFMPEG_PATH
		: existsSync(DEFAULT_FFMPEG)
		? DEFAULT_FFMPEG
		: 'ffmpeg';

const FFPROBE_PATH =
	process.env.FFPROBE_PATH && existsSync(process.env.FFPROBE_PATH)
		? process.env.FFPROBE_PATH
		: existsSync(DEFAULT_FFPROBE)
		? DEFAULT_FFPROBE
		: 'ffprobe';

/* ---------- Supabase ---------- */
// replace your createClient(...) call with this
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
	auth: { persistSession: false },
	global: {
		headers: {
			apikey: SERVICE_KEY,
			Authorization: `Bearer ${SERVICE_KEY}`,
		},
	},
});

// ✅ Remove verbose debug logs, keep only essential ones
console.log('[lambda] Supabase config:', {
	url: SUPABASE_URL,
	keyLength: SERVICE_KEY?.length || 0,
	bucketVideos: BUCKET_VIDEOS,
	bucketThumbs: BUCKET_THUMBS,
});

// ✅ Simplify database connection test - remove verbose logging
async function testDatabaseConnection() {
	try {
		const { data, error } = await supabase.from('Video').select('id').limit(1);

		if (error) {
			console.error('[lambda] Database connection failed:', error);
			return false;
		}

		console.log('[lambda] Database connected successfully');
		return true;
	} catch (err) {
		console.error('[lambda] Database connection error:', err);
		return false;
	}
}

/* ---------- Types ---------- */
const Envelope = z.object({
	type: z.literal('generate-thumbs'),
	version: z.literal(1),
	data: z.object({ videoId: z.string().min(1) }),
});
type Envelope = z.infer<typeof Envelope>;

type VideoRow = {
	id: string;
	userId: string;
	objectPath: string;
	status: 'UPLOADING' | 'PROCESSING' | 'READY';
};

type ThumbRow = {
	id: string;
	videoId: string;
	objectPath: string;
	timecodeSec: number;
	createdAt?: string; // ✅ Make createdAt optional since we'll provide it
};

/* ---------- Helpers ---------- */
function env(name: string): string {
	const v = process.env[name];
	if (!v) throw new Error(`Missing env: ${name}`);
	return v;
}

async function getVideo(videoId: string): Promise<VideoRow | null> {
	const { data, error } = await supabase
		.from('Video')
		.select('id,userId,objectPath,status')
		.eq('id', videoId)
		.maybeSingle();

	if (error) {
		console.error('[lambda] Database error:', error);
		throw new Error(`Database error: ${JSON.stringify(error)}`);
	}

	if (!data) {
		console.log('[lambda] Video not found:', videoId);
		return null;
	}

	return data as VideoRow;
}

async function updateStatus(videoId: string, status: VideoRow['status']) {
	const updateData: { status: VideoRow['status'] } = { status };
	const { error } = await supabase
		.from('Video')
		.update(updateData)
		.eq('id', videoId);
	if (error) throw new Error(`Update error: ${JSON.stringify(error)}`); // ✅ Fix: Convert to Error
}

async function signedDownloadURL(objectPath: string): Promise<string> {
	const { data, error } = await supabase.storage
		.from(BUCKET_VIDEOS)
		.createSignedUrl(objectPath, 60 * 15);
	if (error || !data?.signedUrl)
		throw new Error(`Storage error: ${JSON.stringify(error)}`); // ✅ Fix: Convert to Error
	return data.signedUrl;
}

async function uploadThumb(objectPath: string, localFile: string) {
	const bytes = await fs.readFile(localFile);
	const { error } = await supabase.storage
		.from(BUCKET_THUMBS)
		.upload(objectPath, bytes, { upsert: true, contentType: 'image/jpeg' });
	if (error) throw new Error(`Upload error: ${JSON.stringify(error)}`); // ✅ Fix: Convert to Error
}

async function insertThumbs(rows: ThumbRow[]) {
	// ✅ Generate IDs for each thumbnail before inserting
	const rowsWithIds = rows.map((row) => ({
		...row,
		id: randomUUID(), // Generate UUID for each thumbnail
	}));

	const { error } = await supabase.from('Thumbnail').insert(rowsWithIds);
	if (error) throw new Error(`Insert error: ${JSON.stringify(error)}`);
}

async function downloadToTmp(url: string, filename: string) {
	const dest = path.join(tmpdir(), filename);
	const res = await fetch(url);
	if (!res.ok || !res.body)
		throw new Error(`Download failed: ${res.status} ${res.statusText}`);
	await pipeline(
		res.body as unknown as NodeJS.ReadableStream,
		createWriteStream(dest),
	);
	return dest;
}

async function ffprobeDuration(input: string): Promise<number> {
	try {
		const { stdout } = await execa(
			FFPROBE_PATH,
			[
				'-v',
				'error',
				'-show_entries',
				'format=duration',
				'-of',
				'default=nw=1:nk=1',
				input,
			],
			{ stdio: 'pipe' },
		);
		const dur = parseFloat(stdout.trim());
		if (!isFinite(dur)) throw new Error('non-finite duration');
		return dur;
	} catch (e) {
		console.warn('[lambda] ffprobe failed; fallback to 60s', e);
		return 60;
	}
}

async function extractFrame(input: string, output: string, timeSec: number) {
	await execa(
		FFMPEG_PATH,
		[
			'-y',
			'-ss',
			String(timeSec),
			'-i',
			input,
			'-frames:v',
			'1',
			'-vf',
			'scale=1280:-1',
			'-q:v',
			'2',
			output,
		],
		{ stdio: 'pipe' },
	);
}

function pickTimecodes(duration: number): number[] {
	const clamp = (t: number) =>
		Math.min(Math.max(t, 1), Math.max(1, duration - 1));
	return [0.1, 0.5, 0.9].map((p) => Math.round(clamp(duration * p)));
}

/* ---------- Core job ---------- */
async function processGenerateThumbs(videoId: string) {
	console.log('[lambda] Processing video:', videoId);

	const vid = await getVideo(videoId);
	if (!vid) return;
	if (vid.status === 'READY') {
		console.log('[lambda] Video already processed:', videoId);
		return;
	}

	try {
		await updateStatus(vid.id, 'PROCESSING');
		console.log('[lambda] Downloading video:', videoId);

		const url = await signedDownloadURL(vid.objectPath);
		const src = await downloadToTmp(url, `src-${vid.id}.mp4`);

		const duration = await ffprobeDuration(src);
		const times = pickTimecodes(duration);
		console.log('[lambda] Video duration:', duration, 'seconds, extracting at:', times);

		const thumbs: { local: string; remote: string; t: number }[] = [];
		for (const t of times) {
			const fname = `thumb-${vid.id}-${Math.round(t)}.jpg`;
			const local = path.join(tmpdir(), fname);
			await extractFrame(src, local, t);
			const remote = `${vid.userId}/thumbs/${vid.id}/${fname}`;
			await uploadThumb(remote, local);
			thumbs.push({ local, remote, t });
		}

		await insertThumbs(
			thumbs.map(({ remote, t }) => ({
				id: randomUUID(),
				videoId: vid.id,
				objectPath: remote,
				timecodeSec: Math.round(t),
				createdAt: new Date().toISOString(),
			})),
		);

		await updateStatus(vid.id, 'READY');

		// cleanup
		await fs.rm(src, { force: true });
		await Promise.allSettled(
			thumbs.map((x) => fs.rm(x.local, { force: true })),
		);

		console.log('[lambda] Successfully processed video:', videoId);
	} catch (err: unknown) {
		console.error('[lambda] Failed to process video:', videoId, 'Error:', err instanceof Error ? err.message : String(err));
		try {
			await updateStatus(vid.id, 'UPLOADING');
		} catch {}
		throw err;
	}
}

/* ---------- SQS entrypoint ---------- */
export const handler: SQSHandler = async (event) => {
	// ✅ Test database connection first
	const dbConnected = await testDatabaseConnection();
	if (!dbConnected) {
		throw new Error('Cannot connect to database');
	}

	for (const record of event.Records) {
		await handleRecord(record);
	}
};

async function handleRecord(record: SQSRecord) {
	let parsed: unknown;
	try {
		parsed = JSON.parse(record.body);
	} catch {
		console.error('[lambda] bad JSON', record.body);
		return;
	}

	const envl = Envelope.safeParse(parsed);
	if (!envl.success) {
		console.error('[lambda] bad envelope', envl.error.format());
		return;
	}

	const { type, data } = envl.data;
	if (type === 'generate-thumbs') {
		await processGenerateThumbs(data.videoId);
	} else {
		console.warn('[lambda] ignore message type', type);
	}
}
