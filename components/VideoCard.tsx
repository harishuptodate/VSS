// components/VideoCard.tsx
'use client';

import Link from 'next/link';
import DeleteVideoButton from './DeleteVideoButton';
import { useState } from 'react';

type VideoCardProps = {
	id: string;
	title: string;
	status: string;
	createdAt: string;
	thumbs: (string | null)[];
};

export default function VideoCard({
	id,
	title,
	status,
	createdAt,
	thumbs,
}: VideoCardProps) {
	const [imageError, setImageError] = useState(false);
	const [a, b, c] = (thumbs ?? []).concat([null, null, null]).slice(0, 3);

	const statusConfig = {
		READY: {
			bg: 'bg-emerald-100 dark:bg-emerald-900/30',
			text: 'text-emerald-700 dark:text-emerald-400',
			border: 'border-emerald-200 dark:border-emerald-800',
			icon: (
				<svg
					className="w-3 h-3"
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
			),
		},
		PROCESSING: {
			bg: 'bg-amber-100 dark:bg-amber-900/30',
			text: 'text-amber-700 dark:text-amber-400',
			border: 'border-amber-200 dark:border-amber-800',
			icon: (
				<svg
					className="w-3 h-3 animate-spin"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
					/>
				</svg>
			),
		},
		UPLOADING: {
			bg: 'bg-gray-100 dark:bg-gray-800',
			text: 'text-gray-700 dark:text-gray-300',
			border: 'border-gray-200 dark:border-gray-700',
			icon: (
				<svg
					className="w-3 h-3"
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
			),
		},
	};

	const config = statusConfig[status as keyof typeof statusConfig];
	const displayTitle = title || 'Untitled Video';
	const isTitleLong = displayTitle.length > 25;
	return (
		<div className="group block relative">
			<Link href={`/video/${id}`} className="block">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 hover:scale-[1.02]">
					{/* Thumbnail Container */}
					<div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
						{thumbs && thumbs.some((t) => t) ? (
							<div className="grid grid-cols-3 w-full h-full">
								{[a, b, c].map((src, i) => (
									<div key={i} className="relative overflow-hidden">
										{src ? (
											<img
												src={src}
												alt=""
												className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
												onError={() => setImageError(true)}
											/>
										) : (
											<div className="w-full h-full bg-black/10 flex items-center justify-center">
												<svg
													className="w-6 h-6 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
													/>
												</svg>
											</div>
										)}
									</div>
								))}
							</div>
						) : (
							<div className="text-center space-y-2">
								<div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl flex items-center justify-center mx-auto">
									<svg
										className="w-6 h-6 text-gray-400"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24">
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
										/>
									</svg>
								</div>
								<span className="text-xs text-gray-500 dark:text-gray-400 block">
									No thumbnail yet
								</span>
							</div>
						)}

								{/* Status Badge Overlay */}
					<div className="absolute top-2 left-2">
						<span
							className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border backdrop-blur-sm ${config.bg} ${config.text} ${config.border}`}>
							{config.icon}
							<span className="hidden sm:inline">{status}</span>
						</span>
					</div>
					</div>

					{/* Content */}
					<div className="p-4">
						<h3 className="font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200">
							{title}
						</h3>
						<p className="text-sm text-gray-500 dark:text-gray-400">
							{new Date(createdAt).toLocaleDateString()}
						</p>
					</div>
				</div>
			</Link>

			{/* Delete Button - Outside the Link */}
			<DeleteVideoButton videoId={id} videoTitle={title} />
		</div>
	);
}
