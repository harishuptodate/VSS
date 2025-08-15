// components/CreateLinkForm.tsx
'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { createShareLink } from '@/app/actions/createShareLink';

type State = { ok: boolean; error?: string; message?: string };

function SubmitBtn() {
  const { pending } = useFormStatus();
  return (
    <button className="btn-primary" disabled={pending} aria-busy={pending}>
      {pending ? 'Creating…' : 'Create Share Link'}
    </button>
  );
}

export default function CreateLinkForm({ videoId }: { videoId: string }) {
  const [state, formAction] = useFormState<State, FormData>(createShareLink, { ok: true });

  return (
    <form action={formAction} className="space-y-4 max-w-lg" noValidate>
      {state.error && (
        <div role="alert" className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 px-3 py-2 text-sm">
          {state.error}
        </div>
      )}
      {state.ok && state.message && (
        <div role="status" className="rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 px-3 py-2 text-sm">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Visibility</label>
          <select name="visibility" className="input-field" defaultValue="PUBLIC">
            <option value="PUBLIC">Public</option>
            <option value="PRIVATE">Private</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Expires</label>
          <select name="preset" className="input-field" defaultValue="1h">
            <option value="1h">1 hour</option>
            <option value="12h">12 hours</option>
            <option value="1d">1 day</option>
            <option value="30d">30 days</option>
            <option value="forever">Forever</option>
          </select>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Private Emails (comma-separated)</label>
        <input
          name="emails"
          placeholder="email1@example.com, email2@example.com"
          className="input-field"
        />
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Required if visibility is <span className="font-medium">Private</span>.
        </p>
      </div>

      {/* ensure videoId is included */}
      <input type="hidden" name="videoId" value={videoId} />

      <SubmitBtn />
    </form>
  );
}
