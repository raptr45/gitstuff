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

    if (!username) {
      return NextResponse.json(
        { success: false, error: "User required" },
        { status: 400 }
      );
    }

    const data =
      type === "following"
        ? await followerService.getFollowingList(username)
        : await followerService.getFollowersList(username);

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
