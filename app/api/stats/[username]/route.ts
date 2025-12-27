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
      forceRefresh
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
