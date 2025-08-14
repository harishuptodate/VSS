// app/api/uploads/complete/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { thumbQueue } from "@/lib/queues";

export async function POST(req: Request) {
  const { videoId, size, type } = await req.json();

  const video = await prisma.video.update({
    where: { id: videoId },
    data: { status: "PROCESSING", sizeBytes: BigInt(size ?? 0), mimeType: type || "video/mp4" }
  });

  await thumbQueue.add("make-thumbs", { videoId: video.id });
  return NextResponse.json({ ok: true });
}
