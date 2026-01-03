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
        const now = Date.now();

        // Create new timestamps object with existing + new users
        const updatedTimestamps: UserTimestamps = { ...existingTimestamps };

        currentFollowers.forEach((follower) => {
          if (!updatedTimestamps[follower.login]) {
            updatedTimestamps[follower.login] = now;
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
        const now = Date.now();

        // Create new timestamps object with existing + new users
        const updatedTimestamps: UserTimestamps = { ...existingTimestamps };

        currentFollowing.forEach((user) => {
          if (!updatedTimestamps[user.login]) {
            updatedTimestamps[user.login] = now;
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
    }),
    {
      name: "gitstuff-storage",
    }
  )
);
