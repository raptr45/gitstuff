"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserGrid } from "@/components/user-grid";
import { authClient } from "@/lib/auth-client";
import { useStore, type GitHubUserWithTimestamp } from "@/lib/store";
import { getTierLimit } from "@/lib/tier-limits";
import {
  APIResponse,
  AppUser,
  GitHubUserSummary,
  UserStats,
} from "@/lib/types";
import {
  ArrowUpDown,
  BookMarked,
  Brush,
  CloudUpload,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UserPageClientProps {
  username: string;
}

export function UserPageClient({ username }: UserPageClientProps) {
  const {
    whitelists,
    toggleWhitelist,
    trackFollowers,
    trackFollowing,
    isWhitelisted,
    updateUserWhitelist,
    plan,
    setPlan,
    syncToCloud,
    syncFromCloud,
  } = useStore();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [followers, setFollowers] = useState<GitHubUserWithTimestamp[]>([]);
  const [following, setFollowing] = useState<GitHubUserWithTimestamp[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSweepMode, setIsSweepMode] = useState(false);
  const [selectedSweepUsers, setSelectedSweepUsers] = useState<string[]>([]);
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number>(-1);
  const [isSweeping, setIsSweeping] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    followers: true,
    following: true,
    whitelist: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortDescending, setSortDescending] = useState(true);

  const [pendingUnfollows, setPendingUnfollows] = useState<string[]>([]);

  const fetchStats = useCallback(
    async (refresh = false) => {
      try {
        const statsRes = await fetch(
          `/api/stats/${username}${refresh ? "?refresh=true" : ""}`
        );
        const statsData: APIResponse<UserStats> = await statsRes.json();
        if (statsData.success) setStats(statsData.data);
      } catch (err) {
        console.error("Failed to fetch stats", err);
      } finally {
        setLoadingStates((prev) => ({ ...prev, stats: false }));
      }
    },
    [username]
  );

  const fetchFollowersList = useCallback(
    async (force: boolean = false) => {
      try {
        const res = await fetch(
          `/api/users/${username}/list?type=followers${
            force ? "&refresh=true" : ""
          }`
        );
        const data: APIResponse<GitHubUserSummary[]> = await res.json();

        if (data.success) {
          const timestampedData = trackFollowers(username, data.data);
          setFollowers(timestampedData);
        }
      } catch (err) {
        console.error("Failed to fetch followers list", err);
      } finally {
        setLoadingStates((prev) => ({ ...prev, followers: false }));
      }
    },
    [username, trackFollowers]
  );

  const fetchFollowingList = useCallback(
    async (force: boolean = false) => {
      try {
        const res = await fetch(
          `/api/users/${username}/list?type=following${
            force ? "&refresh=true" : ""
          }`
        );
        const data: APIResponse<GitHubUserSummary[]> = await res.json();

        if (data.success) {
          const timestampedData = trackFollowing(username, data.data);
          setFollowing(timestampedData);
        }
      } catch (err) {
        console.error("Failed to fetch following list", err);
      } finally {
        setLoadingStates((prev) => ({ ...prev, following: false }));
      }
    },
    [username, trackFollowing]
  );

  const fetchLists = useCallback(
    async (force: boolean = false) => {
      await Promise.all([fetchFollowersList(force), fetchFollowingList(force)]);
    },
    [fetchFollowersList, fetchFollowingList]
  );

  const fetchWhitelist = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/actions/whitelist?targetUsername=${username}`
      );
      const data = await res.json();
      if (data.success) {
        // Transform user-specific whitelist to the store's expected format
        const logins = data.data.map(
          (w: { whiteListed: string }) => w.whiteListed
        );
        updateUserWhitelist(username, logins);
      }
    } catch (err) {
      console.error("Failed to fetch whitelist", err);
    } finally {
      setLoadingStates((prev) => ({ ...prev, whitelist: false }));
    }
  }, [username, updateUserWhitelist]);

  const fetchAllData = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      setError(null);

      await Promise.all([
        fetchStats(refresh),
        fetchLists(refresh),
        fetchWhitelist(),
      ]);

      if (refresh) {
        setIsRefreshing(false);
        toast.success("Data refreshed successfully");
      }
    },
    [fetchStats, fetchLists, fetchWhitelist]
  );

  const handleSync = async () => {
    setIsSyncing(true);
    // Simple logic: Try to pull. If empty/fails, push.
    // Ideally we ask user, but for now let's "Sync" = Merge from cloud, then Push latest.
    try {
      const pullSuccess = await syncFromCloud(username);
      if (pullSuccess) toast.success("Synced from cloud");

      const pushSuccess = await syncToCloud(username);
      if (pushSuccess) {
        if (!pullSuccess) toast.success("Synced to cloud");
      } else {
        toast.error("Failed to sync to cloud");
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const { data: session } = authClient.useSession();

  useEffect(() => {
    if (session?.user) {
      setPlan((session.user as AppUser).plan || "FREE");
    }
  }, [session, setPlan]);

  const handleUnfollow = useCallback(async (targetLogin: string) => {
    setPendingUnfollows((prev) => [...prev, targetLogin]);
    try {
      const res = await fetch("/api/actions/unfollow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUsername: targetLogin }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(`Succesfully unfollowed @${targetLogin}`);
        // Manually remove from local state to immediately update UI.
        // We do NOT re-fetch from providing API here because GitHub API has a delay (cache)
        // which would return the old list and cause the user to "reappear" (ghost bug).
        setFollowing((prev) => prev.filter((u) => u.login !== targetLogin));
      } else {
        toast.error(data.error || "Failed to unfollow");
      }
    } catch {
      toast.error("An error occurred while trying to unfollow");
    } finally {
      setPendingUnfollows((prev) =>
        prev.filter((login) => login !== targetLogin)
      );
    }
  }, []);

  const handleToggleWhitelist = useCallback(
    async (login: string) => {
      try {
        const res = await fetch("/api/actions/whitelist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetUsername: username,
            login,
            action: "toggle",
          }),
        });
        const data = await res.json();
        if (data.success) {
          toggleWhitelist(username, login);
        } else {
          toast.error(data.error || "Failed to update protection");
        }
      } catch {
        toast.error("Failed to update protection");
      }
    },
    [username, toggleWhitelist]
  );

  const handleSweep = async () => {
    if (selectedSweepUsers.length === 0) return;
    setIsSweeping(true);
    try {
      const res = await fetch("/api/actions/sweep", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targets: selectedSweepUsers }),
      });
      const data = await res.json();

      if (!data.success) {
        toast.error(data.error || "Sweep failed");
      } else {
        toast.success(`Succesfully swept ${data.data.successful} users.`);
        // Remove from local state
        setFollowers((prev) =>
          prev.filter((u) => !selectedSweepUsers.includes(u.login))
        );
        setFollowing((prev) =>
          prev.filter((u) => !selectedSweepUsers.includes(u.login))
        );
        setSelectedSweepUsers([]);
        setIsSweepMode(false);
        // Stats will update on next refresh or manual trigger, but lists are clean now.
      }
    } catch (e) {
      console.error("Sweep error", e);
      toast.error("Failed to sweep");
    } finally {
      setIsSweeping(false);
    }
  };

  const toggleSweepSelection = (
    login: string,
    checked: boolean,
    index?: number,
    shiftKey?: boolean
  ) => {
    if (shiftKey && index !== undefined && lastSelectedIndex !== -1) {
      // Range selection
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const range = sortedPotentialUnfollows
        .slice(start, end + 1)
        .map((u) => u.login);

      setSelectedSweepUsers((prev) => {
        const newSet = new Set(prev);
        if (checked) {
          range.forEach((l) => newSet.add(l));
        } else {
          range.forEach((l) => newSet.delete(l));
        }
        return Array.from(newSet);
      });
    } else {
      if (checked) {
        setSelectedSweepUsers((prev) => [...prev, login]);
      } else {
        setSelectedSweepUsers((prev) => prev.filter((l) => l !== login));
      }
    }
    if (index !== undefined) setLastSelectedIndex(index);
  };

  const handleSelectAll = () => {
    if (getTierLimit(plan, "maxSweepCount") !== Infinity) return;

    // Select all visible potential unfollows
    const allLogins = sortedPotentialUnfollows.map((u) => u.login);
    if (selectedSweepUsers.length === allLogins.length) {
      setSelectedSweepUsers([]);
    } else {
      setSelectedSweepUsers(allLogins);
    }
  };

  useEffect(() => {
    setLastSelectedIndex(-1);
  }, [sortDescending]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredFollowers = useMemo(() => {
    const filtered = followers.filter((f) =>
      f.login.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Sort by timestamp: newest first (highest timestamp = most recent)
    return filtered.sort((a, b) => {
      const aTime = a.firstSeenAt || 0;
      const bTime = b.firstSeenAt || 0;
      return bTime - aTime;
    });
  }, [followers, searchQuery]);

  const sortedFollowers = useMemo(() => {
    const list = [...filteredFollowers];
    return sortDescending ? list : list.reverse();
  }, [filteredFollowers, sortDescending]);

  const filteredFollowing = useMemo(() => {
    const filtered = following
      .filter((f) => !pendingUnfollows.includes(f.login))
      .filter((f) => f.login.toLowerCase().includes(searchQuery.toLowerCase()));

    // Sort by timestamp: newest first (highest timestamp = most recent)
    return filtered.sort((a, b) => {
      const aTime = a.firstSeenAt || 0;
      const bTime = b.firstSeenAt || 0;
      return bTime - aTime;
    });
  }, [following, searchQuery, pendingUnfollows]);

  const sortedFollowing = useMemo(() => {
    const list = [...filteredFollowing];
    return sortDescending ? list : list.reverse();
  }, [filteredFollowing, sortDescending]);

  const whitelist = useMemo(
    () => whitelists[username] || [],
    [whitelists, username]
  );

  const potentialUnfollows = useMemo(
    () =>
      following
        .filter((ing) => !pendingUnfollows.includes(ing.login))
        .filter((ing) => !followers.some((f) => f.login === ing.login))
        .filter((ing) =>
          ing.login.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => (b.firstSeenAt || 0) - (a.firstSeenAt || 0)),
    [following, followers, pendingUnfollows, searchQuery]
  );

  const sortedPotentialUnfollows = useMemo(() => {
    const list = [...potentialUnfollows];
    return sortDescending ? list : list.reverse();
  }, [potentialUnfollows, sortDescending]);

  if (loadingStates.stats && !stats) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-end mb-4">
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>

          {/* User Card Skeleton */}
          <div className="relative">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/10 via-purple-500/10 to-primary/10 rounded-[2.5rem] blur-2xl opacity-20"></div>
            <Card className="relative overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-3xl rounded-[2.5rem] px-2 py-4">
              <CardHeader className="pb-6">
                <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                  <Skeleton className="w-40 h-40 rounded-full" />
                  <div className="flex-1 space-y-4 w-full text-center md:text-left">
                    <div className="space-y-2">
                      <Skeleton className="h-12 w-2/3 mx-auto md:mx-0 rounded-xl" />
                      <Skeleton className="h-6 w-1/3 mx-auto md:mx-0 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-full max-w-xl mx-auto md:mx-0 rounded-md" />
                    <div className="flex justify-center md:justify-start gap-12 pt-4">
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                      <div className="space-y-2">
                        <Skeleton className="h-8 w-16" />
                        <Skeleton className="h-3 w-12" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 py-4 border-b border-zinc-500/10">
              <Skeleton className="h-12 w-full md:w-[400px] rounded-xl" />
              <Skeleton className="h-10 w-full md:w-80 rounded-xl" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  className="h-24 rounded-3xl border border-zinc-500/10 p-4 flex items-center gap-4"
                >
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-1/2" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full border-red-200 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-red-700">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => fetchAllData()} className="w-full">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-end mb-4 gap-2">
          <Button
            variant="outline"
            onClick={() => setSortDescending(!sortDescending)}
            className="gap-2 rounded-xl"
          >
            <ArrowUpDown className="w-4 h-4" />
            {sortDescending ? "Default" : "Reverse"}
          </Button>

          <Button
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing}
            className="gap-2 rounded-xl"
          >
            <CloudUpload
              className={`w-4 h-4 ${isSyncing ? "animate-bounce" : ""}`}
            />
            Sync
          </Button>

          <Button
            variant="outline"
            onClick={() => fetchAllData(true)}
            disabled={isRefreshing}
            className="gap-2 rounded-xl"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Reload
          </Button>
        </div>

        {/* User Card - Ultra Premium */}
        {stats && (
          <div className="relative group">
            <div className="absolute -inset-1 bg-linear-to-r from-primary/30 via-purple-500/30 to-primary/30 rounded-[2.5rem] blur-2xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
            <Card className="relative overflow-hidden border-none shadow-2xl bg-white/70 dark:bg-zinc-950/70 backdrop-blur-3xl rounded-[2.5rem] px-2 py-4">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[80px] rounded-full -mr-20 -mt-20"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[80px] rounded-full -ml-20 -mb-20"></div>

              <CardHeader className="pb-6 relative z-10">
                <div className="flex flex-col md:flex-row items-center gap-8 px-4">
                  <div className="relative">
                    <div className="absolute -inset-1 bg-linear-to-tr from-primary to-purple-500 rounded-full blur opacity-40 animate-pulse"></div>
                    <Avatar className="w-40 h-40 border-4 border-white dark:border-zinc-900 shadow-2xl relative">
                      <AvatarImage src={stats.avatarUrl} alt={stats.username} />
                      <AvatarFallback className="text-5xl font-black bg-muted">
                        {stats.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-4">
                    <div className="space-y-1">
                      <div className="flex flex-col md:flex-row items-center gap-3">
                        <CardTitle className="text-5xl font-black tracking-tighter bg-linear-to-br from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent">
                          {stats.name || stats.username}
                        </CardTitle>
                        <Badge
                          variant="outline"
                          className={`rounded-full px-4 py-1 border-primary/20 bg-primary/5 font-black uppercase text-[10px] tracking-widest ${
                            plan === "PRO"
                              ? "text-purple-500 bg-purple-500/10 border-purple-500/20"
                              : "text-primary"
                          }`}
                        >
                          {plan === "PRO" ? "PRO TIER" : "FREE TIER"}
                        </Badge>
                      </div>
                      <p className="text-2xl text-zinc-400 font-bold tracking-tight">
                        @{stats.username}
                      </p>
                    </div>

                    {stats.bio && (
                      <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-2xl leading-relaxed font-medium">
                        {stats.bio}
                      </p>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-12 pt-4">
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                          {stats.followers.toLocaleString()}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                          Followers
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                          {stats.following.toLocaleString()}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                          Following
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-3xl font-black text-zinc-900 dark:text-zinc-100">
                          {stats.publicRepos}
                        </span>
                        <span className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 font-black">
                          Repositories
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        <Tabs defaultValue="followers" className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky top-0 bg-background/80 backdrop-blur-md z-10 py-4 border-b">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full md:w-auto p-1 bg-muted/50">
              <TabsTrigger
                value="followers"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
              >
                Followers
              </TabsTrigger>
              <TabsTrigger
                value="following"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
              >
                Following
              </TabsTrigger>
              <TabsTrigger
                value="tracking"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
              >
                Tracking
              </TabsTrigger>
              <TabsTrigger
                value="whitelist"
                className="data-[state=active]:bg-background data-[state=active]:shadow-sm px-6"
              >
                Whitelist
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/20 border-border/50"
              />
            </div>
          </div>

          <TabsContent value="followers" className="m-0 space-y-6">
            <UserGrid
              users={sortedFollowers}
              onToggleWhitelist={handleToggleWhitelist}
              whitelist={whitelist}
              isLoading={loadingStates.followers}
              unfollowingLogins={pendingUnfollows}
            />
          </TabsContent>

          <TabsContent value="following" className="m-0 space-y-6">
            <UserGrid
              users={sortedFollowing}
              onToggleWhitelist={handleToggleWhitelist}
              whitelist={whitelist}
              showFollowBackStatus={followers}
              isLoading={loadingStates.following}
              unfollowingLogins={pendingUnfollows}
            />
          </TabsContent>

          <TabsContent value="tracking" className="m-0 space-y-8 outline-none">
            <div className="flex flex-col gap-8">
              {/* Potential Unfollows Card - Ultra Premium */}
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-cyan-600 rounded-[2rem] blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
                <Card className="relative border-none shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-[60px] rounded-full -mr-10 -mt-10 animate-pulse"></div>
                  <CardHeader className="border-b border-zinc-500/10 pb-6 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-red-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.3)]">
                            <ShieldAlert className="w-5 h-5 text-white" />
                          </div>
                          <CardTitle className="text-2xl font-black tracking-tight bg-linear-to-br from-red-600 to-red-400 bg-clip-text text-transparent">
                            Potential Unfollows
                          </CardTitle>
                        </div>
                        <CardDescription className="text-zinc-500 font-bold ml-12">
                          Identify unreciprocal following
                        </CardDescription>
                      </div>

                      {potentialUnfollows.length > 0 && (
                        <div className="flex items-center gap-2">
                          {isSweepMode && plan === "PRO" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleSelectAll}
                              className="mr-2 h-8 text-xs font-bold"
                            >
                              {selectedSweepUsers.length ===
                              potentialUnfollows.length
                                ? "Deselect All"
                                : "Select All"}
                            </Button>
                          )}
                          <Button
                            variant={isSweepMode ? "secondary" : "default"}
                            size="sm"
                            onClick={() => {
                              setIsSweepMode(!isSweepMode);
                              setSelectedSweepUsers([]);
                              setLastSelectedIndex(-1);
                            }}
                            className="rounded-xl font-bold h-9"
                          >
                            <Brush className="w-4 h-4 mr-2" />
                            {isSweepMode ? "Done" : "Sweep"}
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative z-10">
                    <div className="py-4">
                      <UserGrid
                        users={sortedPotentialUnfollows}
                        onToggleWhitelist={handleToggleWhitelist}
                        whitelist={whitelist}
                        isLoading={
                          loadingStates.following || loadingStates.followers
                        }
                        variant="danger"
                        unfollowingLogins={pendingUnfollows}
                        selectionMode={isSweepMode}
                        selectedUsers={selectedSweepUsers}
                        onSelect={toggleSweepSelection}
                        onUnfollow={(login) => {
                          if (isWhitelisted(username, login)) {
                            toast.error(
                              "User is Shielded. Remove protection first to unfollow."
                            );
                            return;
                          }
                          handleUnfollow(login);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>

                {isSweepMode && (
                  <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-between z-50 animate-in slide-in-from-bottom-10 fade-in duration-300">
                    <div className="container mx-auto max-w-6xl flex justify-between items-center">
                      <div className="text-sm font-medium opacity-70">
                        {selectedSweepUsers.length} users selected
                        {plan === "FREE" && (
                          <span className="ml-2 text-amber-500 font-bold">
                            (Max {getTierLimit(plan, "maxSweepCount")})
                          </span>
                        )}
                      </div>
                      <Button
                        variant="destructive"
                        disabled={selectedSweepUsers.length === 0 || isSweeping}
                        onClick={handleSweep}
                        className="rounded-xl font-bold px-8 shadow-lg shadow-red-500/20"
                      >
                        {isSweeping ? (
                          <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Brush className="w-4 h-4 mr-2" />
                        )}
                        Execute Sweep
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="whitelist" className="m-0 space-y-6">
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-linear-to-r from-blue-600 to-indigo-600 rounded-[2rem] blur opacity-10"></div>
              <Card className="relative border-none shadow-2xl bg-white/80 dark:bg-zinc-950/80 backdrop-blur-3xl rounded-[2rem] overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-8 py-10 border-b border-zinc-500/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg">
                        <BookMarked className="w-5 h-5 text-white" />
                      </div>
                      <CardTitle className="text-3xl font-black tracking-tight">
                        Whitelisted Users
                      </CardTitle>
                    </div>
                    <CardDescription className="text-zinc-500 font-bold ml-12">
                      Users exempt from unfollow alert tracking
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="h-10 px-6 gap-2 border-blue-500/20 bg-blue-500/5 text-blue-600 font-black rounded-full uppercase tracking-widest text-[10px]"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    {whitelist.length} PROTECTED
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  {plan === "FREE" &&
                    whitelist.length >=
                      (getTierLimit("FREE", "maxWhitelist") as number) && (
                      <div className="p-4 bg-amber-500/10 border-b border-amber-500/20 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 text-amber-600 dark:text-amber-500">
                          <ShieldAlert className="w-5 h-5" />
                          <span className="font-bold text-sm">
                            Free limit reached (10 users). Upgrade to Supporter
                            for unlimited protection.
                          </span>
                        </div>
                        <Button
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white border-none font-bold"
                        >
                          Become a Supporter
                        </Button>
                      </div>
                    )}
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent border-zinc-500/10">
                        <TableHead className="w-[400px] h-14 px-8 text-xs font-black uppercase tracking-widest text-zinc-400">
                          User Details
                        </TableHead>
                        <TableHead className="h-14 text-xs font-black uppercase tracking-widest text-zinc-400">
                          Status
                        </TableHead>
                        <TableHead className="text-right h-14 px-8 text-xs font-black uppercase tracking-widest text-zinc-400">
                          Management
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {whitelist.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-64 text-center">
                            <div className="flex flex-col items-center gap-4 text-zinc-400">
                              <BookMarked className="w-12 h-12 opacity-10" />
                              <p className="font-bold">
                                No users whitelisted yet.
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        whitelist.map((login) => {
                          const user = [...followers, ...following].find(
                            (u) => u.login === login
                          );
                          return (
                            <TableRow
                              key={`wl-${login}`}
                              className="border-zinc-500/10 hover:bg-muted/30 transition-colors group/row"
                            >
                              <TableCell className="px-8 py-5">
                                <div className="flex items-center gap-4">
                                  <Avatar className="w-12 h-12 ring-2 ring-white dark:ring-zinc-900 shadow-md">
                                    <AvatarImage src={user?.avatar_url} />
                                    <AvatarFallback className="font-black">
                                      {login[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-black text-lg text-zinc-800 dark:text-zinc-200">
                                      @{login}
                                    </p>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                                      Protected User
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="secondary"
                                  className="bg-blue-500/10 text-blue-600 border-none font-black text-[10px] uppercase px-3 py-1"
                                >
                                  Whitelisted
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right px-8">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-500 h-10 px-4 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl font-bold"
                                  onClick={() => handleToggleWhitelist(login)}
                                >
                                  Remove from Protection
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="mt-20 pb-12 text-center text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-4 duration-1000">
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center gap-2">
              <p className="font-black tracking-tighter text-zinc-900 dark:text-zinc-100 italic opacity-80">
                gitstuff 🐱
              </p>
              <span className="w-1 h-1 rounded-full bg-zinc-400 opacity-30" />
              <a
                href="https://github.com/raptr45/gitstuff"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30 hover:opacity-100 transition-opacity"
              >
                Open Source
              </a>
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">
              Handcrafted by{" "}
              <a
                href="https://github.com/raptr45"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors underline decoration-primary/50"
              >
                raptr45
              </a>
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
