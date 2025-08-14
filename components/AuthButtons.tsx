// components/AuthButtons.tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseClient } from "@/lib/supabaseClient";

export default function AuthButtons() {
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const supa = supabaseClient();
    supa.auth.getUser().then(({ data: { user } }) => setEmail(user?.email ?? null));
    const { data: sub } = supa.auth.onAuthStateChange((_e, s) => setEmail(s?.user?.email ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  async function signOut() {
    const supa = supabaseClient();
    await supa.auth.signOut();
    location.href = "/"; // send to redirect logic
  }

  return email ? (
    <div className="flex items-center gap-3 text-sm">
      <span className="text-gray-600">{email}</span>
      <button onClick={signOut} className="border rounded px-3 py-1">Sign out</button>
    </div>
  ) : (
    <Link href="/login?mode=signup" className="border rounded px-3 py-1 text-sm">
      Sign in
    </Link>
  );
}
