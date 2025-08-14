// components/UploadDrop.tsx
"use client";
import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { supabaseClient } from "@/lib/supabaseClient";

function fmtBytes(n: number) {
  if (!Number.isFinite(n)) return "0 B";
  const units = ["B","KB","MB","GB","TB"];
  let i = 0, v = n;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 2 : 0)} ${units[i]}`;
}

export default function UploadDrop() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({ up: 0, total: 0 });
  const [status, setStatus] = useState<"idle"|"uploading"|"done">("idle");

  async function startUpload(file: File) {
    const max = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES ?? 500_000_000);
    if (Number.isFinite(max) && file.size > max) {
      alert(`Max ${(max/1024/1024).toFixed(0)} MB`);
      return;
    }
    setStatus("uploading");
    setBytes({ up: 0, total: file.size });
    setProgress(0);

    const intent = await fetch("/api/uploads/intent", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, type: file.type, size: file.size }),
    }).then(r => r.json());

    const supa = supabaseClient();
    const { data: { session } } = await supa.auth.getSession();
    if (!session?.access_token) {
      alert("You must be signed in to upload.");
      setStatus("idle");
      return;
    }

    const upload = new Upload(file, {
      endpoint: intent.tusEndpoint as string,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        "x-upsert": "true",
      },
      metadata: {
        bucketName: intent.bucket,
        objectName: intent.objectPath, // name INSIDE the bucket
        contentType: file.type || "video/mp4",
        cacheControl: "3600"
      },
      retryDelays: [0, 1000, 3000, 5000],
      onError: (e) => { console.error(e); alert(e.message); setStatus("idle"); },
      onProgress: (bytesUploaded, bytesTotal) => {
        setBytes({ up: bytesUploaded, total: bytesTotal });
        setProgress(Math.floor((bytesUploaded / bytesTotal) * 100));
      },
      onSuccess: async () => {
        await fetch("/api/uploads/complete", {
          method: "POST",
          body: JSON.stringify({ videoId: intent.videoId, size: file.size, type: file.type }),
        });
        setStatus("done");
        setProgress(100);
      }
    });

    upload.start();
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) startUpload(file);
  }

  return (
    <div className="space-y-4">
      <div
        className="border rounded-xl p-8 text-center cursor-pointer hover:bg-gray-50 transition"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <p className="text-sm text-gray-600">Drag & drop a video (max size configured) or click to choose</p>
        <input
          ref={inputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) startUpload(f);
          }}
        />
      </div>

      {status !== "idle" && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-600">
            <span>{fmtBytes(bytes.up)} / {fmtBytes(bytes.total)}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div className="bg-gray-900 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
          {status === "done" && <div className="text-emerald-600 text-sm">Upload complete. Processing…</div>}
        </div>
      )}
    </div>
  );
}
