"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FollowerData } from "@/lib/types";
import { Clock, Users } from "lucide-react";
import Link from "next/link";

interface FollowerDisplayProps {
  data: FollowerData | null;
  error: string | null;
  isLoading: boolean;
  isClickable?: boolean;
}

export function FollowerDisplay({
  data,
  error,
  isLoading,
  isClickable,
}: FollowerDisplayProps) {
  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
              <div className="h-3 bg-muted rounded animate-pulse w-1/2" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-8 bg-muted rounded animate-pulse w-1/3" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-md border-red-200 bg-red-50">
        <CardHeader>
          <CardTitle className="text-red-700">Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return null;
  }

  const content = (
    <Card
      className={`w-full max-w-md ${
        isClickable
          ? "hover:border-primary/50 hover:shadow-md transition-all cursor-pointer"
          : ""
      }`}
    >
      <CardHeader>
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={data.avatarUrl} alt={data.username} />
            <AvatarFallback>{data.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-xl">
              {data.name || data.username}
            </CardTitle>
            <CardDescription>@{data.username}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-muted-foreground" />
          <div>
            <p className="text-3xl font-bold">
              {data.followers.toLocaleString()}
            </p>
            <p className="text-sm text-muted-foreground">Followers</p>
          </div>
        </div>

        {data.cached && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>Cached data (refreshes every 5 minutes)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (isClickable) {
    return (
      <Link href={`/${data.username}`} className="w-full max-w-md block">
        {content}
      </Link>
    );
  }

  return content;
}
