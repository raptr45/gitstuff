"use client";

import { FollowerDisplay } from "@/components/follower-display";
import { Button } from "@/components/ui/button";
import { APIResponse, FollowerData } from "@/lib/types";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

interface UserPageClientProps {
  username: string;
}

export function UserPageClient({ username }: UserPageClientProps) {
  const [data, setData] = useState<FollowerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchUser = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);

      setError(null);

      try {
        const response = await fetch(
          `/api/followers/${username}${refresh ? "?refresh=true" : ""}`
        );
        const result: APIResponse = await response.json();

        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error);
        }
      } catch {
        setError("Failed to fetch user data. Please try again.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [username]
  );

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  return (
    <div className="min-h-screen flex flex-col items-center p-8 bg-gradient-to-b from-background to-muted/20">
      <main className="flex flex-col items-center gap-8 max-w-2xl w-full">
        <div className="w-full flex justify-between items-center">
          <Button variant="ghost" asChild className="gap-2">
            <Link href="/">
              <ArrowLeft className="w-4 h-4" />
              Back to Search
            </Link>
          </Button>

          <div className="flex gap-2">
            {data && (
              <Button variant="outline" asChild className="gap-2">
                <a
                  href={`https://github.com/${data.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="w-4 h-4" />
                  GitHub Profile
                </a>
              </Button>
            )}
            <Button
              onClick={() => fetchUser(true)}
              disabled={isLoading || isRefreshing}
              className="gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>
        </div>

        <div className="text-center space-y-2 mt-4">
          <h1 className="text-4xl font-bold tracking-tight">User Details</h1>
          <p className="text-muted-foreground">
            Detailed follower statistics for @{username}
          </p>
        </div>

        <FollowerDisplay data={data} error={error} isLoading={isLoading} />

        {data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-md mt-4">
            <div className="p-4 rounded-lg bg-card border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Username
              </p>
              <p className="text-lg font-semibold">{data.username}</p>
            </div>
            <div className="p-4 rounded-lg bg-card border shadow-sm">
              <p className="text-sm font-medium text-muted-foreground">
                Display Name
              </p>
              <p className="text-lg font-semibold">
                {data.name || "Not available"}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">
                Last Updated
              </p>
              <p className="text-sm font-semibold">
                {new Date(data.fetchedAt).toLocaleString()}
              </p>
            </div>
            <div className="p-4 rounded-lg bg-card border shadow-sm flex flex-col justify-center">
              <p className="text-sm font-medium text-muted-foreground">
                Source
              </p>
              <p className="text-sm font-semibold">
                {data.cached ? "Cache (5m TTL)" : "GitHub API (Fresh)"}
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
