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
			className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors text-sm">
			Sign Out
		</button>
	);
}
