'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type DeleteVideoButtonProps = {
	videoId: string;
	videoTitle: string;
};

export default function DeleteVideoButton({
	videoId,
	videoTitle,
}: DeleteVideoButtonProps) {
	const router = useRouter();
	const [isDeleting, setIsDeleting] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);

	const handleDelete = async () => {
		setIsDeleting(true);
		try {
			const response = await fetch(`/api/videos/${videoId}`, {
				method: 'DELETE',
			});

			if (response.ok) {
				router.refresh();
			} else {
				const error = await response.json();
				alert(error.message || 'Failed to delete video');
			}
		} catch (error) {
			console.error('Delete failed:', error);
			alert('Failed to delete video');
		} finally {
			setIsDeleting(false);
			setShowConfirm(false);
		}
	};

	return (
		<>
			<button
				onClick={(e) => {
					e.preventDefault();
					e.stopPropagation();
					setShowConfirm(true);
				}}
				onMouseDown={(e) => {
					e.preventDefault();
					e.stopPropagation();
				}}
				className="absolute top-2 right-2 p-1.5 bg-slate-700 hover:bg-red-600 text-white rounded-full transition-colors duration-200 z-20"
				title="Delete video">
				<svg
					className="w-4 h-4"
					fill="none"
					stroke="currentColor"
					viewBox="0 0 24 24">
					<path
						strokeLinecap="round"
						strokeLinejoin="round"
						strokeWidth={2}
						d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
					/>
				</svg>
			</button>

			{/* Confirmation Modal */}
			{showConfirm && (
				<div
					className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
					onClick={(e) => {
						e.preventDefault();
						e.stopPropagation();
						setShowConfirm(false);
					}}>
					<div
						className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
						}}>
						<h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
							Delete Video?
						</h3>
						<p className="text-gray-500 dark:text-gray-400 mb-6">
							&quot;{videoTitle}&quot; will be permanently deleted. This action
							cannot be undone.
						</p>
						<div className="flex space-x-3">
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									setShowConfirm(false);
								}}
								className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200">
								Cancel
							</button>
							<button
								onClick={(e) => {
									e.preventDefault();
									e.stopPropagation();
									handleDelete();
								}}
								disabled={isDeleting}
								className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
								{isDeleting ? 'Deleting...' : 'Delete'}
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
}
