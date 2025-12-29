import { create } from "zustand";
import { persist } from "zustand/middleware";
import { GitHubUserSummary } from "./types";

interface TrackedUser {
  username: string;
  followers: GitHubUserSummary[];
  lastChecked: number;
}

interface UserState {
  whitelists: Record<string, string[]>; // targetUsername -> whitelistedLogins[]
  followerHistory: Record<string, TrackedUser>; // targetUsername -> historicalInfo

  // Actions
  toggleWhitelist: (targetUsername: string, userToWhitelist: string) => void;
  isWhitelisted: (targetUsername: string, login: string) => boolean;
  saveFollowerState: (
    targetUsername: string,
    followers: GitHubUserSummary[]
  ) => {
    newFollowers: GitHubUserSummary[];
    unfollowers: GitHubUserSummary[];
  };
  setWhitelists: (whitelists: Record<string, string[]>) => void;
  updateUserWhitelist: (targetUsername: string, logins: string[]) => void;
}

export const useStore = create<UserState>()(
  persist(
    (set, get) => ({
      whitelists: {},
      followerHistory: {},

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

      saveFollowerState: (target, currentFollowers) => {
        const state = get();
        const history = state.followerHistory[target];

        let newFollowers: GitHubUserSummary[] = [];
        let unfollowers: GitHubUserSummary[] = [];

        if (history) {
          const oldLogins = new Set(history.followers.map((f) => f.login));
          const currentLogins = new Set(currentFollowers.map((f) => f.login));

          newFollowers = currentFollowers.filter(
            (f) => !oldLogins.has(f.login)
          );
          unfollowers = history.followers.filter(
            (f) => !currentLogins.has(f.login)
          );
        }

        set((state) => ({
          followerHistory: {
            ...state.followerHistory,
            [target]: {
              username: target,
              followers: currentFollowers,
              lastChecked: Date.now(),
            },
          },
        }));

        return { newFollowers, unfollowers };
      },

      setWhitelists: (whitelists) => set({ whitelists }),

      updateUserWhitelist: (target, logins) =>
        set((state) => ({
          whitelists: { ...state.whitelists, [target]: logins },
        })),
    }),
    {
      name: "gitstuff-storage",
    }
  )
);
