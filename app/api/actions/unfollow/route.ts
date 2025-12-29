import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { targetUsername } = await req.json();

  if (!targetUsername) {
    return NextResponse.json(
      { error: "Target username is required" },
      { status: 400 }
    );
  }

  // Get the access token from the database
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

  try {
    const response = await fetch(
      `https://api.github.com/user/following/${targetUsername}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `token ${account.accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      }
    );

    if (response.status === 204) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || "Failed to unfollow user",
        },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
