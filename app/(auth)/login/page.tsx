// app/(auth)/login/page.tsx
"use client";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const sp = useSearchParams();
  const defaultMode = (sp.get("mode") === "signup" ? "signup" : "signin") as "signin"|"signup";

  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [mode, setMode] = useState<"signin"|"signup">(defaultMode);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const supa = supabaseClient();
    const { error } = mode === "signin"
      ? await supa.auth.signInWithPassword({ email, password: pw })
      : await supa.auth.signUp({ email, password: pw });
    if (error) setErr(error.message);
    else router.push("/upload");
  }

  useEffect(() => setMode(defaultMode), [defaultMode]);

  return (
    <main className="min-h-[70vh] flex items-center justify-center">
      <div className="w-full max-w-sm border rounded-2xl p-6 shadow-sm bg-white">
        <h2 className="text-xl font-semibold mb-1">{mode === "signin" ? "Sign in" : "Create your account"}</h2>
        <p className="text-xs text-gray-600 mb-4">{mode === "signin" ? "Welcome back!" : "Upload and share your videos securely."}</p>
        <form onSubmit={onSubmit} className="space-y-3">
          <input className="border rounded-lg p-2 w-full" placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <input className="border rounded-lg p-2 w-full" placeholder="Password" type="password" value={pw} onChange={e=>setPw(e.target.value)} required />
          {err && <p className="text-red-600 text-sm">{err}</p>}
          <button className="bg-gray-900 text-white rounded-lg p-2 w-full">{mode === "signin" ? "Sign in" : "Sign up"}</button>
        </form>
        <button className="text-xs underline mt-3" onClick={() => setMode(m => m === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
        </button>
      </div>
    </main>
  );
}
