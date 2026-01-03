import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTierLimit } from "@/lib/tier-limits";
import { AppUser } from "@/lib/types";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targets } = (await req.json()) as { targets: string[] };

  if (!targets || !Array.isArray(targets) || targets.length === 0) {
    return NextResponse.json(
      { error: "Targets array is required" },
      { status: 400 }
    );
  }

  // Check tier limits
  const userPlan = (session.user as AppUser).plan;
  const maxSweep = getTierLimit(userPlan, "maxSweepCount");

  if (typeof maxSweep === "number" && targets.length > maxSweep) {
    return NextResponse.json(
      {
        error: `Free Tier is limited to ${maxSweep} users per sweep. Upgrade to Supporter for unlimited sweeps!`,
      },
      { status: 403 }
    );
  }

  // Get GitHub token
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  if (!account || !account.accessToken) {
    return NextResponse.json(
      { error: "GitHub account not connected or token missing" },
      { status: 400 }
    );
  }

  // Check for protected users
  const protectedUsers = await prisma.whitelist.findMany({
    where: {
      userId: session.user.id,
      whiteListed: { in: targets },
    },
    select: { whiteListed: true },
  });

  if (protectedUsers.length > 0) {
    const protectedNames = protectedUsers.map((u) => u.whiteListed).join(", ");
    return NextResponse.json(
      {
        error: `Cannot sweep protected users: ${protectedNames}. Remove them from whitelist first.`,
      },
      { status: 400 }
    );
  }

  // Perform Sweep
  const results = await Promise.allSettled(
    targets.map(async (target) => {
      const res = await fetch(
        `https://api.github.com/user/following/${target}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `token ${account.accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        }
      );
      if (res.status !== 204) {
        throw new Error(`Failed to unfollow ${target}`);
      }
      return target;
    })
  );

  const successful = results.filter((r) => r.status === "fulfilled").length;
  const failed = results.filter((r) => r.status === "rejected").length;

  return NextResponse.json({
    success: true,
    data: {
      successful,
      failed,
      total: targets.length,
    },
  });
}
