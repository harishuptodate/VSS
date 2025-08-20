// lib/storage.ts
import { createClient } from '@supabase/supabase-js';

// Security: Server-side only - never expose service role keys to client
const supabaseUrl =
	process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
	throw new Error(
		'Missing Supabase storage environment variables. Check your .env.local file.',
	);
}

const supabase = createClient(supabaseUrl, serviceKey);

// Security: Validate bucket names from environment
const videosBucket = process.env.BUCKET_VIDEOS;
const thumbsBucket = process.env.BUCKET_THUMBS;

if (!videosBucket || !thumbsBucket) {
	throw new Error(
		'Missing storage bucket environment variables. Check your .env.local file.',
	);
}

export async function signDownloadUrl(
	objectPath: string,
	bucket = videosBucket,
) {
	const { data, error } = await supabase.storage
		.from(bucket || '')
		.createSignedUrl(objectPath, 3600); // 1 hour expiry

	if (error) throw error;
	return data.signedUrl;
}

export async function signThumbUrl(objectPath: string) {
	const { data, error } = await supabase.storage
		.from(thumbsBucket || '')
		.createSignedUrl(objectPath, 3600); // 1 hour expiry

	if (error) throw error;
	return data.signedUrl;
}
