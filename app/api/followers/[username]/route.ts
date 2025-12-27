import { followerService } from '@/lib/follower-service';
import { GitHubAPIError } from '@/lib/github-api-client';
import { APIResponse, ErrorCode } from '@/lib/types';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    // Validate input
    if (!username || username.trim() === '') {
      const errorResponse: APIResponse = {
        success: false,
        error: 'Please enter a valid GitHub username',
        code: 'INVALID_INPUT',
      };
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Fetch follower data
    const data = await followerService.getFollowerCount(username.trim());

    const successResponse: APIResponse = {
      success: true,
      data,
    };

    return NextResponse.json(successResponse);
  } catch (error) {
    // Handle GitHub API errors
    if (error instanceof GitHubAPIError) {
      const errorCode = (error.code as ErrorCode) || 'NETWORK_ERROR';
      const errorResponse: APIResponse = {
        success: false,
        error: error.message,
        code: errorCode,
      };

      const statusCode = error.statusCode || 500;
      return NextResponse.json(errorResponse, { status: statusCode });
    }

    // Handle unexpected errors
    const errorResponse: APIResponse = {
      success: false,
      error: 'An unexpected error occurred',
      code: 'NETWORK_ERROR',
    };

    return NextResponse.json(errorResponse, { status: 500 });
  }
}
