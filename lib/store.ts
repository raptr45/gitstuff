import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GitHubUserSummary, Plan } from "./types";

// Extended user with timestamp
export interface GitHubUserWithTimestamp extends GitHubUserSummary {
  firstSeenAt?: number; // When we first saw this user
}

interface UserTimestamps {
  [login: string]: number; // login -> timestamp when first seen
}

interface UserState {
  whitelists: Record<string, string[]>; // targetUsername -> whitelistedLogins[]
  followerTimestamps: Record<string, UserTimestamps>; // targetUsername -> {login -> timestamp}
  followingTimestamps: Record<string, UserTimestamps>; // targetUsername -> {login -> timestamp}
  plan: Plan;

  // Actions
  toggleWhitelist: (targetUsername: string, userToWhitelist: string) => void;
  isWhitelisted: (targetUsername: string, login: string) => boolean;

  // Track followers with timestamps
  trackFollowers: (
    targetUsername: string,
    followers: GitHubUserSummary[]
  ) => GitHubUserWithTimestamp[];

  // Track following with timestamps
  trackFollowing: (
    targetUsername: string,
    following: GitHubUserSummary[]
  ) => GitHubUserWithTimestamp[];

  setWhitelists: (whitelists: Record<string, string[]>) => void;
  updateUserWhitelist: (targetUsername: string, logins: string[]) => void;
  setPlan: (plan: Plan) => void;
  syncToCloud: (username: string) => Promise<boolean>;
  syncFromCloud: (username: string) => Promise<boolean>;
}

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      whitelists: {},
      followerTimestamps: {},
      followingTimestamps: {},
      plan: "FREE",

      toggleWhitelist: (target, login) => {
        set((state) => {
          const current = state.whitelists[target] || [];
          const exists = current.includes(login);
          const next = exists
            ? current.filter((l) => l !== login)
            : [...current, login];
          return {
            whitelists: { ...state.whitelists, [target]: next },
          };
        });
      },

      isWhitelisted: (target, login) => {
        return (get().whitelists[target] || []).includes(login);
      },

      trackFollowers: (target, currentFollowers) => {
        const state = get();
        const existingTimestamps = state.followerTimestamps[target] || {};
        const isFirstScan = Object.keys(existingTimestamps).length === 0;
        const now = Date.now();

        // Create new timestamps object with existing + new users
        const updatedTimestamps: UserTimestamps = { ...existingTimestamps };

        currentFollowers.forEach((follower) => {
          if (!updatedTimestamps[follower.login]) {
            // If first scan, treat everyone as "old" (timestamp 1)
            // If subsequent scan, new users get "now"
            updatedTimestamps[follower.login] = isFirstScan ? 1 : now;
          }
        });

        // Update state
        set((state) => ({
          followerTimestamps: {
            ...state.followerTimestamps,
            [target]: updatedTimestamps,
          },
        }));

        // Return followers with timestamps attached
        return currentFollowers.map((follower) => ({
          ...follower,
          firstSeenAt: updatedTimestamps[follower.login],
        }));
      },

      trackFollowing: (target, currentFollowing) => {
        const state = get();
        const existingTimestamps = state.followingTimestamps[target] || {};
        const isFirstScan = Object.keys(existingTimestamps).length === 0;
        const now = Date.now();

        // Create new timestamps object with existing + new users
        const updatedTimestamps: UserTimestamps = { ...existingTimestamps };

        currentFollowing.forEach((user) => {
          if (!updatedTimestamps[user.login]) {
            updatedTimestamps[user.login] = isFirstScan ? 1 : now;
          }
        });

        // Update state
        set((state) => ({
          followingTimestamps: {
            ...state.followingTimestamps,
            [target]: updatedTimestamps,
          },
        }));

        // Return following with timestamps attached
        return currentFollowing.map((user) => ({
          ...user,
          firstSeenAt: updatedTimestamps[user.login],
        }));
      },

      setWhitelists: (whitelists) => set({ whitelists }),

      updateUserWhitelist: (target, logins) =>
        set((state) => ({
          whitelists: { ...state.whitelists, [target]: logins },
        })),

      setPlan: (plan) => set({ plan }),

      syncToCloud: async (username) => {
        const state = get();
        const followers = state.followerTimestamps[username] || {};
        const following = state.followingTimestamps[username] || {};

        try {
          const res = await fetch("/api/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ followers, following }),
          });
          return res.ok;
        } catch {
          return false;
        }
      },

      syncFromCloud: async (username) => {
        try {
          const res = await fetch("/api/sync");
          if (!res.ok) return false;

          const data = await res.json();
          if (!data.success || !data.snapshot) return false;

          // Merge logic: prefer Cloud if it has data
          // Or overwrite local? "Restore" implies overwrite or merge max timestamp.
          // Let's merge: keep max timestamp for each user.

          set((state) => {
            const cloudFollowers = data.snapshot.followers as UserTimestamps;
            const cloudFollowing = data.snapshot.following as UserTimestamps;

            const currentFollowers = state.followerTimestamps[username] || {};
            const currentFollowing = state.followingTimestamps[username] || {};

            const mergedFollowers = { ...currentFollowers, ...cloudFollowers }; // Simple merge
            const mergedFollowing = { ...currentFollowing, ...cloudFollowing };

            return {
              followerTimestamps: {
                ...state.followerTimestamps,
                [username]: mergedFollowers,
              },
              followingTimestamps: {
                ...state.followingTimestamps,
                [username]: mergedFollowing,
              },
            };
          });
          return true;
        } catch {
          return false;
        }
      },
    }),
    {
      name: "gitstuff-storage",
    }
  )
);
