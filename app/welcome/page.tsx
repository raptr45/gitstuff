"use client";

import { FollowerDisplay } from "@/components/follower-display";
import { FollowerTrackerForm } from "@/components/follower-tracker-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { APIResponse, FollowerData } from "@/lib/types";
import {
  ArrowRight,
  Github,
  LayoutDashboard,
  ShieldCheck,
  Zap
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Welcome() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();

  // Search State
  const [followerData, setFollowerData] = useState<FollowerData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [navSearchQuery, setNavSearchQuery] = useState("");

  // If logged in, redirect to Dashboard (/)
  useEffect(() => {
    if (!isSessionPending && session) {
      router.push("/");
    }
  }, [session, isSessionPending, router]);

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/", // Redirect to Dashboard
    });
  };

  const handleNavbarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      router.push(`/${navSearchQuery.trim()}`);
    }
  };

  const handleSearch = async (username: string) => {
    setIsSearchLoading(true);
    setError(null);
    setFollowerData(null);

    try {
      const response = await fetch(`/api/followers/${username}`);
      const data: APIResponse<FollowerData> = await response.json();

      if (data.success) {
        setFollowerData(data.data);
      } else {
        setError(data.error);
      }
    } catch {
      setError("Failed to fetch data. Please try again.");
    } finally {
      setIsSearchLoading(false);
    }
  };

  if (isSessionPending) {
     return (
       <div className="min-h-screen flex items-center justify-center bg-background">
         <div className="flex flex-col items-center gap-4">
           <div className="relative">
             <div className="absolute -inset-4 bg-primary/20 blur-2xl rounded-full animate-pulse"></div>
             <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
           </div>
         </div>
       </div>
     );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 blur-[120px] rounded-full -mr-40 -mt-40"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[100px] rounded-full -ml-20 -mb-20"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <main className="pt-8 pb-24 lg:pt-20">
          {/* Hero Section */}
          <div className="text-center max-w-4xl mx-auto space-y-8 mb-20">
            <div className="space-y-4">
              <h1 className="text-4xl lg:text-7xl font-black tracking-tighter bg-linear-to-b from-zinc-900 via-zinc-800 to-zinc-500 dark:from-white dark:via-zinc-200 dark:to-zinc-500 bg-clip-text text-transparent pb-2">
                Master Your
                <br />
                GitHub Circle
              </h1>
              <p className="text-xl lg:text-2xl text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
                Intelligent follower tracking, mutual connection insights, and
                whitelist protection for your GitHub network.
              </p>
            </div>

            {/* CTA & Search Block */}
            <div className="flex flex-col items-center gap-8 max-w-md mx-auto">
              <Button
                  onClick={handleSignIn}
                  size="lg"
                  className="w-full h-14 px-8 rounded-full text-lg font-bold gap-3 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-100 shadow-xl shadow-primary/10 transition-all hover:scale-105"
                >
                  <Github className="w-5 h-5" />
                  Get Started with GitHub
                  <ArrowRight className="w-5 h-5 opacity-50" />
                </Button>

              <div className="w-full flex items-center gap-4 text-zinc-400">
                <Separator className="shrink" />
                <span className="text-xs font-bold uppercase tracking-widest min-w-max">
                  Or try it out
                </span>
                <Separator className="shrink" />
              </div>

              <div className="w-full space-y-8">
                <FollowerTrackerForm
                  onSubmit={handleSearch}
                  isLoading={isSearchLoading}
                />
                <FollowerDisplay
                  data={followerData}
                  error={error}
                  isLoading={isSearchLoading}
                  isClickable={true}
                />
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <CardTitle className="text-3xl font-black text-center mb-10 tracking-tight">
            Advanced Features
          </CardTitle>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {[
              {
                icon: Zap,
                title: "Smart Tracking",
                description:
                  "Instantly detect new followers and identify users who have unfollowed you.",
                color: "text-amber-500",
                bg: "bg-amber-500/10",
              },
              {
                icon: ShieldCheck,
                title: "Protection",
                description:
                  "Whitelist friends and important connections to prevent accidental unfollows.",
                color: "text-blue-500",
                bg: "bg-blue-500/10",
              },
              {
                icon: LayoutDashboard,
                title: "Premium Insights",
                description:
                  "Visualize your network with a beautiful, performance-optimized dashboard.",
                color: "text-purple-500",
                bg: "bg-purple-500/10",
              },
            ].map((feature, i) => (
              <Card
                key={i}
                className="relative border-none shadow-lg bg-white/50 dark:bg-zinc-900/50 backdrop-blur-xl hover:bg-white/80 dark:hover:bg-zinc-900/80 transition-all duration-300 group overflow-hidden"
              >
                <div className="absolute inset-0 bg-linear-to-br from-white/5 to-white/0 dark:from-zinc-800/10 dark:to-zinc-800/0 opacity-0 group-hover:opacity-100 transition-opacity" />
                <CardHeader>
                  <div
                    className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <feature.icon className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl font-bold">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base font-medium leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>

        <footer className="py-8 text-center border-t border-zinc-500/10">
          <p className="text-zinc-400 font-bold text-sm"><a
            href="https://github.com/raptr45/gitstuff"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-muted-foreground hover:text-foreground transition-colors"
          >Open Source</a> • Built by{" "}
            <a
              href="https://github.com/raptr45"
              className="text-primary hover:underline"
            >
              raptr45
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}
