import { beforeEach, describe, expect, it, vi } from "vitest";
import { FollowerService } from "./follower-service";
import { CacheManager, GitHubAPIClient } from "./types";

describe("FollowerService", () => {
  let followerService: FollowerService;
  let mockAPIClient: GitHubAPIClient;
  let mockCache: CacheManager;

  beforeEach(() => {
    mockAPIClient = {
      fetchUserFollowers: vi.fn(),
    } as unknown as GitHubAPIClient;

    mockCache = {
      get: vi.fn(),
      set: vi.fn(),
      has: vi.fn(),
      isExpired: vi.fn(),
      clear: vi.fn(),
    } as unknown as CacheManager;

    followerService = new FollowerService(mockAPIClient, mockCache);
  });

  it("should return cached data if forceRefresh is false", async () => {
    const cachedData = {
      username: "testuser",
      followers: 10,
      avatarUrl: "url",
      name: "Test",
      fetchedAt: Date.now(),
    };

    vi.mocked(mockCache.get).mockReturnValue(cachedData);

    const result = await followerService.getFollowerCount("testuser", false);

    expect(result.cached).toBe(true);
    expect(result.followers).toBe(10);
    expect(mockAPIClient.fetchUserFollowers).not.toHaveBeenCalled();
  });

  it("should fetch from API if forceRefresh is true, even if cache exists", async () => {
    const cachedData = {
      username: "testuser",
      followers: 10,
      avatarUrl: "url",
      name: "Test",
      fetchedAt: Date.now(),
    };

    const freshData = {
      login: "testuser",
      followers: 20,
      avatar_url: "url",
      name: "Test",
    };

    vi.mocked(mockCache.get).mockReturnValue(cachedData);
    vi.mocked(mockAPIClient.fetchUserFollowers).mockResolvedValue(freshData);

    const result = await followerService.getFollowerCount("testuser", true);

    expect(result.cached).toBe(false);
    expect(result.followers).toBe(20);
    expect(mockAPIClient.fetchUserFollowers).toHaveBeenCalledWith("testuser");
    expect(mockCache.set).toHaveBeenCalled();
  });
});
