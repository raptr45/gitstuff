import {
  GitHubUser,
  GitHubUserSummary,
  GitHubAPIClient as IGitHubAPIClient,
  UserStats,
} from "./types";

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
    this.name = "GitHubAPIError";
  }
}

/**
 * GitHub API client for fetching user data
 */
export class GitHubAPIClient implements IGitHubAPIClient {
  private readonly baseUrl = "https://api.github.com";
  private readonly timeout = 10000; // 10 seconds

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    token?: string
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const headers: Record<string, string> = {
        "User-Agent": "gitstuff",
        Accept: "application/vnd.github.v3+json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (token) {
        headers["Authorization"] = `token ${token}`;
      }

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 404) {
        throw new GitHubAPIError("Not found", 404, "NOT_FOUND");
      }

      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get(
          "X-RateLimit-Remaining"
        );
        if (rateLimitRemaining === "0") {
          throw new GitHubAPIError(
            "GitHub API rate limit exceeded. Please try again later.",
            403,
            "RATE_LIMIT"
          );
        }
        throw new GitHubAPIError("Access forbidden", 403, "NETWORK_ERROR");
      }

      if (response.status >= 500) {
        throw new GitHubAPIError(
          "GitHub is experiencing issues. Please try again later.",
          response.status,
          "NETWORK_ERROR"
        );
      }

      if (!response.ok) {
        throw new GitHubAPIError(
          `GitHub API error: ${response.statusText}`,
          response.status,
          "NETWORK_ERROR"
        );
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof GitHubAPIError) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new GitHubAPIError("Request timeout", undefined, "NETWORK_ERROR");
      }
      throw new GitHubAPIError(
        "Failed to connect to GitHub",
        undefined,
        "NETWORK_ERROR"
      );
    }
  }

  async fetchUser(username: string, token?: string): Promise<GitHubUser> {
    const data = await this.request<Record<string, unknown>>(
      `/users/${username}`,
      {},
      token
    );
    return {
      login: data.login as string,
      followers: data.followers as number,
      following: data.following as number,
      avatar_url: data.avatar_url as string,
      name: (data.name as string) || null,
      bio: (data.bio as string) || null,
      html_url: data.html_url as string,
      public_repos: data.public_repos as number,
    };
  }

  async fetchFollowers(
    username: string,
    page = 1,
    token?: string
  ): Promise<GitHubUserSummary[]> {
    const data = await this.request<Record<string, unknown>[]>(
      `/users/${username}/followers?per_page=100&page=${page}`,
      {},
      token
    );
    return data.map((item) => ({
      login: item.login as string,
      avatar_url: item.avatar_url as string,
      html_url: item.html_url as string,
    }));
  }

  async fetchFollowing(
    username: string,
    page = 1,
    token?: string
  ): Promise<GitHubUserSummary[]> {
    const data = await this.request<Record<string, unknown>[]>(
      `/users/${username}/following?per_page=100&page=${page}`,
      {},
      token
    );
    return data.map((item) => ({
      login: item.login as string,
      avatar_url: item.avatar_url as string,
      html_url: item.html_url as string,
    }));
  }

  /**
   * Fetch authenticated user's followers (requires token)
   * Uses /user/followers endpoint with higher rate limits
   */
  async fetchAuthenticatedUserFollowers(
    page = 1,
    token: string
  ): Promise<GitHubUserSummary[]> {
    const data = await this.request<Record<string, unknown>[]>(
      `/user/followers?per_page=100&page=${page}`,
      {},
      token
    );
    return data.map((item) => ({
      login: item.login as string,
      avatar_url: item.avatar_url as string,
      html_url: item.html_url as string,
    }));
  }

  /**
   * Fetch authenticated user's following (requires token)
   * Uses /user/following endpoint with higher rate limits
   */
  async fetchAuthenticatedUserFollowing(
    page = 1,
    token: string
  ): Promise<GitHubUserSummary[]> {
    const data = await this.request<Record<string, unknown>[]>(
      `/user/following?per_page=100&page=${page}`,
      {},
      token
    );
    return data.map((item) => ({
      login: item.login as string,
      avatar_url: item.avatar_url as string,
      html_url: item.html_url as string,
    }));
  }

  // Legacy support for older interface if needed
  async fetchUserFollowers(username: string): Promise<UserStats> {
    return this.fetchUser(username) as unknown as UserStats;
  }
}

// Singleton instance
export const githubAPIClient = new GitHubAPIClient();
