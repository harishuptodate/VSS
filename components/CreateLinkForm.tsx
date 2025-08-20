'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createShareLink } from '@/app/actions/createShareLink';

type State = { ok: boolean; error?: string; message?: string };

function SubmitBtn() {
	const { pending } = useFormStatus();
	return (
		<button
			className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-all duration-200 text-sm h-12 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
			disabled={pending}
			aria-busy={pending}>
			{pending ? 'Creating…' : 'Create Share Link'}
		</button>
	);
}

export default function CreateLinkForm({ videoId }: { videoId: string }) {
	const [state, formAction] = useFormState<State, FormData>(createShareLink, {
		ok: true,
	});

	return (
		<form action={formAction} noValidate className="space-y-4">
			{(state.error || (state.ok && state.message)) && (
				<div
					role={state.error ? 'alert' : 'status'}
					className={[
						'rounded-lg border px-4 py-3 text-sm',
						state.error
							? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
							: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
					].join(' ')}>
					{state.error ?? state.message}
				</div>
			)}

			{/* Perfectly Aligned Form Row */}
			<div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
				{/* Visibility - Fixed Width */}
				<div className="lg:col-span-2">
					<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
						Visibility
					</label>
					<select
						name="visibility"
						defaultValue="PUBLIC"
						className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-no-repeat bg-right pr-10"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
						}}>
						<option value="PUBLIC">Public</option>
						<option value="PRIVATE">Private</option>
					</select>
				</div>

				{/* Expires - Fixed Width */}
				<div className="lg:col-span-2">
					<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
						Expires
					</label>
					<select
						name="preset"
						defaultValue="1h"
						className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 appearance-none bg-no-repeat bg-right pr-10"
						style={{
							backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
						}}>
						<option value="1h">1 hour</option>
						<option value="12h">12 hours</option>
						<option value="1d">1 day</option>
						<option value="30d">30 days</option>
						<option value="forever">Forever</option>
					</select>
				</div>

				{/* Emails - Flexible Width */}
				<div className="lg:col-span-6">
					<label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
						Private Emails
					</label>

					<p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
						Required if visibility is{' '}
						<span className="font-medium">Private</span>
					</p>

					<input
						name="emails"
						placeholder="email1@example.com, email2@example.com"
						className="w-full h-12 px-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
					/>
				</div>

				{/* Submit Button - Fixed Width */}
				<div className="lg:col-span-2">
					<SubmitBtn />
				</div>
			</div>

			<input type="hidden" name="videoId" value={videoId} />
		</form>
	);
}
