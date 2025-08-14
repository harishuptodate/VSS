"use client";
import { useEffect } from "react";
import { supabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function DashboardRealtimeRefresher({ userId }: { userId: string }) {
  const router = useRouter();
  useEffect(() => {
    const supa = supabaseClient();
    const ch = supa.channel(`videos-user-${userId}`)
      .on("postgres_changes",
        { event: "*", schema: "public", table: "Video", filter: `userId=eq.${userId}` },
        () => router.refresh() // re-renders the server component list
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "Thumbnail" },
        () => router.refresh()
      )
      .subscribe();
    return () => { supa.removeChannel(ch); };
  }, [userId, router]);

  return null;
}
