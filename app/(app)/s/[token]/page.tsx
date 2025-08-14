// app/(app)/s/[token]/page.tsx
import { prisma } from "@/lib/prisma";
import { createServerClient } from "@/lib/supabaseServer";
import { signDownloadUrl, signThumbUrl } from "@/lib/storage";
import { redirect } from "next/navigation";

export default async function TokenView({ params }: { params: { token: string } }) {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  const link = await prisma.shareLink.findFirst({
    where: { token: params.token },
    include: { video: { include: { thumbnails: { orderBy: { timecodeSec: "asc" } } } }, emails: true }
  });
  if (!link) return <div className="p-4">Invalid link</div>;

  // expiry check
  if (link.expiresAt && link.expiresAt <= new Date()) return <div className="p-4">This link has expired</div>;

  if (link.visibility === "PRIVATE") {
    if (!user) return <div className="p-4">Sign in to view this private link.</div>;
    const allowed = link.emails.some(e => e.email.toLowerCase() === (user.email ?? "").toLowerCase());
    if (!allowed) return <div className="p-4">Your account is not authorized for this link.</div>;
  }

  // Update lastViewedAt
  await prisma.shareLink.update({ where: { id: link.id }, data: { lastViewedAt: new Date() } });

  const src = await signDownloadUrl(link.video.objectPath);
  const poster = link.video.thumbnails[0] ? await signThumbUrl(link.video.thumbnails[0].objectPath) : undefined;

  return (
    <main className="space-y-3">
      <h2 className="text-lg font-semibold">Shared Video</h2>
      <video controls className="w-full rounded" src={src} poster={poster ?? undefined} />
      <p className="text-sm text-gray-600">Visibility: {link.visibility} · {link.expiresAt ? `Expires: ${new Date(link.expiresAt).toLocaleString()}` : "Forever"}</p>
    </main>
  );
}
