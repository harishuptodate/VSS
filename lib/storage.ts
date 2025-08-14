// lib/storage.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

export async function signDownloadUrl(objectPath: string, bucket = process.env.BUCKET_VIDEOS!) {
  const { data, error } = await serviceClient.storage
    .from(bucket)
    .createSignedUrl(objectPath, 60 * 10); // 10 min
  if (error || !data?.signedUrl) throw error || new Error("Failed to sign URL");
  return data.signedUrl;
}

export async function signThumbUrl(objectPath: string) {
  const { data, error } = await serviceClient.storage
    .from(process.env.BUCKET_THUMBS!)
    .createSignedUrl(objectPath, 60 * 60);
  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
