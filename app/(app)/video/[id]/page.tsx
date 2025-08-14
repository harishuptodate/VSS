// app/(app)/video/[id]/page.tsx
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signDownloadUrl, signThumbUrl } from "@/lib/storage";
import ShareLinksTable from "@/components/ShareLinksTable";

export default async function VideoPage({ params }: { params: { id: string } }) {
  const user = await requireUser();
  const v = await prisma.video.findFirst({
    where: { id: params.id, userId: user.id },
    include: { thumbnails: { orderBy: { timecodeSec: "asc" } }, shares: true }
  });
  if (!v) return <div className="p-4">Not found</div>;

  const src = await signDownloadUrl(v.objectPath);
  const poster = v.thumbnails[0] ? await signThumbUrl(v.thumbnails[0].objectPath) : undefined;

  return (
    <main className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">{v.title || v.id}</h2>
        <video controls className="w-full rounded" src={src} poster={poster ?? undefined} />
        <div className="text-sm text-gray-600">
          <p>Status: {v.status}</p>
          <p>Size: {(Number(v.sizeBytes) / (1024 * 1024)).toFixed(1)} MB</p>
          <p>Uploaded: {new Date(v.createdAt).toLocaleString()}</p>
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="font-medium">Create Share Link</h3>
        <CreateLinkForm videoId={v.id} />
      </section>

      <section className="space-y-3">
        <h3 className="font-medium">Share Links</h3>
        <ShareLinksTable />
      </section>
    </main>
  );
}

function CreateLinkForm({ videoId }: { videoId: string }) {
  async function action(formData: FormData) {
    "use server";
    const visibility = String(formData.get("visibility"));
    const preset = String(formData.get("preset"));
    const emails = String(formData.get("emails") || "").split(",").map(s => s.trim()).filter(Boolean);

    const { requireUser } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");
    const { expiryFromPreset, generateToken } = await import("@/lib/links");

    const user = await requireUser();
    const token = generateToken();
    const expiresAt = expiryFromPreset(preset as "1h" | "12h" | "1d" | "30d" | "forever");

    await prisma.shareLink.create({
      data: {
        token,
        videoId,
        createdBy: user.id,
        visibility: visibility === "PRIVATE" ? "PRIVATE" : "PUBLIC",
        expiresAt,
        emails: { create: emails.map(email => ({ email })) }
      }
    });
  }

  return (
    <form action={action} className="flex flex-col gap-2 max-w-lg">
      <div className="flex gap-2">
        <select name="visibility" className="border rounded p-2">
          <option value="PUBLIC">PUBLIC</option>
          <option value="PRIVATE">PRIVATE</option>
        </select>
        <select name="preset" className="border rounded p-2">
          <option value="1h">1 hour</option>
          <option value="12h">12 hours</option>
          <option value="1d">1 day</option>
          <option value="30d">30 days</option>
          <option value="forever">Forever</option>
        </select>
      </div>
      <input name="emails" placeholder="Private emails (comma-separated)" className="border rounded p-2" />
      <button className="bg-blue-600 text-white rounded p-2 w-fit">Create Link</button>
    </form>
  );
}
