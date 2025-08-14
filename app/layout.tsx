// app/layout.tsx
import './globals.css';
import { ReactNode } from 'react';

export const metadata = { title: 'Video Storage' };

export default function RootLayout({ children }: { children: ReactNode }) {
	return (
		<html lang="en">
			<body className="min-h-screen bg-gray-50 dark:bg-gray-950">
				<div className="page-container">
					<header className="mb-8">
						<div className="card-elevated p-6">
							<div className="flex items-center justify-between">
								<div className="flex items-center space-x-3">
									<div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
										<svg
											className="w-6 h-6 text-white"
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
									<h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
										Video Storage
									</h1>
								</div>
							</div>
						</div>
					</header>
					{children}
				</div>
			</body>
		</html>
	);
}
