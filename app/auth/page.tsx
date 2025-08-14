'use client';

import { useState } from 'react';
import { supabaseClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AuthPage() {
	const [isSignUp, setIsSignUp] = useState(false);
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState('');
	const router = useRouter();

	const handleAuth = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);
		setMessage('');

		try {
			if (isSignUp) {
				const { error } = await supabaseClient().auth.signUp({
					email,
					password,
				});
				if (error) throw error;
				setMessage('Check your email for the confirmation link!');
			} else {
				const { error } = await supabaseClient().auth.signInWithPassword({
					email,
					password,
				});
				if (error) throw error;
				router.push('/dashboard');
				router.refresh();
			}
		} catch (error: unknown) {
			setMessage(error instanceof Error ? error.message : 'An unknown error occurred');
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
						{isSignUp ? 'Create your account' : 'Sign in to your account'}
					</h2>
				</div>
				<form className="mt-8 space-y-6" onSubmit={handleAuth}>
					<div className="rounded-md shadow-sm -space-y-px">
						<div>
							<label htmlFor="email" className="sr-only">
								Email address
							</label>
							<input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
							/>
						</div>
						<div>
							<label htmlFor="password" className="sr-only">
								Password
							</label>
							<input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
							/>
						</div>
					</div>

					{message && (
						<div
							className={`text-sm text-center ${
								message.includes('error') ? 'text-red-600' : 'text-green-600'
							}`}>
							{message}
						</div>
					)}

					<div>
						<button
							type="submit"
							disabled={loading}
							className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
							{loading ? 'Loading...' : isSignUp ? 'Sign up' : 'Sign in'}
						</button>
					</div>

					<div className="text-center">
						<button
							type="button"
							onClick={() => setIsSignUp(!isSignUp)}
							className="text-indigo-600 hover:text-indigo-500">
							{isSignUp
								? 'Already have an account? Sign in'
								: "Don't have an account? Sign up"}
						</button>
					</div>
				</form>

				<div className="text-center">
					<Link href="/" className="text-gray-600 hover:text-gray-500">
						← Back to home
					</Link>
				</div>
			</div>
		</div>
	);
}
