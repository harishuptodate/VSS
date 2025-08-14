'use client';

import { supabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function SignOutButton() {
	const router = useRouter();

	const handleSignOut = async () => {
		await supabaseClient().auth.signOut();
		router.push('/');
		router.refresh();
	};

	return (
		<button
			onClick={handleSignOut}
			className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-xl hover:shadow-lg transition-all duration-200 text-sm font-medium flex items-center space-x-2 hover:-translate-y-0.5 transform">
			<svg
				className="w-4 h-4"
				fill="none"
				stroke="currentColor"
				viewBox="0 0 24 24">
				<path
					strokeLinecap="round"
					strokeLinejoin="round"
					strokeWidth={2}
					d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
				/>
			</svg>
			<span>Sign Out</span>
		</button>
	);
}
