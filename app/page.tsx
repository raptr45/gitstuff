"use client";

import { UserPageClient } from "@/components/user-page-client";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Home() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [syncedUsername, setSyncedUsername] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    // If not logged in (and not loading), go to welcome
    if (!isPending && !session) {
      router.push("/welcome");
    }
  }, [isPending, session, router]);

  useEffect(() => {
    // Check if we need to sync username
    const checkAndSync = async () => {
      if (!session?.user) return;

      const user = session.user as {
        username?: string;
        name?: string;
        id: string;
      };

      // If we already have it in session, great.
      if (user.username) {
        setSyncedUsername(user.username);
        return;
      }

      // If not, try to sync from server
      setIsSyncing(true);
      try {
        const res = await fetch("/api/user/sync", { method: "POST" });
        const data = await res.json();
        if (data.success && data.username) {
          setSyncedUsername(data.username);
          // Optionally reload session? authClient.getSession() might need refresh
        }
      } catch (e) {
        console.error("Sync failed", e);
      } finally {
        setIsSyncing(false);
      }
    };

    if (session && !isPending) {
      checkAndSync();
    }
  }, [session, isPending]);

  if (isPending || (session && !syncedUsername && isSyncing)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute top-full mt-4 w-64 text-center text-sm text-muted-foreground font-medium animate-pulse">
              Syncing GitHub profile...
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  // Use synced username or fallback (though fallback is likely "name" which caused 404s,
  // so we really depend on syncedUsername being correct now).
  // If sync failed, we might still be stuck, but this covers 99% of cases.
  const finalUsername =
    syncedUsername ||
    (session.user as any).username ||
    (session.user as any).name;

  return <UserPageClient username={finalUsername} />;
}
