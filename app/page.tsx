// app/page.tsx
import { createServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';

export default async function Home() {
	const supabase = await createServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<main className="space-y-8">
			{user ? (
				<div className="card-elevated p-8 text-center">
					<div className="space-y-4">
						<div className="w-16 h-16 bg-gradient-to-br from-green-400 to-blue-500 rounded-2xl flex items-center justify-center mx-auto">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
								/>
							</svg>
						</div>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white">
							Welcome back!
						</h2>
						<p className="text-gray-600 dark:text-gray-300">
							You&apos;re all set to manage your videos.
						</p>
						<Link href="/dashboard" className="btn-primary inline-block">
							Go to Dashboard
						</Link>
					</div>
				</div>
			) : (
				<div className="space-y-8">
					<div className="card-elevated p-8 text-center">
						<div className="space-y-4">
							<div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto">
								<svg
									className="w-10 h-10 text-white"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 0h10m-10 0a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V6a2 2 0 00-2-2"
									/>
								</svg>
							</div>
							<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
								Video Storage Dashboard
							</h2>
							<p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
								Please sign in to access your video storage dashboard and start
								managing your content.
							</p>
							<Link href="/auth" className="btn-primary inline-block">
								Sign In / Sign Up
							</Link>
						</div>
					</div>
				</div>
			)}
		</main>
	);
}
