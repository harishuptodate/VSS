// app/api/uploads/intent/route.ts
import { NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabaseServer";
import { prisma } from "@/lib/prisma";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const supabase = await createRouteClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { filename, type, size } = await req.json();
  const videoId = randomUUID();

  // ✅ object name INSIDE the bucket (no bucket name prefix)
  const objectPath = `${user.id}/${videoId}.mp4`;

  await prisma.video.create({
    data: {
      id: videoId,
      title: filename,
      userId: user.id,
      objectPath,
      sizeBytes: BigInt(size ?? 0),
      mimeType: type || "video/mp4",
      status: "UPLOADING"
    }
  });

  return NextResponse.json({
    videoId,
    bucket: process.env.BUCKET_VIDEOS!,
    objectPath,
    tusEndpoint: process.env.TUS_ENDPOINT!, // keep this env exactly as /storage/v1/upload/resumable
  });
}
