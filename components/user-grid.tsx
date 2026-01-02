"use client";

import { useCallback, useState } from "react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { GitHubUserSummary } from "@/lib/types";
import {
  ExternalLink,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  UserX,
} from "lucide-react";

interface UserGridProps {
  users: GitHubUserSummary[];
  onToggleWhitelist: (login: string) => void | Promise<void>;
  onUnfollow?: (login: string) => void | Promise<void>;
  whitelist: string[];
  showFollowBackStatus?: GitHubUserSummary[];
  isLoading?: boolean;
  variant?: "default" | "danger";
  unfollowingLogins?: string[];
}

export function UserGrid({
  users,
  onToggleWhitelist,
  onUnfollow,
  whitelist,
  showFollowBackStatus,
  isLoading,
  variant = "default",
  unfollowingLogins = [],
}: UserGridProps) {
  const [visibleCount, setVisibleCount] = useState(20);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + 20);
  }, []);

  const visibleUsers = users.slice(0, visibleCount);
  const hasMore = visibleUsers.length < users.length;

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={`skeleton-${i}`}
            className="h-24 rounded-3xl bg-white/5 dark:bg-zinc-900/5 animate-pulse border border-white/5"
          />
        ))}
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2.5rem] bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl border border-dashed border-zinc-500/20">
        <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-4">
          <span className="text-2xl">🐱</span>
        </div>
        <p className="text-lg font-bold text-zinc-600 dark:text-zinc-300">
          No users found
        </p>
        <p className="text-sm text-zinc-400">
          Depending on your filter, this list might be empty.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {visibleUsers.map((user) => {
          const isWl = whitelist.includes(user.login);
          const followsBack = showFollowBackStatus?.some(
            (f) => f.login === user.login
          );
          const hasFollowBackStatus = !!showFollowBackStatus;
          const isUnfollowing = unfollowingLogins.includes(user.login);

          return (
            <div
              key={user.login}
              className={`group relative flex items-center justify-between p-4 rounded-3xl backdrop-blur-xl border transition-all duration-300 ${
                variant === "danger"
                  ? "bg-red-500/5 dark:bg-red-950/20 border-red-500/10 hover:border-red-500/30 hover:bg-red-500/10 dark:hover:bg-red-900/40 hover:shadow-lg hover:shadow-red-500/10"
                  : "bg-white/60 dark:bg-zinc-900/60 border-zinc-500/10 hover:border-primary/20 hover:bg-white/80 dark:hover:bg-zinc-900/80 hover:shadow-lg"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="w-16 h-16 ring-4 ring-white dark:ring-zinc-950 shadow-xl transition-transform duration-300 group-hover:scale-105">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-xl font-black bg-linear-to-br from-zinc-100 to-zinc-200 text-zinc-500">
                      {user.login[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  {isWl && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-900 shadow-sm z-10">
                      <ShieldCheck className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-black text-lg tracking-tight hover:text-primary transition-colors flex items-center gap-1.5"
                  >
                    @{user.login}
                    <ExternalLink className="w-3 h-3 opacity-0 -ml-2 group-hover:opacity-50 group-hover:ml-0 transition-all duration-300" />
                  </a>

                  <div className="flex flex-wrap gap-1.5">
                    {isWl && (
                      <Badge
                        variant="secondary"
                        className="h-5 px-2 bg-blue-500/10 text-blue-600 border-none font-bold text-[9px] uppercase tracking-widest"
                      >
                        Shielded
                      </Badge>
                    )}
                    {hasFollowBackStatus && (
                      <Badge
                        variant="secondary"
                        className={`h-5 px-2 border-none font-bold text-[9px] uppercase tracking-widest ${
                          followsBack
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-amber-500/10 text-amber-600"
                        }`}
                      >
                        {followsBack ? "Mutually Gaining" : "Non-Reciprocal"}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pl-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onToggleWhitelist(user.login)}
                        className={`h-11 w-11 rounded-2xl transition-all duration-300 ${
                          isWl
                            ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20 hover:bg-blue-600"
                            : variant === "danger"
                            ? "bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-500"
                            : "bg-zinc-500/5 text-zinc-400 hover:bg-zinc-500/10 hover:text-zinc-600 dark:hover:text-zinc-300"
                        }`}
                      >
                        {isWl ? (
                          <ShieldCheck className="w-5 h-5" />
                        ) : (
                          <ShieldAlert className="w-5 h-5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-bold">
                        {isWl
                          ? "Protected Connection"
                          : "Shield this Connection"}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                {onUnfollow && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => !isWl && onUnfollow(user.login)}
                          disabled={isWl || isUnfollowing}
                          className={`h-11 w-11 rounded-2xl transition-all duration-300 ${
                            isWl
                              ? "opacity-50 cursor-not-allowed bg-zinc-500/5 text-zinc-400"
                              : "bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                          } ${isUnfollowing ? "animate-pulse opacity-70" : ""}`}
                        >
                          {isUnfollowing ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <UserX className="w-5 h-5" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="font-bold">
                          {isWl
                            ? "Protected User (Remove Shield First)"
                            : "Unfollow User"}
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-4 pb-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            className="rounded-full px-8 h-12 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-zinc-200 dark:border-zinc-800 hover:bg-white/80 dark:hover:bg-zinc-800 transition-all font-bold text-zinc-600 dark:text-zinc-300"
          >
            Load More Identities ({users.length - visibleCount} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}
