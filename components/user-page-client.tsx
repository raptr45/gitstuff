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
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useStore } from "@/lib/store";
import { APIResponse, GitHubUserSummary, UserStats } from "@/lib/types";
import {
  ArrowLeft,
  BookMarked,
  ExternalLink,
  Github,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserMinus,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface UserPageClientProps {
  username: string;
}

export function UserPageClient({ username }: UserPageClientProps) {
  const { whitelists, toggleWhitelist, saveFollowerState, isWhitelisted } =
    useStore();

  const [stats, setStats] = useState<UserStats | null>(null);
  const [followers, setFollowers] = useState<GitHubUserSummary[]>([]);
  const [following, setFollowing] = useState<GitHubUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [newFollowers, setNewFollowers] = useState<GitHubUserSummary[]>([]);
  const [unfollowers, setUnfollowers] = useState<GitHubUserSummary[]>([]);

  const fetchAllData = useCallback(
    async (refresh = false) => {
      if (refresh) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        // Fetch stats
        const statsRes = await fetch(
          `/api/stats/${username}${refresh ? "?refresh=true" : ""}`
        );
        const statsData: APIResponse<UserStats> = await statsRes.json();

        if (!statsData.success) throw new Error(statsData.error);
        setStats(statsData.data);

        // Fetch lists
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

        if (refresh) toast.success("Data refreshed successfully");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to fetch data";
        setError(message);
        toast.error("Failed to update: " + message);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [username, saveFollowerState]
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

  if (isLoading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">
            Loading GitHub stats...
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
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="text-lg font-semibold tracking-tight uppercase">
                gitstuff
              </span>
            </Link>
          </Button>

          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              onClick={() => fetchAllData(true)}
              disabled={isRefreshing}
              className="flex-1 md:flex-none gap-2"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
            <Button asChild className="flex-1 md:flex-none gap-2">
              <a
                href={stats?.htmlUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="w-4 h-4" />
                Profile
                <ExternalLink className="w-3 h-3 ml-1 opacity-50" />
              </a>
            </Button>
          </div>
        </div>

        {/* User Card */}
        {stats && (
          <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-br from-primary/5 via-background to-primary/5">
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-32 h-32 border-4 border-background shadow-2xl ring-2 ring-primary/20">
                  <AvatarImage src={stats.avatarUrl} alt={stats.username} />
                  <AvatarFallback className="text-4xl">
                    {stats.username[0].toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 text-center md:text-left space-y-2">
                  <div>
                    <CardTitle className="text-4xl font-bold tracking-tight">
                      {stats.name || stats.username}
                    </CardTitle>
                    <p className="text-xl text-muted-foreground font-medium">
                      @{stats.username}
                    </p>
                  </div>
                  {stats.bio && (
                    <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
                      {stats.bio}
                    </p>
                  )}
                  <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-4">
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-2xl font-bold">
                        {stats.followers.toLocaleString()}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                        Followers
                      </span>
                    </div>
                    <div className="w-px h-10 bg-border hidden md:block" />
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-2xl font-bold">
                        {stats.following.toLocaleString()}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                        Following
                      </span>
                    </div>
                    <div className="w-px h-10 bg-border hidden md:block" />
                    <div className="flex flex-col items-center md:items-start">
                      <span className="text-2xl font-bold">
                        {stats.publicRepos}
                      </span>
                      <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold">
                        Repos
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
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

            <UserListTable
              users={filteredFollowers}
              target={username}
              onToggleWhitelist={(login) => toggleWhitelist(username, login)}
              whitelist={whitelist}
            />
          </TabsContent>

          <TabsContent value="following" className="m-0 space-y-6">
            <UserListTable
              users={filteredFollowing}
              target={username}
              onToggleWhitelist={(login) => toggleWhitelist(username, login)}
              whitelist={whitelist}
              showFollowBackStatus={followers}
            />
          </TabsContent>

          <TabsContent value="tracking" className="m-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-red-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-red-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-red-700">
                        Lost Followers
                      </CardTitle>
                      <CardDescription>
                        People who recently unfollowed you
                      </CardDescription>
                    </div>
                    <UserMinus className="w-6 h-6 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    {unfollowers.length === 0 ? (
                      <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-2">
                        <ShieldCheck className="w-8 h-8 opacity-20" />
                        <p>No lost followers detected recently.</p>
                      </div>
                    ) : (
                      <div className="divide-y">
                        {unfollowers.map((f) => (
                          <div
                            key={`lost-${f.login}`}
                            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={f.avatar_url} />
                                <AvatarFallback>{f.login[0]}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold">@{f.login}</p>
                                {isWhitelisted(username, f.login) && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] h-4"
                                  >
                                    Whitelisted
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={f.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card className="border-blue-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-blue-50/50 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-blue-700">
                        Potential Unfollows
                      </CardTitle>
                      <CardDescription>
                        People you follow who don&apos;t follow back
                      </CardDescription>
                    </div>
                    <ShieldAlert className="w-6 h-6 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <ScrollArea className="h-[400px]">
                    <div className="divide-y">
                      {following
                        .filter(
                          (ing) => !followers.some((f) => f.login === ing.login)
                        )
                        .map((ing) => (
                          <div
                            key={`potential-${ing.login}`}
                            className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-4">
                              <Avatar>
                                <AvatarImage src={ing.avatar_url} />
                                <AvatarFallback>{ing.login[0]}</AvatarFallback>
                              </Avatar>
                              <p className="font-semibold">@{ing.login}</p>
                            </div>
                            <Button variant="ghost" size="icon" asChild>
                              <a
                                href={ing.html_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="whitelist" className="m-0 space-y-6">
            <Card className="border-none shadow-sm ring-1 ring-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
                <div className="space-y-1">
                  <CardTitle>Whitelisted Users</CardTitle>
                  <CardDescription>
                    People you want to keep track of regardless of follower
                    status
                  </CardDescription>
                </div>
                <Badge
                  variant="outline"
                  className="h-6 gap-1 border-primary/20 bg-primary/5 text-primary"
                >
                  <BookMarked className="w-3 h-3" />
                  {whitelist.length} Users
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="w-[400px]">User</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {whitelist.length === 0 ? (
                      <TableRow>
                        <TableCell
                          colSpan={3}
                          className="h-32 text-center text-muted-foreground"
                        >
                          No users whitelisted yet.
                        </TableCell>
                      </TableRow>
                    ) : (
                      whitelist.map((login) => {
                        const user = [...followers, ...following].find(
                          (u) => u.login === login
                        );
                        return (
                          <TableRow key={`wl-${login}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8">
                                  <AvatarImage src={user?.avatar_url} />
                                  <AvatarFallback>{login[0]}</AvatarFallback>
                                </Avatar>
                                <span className="font-semibold">@{login}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="secondary"
                                className="bg-blue-100 text-blue-700 border-none"
                              >
                                Whitelisted
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={() => toggleWhitelist(username, login)}
                              >
                                Remove
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
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function UserListTable({
  users,
  onToggleWhitelist,
  whitelist,
  showFollowBackStatus,
}: {
  users: GitHubUserSummary[];
  target: string;
  onToggleWhitelist: (login: string) => void;
  whitelist: string[];
  showFollowBackStatus?: GitHubUserSummary[];
}) {
  return (
    <Card className="border-none shadow-sm ring-1 ring-border">
      <CardContent className="p-0">
        <ScrollArea className="h-[600px] rounded-md">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0 z-10">
              <TableRow>
                <TableHead className="w-[300px]">GitHub User</TableHead>
                <TableHead>Relationship</TableHead>
                <TableHead className="text-right">Management</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No users found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => {
                  const isWl = whitelist.includes(user.login);
                  const followsBack = showFollowBackStatus?.some(
                    (f) => f.login === user.login
                  );

                  return (
                    <TableRow
                      key={user.login}
                      className="group hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="py-3">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-10 h-10 ring-1 ring-border group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={user.avatar_url} />
                            <AvatarFallback>{user.login[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <a
                              href={user.html_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold hover:underline decoration-primary/50 flex items-center gap-1 group/link"
                            >
                              @{user.login}
                              <ExternalLink className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity" />
                            </a>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-2">
                          {isWl && (
                            <Badge
                              variant="secondary"
                              className="bg-blue-500/10 text-blue-600 border-none font-bold text-[10px]"
                            >
                              Whitelisted
                            </Badge>
                          )}
                          {showFollowBackStatus &&
                            (followsBack ? (
                              <Badge
                                variant="secondary"
                                className="bg-green-500/10 text-green-600 border-none font-bold text-[10px]"
                              >
                                Follows Back
                              </Badge>
                            ) : (
                              <Badge
                                variant="secondary"
                                className="bg-yellow-500/10 text-yellow-600 border-none font-bold text-[10px]"
                              >
                                Not Following Back
                              </Badge>
                            ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onToggleWhitelist(user.login)}
                                className={
                                  isWl
                                    ? "text-primary"
                                    : "text-muted-foreground hover:text-primary"
                                }
                              >
                                {isWl ? (
                                  <ShieldCheck className="w-5 h-5" />
                                ) : (
                                  <ShieldAlert className="w-5 h-5 opacity-40 group-hover:opacity-100" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {isWl
                                ? "Remove from Whitelist"
                                : "Add to Whitelist"}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
