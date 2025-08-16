type VideoStatsProps = {
	video: {
		status: string;
		sizeBytes: bigint;
		createdAt: Date;
	};
};

export default function VideoStats({ video }: VideoStatsProps) {
	return (
		<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 pt-2 sm:pt-4">
			<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
				<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
					Status
				</p>
				<p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
					{video.status}
				</p>
			</div>
			<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
				<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
					Size
				</p>
				<p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
					{(Number(video.sizeBytes) / (1024 * 1024)).toFixed(1)} MB
				</p>
			</div>
			<div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 sm:p-4 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
				<p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mb-1">
					Uploaded
				</p>
				<p className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">
					{new Date(video.createdAt).toLocaleDateString()}
				</p>
			</div>
		</div>
	);
}
