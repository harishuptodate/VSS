'use client';

import { useState, useRef } from 'react';

type VideoPlayerProps = {
	src: string;
	poster?: string | null;
	title: string;
};

export default function VideoPlayer({ src, poster, title }: VideoPlayerProps) {
	const [isLoading, setIsLoading] = useState(true);
	const [hasError, setHasError] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleLoadStart = () => setIsLoading(true);
	const handleCanPlay = () => setIsLoading(false);
	const handleError = () => {
		setHasError(true);
		setIsLoading(false);
	};

	return (
		<div className="flex justify-center">
			<div className="w-full max-w-4xl">
				<div className="bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative">
					{isLoading && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-800">
							<div className="text-center">
								<div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
								<p className="text-white text-sm">Loading video...</p>
							</div>
						</div>
					)}

					{hasError && (
						<div className="absolute inset-0 flex items-center justify-center bg-gray-800">
							<div className="text-center text-white">
								<svg
									className="w-16 h-16 mx-auto mb-4 text-red-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									/>
								</svg>
								<p className="text-lg font-medium">Failed to load video</p>
								<p className="text-sm text-gray-300 mt-2">
									Please try refreshing the page
								</p>
							</div>
						</div>
					)}

					<video
						ref={videoRef}
						controls
						className="w-full h-auto max-h-[70vh] object-contain"
						src={src}
						poster={poster ?? undefined}
						preload="metadata"
						onLoadStart={handleLoadStart}
						onCanPlay={handleCanPlay}
						onError={handleError}
						title={title}
					/>
				</div>
			</div>
		</div>
	);
}
