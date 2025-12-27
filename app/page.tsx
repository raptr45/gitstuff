"use client";

import { FollowerDisplay } from "@/components/follower-display";
import { FollowerTrackerForm } from "@/components/follower-tracker-form";
import { APIResponse, FollowerData } from "@/lib/types";
import { Github } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const [followerData, setFollowerData] = useState<FollowerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (username: string) => {
    setIsLoading(true);
    setError(null);
    setFollowerData(null);

    try {
      const response = await fetch(`/api/followers/${username}`);
      const data: APIResponse = await response.json();

      if (data.success) {
        setFollowerData(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-gradient-to-b from-background to-muted/20">
      <main className="flex flex-col items-center gap-8 max-w-2xl w-full">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Github className="w-12 h-12" />
            <h1 className="text-4xl font-bold">GitHub Follower Tracker</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Track GitHub follower counts with intelligent caching
          </p>
        </div>

        <FollowerTrackerForm onSubmit={handleSubmit} isLoading={isLoading} />

        <FollowerDisplay
          data={followerData}
          error={error}
          isLoading={isLoading}
          isClickable={true}
        />
      </main>

      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>Built with Next.js, TypeScript, and shadcn/ui</p>
      </footer>
    </div>
  );
}
