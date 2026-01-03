"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useStore } from "@/lib/store";
import { AppUser } from "@/lib/types";
import {
  AlertTriangle,
  Cloud,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface CloudSnapshot {
  updatedAt: string;
  followers: Record<string, number>;
  following: Record<string, number>;
}

export default function ManageData() {
  const { data: session } = authClient.useSession();
  const { syncToCloud, syncFromCloud, whitelists } = useStore();

  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeletingSnapshot, setIsDeletingSnapshot] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudSnapshot, setCloudSnapshot] = useState<CloudSnapshot | null>(
    null
  );
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(true);

  const fetchCloudSnapshot = async () => {
    setIsLoadingSnapshot(true);
    try {
      const res = await fetch("/api/sync");
      const data = await res.json();
      if (data.success && data.snapshot) {
        setCloudSnapshot(data.snapshot);
      } else {
        setCloudSnapshot(null);
      }
    } catch {
      toast.error("Failed to fetch cloud data info");
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  useEffect(() => {
    if (session) fetchCloudSnapshot();
  }, [session]);

  const handleDeleteAllData = async () => {
    if (
      !confirm(
        "Are you sure? This will delete ALL your tracking history, whitelists, and snapshots from our servers. This cannot be undone."
      )
    ) {
      return;
    }

    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/user/data", { method: "DELETE" });
      if (res.ok) {
        useStore.persist.clearStorage();
        setCloudSnapshot(null);
        toast.success("All data deleted successfully");
        setTimeout(() => (window.location.href = "/"), 1000);
      } else {
        toast.error("Failed to delete data");
      }
    } catch {
      toast.error("An error occurred");
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteSnapshot = async () => {
    if (
      !confirm(
        "Are you sure you want to delete your cloud snapshot? local data will stay intact."
      )
    )
      return;

    setIsDeletingSnapshot(true);
    // We don't have a specific DELETE snapshot endpoint yet, but our general DELETE deletes all.
    // Let's assume we want granular?
    // For now, let's stick to the /api/sync endpoint... wait, /api/sync is GET/POST.
    // I should probably add DELETE to /api/sync if I want granular control.
    // For this iteration, I'll assume I update /api/sync to handle DELETE or use a query param?
    // Actually, let's keep it simple: If they delete snapshot, we can just POST empty? No that's hacky.
    // I'll add DELETE to /api/sync in a follow up step or assume it exists.
    // Wait, I didn't add DELETE to /api/sync yet. I added to /api/user/data.

    // Let's implement DELETE in /api/sync logic right after this.
    try {
      const res = await fetch("/api/sync", { method: "DELETE" });
      if (res.ok) {
        setCloudSnapshot(null);
        toast.success("Snapshot deleted from cloud");
      } else {
        toast.error("Failed to delete snapshot");
      }
    } catch {
      toast.error("Error deleting snapshot");
    } finally {
      setIsDeletingSnapshot(false);
    }
  };

  const handleSyncNow = async () => {
    if (!session?.user?.id) return;
    setIsSyncing(true);
    // Push local to cloud
    const user = session.user as AppUser;
    const success = await syncToCloud(user.username || "");
    setIsSyncing(false);
    if (success) {
      toast.success("Synced successfully");
      fetchCloudSnapshot();
    } else {
      toast.error("Sync failed");
    }
  };

  const handleRestore = async () => {
    if (!session?.user?.id) return;
    if (
      !confirm(
        "This will overwrite your local data with the cloud backup. Continue?"
      )
    )
      return;

    setIsSyncing(true);
    const user = session.user as AppUser;
    const success = await syncFromCloud(user.username || "");
    setIsSyncing(false);

    if (success) {
      toast.success("Restored from cloud successfully");
      // Force reload to reflect restored data?
      // window.location.reload();
      // Actually state update should trigger re-renders, but for lists usually safer to reload or re-fetch.
      // But syncFromCloud updates the store, so stats on this page (if any) need updates.
      // This page only shows "local count".
    } else {
      toast.error("Restore failed");
    }
  };

  if (!session) return null;

  const user = session.user as AppUser;
  const username = user.username || "user";
  const localWhitelistCount = (whitelists[username] || []).length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Manage Data</h1>
          <p className="text-muted-foreground text-lg max-w-2xl">
            You have full control over your data. Manage your cloud snapshots,
            view what&apos;s stored, or wipe everything clean.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Cloud Snapshot Card */}
          <Card className="border-blue-500/20 bg-blue-50/10 dark:bg-blue-900/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-32 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none -mt-20 -mr-20"></div>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-500/10 rounded-xl">
                  <Cloud className="w-5 h-5 text-blue-500" />
                </div>
                <CardTitle>Cloud Snapshot</CardTitle>
              </div>
              <CardDescription>
                Your encrypted backup for cross-device synchronization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 relative z-10">
              {isLoadingSnapshot ? (
                <div className="flex items-center gap-2 text-muted-foreground animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" /> Checking
                  cloud...
                </div>
              ) : cloudSnapshot ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Status
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span className="font-medium">Active Backup Found</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 p-4 bg-background/50 rounded-xl border border-blue-500/10">
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        Last Synced
                      </span>
                      <p className="font-mono text-sm mt-1">
                        {new Date(cloudSnapshot.updatedAt).toLocaleDateString()}{" "}
                        <span className="text-muted-foreground text-xs">
                          {new Date(
                            cloudSnapshot.updatedAt
                          ).toLocaleTimeString()}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-muted-foreground uppercase">
                        Size
                      </span>
                      <p className="font-mono text-sm mt-1">
                        {Object.keys(cloudSnapshot.followers).length} Records
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="gap-2 flex-1 font-bold"
                    >
                      <CloudUpload className="w-4 h-4" />
                      {isSyncing ? "Syncing..." : "Update Backup"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRestore}
                      disabled={isSyncing}
                      className="gap-2 font-bold"
                    >
                      <CloudDownload className="w-4 h-4" />
                      Restore
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleDeleteSnapshot}
                      disabled={isDeletingSnapshot}
                      className="gap-2 text-red-500 hover:text-red-600 border-red-200 dark:border-red-900/30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <p className="text-muted-foreground text-sm">
                    No cloud backup found.
                  </p>
                  <Button
                    onClick={handleSyncNow}
                    disabled={isSyncing}
                    className="gap-2 w-full font-bold"
                  >
                    <CloudUpload className="w-4 h-4" />
                    {isSyncing ? "Creating..." : "Create Cloud Backup"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Local Data Summary */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-xl">
                  <Smartphone className="w-5 h-5" />
                </div>
                <CardTitle>On This Device</CardTitle>
              </div>
              <CardDescription>
                Data currently stored in your browser&apos;s local storage.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Whitelisted Users</span>
                  <Badge variant="secondary">{localWhitelistCount}</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <span className="text-sm font-medium">Stored History</span>
                  <Badge
                    variant="outline"
                    className="text-green-600 bg-green-500/10 border-none"
                  >
                    Active
                  </Badge>
                </div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm text-amber-600 dark:text-amber-500">
                <p className="flex gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>
                    Clearing your browser cache will remove this local data
                    unless you have backed it up to the cloud.
                  </span>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-500">
                Danger Zone
              </CardTitle>
            </div>
            <CardDescription className="text-red-600/80 dark:text-red-400/80">
              Irreversible actions related to your account data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row items-center justify-between p-6 bg-background/50 rounded-xl border border-red-200/50 dark:border-red-900/20 gap-4">
              <div className="space-y-1 text-center md:text-left">
                <h3 className="font-bold text-lg">Delete All Data</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently remove all snapshots, whitelists, and local
                  history.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteAllData}
                disabled={isDeletingAll}
                className="gap-2 w-full md:w-auto font-bold shadow-lg shadow-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
                {isDeletingAll ? "Deleting..." : "Delete Everything"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
