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
import { useStore } from "@/lib/store";
import { APIResponse, GitHubUserSummary, UserStats } from "@/lib/types";
import {
  BookMarked,
  Github,
  LogOut,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserPlus
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UserPageClientProps {
  username: string;
}

export function UserPageClient({ username }: UserPageClientProps) {
  const {
    whitelists,
    toggleWhitelist,
    saveFollowerState,
    isWhitelisted,
    setWhitelists,
    updateUserWhitelist,
  } = useStore();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [followers, setFollowers] = useState<GitHubUserSummary[]>([]);
  const [following, setFollowing] = useState<GitHubUserSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const [loadingStates, setLoadingStates] = useState({
    stats: true,
    followers: true,
    following: true,
    whitelist: true,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [newFollowers, setNewFollowers] = useState<GitHubUserSummary[]>([]);
  const [unfollowers, setUnfollowers] = useState<GitHubUserSummary[]>([]);

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

  const fetchLists = useCallback(async () => {
    try {
      const [fRes, ingRes] = await Promise.all([
        fetch(`/api/users/${username}/list?type=followers`),
        fetch(`/api/users/${username}/list?type=following`),
      ]);

      const fData: APIResponse<GitHubUserSummary[]> = await fRes.json();
      const ingData: APIResponse<GitHubUserSummary[]> = await ingRes.json();

      if (fData.success) {
        setFollowers(fData.data);
        const diff = saveFollowerState(username, fData.data);
        setNewFollowers(diff.newFollowers);
        setUnfollowers(diff.unfollowers);
      }

      if (ingData.success) {
        setFollowing(ingData.data);
      }
    } catch (err) {
      console.error("Failed to fetch lists", err);
    } finally {
      setLoadingStates((prev) => ({
        ...prev,
        followers: false,
        following: false,
      }));
    }
  }, [username, saveFollowerState]);

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

      await Promise.all([fetchStats(refresh), fetchLists(), fetchWhitelist()]);

      if (refresh) {
        setIsRefreshing(false);
        toast.success("Data refreshed successfully");
      }
    },
    [fetchStats, fetchLists, fetchWhitelist]
  );

  const { data: session } = authClient.useSession();

  const handleUnfollow = useCallback(
    async (targetLogin: string) => {
      try {
        const res = await fetch("/api/actions/unfollow", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUsername: targetLogin }),
        });

        const data = await res.json();
        if (data.success) {
          toast.success(`Succesfully unfollowed @${targetLogin}`);
          fetchLists(); // Only refresh lists, not full page
        } else {
          toast.error(data.error || "Failed to unfollow");
        }
      } catch {
        toast.error("An error occurred while trying to unfollow");
      }
    },
    [fetchLists]
  );

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

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredFollowers = useMemo(
    () =>
      followers.filter((f) =>
        f.login.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [followers, searchQuery]
  );

  const filteredFollowing = useMemo(
    () =>
      following.filter((f) =>
        f.login.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [following, searchQuery]
  );

  const whitelist = useMemo(
    () => whitelists[username] || [],
    [whitelists, username]
  );

  const potentialUnfollows = useMemo(
    () =>
      following.filter((ing) => !followers.some((f) => f.login === ing.login)),
    [following, followers]
  );

  if (loadingStates.stats && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
            <RefreshCw className="w-10 h-10 animate-spin text-primary relative" />
          </div>
          <p className="text-xl font-bold tracking-tight animate-pulse bg-linear-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Synchronizing GitHub Intelligence...
          </p>
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
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <Button variant="ghost" asChild className="pl-0 hover:bg-transparent">
            <Link href="/" className="flex items-center gap-2 group">
              <span className="text-2xl">🐱</span>
              <span className="text-xl font-bold tracking-tight uppercase">
                gitstuff
              </span>
            </Link>
          </Button>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="flex-1 md:flex-none gap-2 rounded-xl"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            {session ? (
              <div className="flex items-center gap-2">
                <Avatar className="w-10 h-10 ring-2 ring-amber-500/20">
                  <AvatarImage src={session.user.image || ""} />
                  <AvatarFallback>{session.user.name[0]}</AvatarFallback>
                </Avatar>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-red-500"
                  onClick={() => authClient.signOut()}
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <Button
                asChild
                className="flex-1 md:flex-none gap-2 bg-zinc-900 dark:bg-zinc-100 rounded-xl"
              >
                <Link href="/login">
                  <Github className="w-4 h-4" />
                  Connect
                </Link>
              </Button>
            )}
          </div>
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
                          className="rounded-full px-4 py-1 border-primary/20 bg-primary/5 text-primary font-black uppercase text-[10px] tracking-widest"
                        >
                          Active User
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
                {newFollowers.length > 0 && (
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-500/10 text-green-600 border-none"
                  >
                    +{newFollowers.length}
                  </Badge>
                )}
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
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-muted/20 border-border/50"
              />
            </div>
          </div>

          <TabsContent value="followers" className="m-0 space-y-6">
            {newFollowers.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {newFollowers.map((f) => (
                  <Card
                    key={`new-${f.login}`}
                    className="border-green-200 bg-green-50/30"
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-bold">@{f.login}</p>
                          <p className="text-xs text-green-700">
                            New Follower!
                          </p>
                        </div>
                      </div>
                      <Avatar>
                        <AvatarImage src={f.avatar_url} />
                        <AvatarFallback>{f.login[0]}</AvatarFallback>
                      </Avatar>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            <UserGrid
              users={filteredFollowers}
              onToggleWhitelist={handleToggleWhitelist}
              whitelist={whitelist}
              isLoading={loadingStates.followers}
            />
          </TabsContent>

          <TabsContent value="following" className="m-0 space-y-6">
            <UserGrid
              users={filteredFollowing}
              onToggleWhitelist={handleToggleWhitelist}
              whitelist={whitelist}
              showFollowBackStatus={followers}
              isLoading={loadingStates.following}
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
                    <div className="flex items-center justify-between">
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
                    </div>
                  </CardHeader>
                  <CardContent className="p-6 relative z-10">
                    <UserGrid
                      users={potentialUnfollows}
                      onToggleWhitelist={handleToggleWhitelist}
                      whitelist={whitelist}
                      isLoading={loadingStates.following || loadingStates.followers}
                      variant="danger"
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
                  </CardContent>
                </Card>
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

