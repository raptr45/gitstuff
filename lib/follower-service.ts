import { GitHubAPIError } from "./github-api-client";
import {
  CacheManager,
  FollowerData,
  GitHubAPIClient,
  GitHubUserSummary,
  FollowerService as IFollowerService,
  UserStats,
} from "./types";

/**
 * Service for fetching and caching GitHub follower data
 */
export class FollowerService implements IFollowerService {
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  constructor(
    private apiClient: GitHubAPIClient,
    private cache: CacheManager
  ) {}

  /**
   * Get follower count for a GitHub user (with caching)
   */
  async getFollowerCount(
    username: string,
    forceRefresh: boolean = false,
    token?: string
  ): Promise<FollowerData> {
    const cacheKey = `github:followers:${username}`;

    // Check cache first (unless forceRefresh is true)
    if (!forceRefresh) {
      const cachedData = this.cache.get<FollowerData>(cacheKey);
      if (cachedData) {
        return {
          ...cachedData,
          cached: true,
        };
      }
    }

    // Cache miss or expired - fetch from API
    try {
      const userData = await this.apiClient.fetchUser(username, token);

      const followerData: FollowerData = {
        username: userData.login,
        followers: userData.followers,
        avatarUrl: userData.avatar_url,
        name: userData.name,
        cached: false,
        fetchedAt: Date.now(),
      };

      // Update cache
      this.cache.set(cacheKey, followerData, this.defaultTTL);

      return followerData;
    } catch (error) {
      // Re-throw API errors
      if (error instanceof GitHubAPIError) {
        throw error;
      }
      throw error;
    }
  }

  async getUserStats(
    username: string,
    forceRefresh: boolean = false,
    token?: string
  ): Promise<UserStats> {
    const cacheKey = `github:stats:${username}`;

    if (!forceRefresh) {
      const cachedData = this.cache.get<UserStats>(cacheKey);
      if (cachedData) {
        return { ...cachedData, cached: true };
      }
    }

    try {
      const userData = await this.apiClient.fetchUser(username, token);
      const stats: UserStats = {
        username: userData.login,
        followers: userData.followers,
        following: userData.following,
        avatarUrl: userData.avatar_url,
        name: userData.name,
        bio: userData.bio,
        htmlUrl: userData.html_url,
        publicRepos: userData.public_repos,
        cached: false,
        fetchedAt: Date.now(),
      };

      this.cache.set(cacheKey, stats, this.defaultTTL);
      return stats;
    } catch (error) {
      if (error instanceof GitHubAPIError) throw error;
      throw error;
    }
  }

  async getFollowersList(
    username: string,
    token?: string,
    forceRefresh: boolean = false,
    authenticatedUsername?: string
  ): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:followers-list:${username}`;
    if (!forceRefresh) {
      const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
      if (cached) return cached;
    }

    // Use authenticated endpoint if viewing own profile with token
    const useAuthEndpoint =
      authenticatedUsername && username === authenticatedUsername && token;

    // Fetch all pages dynamically until we run out of data
    const fullList: GitHubUserSummary[] = [];
    let page = 1;
    while (true) {
      const pageData = useAuthEndpoint
        ? await this.apiClient.fetchAuthenticatedUserFollowers(page, token!)
        : await this.apiClient.fetchFollowers(username, page, token);

      if (pageData.length === 0) break;

      fullList.push(...pageData);

      if (pageData.length < 100) break;
      if (page >= 50) break; // Safety limit (5k users)
      page++;
    }

    this.cache.set(cacheKey, fullList, this.defaultTTL);
    return fullList;
  }

  async getFollowingList(
    username: string,
    token?: string,
    forceRefresh: boolean = false,
    authenticatedUsername?: string
  ): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:following-list:${username}`;
    if (!forceRefresh) {
      const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
      if (cached) return cached;
    }

    // Use authenticated endpoint if viewing own profile with token
    const useAuthEndpoint =
      authenticatedUsername && username === authenticatedUsername && token;

    // Fetch all pages dynamically until we run out of data
    const fullList: GitHubUserSummary[] = [];
    let page = 1;
    while (true) {
      const pageData = useAuthEndpoint
        ? await this.apiClient.fetchAuthenticatedUserFollowing(page, token!)
        : await this.apiClient.fetchFollowing(username, page, token);

      if (pageData.length === 0) break;

      fullList.push(...pageData);

      if (pageData.length < 100) break;
      if (page >= 50) break; // Safety limit
      page++;
    }

    this.cache.set(cacheKey, fullList, this.defaultTTL);
    return fullList;
  }
}

// Create singleton instance
import { cacheManager } from "./cache-manager";
import { githubAPIClient } from "./github-api-client";

export const followerService = new FollowerService(
  githubAPIClient,
  cacheManager
);
