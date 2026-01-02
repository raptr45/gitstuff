"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { authClient } from "@/lib/auth-client";
import { useStore } from "@/lib/store"; // Import store
import { AlertTriangle, Database, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function ManageData() {
  const { data: session } = authClient.useSession();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteData = async () => {
    if (
      !confirm(
        "Are you sure? This will delete all your tracking history and whitelists. This status cannot be undone."
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch("/api/user/data", { method: "DELETE" });
      if (res.ok) {
        // Clear client-side state
        useStore.persist.clearStorage();
        // Force reload to reset state in memory immediately
        window.location.href = "/";
        toast.success("Data deleted successfully");
      } else {
        toast.error("Failed to delete data");
        setIsDeleting(false);
      }
    } catch {
      toast.error("An error occurred");
      setIsDeleting(false);
    }
  };

  if (!session) return null;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 pt-24">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl font-black tracking-tight">Manage Data</h1>
          <p className="text-muted-foreground text-lg">
            View and manage the data associated with your account.
          </p>
        </div>

        <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-500" />
              </div>
              <CardTitle className="text-xl">Danger Zone</CardTitle>
            </div>
            <CardDescription>
              Actions here can cause permanent data loss.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-background/50 rounded-xl border">
              <div className="space-y-1">
                <h3 className="font-bold">Delete Tracking History</h3>
                <p className="text-sm text-muted-foreground">
                  Remove all saved follower snapshots and whitelists.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDeleteData}
                disabled={isDeleting}
                className="gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {isDeleting ? "Deleting..." : "Delete Data"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder for Data Summary if we want to fetch it */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="w-5 h-5 text-primary" />
              <CardTitle>Data Overview</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your account stores snapshots of your follower lists to detect
              changes, and a list of whitelisted users you&apos;ve chosen to
              protect.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
