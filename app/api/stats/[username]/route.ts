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
    const forceRefresh = request.nextUrl.searchParams.get("refresh") === "true";

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

    if (!username || username.trim() === "") {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid username",
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    const data = await followerService.getUserStats(
      username.trim(),
      forceRefresh,
      token
    );

    return NextResponse.json({
      success: true,
      data,
    });
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
      {
        success: false,
        error: "Unexpected error",
        code: "NETWORK_ERROR",
      },
      { status: 500 }
    );
  }
}
