import type { HealthRagStatus } from "../types";

export interface HealthConfig {
  status: HealthRagStatus;
  label: string;
  badgeBg: string;
  dotBg: string;
  pingBg: string;
  barBg: string;
  text: string;
}

export function getHealthConfig(score: number = 0, ragStatus?: HealthRagStatus | string): HealthConfig {
  let status: HealthRagStatus;

  if (ragStatus === "GREEN" || ragStatus === "AMBER" || ragStatus === "RED") {
    status = ragStatus as HealthRagStatus;
  } else {
    if (score >= 70) {
      status = "GREEN";
    } else if (score >= 40) {
      status = "AMBER";
    } else {
      status = "RED";
    }
  }

  switch (status) {
    case "GREEN":
      return {
        status: "GREEN",
        label: "Healthy",
        badgeBg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400",
        dotBg: "bg-emerald-500",
        pingBg: "bg-emerald-400",
        barBg: "bg-emerald-500",
        text: "text-emerald-600 dark:text-emerald-400",
      };
    case "AMBER":
      return {
        status: "AMBER",
        label: "At Risk",
        badgeBg: "bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400",
        dotBg: "bg-amber-500",
        pingBg: "bg-amber-400",
        barBg: "bg-amber-500",
        text: "text-amber-600 dark:text-amber-400",
      };
    case "RED":
    default:
      return {
        status: "RED",
        label: "Critical",
        badgeBg: "bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400",
        dotBg: "bg-rose-500",
        pingBg: "bg-rose-400",
        barBg: "bg-rose-500",
        text: "text-rose-600 dark:text-rose-400",
      };
  }
}
