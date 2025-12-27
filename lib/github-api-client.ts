import { GitHubUser, GitHubAPIClient as IGitHubAPIClient } from './types';

/**
 * Custom error class for GitHub API errors
 */
export class GitHubAPIError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public code?: string
  ) {
    super(message);
    this.name = 'GitHubAPIError';
  }
}

/**
 * GitHub API client for fetching user data
 */
export class GitHubAPIClient implements IGitHubAPIClient {
  private readonly baseUrl = 'https://api.github.com';
  private readonly timeout = 10000; // 10 seconds

  /**
   * Fetch follower count for a GitHub user
   */
  async fetchUserFollowers(username: string): Promise<GitHubUser> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}/users/${username}`, {
        headers: {
          'User-Agent': 'GitHub-Follower-Tracker',
          'Accept': 'application/vnd.github.v3+json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle different HTTP status codes
      if (response.status === 404) {
        throw new GitHubAPIError(
          `GitHub user '${username}' not found`,
          404,
          'NOT_FOUND'
        );
      }

      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        if (rateLimitRemaining === '0') {
          throw new GitHubAPIError(
            'GitHub API rate limit exceeded. Please try again later.',
            403,
            'RATE_LIMIT'
          );
        }
        throw new GitHubAPIError(
          'Access forbidden',
          403,
          'NETWORK_ERROR'
        );
      }

      if (response.status >= 500) {
        throw new GitHubAPIError(
          'GitHub is experiencing issues. Please try again later.',
          response.status,
          'NETWORK_ERROR'
        );
      }

      if (!response.ok) {
        throw new GitHubAPIError(
          `GitHub API error: ${response.statusText}`,
          response.status,
          'NETWORK_ERROR'
        );
      }

      const data = await response.json();

      // Validate response structure
      if (
        typeof data.login !== 'string' ||
        typeof data.followers !== 'number' ||
        typeof data.avatar_url !== 'string'
      ) {
        throw new GitHubAPIError(
          'Invalid response format from GitHub API',
          undefined,
          'NETWORK_ERROR'
        );
      }

      return {
        login: data.login,
        followers: data.followers,
        avatar_url: data.avatar_url,
        name: data.name || null,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Re-throw GitHubAPIError as-is
      if (error instanceof GitHubAPIError) {
        throw error;
      }

      // Handle abort/timeout
      if (error instanceof Error && error.name === 'AbortError') {
        throw new GitHubAPIError(
          'Request timeout. Please try again.',
          undefined,
          'NETWORK_ERROR'
        );
      }

      // Handle network errors
      throw new GitHubAPIError(
        'Failed to connect to GitHub. Please check your connection.',
        undefined,
        'NETWORK_ERROR'
      );
    }
  }
}

// Singleton instance
export const githubAPIClient = new GitHubAPIClient();
