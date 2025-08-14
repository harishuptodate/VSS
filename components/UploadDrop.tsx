// components/UploadDrop.tsx
'use client';
import { useRef, useState } from 'react';
import { Upload } from 'tus-js-client';
import { supabaseClient } from '@/lib/supabaseClient';

function fmt(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 ** 2) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 ** 3) return `${(n / 1024 ** 2).toFixed(1)} MB`;
  return `${(n / 1024 ** 3).toFixed(1)} GB`;
}

export default function UploadDrop() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [progress, setProgress] = useState(0);
	const [bytes, setBytes] = useState({ up: 0, total: 0 });
	const [status, setStatus] = useState<'idle' | 'uploading' | 'done'>('idle');

	async function startUpload(file: File) {
		const max = Number(process.env.NEXT_PUBLIC_UPLOAD_MAX_BYTES ?? 500_000_000);
		if (Number.isFinite(max) && file.size > max) {
			alert(`Max ${(max / 1024 / 1024).toFixed(0)} MB`);
			return;
		}
		setStatus('uploading');

		const intent = await fetch('/api/uploads/intent', {
			method: 'POST',
			body: JSON.stringify({
				filename: file.name,
				type: file.type,
				size: file.size,
			}),
		}).then((r) => r.json());

		// ✅ get USER access token
		const supa = supabaseClient();
		const {
			data: { session },
		} = await supa.auth.getSession();
		if (!session?.access_token) {
			alert('You must be signed in to upload.');
			setStatus('idle');
			return;
		}

		const upload = new Upload(file, {
			endpoint: intent.tusEndpoint as string,
			headers: {
				authorization: `Bearer ${session.access_token}`,
				'x-upsert': 'true', // optional but recommended
			},
			// TUS requires metadata keys; tus-js-client will base64 values for us.
			metadata: {
				bucketName: intent.bucket,
				objectName: intent.objectPath,
				contentType: file.type || 'video/mp4',
				cacheControl: '3600',
			},
			retryDelays: [0, 1000, 3000, 5000],
			onError: (e) => {
				console.error(e);
				alert(e.message);
				setStatus('idle');
			},
			onProgress: (bytesUploaded, bytesTotal) => {
				setBytes({ up: bytesUploaded, total: bytesTotal });
				setProgress(Math.floor((bytesUploaded / bytesTotal) * 100));
			},
			onSuccess: async () => {
				await fetch('/api/uploads/complete', {
					method: 'POST',
					body: JSON.stringify({
						videoId: intent.videoId,
						size: file.size,
						type: file.type,
					}),
				});
				setStatus('done');
				setProgress(100);
			},
		});

		upload.start();
	}

	function onDrop(e: React.DragEvent<HTMLDivElement>) {
		e.preventDefault();
		const file = e.dataTransfer.files?.[0];
		if (file) startUpload(file);
	}

	return (
		<div className="space-y-6">
			<div
				className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 text-center cursor-pointer hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-all duration-200 group"
				onClick={() => inputRef.current?.click()}
				onDragOver={(e) => e.preventDefault()}
				onDrop={onDrop}>
				<div className="space-y-4">
					<div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900/30 dark:to-blue-800/30 rounded-2xl flex items-center justify-center mx-auto group-hover:from-blue-200 group-hover:to-blue-300 dark:group-hover:from-blue-800/50 dark:group-hover:to-blue-700/50 transition-all duration-200">
						<svg
							className="w-8 h-8 text-blue-600 dark:text-blue-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							/>
						</svg>
					</div>
					<div className="space-y-2">
						<p className="text-lg font-medium text-gray-900 dark:text-white">
							Drop your video here or click to browse
						</p>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							Supports MP4, MOV, AVI and other video formats
						</p>
					</div>
				</div>
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

			{status !== 'idle' && (
				<div className="space-y-3">
					<div className="flex items-center justify-between text-sm">
						<span className="text-gray-700 dark:text-gray-300 font-medium">
							{status === 'uploading' ? 'Uploading...' : 'Upload complete!'}
						</span>
						<span className="text-gray-500 dark:text-gray-400">
						{fmt(bytes.up)} / {fmt(bytes.total)} ({progress}%)
						</span>
					</div>
					<div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
						<div
							className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
							
						/>
					</div>
				</div>
			)}

			{status === 'done' && (
				<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
					<div className="flex items-center justify-center space-x-2 text-green-700 dark:text-green-400">
						<svg
							className="w-5 h-5"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M5 13l4 4L19 7"
							/>
						</svg>
						<span className="font-medium">
							Upload complete! Processing your video...
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
