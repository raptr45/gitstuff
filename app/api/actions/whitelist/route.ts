import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTierLimit } from "@/lib/tier-limits";
import { Plan } from "@/lib/types";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const targetUsername = searchParams.get("targetUsername");

  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const whitelists = await prisma.whitelist.findMany({
    where: {
      userId: session.user.id,
      ...(targetUsername ? { targetUsername } : {}),
    },
  });

  return NextResponse.json({
    success: true,
    data: whitelists.map((w) => ({
      targetUsername: w.targetUsername,
      whiteListed: w.whiteListed,
    })),
  });
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUsername, login, action } = await req.json();

  if (!targetUsername || !login) {
    return NextResponse.json(
      { error: "targetUsername and login are required" },
      { status: 400 }
    );
  }

  if (action === "toggle") {
    const existing = await prisma.whitelist.findUnique({
      where: {
        userId_targetUsername_whiteListed: {
          userId: session.user.id,
          targetUsername,
          whiteListed: login,
        },
      },
    });

    if (existing) {
      await prisma.whitelist.delete({
        where: { id: existing.id },
      });
      return NextResponse.json({ success: true, whitelisted: false });
    } else {
      // Check limits before adding
      const userPlan = (session.user as any).plan as Plan | undefined;
      const limit = getTierLimit(userPlan, "maxWhitelist");

      if (typeof limit === "number" && limit !== Infinity) {
        // Count TOTAL whitelists for this user (across all targets? or just this target?)
        // The limit "Max 10 users" usually means total unique whitelisted users globally or per target?
        // Let's assume global for now as safety.
        // Logic: "Whitelisting: Mark specific users as 'safe'". usually specific to the logged in user's view of a target.
        // But whitelists schema has `targetUsername`.
        // If I whitelist `alice` on `bob`'s profile, and `alice` on `charlie`'s profile...
        // The schema is: userId, targetUsername, whiteListed.
        // It seems `whitelists` are contextual to the target user being viewed?
        // "Mark specific users as 'safe' to prevent them from appearing in your unfollow lists".
        // Unfollow lists are derived from `following`.
        // So `targetUsername` is probably the `username` of the profile being viewed (which is usually the logged in user themselves in this app context, or someone they are tracking).
        // If the user uses the app to track their OWN followers, `targetUsername` == `session.user.username`.
        // If they track others, it varies.
        // Let's count total whitelisted entries for the user for now.
        const count = await prisma.whitelist.count({
          where: { userId: session.user.id },
        });

        if (count >= limit) {
          return NextResponse.json(
            {
              error:
                "Free plan limit reached (10 whitelisted users). Upgrade to PRO for unlimited.",
            },
            { status: 403 }
          );
        }
      }

      await prisma.whitelist.create({
        data: {
          userId: session.user.id,
          targetUsername,
          whiteListed: login,
        },
      });
      return NextResponse.json({ success: true, whitelisted: true });
    }
  }

  // Bulk sync logic removed for now
  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
