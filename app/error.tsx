// app/error.tsx
'use client';
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }, reset: () => void }) {
  return (
    <html>
      <body className="max-w-3xl mx-auto p-6">
        <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-600 mb-4">{error.message || 'Unknown error'}</p>
        <button
          onClick={() => reset()}
          className="px-3 py-2 border rounded"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
