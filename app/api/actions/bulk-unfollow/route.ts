import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTierLimit } from "@/lib/tier-limits";
import { AppUser } from "@/lib/types";
import { NextResponse } from "next/server";

const INTER_REQUEST_DELAY_MS = 250;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { usernames } = body as { usernames: string[] };

  if (!Array.isArray(usernames) || usernames.length === 0) {
    return NextResponse.json(
      { error: "Usernames array required" },
      { status: 400 }
    );
  }

  // Tier-gated cap (reuse sweep limit for unfollow)
  const userPlan = (session.user as AppUser).plan;
  const maxSweep = getTierLimit(userPlan, "maxSweepCount");

  if (typeof maxSweep === "number" && usernames.length > maxSweep) {
    return NextResponse.json(
      {
        error: `Your plan allows a maximum of ${maxSweep} users per bulk unfollow. Upgrade to PRO for unlimited.`,
      },
      { status: 403 }
    );
  }

  // Sanitise inputs
  const safeUsernames = usernames.filter(
    (u) => typeof u === "string" && /^[a-zA-Z0-9\-]{1,39}$/.test(u)
  );

  if (safeUsernames.length === 0) {
    return NextResponse.json(
      { error: "No valid usernames provided" },
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

  // Check for whitelisted (protected) users — refuse to unfollow them
  const protectedUsers = await prisma.whitelist.findMany({
    where: {
      userId: session.user.id,
      whiteListed: { in: safeUsernames },
    },
    select: { whiteListed: true },
  });

  const protectedSet = new Set(protectedUsers.map((u) => u.whiteListed));

  const results: { username: string; success: boolean; error?: string }[] = [];

  for (const username of safeUsernames) {
    if (protectedSet.has(username)) {
      results.push({
        username,
        success: false,
        error: "Protected (whitelisted)",
      });
      continue;
    }

    try {
      const response = await fetch(
        `https://api.github.com/user/following/${username}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${account.accessToken}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
          },
        }
      );

      if (response.status === 204) {
        results.push({ username, success: true });
      } else if (response.status === 429) {
        results.push({
          username,
          success: false,
          error: "Rate limited by GitHub",
        });
        break;
      } else {
        const errorData = await response.json().catch(() => ({}));
        results.push({
          username,
          success: false,
          error:
            (errorData as { message?: string }).message || `HTTP ${response.status}`,
        });
      }
    } catch {
      results.push({ username, success: false, error: "Network error" });
    }

    await sleep(INTER_REQUEST_DELAY_MS);
  }

  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success).length;

  return NextResponse.json({
    success: true,
    results,
    succeeded,
    failed,
    total: safeUsernames.length,
  });
}
