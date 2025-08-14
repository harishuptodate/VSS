// app/page.tsx
import { createServerClient } from '@/lib/supabaseServer';
import Link from 'next/link';

export default async function Home() {
	const supabase = await createServerClient();
	const {
		data: { user },
	} = await supabase.auth.getUser();

	return (
		<main className="space-y-4">
			{user ? (
				<div className="space-y-2">
					<p>Welcome back.</p>
					<Link href="/dashboard" className="text-blue-600 underline">
						Go to Dashboard
					</Link>
				</div>
			) : (
				<div className="space-y-4">
					<p>Please sign in to access your video storage dashboard.</p>
					<div className="space-x-4">
						<Link
							href="/auth"
							className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors">
							Sign In / Sign Up
						</Link>
					</div>
				</div>
			)}
		</main>
	);
}
