/**
 * Type definitions for GitHub Follower Tracker
 */

/**
 * GitHub user data from the GitHub API
 */
export interface GitHubUser {
  login: string;
  followers: number;
  avatar_url: string;
  name: string | null;
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
  | "INVALID_INPUT";

/**
 * API response types
 */
export type APIResponse = 
  | { success: true; data: FollowerData }
  | { success: false; error: string; code: ErrorCode };

/**
 * GitHub API Client interface
 */
export interface GitHubAPIClient {
  fetchUserFollowers(username: string): Promise<GitHubUser>;
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
  getFollowerCount(username: string): Promise<FollowerData>;
}
