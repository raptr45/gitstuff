import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function POST() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  // 1. Check if user already has username in DB (source of truth)

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.username) {
    return NextResponse.json({ success: true, username: user.username });
  }

  // 2. If not, find the GitHub account to get the access token
  const account = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "github",
    },
  });

  if (!account?.accessToken) {
    return NextResponse.json(
      { error: "No connected GitHub account found" },
      { status: 400 }
    );
  }

  try {
    // 3. Fetch GitHub profile
    const ghRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${account.accessToken}`,
        "User-Agent": "gitstuff-app",
      },
    });

    if (!ghRes.ok) {
      // Fallback: If token expired, we might need re-auth, but let's try reading schema?
      throw new Error("Failed to fetch GitHub profile");
    }

    const ghUser = await ghRes.json();
    const login = ghUser.login;

    if (!login) {
      throw new Error("No login found in GitHub profile");
    }

    // 4. Update User record
    await prisma.user.update({
      where: { id: userId },
      data: { username: login },
    });

    return NextResponse.json({ success: true, username: login });
  } catch (error) {
    console.error("Sync error:", error);
    return NextResponse.json(
      { error: "Failed to sync username" },
      { status: 500 }
    );
  }
}
