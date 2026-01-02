/**
 * Type definitions for gitstuff
 */

/**
 * GitHub user data from the GitHub API
 */
export type Plan = "FREE" | "PRO";

export interface GitHubUser {
  login: string;
  followers: number;
  following: number;
  avatar_url: string;
  name: string | null;
  bio: string | null;
  html_url: string;
  public_repos: number;
}

/**
 * Minimal user info for lists
 */
export interface GitHubUserSummary {
  login: string;
  avatar_url: string;
  html_url: string;
}

/**
 * Cache entry with expiration tracking
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * Detailed user data returned to the client
 */
export interface UserStats extends FollowerData {
  following: number;
  bio: string | null;
  htmlUrl: string;
  publicRepos: number;
}

/**
 * Follower data returned to the client
 */
export interface FollowerData {
  username: string;
  followers: number;
  avatarUrl: string;
  name: string | null;
  cached: boolean;
  fetchedAt: number;
}

/**
 * Error codes for API responses
 */
export type ErrorCode =
  | "NOT_FOUND"
  | "RATE_LIMIT"
  | "NETWORK_ERROR"
  | "INVALID_INPUT"
  | "UNAUTHORIZED";

/**
 * API response types
 */
export type APIResponse<T = unknown> =
  | { success: true; data: T }
  | { success: false; error: string; code: ErrorCode };

/**
 * GitHub API Client interface
 */
export interface GitHubAPIClient {
  fetchUser(username: string, token?: string): Promise<GitHubUser>;
  fetchFollowers(
    username: string,
    page?: number,
    token?: string
  ): Promise<GitHubUserSummary[]>;
  fetchFollowing(
    username: string,
    page?: number,
    token?: string
  ): Promise<GitHubUserSummary[]>;
  fetchAuthenticatedUserFollowers(
    page: number,
    token: string
  ): Promise<GitHubUserSummary[]>;
  fetchAuthenticatedUserFollowing(
    page: number,
    token: string
  ): Promise<GitHubUserSummary[]>;
}

/**
 * Cache Manager interface
 */
export interface CacheManager {
  get<T>(key: string): T | null;
  set<T>(key: string, data: T, ttlMs: number): void;
  has(key: string): boolean;
  isExpired(key: string): boolean;
  clear(key: string): void;
}

/**
 * Follower Service interface
 */
export interface FollowerService {
  getFollowerCount(
    username: string,
    forceRefresh?: boolean,
    token?: string
  ): Promise<FollowerData>;
  getUserStats(
    username: string,
    forceRefresh?: boolean,
    token?: string
  ): Promise<UserStats>;
  getFollowersList(
    username: string,
    token?: string,
    forceRefresh?: boolean,
    authenticatedUsername?: string
  ): Promise<GitHubUserSummary[]>;
  getFollowingList(
    username: string,
    token?: string,
    forceRefresh?: boolean,
    authenticatedUsername?: string
  ): Promise<GitHubUserSummary[]>;
}
