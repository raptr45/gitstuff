import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GitHubUserSummary } from "@/lib/types";
import { NextResponse } from "next/server";

const GITHUB_PER_PAGE = 100;

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUsername = searchParams.get("username");
  const listType = (searchParams.get("type") ?? "followers") as
    | "followers"
    | "following";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));

  if (!targetUsername || !/^[a-zA-Z0-9\-]{1,39}$/.test(targetUsername)) {
    return NextResponse.json(
      { error: "Valid GitHub username required" },
      { status: 400 }
    );
  }

  if (listType !== "followers" && listType !== "following") {
    return NextResponse.json(
      { error: "type must be 'followers' or 'following'" },
      { status: 400 }
    );
  }

  const account = await prisma.account.findFirst({
    where: { userId: session.user.id, providerId: "github" },
  });

  if (!account?.accessToken) {
    return NextResponse.json(
      { error: "GitHub account not connected or token missing" },
      { status: 400 }
    );
  }

  const endpoint =
    listType === "followers"
      ? `https://api.github.com/users/${targetUsername}/followers`
      : `https://api.github.com/users/${targetUsername}/following`;

  const res = await fetch(
    `${endpoint}?per_page=${GITHUB_PER_PAGE}&page=${page}`,
    {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  if (res.status === 404) {
    return NextResponse.json(
      { error: `GitHub user '${targetUsername}' not found` },
      { status: 404 }
    );
  }

  if (res.status === 429 || res.status === 403) {
    return NextResponse.json(
      { error: "GitHub rate limit reached. Please wait a moment and try again." },
      { status: 429 }
    );
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    return NextResponse.json(
      { error: (body as { message?: string }).message || "GitHub API error" },
      { status: res.status }
    );
  }

  const raw: Array<{ login: string; avatar_url: string; html_url: string }> =
    await res.json();

  // Check remaining rate limit from headers
  const rateRemaining = res.headers.get("x-ratelimit-remaining");
  const hasMore = raw.length === GITHUB_PER_PAGE;

  const users: GitHubUserSummary[] = raw.map(({ login, avatar_url, html_url }) => ({
    login,
    avatar_url,
    html_url,
  }));

  return NextResponse.json({
    success: true,
    data: users,
    hasMore,
    page,
    rateRemaining: rateRemaining ? parseInt(rateRemaining, 10) : null,
  });
}
