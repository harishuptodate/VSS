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
				// setMessage('Check your email for the confirmation link!');
				setMessage('Sign up successful! Please Sign in to continue');

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
			setMessage(
				error instanceof Error ? error.message : 'An unknown error occurred',
			);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
			<div className="max-w-md w-full">
				<div className="card-elevated p-8">
					<div className="text-center mb-8">
						<div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
							<svg
								className="w-8 h-8 text-white"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24">
								<path
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
									d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
								/>
							</svg>
						</div>
						<h2 className="text-3xl font-bold text-gray-900 dark:text-white">
							{isSignUp ? 'Create your account' : 'Sign in to your account'}
						</h2>
						<p className="text-gray-600 dark:text-gray-300 mt-2">
							{isSignUp
								? 'Get started with your video storage journey'
								: 'Welcome back to your dashboard'}
						</p>
					</div>

					<form className="space-y-6" onSubmit={handleAuth}>
						<div className="space-y-4">
							<div>
								<label
									htmlFor="email"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Email address
								</label>
								<input
									id="email"
									name="email"
									type="email"
									autoComplete="email"
									required
									className="input-field"
									placeholder="Enter your email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
								/>
							</div>
							<div>
								<label
									htmlFor="password"
									className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
									Password
								</label>
								<input
									id="password"
									name="password"
									type="password"
									autoComplete="current-password"
									required
									className="input-field"
									placeholder="Enter your password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
								/>
							</div>
						</div>

						{message && (
							<div
								className={`text-sm text-center p-3 rounded-xl ${
									message.includes('error')
										? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
										: 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
								}`}>
								{message}
							</div>
						)}

						<div>
							<button
								type="submit"
								disabled={loading}
								className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed">
								{loading ? (
									<div className="flex items-center justify-center space-x-2">
										<div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
										<span>Loading...</span>
									</div>
								) : isSignUp ? (
									'Create Account'
								) : (
									'Sign In'
								)}
							</button>
						</div>

						<div className="text-center">
							<button
								type="button"
								onClick={() => setIsSignUp(!isSignUp)}
								className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 font-medium transition-colors">
								{isSignUp
									? 'Already have an account? Sign in'
									: "Don't have an account? Sign up"}
							</button>
						</div>
					</form>

					<div className="text-center mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
						<Link
							href="/"
							className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
							← Back to home
						</Link>
					</div>
				</div>
			</div>
		</div>
	);
}
