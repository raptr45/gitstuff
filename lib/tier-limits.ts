import { Plan } from "./types";

export const TIER_LIMITS = {
  FREE: {
    maxWhitelist: 10,
    historyRetensionDays: 7,
    canExport: false,
    priorityRefresh: false,
  },
  PRO: {
    maxWhitelist: Infinity,
    historyRetensionDays: Infinity,
    canExport: true,
    priorityRefresh: true,
  },
} as const;

export function getTierLimit(
  plan: Plan | undefined,
  feature: keyof (typeof TIER_LIMITS)["FREE"]
) {
  const p = plan || "FREE";
  return TIER_LIMITS[p][feature];
}

export function isFeatureEnabled(
  plan: Plan | undefined,
  feature: keyof (typeof TIER_LIMITS)["FREE"]
): boolean {
  const limit = getTierLimit(plan, feature);
  return (
    limit === true ||
    limit === Infinity ||
    (typeof limit === "number" && limit > 0)
  );
}
