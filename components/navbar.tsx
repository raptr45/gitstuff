"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { Contrast, Database, Github, LogOut, Search, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ThemeSwitcher } from "./theme-switcher";

export function Navbar() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [navSearchQuery, setNavSearchQuery] = useState("");

  const handleNavbarSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (navSearchQuery.trim()) {
      router.push(`/${navSearchQuery.trim()}`);
    }
  };

  const handleSignIn = async () => {
    await authClient.signIn.social({
      provider: "github",
      callbackURL: "/",
    });
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl filter drop-shadow-sm">🐱</span>
            <span className="text-xl font-bold tracking-tight uppercase bg-linear-to-r from-zinc-900 to-zinc-600 dark:from-white dark:to-zinc-400 bg-clip-text text-transparent">
              gitstuff
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <form
            onSubmit={handleNavbarSearch}
            className="relative group w-40 md:w-64 hidden sm:block"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-primary transition-colors" />
            <Input
              value={navSearchQuery}
              onChange={(e) => setNavSearchQuery(e.target.value)}
              placeholder="Search by username"
              className="pl-10 h-9 rounded-full bg-muted/50 border-input focus:ring-2 ring-primary/20 transition-all font-medium"
            />
          </form>

          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8 ring-2 ring-border">
                    <AvatarImage src={session.user.image || ""} alt={session.user.name || ""} />
                    <AvatarFallback>{session.user.name?.[0]}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 p-2" align="end" forceMount>
                <DropdownMenuLabel className="font-normal mb-2">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{session.user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {`@${(session.user as any).username}` || session.user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                
                <div className="flex items-center justify-between px-2 py-1.5">
                  {/* lets add a contrast icon here */}
                  <div className="flex items-center gap-2">
                    <Contrast className="mr-2 h-4 w-4" />
                    <span className="text-sm font-medium">Theme</span>
                  </div>
                  <ThemeSwitcher />
                </div>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem asChild>
                    <Link href="/" className="cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/manage-data" className="cursor-pointer">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Manage Data</span>
                    </Link>
                </DropdownMenuItem>
                
                <DropdownMenuSeparator className="my-2" />
                
                <DropdownMenuItem
                    className="font-semibold text-red-400 focus:text-red-500 cursor-pointer" 
                    onClick={() => authClient.signOut().then(() => window.location.reload())}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={handleSignIn}
              size="sm"
              className="rounded-full font-bold gap-2"
            >
              <Github className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
