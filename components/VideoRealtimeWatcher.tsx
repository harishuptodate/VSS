"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Props = {
  videoId: string;
  initialStatus: "UPLOADING" | "PROCESSING" | "READY";
  initialThumbs: { objectPath: string }[];
};

export default function VideoRealtimeWatcher({ videoId, initialStatus, initialThumbs }: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [thumbCount, setThumbCount] = useState(initialThumbs.length);

  useEffect(() => {
    const supa = supabaseClient();
    const ch1 = supa.channel(`video-${videoId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Video", filter: `id=eq.${videoId}` },
        (payload) => {
          const s = (payload.new as { status: string }).status;
          if (s && s !== status) setStatus(s as "UPLOADING" | "PROCESSING" | "READY");
        }
      )
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Thumbnail", filter: `videoId=eq.${videoId}` },
        () => setThumbCount(c => c + 1)
      )
      .subscribe();

    return () => { supa.removeChannel(ch1); };
  }, [videoId, status]);

  return (
    <div className="text-xs text-gray-600">
      Live status: <span className="font-medium">{status}</span> · Thumbs: {thumbCount}
    </div>
  );
}
