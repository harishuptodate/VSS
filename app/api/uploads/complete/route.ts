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
  const videoData = await getVideo(video.id);
  console.log(videoData);
  return NextResponse.json({ ok: true });
}
  async function getVideo(videoId: string): Promise<VideoRow | null> {
    // console.log('[lambda] getVideo: querying for videoId:', videoId);
  
    const { data, error } = await supabase
      .from("Video")
      .select('id,userId,objectPath,status')
      .eq("id", videoId)
      .maybeSingle();
  
    console.log('[lambda] getVideo: result:', { data, error });
  
    if (error) {
      console.error('[lambda] getVideo: database error:', error);
      throw new Error(`Database error: ${JSON.stringify(error)}`);
    }
  
    if (!data) {
      console.log('[lambda] getVideo: no video found for ID:', videoId);
      return null;
    }
  
    console.log('[lambda] getVideo: found video:', {
      id: data.id,
      status: data.status,
    });
    return data as VideoRow;
  }


