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
      const userData = await this.apiClient.fetchUser(username);

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
    forceRefresh: boolean = false
  ): Promise<UserStats> {
    const cacheKey = `github:stats:${username}`;

    if (!forceRefresh) {
      const cachedData = this.cache.get<UserStats>(cacheKey);
      if (cachedData) {
        return { ...cachedData, cached: true };
      }
    }

    try {
      const userData = await this.apiClient.fetchUser(username);
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

  async getFollowersList(username: string): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:followers-list:${username}`;
    const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
    if (cached) return cached;

    // We'll fetch the first 100 for now. For "unfollower" tracking,
    // we would ideally fetch ALL, but let's start with 100.
    const data = await this.apiClient.fetchFollowers(username);
    this.cache.set(cacheKey, data, this.defaultTTL);
    return data;
  }

  async getFollowingList(username: string): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:following-list:${username}`;
    const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
    if (cached) return cached;

    const data = await this.apiClient.fetchFollowing(username);
    this.cache.set(cacheKey, data, this.defaultTTL);
    return data;
  }
}

// Create singleton instance
import { cacheManager } from "./cache-manager";
import { githubAPIClient } from "./github-api-client";

export const followerService = new FollowerService(
  githubAPIClient,
  cacheManager
);
