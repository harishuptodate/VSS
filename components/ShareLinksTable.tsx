// components/ShareLinksTable.tsx
'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';

type LinkRow = {
	id: string;
	token: string;
	visibility: 'PUBLIC' | 'PRIVATE';
	expiresAt: string | null;
	lastViewedAt: string | null;
	createdAt: string;
	video?: { id: string; title: string | null } | null;
	emails?: { email: string }[];
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function truncateLink(path: string, visible = 14) {
	if (path.length <= visible) return path;
	return `${path.slice(0, visible)}…`;
}

function truncateTitle(title: string, maxLength = 25) {
	if (title.length <= maxLength) return title;
	return `${title.slice(0, maxLength)}…`;
}

function truncateEmail(email: string, maxLength = 20) {
	if (email.length <= maxLength) return email;
	return `${email.slice(0, maxLength)}…`;
}

export default function ShareLinksTable() {
	const { data, error, mutate } = useSWR<LinkRow[]>('/api/links', fetcher, {
		revalidateOnFocus: true,
		refreshInterval: 5000, // Refresh every 5 seconds
	});

	const [copySuccess, setCopySuccess] = useState<string | null>(null);

	async function copyToClipboard(text: string, linkId: string) {
		try {
			await navigator.clipboard.writeText(text);
			setCopySuccess(linkId);
			setTimeout(() => setCopySuccess(null), 2000);
		} catch (e) {
			console.error('copy failed', e);
		}
	}

	if (error) {
		return (
			<div className="text-center py-8">
				<div className="w-16 h-16 bg-red-50 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<span className="text-red-600">!</span>
				</div>
				<p className="text-red-700 dark:text-red-300">Failed to load links.</p>
				<button
					onClick={() => mutate()}
					className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
					Retry
				</button>
			</div>
		);
	}

	if (!data) {
		return (
			<div className="text-center py-8">
				<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<div className="w-8 h-8 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
				</div>
				<p className="text-gray-500 dark:text-gray-400">
					Loading share links...
				</p>
			</div>
		);
	}

	if (data.length === 0) {
		return (
			<div className="text-center py-8">
				<div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
					<svg
						className="w-8 h-8 text-gray-400"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24">
						<path
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth={2}
							d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
						/>
					</svg>
				</div>
				<p className="text-gray-500 dark:text-gray-400">
					No share links created yet.
				</p>
			</div>
		);
	}

	const base = process.env.NEXT_PUBLIC_SITE_URL || '';

	return (
		<div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
			<div className="overflow-x-auto">
				<table className="w-full text-sm">
					<thead>
						<tr className="bg-gray-50 dark:bg-gray-800/50">
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Video Title
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Visibility
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Shared With
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Expiry
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Status
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Last Access
							</th>
							<th className="p-4 text-left font-semibold text-gray-900 dark:text-white">
								Link
							</th>
						</tr>
					</thead>
					<tbody className="divide-y divide-gray-200 dark:divide-gray-700">
						{data.map((l) => {
							const active = !l.expiresAt || new Date(l.expiresAt) > new Date();
							const fullUrl = `${base}/s/${l.token}`;
							const pretty = `/s/${l.token}`;
							const truncated = truncateLink(pretty);
							const videoTitle =
								l.video?.title || l.video?.id || 'Unknown Video';

							return (
								<tr
									key={l.id}
									className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
									{/* Video Title */}
									<td className="p-4">
										<div className="max-w-xs">
											<div
												className="font-medium text-gray-900 dark:text-gray-100"
												title={videoTitle}>
												{truncateTitle(videoTitle)}
											</div>
											{l.video?.id && (
												<div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
													ID: {l.video.id.slice(0, 8)}...
												</div>
											)}
										</div>
									</td>

									{/* Visibility */}
									<td className="p-4">
										<span
											className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
												l.visibility === 'PUBLIC'
													? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
													: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800'
											}`}>
											{l.visibility === 'PUBLIC' ? (
												<svg
													className="w-3 h-3 mr-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
													/>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
													/>
												</svg>
											) : (
												<svg
													className="w-3 h-3 mr-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
													/>
												</svg>
											)}
											{l.visibility}
										</span>
									</td>

									{/* Shared With (Emails) */}
									<td className="p-4">
										{l.visibility === 'PRIVATE' &&
										l.emails &&
										l.emails.length > 0 ? (
											<div className="space-y-1">
												{l.emails.slice(0, 2).map((email, index) => (
													<div
														key={index}
														className="text-xs text-gray-700 dark:text-gray-300 font-mono"
														title={email.email}>
														{truncateEmail(email.email)}
													</div>
												))}
												{l.emails.length > 2 && (
													<div className="text-xs text-gray-500 dark:text-gray-400">
														+{l.emails.length - 2} more
													</div>
												)}
											</div>
										) : (
											<span className="text-gray-400 dark:text-gray-500 text-xs">
												{l.visibility === 'PUBLIC' ? 'Everyone' : 'No emails'}
											</span>
										)}
									</td>

									{/* Expiry */}
									<td className="p-4 text-gray-700 dark:text-gray-300">
										{l.expiresAt
											? new Date(l.expiresAt).toLocaleString()
											: 'Forever'}
									</td>

									{/* Status */}
									<td className="p-4">
										<span
											className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
												active
													? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800'
													: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800'
											}`}>
											{active ? (
												<svg
													className="w-3 h-3 mr-1"
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
											) : (
												<svg
													className="w-3 h-3 mr-1"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24">
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth={2}
														d="M6 18L18 6M6 6l12 12"
													/>
												</svg>
											)}
											{active ? 'Active' : 'Expired'}
										</span>
									</td>

									{/* Last Access */}
									<td className="p-4 text-gray-700 dark:text-gray-300">
										{l.lastViewedAt
											? new Date(l.lastViewedAt).toLocaleString()
											: '-'}
									</td>

									{/* Link */}
									<td className="p-4">
										<div className="flex items-center gap-2">
											<a
												href={fullUrl}
												target="_blank"
												rel="noopener noreferrer"
												className="font-mono text-xs text-blue-700 dark:text-blue-400 hover:underline">
												{truncated}
											</a>
											<button
												onClick={() => copyToClipboard(fullUrl, l.id)}
												className={`px-2 py-1 text-xs border rounded transition-colors duration-200 ${
													copySuccess === l.id
														? 'bg-green-100 text-green-700 border-green-300'
														: 'hover:bg-gray-50 dark:hover:bg-gray-800'
												}`}
												aria-label="Copy link">
												{copySuccess === l.id ? 'Copied!' : 'Copy'}
											</button>
										</div>
									</td>
								</tr>
							);
						})}
					</tbody>
				</table>
			</div>
		</div>
	);
}
