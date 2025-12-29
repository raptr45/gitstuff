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
    token?: string
  ): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:followers-list:${username}`;
    const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
    if (cached) return cached;

    // First get the count to know how many pages
    const stats = await this.getUserStats(username, false, token);
    const total = stats.followers;
    const pages = Math.ceil(total / 100);

    const fullList: GitHubUserSummary[] = [];

    // Fetch all pages
    // For large counts (e.g. 1k+), this might take a few seconds
    // but with per_page=100 it's manageable.
    for (let page = 1; page <= pages; page++) {
      const pageData = await this.apiClient.fetchFollowers(
        username,
        page,
        token
      );
      fullList.push(...pageData);
      // Safety break for extreme cases to avoid infinite loops or memory issues
      if (page >= 50 || pageData.length === 0) break;
    }

    this.cache.set(cacheKey, fullList, this.defaultTTL);
    return fullList;
  }

  async getFollowingList(
    username: string,
    token?: string
  ): Promise<GitHubUserSummary[]> {
    const cacheKey = `github:following-list:${username}`;
    const cached = this.cache.get<GitHubUserSummary[]>(cacheKey);
    if (cached) return cached;

    const stats = await this.getUserStats(username, false, token);
    const total = stats.following;
    const pages = Math.ceil(total / 100);

    const fullList: GitHubUserSummary[] = [];

    for (let page = 1; page <= pages; page++) {
      const pageData = await this.apiClient.fetchFollowing(
        username,
        page,
        token
      );
      fullList.push(...pageData);
      if (page >= 50 || pageData.length === 0) break;
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
