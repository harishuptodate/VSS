// components/VideoCard.tsx
import Link from 'next/link';

type Props = {
	id: string;
	title?: string | null;
	status: 'UPLOADING' | 'PROCESSING' | 'READY';
	thumbUrl?: string | null;
	createdAt: string | Date;
};

export default function VideoCard({
	id,
	title,
	status,
	thumbUrl,
	createdAt,
}: Props) {
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

	const config = statusConfig[status];

	return (
		<Link href={`/video/${id}`} className="group">
			<div className="card overflow-hidden hover:shadow-lg transition-all duration-200 group-hover:-translate-y-1">
				<div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center overflow-hidden">
					{thumbUrl ? (
						<img
							src={thumbUrl}
							alt=""
							className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
						/>
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
				</div>
				<div className="p-4">
					<div className="flex items-start justify-between mb-3">
						<h3 className="font-semibold text-gray-900 dark:text-white truncate pr-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
							{title || 'Untitled Video'}
						</h3>
						<span
							className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border} flex-shrink-0`}>
							{config.icon}
							<span>{status}</span>
						</span>
					</div>
					<div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
						<svg
							className="w-3 h-3 mr-1"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
								d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-6 6m6-6l6 6"
							/>
						</svg>
						{new Date(createdAt).toLocaleDateString()}
					</div>
				</div>
			</div>
		</Link>
	);
}
