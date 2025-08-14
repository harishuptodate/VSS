// components/VideoCard.tsx
import Link from "next/link";

type Props = {
  id: string;
  title?: string | null;
  status: "UPLOADING" | "PROCESSING" | "READY";
  thumbUrl?: string | null;
  createdAt: string | Date;
};

export default function VideoCard({ id, title, status, thumbUrl, createdAt }: Props) {
  const chip =
    status === "READY" ? "bg-emerald-100 text-emerald-700" :
    status === "PROCESSING" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-700";

  return (
    <Link href={`/video/${id}`} className="block border rounded-xl overflow-hidden bg-white hover:shadow-sm transition">
      <div className="aspect-video bg-gray-50 flex items-center justify-center">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs text-gray-500">No thumbnail yet</span>
        )}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">{title || "Untitled"}</h3>
          <span className={`text-[10px] px-2 py-0.5 rounded-full ${chip}`}>{status}</span>
        </div>
        <p className="text-[11px] text-gray-500 mt-1">{new Date(createdAt).toLocaleString()}</p>
      </div>
    </Link>
  );
}
