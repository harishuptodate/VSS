// app/api/videos/[id]/route.ts
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signDownloadUrl } from "@/lib/storage";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const user = await requireUser();
  const v = await prisma.video.findFirst({ where: { id: params.id, userId: user.id } });
  if (!v) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const url = await signDownloadUrl(v.objectPath);
  return NextResponse.json({ ...v, signedUrl: url });
}
