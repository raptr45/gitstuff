"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GitHubUserSummary } from "@/lib/types";
import {
  AlertCircle,
  ChevronDown,
  ExternalLink,
  Loader2,
  Search,
  UserCheck,
  Users,
} from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";

type ListType = "followers" | "following";

interface TargetFollowerPanelProps {
  /** Called when the user wants to follow the selected set of logins */
  onFollowSelected: (logins: string[]) => void;
  /** True while the parent is processing a bulk follow */
  isFollowing: boolean;
}

export function TargetFollowerPanel({
  onFollowSelected,
  isFollowing,
}: TargetFollowerPanelProps) {
  const [targetUsername, setTargetUsername] = useState("");
  const [listType, setListType] = useState<ListType>("followers");
  const [isFetching, setIsFetching] = useState(false);
  const [fetchedUsers, setFetchedUsers] = useState<GitHubUserSummary[]>([]);
  const [selectedLogins, setSelectedLogins] = useState<Set<string>>(new Set());
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const fetchPage = useCallback(
    async (username: string, type: ListType, page: number, append = false) => {
      setIsFetching(true);
      setError(null);

      try {
        const res = await fetch(
          `/api/actions/target-followers?username=${encodeURIComponent(username)}&type=${type}&page=${page}`
        );
        const data = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Failed to fetch users");
          return;
        }

        const users: GitHubUserSummary[] = data.data;
        setFetchedUsers((prev) => (append ? [...prev, ...users] : users));
        setHasMore(data.hasMore ?? false);
        setCurrentPage(page);

        if (data.rateRemaining !== null && data.rateRemaining < 20) {
          toast.warning(
            `GitHub rate limit low (${data.rateRemaining} remaining). Slow down!`
          );
        }
      } catch {
        setError("Network error — please try again.");
      } finally {
        setIsFetching(false);
      }
    },
    []
  );

  const handleSearch = useCallback(async () => {
    const trimmed = targetUsername.trim();
    if (!trimmed) return;
    setSearched(true);
    setFetchedUsers([]);
    setSelectedLogins(new Set());
    setCurrentPage(1);
    await fetchPage(trimmed, listType, 1, false);
  }, [targetUsername, listType, fetchPage]);

  const handleLoadMore = useCallback(async () => {
    const trimmed = targetUsername.trim();
    if (!trimmed) return;
    await fetchPage(trimmed, listType, currentPage + 1, true);
  }, [targetUsername, listType, currentPage, fetchPage]);

  const toggleUser = useCallback((login: string) => {
    setSelectedLogins((prev) => {
      const next = new Set(prev);
      if (next.has(login)) next.delete(login);
      else next.add(login);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedLogins(new Set(fetchedUsers.map((u) => u.login)));
  }, [fetchedUsers]);

  const clearAll = useCallback(() => {
    setSelectedLogins(new Set());
  }, []);

  const handleFollowSelected = useCallback(() => {
    if (selectedLogins.size === 0) return;
    onFollowSelected(Array.from(selectedLogins));
  }, [selectedLogins, onFollowSelected]);

  const allSelected =
    fetchedUsers.length > 0 &&
    fetchedUsers.every((u) => selectedLogins.has(u.login));

  return (
    <div className="space-y-6">
      {/* Search controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* List type toggle */}
        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg shrink-0">
          <Button
            variant={listType === "followers" ? "default" : "ghost"}
            size="sm"
            onClick={() => setListType("followers")}
            disabled={isFetching}
            className="h-8 px-4 text-xs font-black rounded-md gap-1.5"
          >
            <Users className="w-3.5 h-3.5" />
            Followers
          </Button>
          <Button
            variant={listType === "following" ? "default" : "ghost"}
            size="sm"
            onClick={() => setListType("following")}
            disabled={isFetching}
            className="h-8 px-4 text-xs font-black rounded-md gap-1.5"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Following
          </Button>
        </div>

        {/* Username input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter GitHub username (e.g. raptr45)"
            value={targetUsername}
            onChange={(e) => setTargetUsername(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="pl-9 bg-muted/20 border-border/50"
            disabled={isFetching}
          />
        </div>

        <Button
          onClick={handleSearch}
          disabled={!targetUsername.trim() || isFetching}
          className="shrink-0 gap-2 font-black"
        >
          {isFetching && !fetchedUsers.length ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          Fetch
        </Button>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      )}

      {/* Results */}
      {fetchedUsers.length > 0 && (
        <div className="space-y-3">
          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Checkbox
                id="target-select-all"
                checked={allSelected}
                onCheckedChange={(c) => (c ? selectAll() : clearAll())}
                className="h-4 w-4 rounded border-zinc-300 dark:border-zinc-600"
              />
              <label
                htmlFor="target-select-all"
                className="text-sm font-bold text-zinc-500 cursor-pointer select-none"
              >
                {allSelected
                  ? `Deselect all (${fetchedUsers.length})`
                  : `Select all (${fetchedUsers.length})`}
              </label>
            </div>
            {selectedLogins.size > 0 && (
              <Badge
                variant="secondary"
                className="bg-primary/10 text-primary border-none font-black text-xs px-3 py-1"
              >
                {selectedLogins.size} selected
              </Badge>
            )}
          </div>

          {/* User list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[420px] overflow-y-auto pr-1">
            {fetchedUsers.map((user) => {
              const isSelected = selectedLogins.has(user.login);
              return (
                <div
                  key={user.login}
                  onClick={() => toggleUser(user.login)}
                  className={`group flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
                    isSelected
                      ? "border-primary/40 bg-primary/5 dark:bg-primary/10 ring-1 ring-primary/20"
                      : "border-zinc-500/10 bg-white/60 dark:bg-zinc-900/60 hover:border-primary/20 hover:bg-white/80 dark:hover:bg-zinc-900/80"
                  }`}
                >
                  <Checkbox
                    checked={isSelected}
                    onCheckedChange={() => toggleUser(user.login)}
                    onClick={(e) => e.stopPropagation()}
                    className="h-4 w-4 shrink-0 rounded border-zinc-300 dark:border-zinc-600"
                  />
                  <Avatar className="w-9 h-9 ring-2 ring-white dark:ring-zinc-950 shadow-sm shrink-0">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback className="text-sm font-black bg-zinc-100 dark:bg-zinc-800 text-zinc-500">
                      {user.login[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-bold text-sm truncate flex-1">
                    @{user.login}
                  </span>
                  <a
                    href={user.html_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="shrink-0 opacity-0 group-hover:opacity-40 hover:!opacity-100 transition-opacity"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLoadMore}
                disabled={isFetching}
                className="rounded-full px-6 font-bold gap-2"
              >
                {isFetching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Load Next 100
              </Button>
            </div>
          )}

          {/* Follow action */}
          <div className="flex justify-end pt-2 border-t border-border/50">
            <Button
              onClick={handleFollowSelected}
              disabled={selectedLogins.size === 0 || isFollowing}
              className="gap-2 font-black px-8 shadow-lg shadow-primary/20"
            >
              {isFollowing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserCheck className="w-4 h-4" />
              )}
              {isFollowing
                ? "Following…"
                : `Follow Selected (${selectedLogins.size})`}
            </Button>
          </div>
        </div>
      )}

      {/* Empty state after search */}
      {searched && !isFetching && !error && fetchedUsers.length === 0 && (
        <div className="flex flex-col items-center justify-center p-10 rounded-[2rem] border border-dashed border-zinc-500/20 text-center">
          <Users className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-3" />
          <p className="font-bold text-zinc-500">No {listType} found</p>
          <p className="text-sm text-zinc-400">
            @{targetUsername} may have no {listType} or the account is private.
          </p>
        </div>
      )}
    </div>
  );
}
