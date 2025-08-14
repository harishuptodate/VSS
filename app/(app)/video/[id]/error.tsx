// app/(app)/video/[id]/error.tsx
'use client';
export default function VideoPageError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <div className="p-4 border rounded bg-red-50 text-red-700">
      <div className="font-semibold mb-1">Video page error</div>
      <div className="text-sm mb-3">{error.message || 'Unknown error'}</div>
      <button onClick={() => reset()} className="px-3 py-1 border rounded bg-white">Retry</button>
    </div>
  );
}
