import { followerService } from "@/lib/follower-service";
import { GitHubAPIError } from "@/lib/github-api-client";
import { ErrorCode } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;
    const type = request.nextUrl.searchParams.get("type") || "followers";

    // Try to get token for authenticated request (higher rate limit)
    const { auth } = await import("@/lib/auth");
    const { prisma } = await import("@/lib/prisma");

    const session = await auth.api.getSession({
      headers: request.headers,
    });

    let token: string | undefined;

    if (session) {
      const account = await prisma.account.findFirst({
        where: {
          userId: session.user.id,
          providerId: "github",
        },
      });
      token = account?.accessToken || undefined;
    }

    if (!username) {
      return NextResponse.json(
        { success: false, error: "User required" },
        { status: 400 }
      );
    }

    // Get authenticated user's GitHub username for optimized endpoints
    let authenticatedUsername: string | undefined;
    if (session) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
      });
      authenticatedUsername = user?.username || undefined;
    }

    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";
    const data =
      type === "following"
        ? await followerService.getFollowingList(
            username,
            token,
            forceRefresh,
            authenticatedUsername
          )
        : await followerService.getFollowersList(
            username,
            token,
            forceRefresh,
            authenticatedUsername
          );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (error instanceof GitHubAPIError) {
      return NextResponse.json(
        {
          success: false,
          error: error.message,
          code: (error.code as ErrorCode) || "NETWORK_ERROR",
        },
        { status: error.statusCode || 500 }
      );
    }
    return NextResponse.json(
      { success: false, error: "Error" },
      { status: 500 }
    );
  }
}
