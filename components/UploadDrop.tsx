// components/UploadDrop.tsx
"use client";
import { useRef, useState } from "react";
import { Upload } from "tus-js-client";
import { supabaseClient } from "@/lib/supabaseClient";

export default function UploadDrop() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle"|"uploading"|"done">("idle");

  async function startUpload(file: File) {
    const max = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES ?? 500_000_000);
    if (Number.isFinite(max) && file.size > max) {
      alert(`Max ${(max/1024/1024).toFixed(0)} MB`);
      return;
    }
    setStatus("uploading");

    const intent = await fetch("/api/uploads/intent", {
      method: "POST",
      body: JSON.stringify({ filename: file.name, type: file.type, size: file.size }),
    }).then(r => r.json());

    // ✅ get USER access token
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
        "x-upsert": "true", // optional but recommended
      },
      // TUS requires metadata keys; tus-js-client will base64 values for us.
      metadata: {
        bucketName: intent.bucket,
        objectName: intent.objectPath,
        contentType: file.type || "video/mp4",
        cacheControl: "3600"
      },
      retryDelays: [0, 1000, 3000, 5000],
      onError: (e) => { console.error(e); alert(e.message); setStatus("idle"); },
      onProgress: (bytesUploaded, bytesTotal) => {
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
        className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={onDrop}
      >
        <p>Drag & drop a video (max size configured) or click to choose.</p>
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
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div className="bg-blue-500 h-3 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {status === "done" && <div className="text-green-600">Upload complete. Processing…</div>}
    </div>
  );
}
