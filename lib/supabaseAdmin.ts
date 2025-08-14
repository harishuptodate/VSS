
// lib/supabaseAdmin.ts
import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

/**
 * Returns only those emails that belong to registered users.
 * Falls back to empty array if admin listing fails.
 */
export async function getRegisteredRecipients(emails: string[]): Promise<string[]> {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (error || !data?.users) return [];
    const set = new Set(
      data.users
        .map(u => (u.email ?? "").toLowerCase())
        .filter(Boolean)
    );
    return emails
      .map(e => e.toLowerCase())
      .filter(e => set.has(e));
  } catch {
    return [];
  }
}
