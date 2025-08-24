// app/api/uploads/complete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { enqueueGenerateThumbs } from "@/lib/queues";
import { createClient } from '@supabase/supabase-js';


const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
  global: {
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
    },
  },
});
type VideoRow = {
	id: string;
	userId: string;
	objectPath: string;
	status: 'UPLOADING' | 'PROCESSING' | 'READY';
};
export async function POST(req: Request) {
  const { videoId, size, type } = await req.json();
  
  const video = await prisma.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING", sizeBytes: BigInt(size ?? 0), mimeType: type || "video/mp4" }
  });
  
  await enqueueGenerateThumbs(video.id);
  return NextResponse.json({ ok: true });
}
  