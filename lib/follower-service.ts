import { GitHubAPIError } from "./github-api-client";
import {
  CacheManager,
  FollowerData,
  GitHubAPIClient,
  FollowerService as IFollowerService,
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
    forceRefresh: boolean = false
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
      const userData = await this.apiClient.fetchUserFollowers(username);

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
}

// Create singleton instance
import { cacheManager } from "./cache-manager";
import { githubAPIClient } from "./github-api-client";

export const followerService = new FollowerService(
  githubAPIClient,
  cacheManager
);
