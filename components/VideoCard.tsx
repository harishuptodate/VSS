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
  return (
    <Link href={`/video/${id}`} className="block border rounded-lg overflow-hidden hover:shadow">
      <div className="aspect-video bg-black/5 flex items-center justify-center">
        {thumbUrl ? <img src={thumbUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-sm">No thumbnail yet</span>}
      </div>
      <div className="p-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium truncate">{title || id}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full ${status === "READY" ? "bg-green-100 text-green-700" : status === "PROCESSING" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-700"}`}>
            {status}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">{new Date(createdAt).toLocaleString()}</p>
      </div>
    </Link>
  );
}
