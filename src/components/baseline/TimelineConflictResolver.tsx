import React, { useState } from "react";
import {
  AlertTriangle,
  Clock,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Loader2,
  Info,
  ShieldAlert,
  Users,
  Check,
  TrendingDown,
  FileText,
  BadgeAlert,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { API_ENDPOINTS } from "../../api/endpoints";

interface ScenarioCapacity {
  demand_dev_weeks: number;
  available_dev_weeks: number;
  headcount_available: number;
  developers_needed: number;
  shortfall_dev_weeks: number;
  utilisation?: number;
  feasibility: "FEASIBLE" | "UNFEASIBLE" | "CONDITIONAL";
  capacity_warning?: string;
}

interface PhaseScheduleItem {
  phase: string;
  window: string;
  duration: string;
}

interface Scenario {
  key: string;
  title: string;
  badge: string;
  badge_color: "red" | "emerald" | "amber";
  approach: string;
  phase_schedule?: PhaseScheduleItem[];
  capacity: ScenarioCapacity;
  billing_impact: string;
  governance_note?: string;
  planning_assumption?: string;
}

interface HitlConflict {
  has_contradiction: boolean;
  contract_start?: string | null;
  phase_duration_days?: number;
  earliest_milestone_date?: string | null;
  available_days?: number | null;
  gap_days?: number;
  phase_breakdown?: { name: string; days: number; source: string }[];
  milestone_name?: string | null;
  severity?: "CRITICAL" | "WARNING" | null;
  explanation?: string;
  recommended_action?: string;
  resolution?: string;
  warning_tag?: string;
  resolved_at?: string;
  warning?: {
    warning_type: string;
    severity: string;
    derived_date?: string;
    contract_date?: string;
    gap_days?: number;
    message?: string;
  };
  scenarios?: {
    scenario_a: Scenario;
    scenario_b: Scenario;
    scenario_c: Scenario;
    derived_dates?: {
      build_end?: string;
      go_live?: string;
      final_end?: string;
    };
    contract_dates?: {
      earliest_milestone?: string;
      go_live?: string;
    };
  };
}

interface TimelineConflictResolverProps {
  projectId: string | number;
  conflict: HitlConflict;
  onResolved: () => void;
}

export const TimelineConflictResolver: React.FC<TimelineConflictResolverProps> = ({
  projectId,
  conflict,
  onResolved,
}) => {
  const [resolving, setResolving] = useState(false);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [resolved, setResolved] = useState(false);
  const [chosenOption, setChosenOption] = useState<string | null>(null);

  const handleResolve = async (
    resolution: "CONTRACT_ANCHORED" | "DURATION_ANCHORED" | "PROVISIONAL_STRICT"
  ) => {
    setResolving(true);
    setError(null);
    setChosenOption(resolution);
    try {
      const res = await apiClient.post(API_ENDPOINTS.BASELINE.HITL_RESOLVE(projectId), {
        resolution,
        notes: notes.trim() || undefined,
      });
      if (res.data?.success) {
        setResolved(true);
        setTimeout(() => onResolved(), 1600);
      } else {
        setError(res.data?.message || "Resolution failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Network error. Please try again.");
    } finally {
      setResolving(false);
    }
  };

  if (resolved) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-10 text-center rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
        <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center animate-bounce">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <p className="text-base font-bold text-emerald-400">Timeline Conflict Resolved!</p>
        <p className="text-xs text-text-muted">
          Choice recorded. Project status is now BASELINE_PENDING_REVIEW. Reloading baseline review…
        </p>
      </div>
    );
  }

  const phaseDays = conflict.phase_duration_days ?? 98;
  const availDays = conflict.available_days ?? 20;
  const overrunDays = conflict.gap_days ?? 78;
  const breakdown = conflict.phase_breakdown ?? [];

  // Scenarios with fallbacks
  const scA: Scenario = conflict.scenarios?.scenario_a ?? {
    key: "CONTRACT_ANCHORED",
    title: "Option A: Enforce Milestone Dates (Contract-Anchored)",
    badge: "Capacity Risk",
    badge_color: "red",
    approach:
      "Contract billing milestone dates are enforced as the authoritative delivery anchors. Phase durations are compressed to fit inside the milestone window.",
    capacity: {
      demand_dev_weeks: 36.0,
      available_dev_weeks: 10.1,
      headcount_available: 5,
      developers_needed: 18,
      shortfall_dev_weeks: 25.9,
      feasibility: "UNFEASIBLE",
      capacity_warning:
        "CRITICAL: Compressing 9 weeks of build work into ~3 calendar weeks requires ~18 developers at 70% utilisation. Available team (5 developers) faces a 25.9 dev-week shortfall.",
    },
    billing_impact:
      "Milestones achieved on original signed schedule. Invoicing proceeds on contract dates without amendment.",
    governance_note: "Requires staffing surge (+13 developers) or severe scope descope to be viable.",
  };

  const scB: Scenario = conflict.scenarios?.scenario_b ?? {
    key: "DURATION_ANCHORED",
    title: "Option B: Enforce Phase Durations (Duration-Anchored)",
    badge: "Recommended",
    badge_color: "emerald",
    approach:
      "Stated phase durations (9w build, 3w UAT, 2w Hypercare) are enforced. Team of 5 developers delivers scope at standard velocity. Contract billing records remain immutable; contract amendment is recommended.",
    capacity: {
      demand_dev_weeks: 36.0,
      available_dev_weeks: 31.5,
      headcount_available: 5,
      developers_needed: 5,
      shortfall_dev_weeks: 0.0,
      feasibility: "FEASIBLE",
      capacity_warning:
        "FEASIBLE: 5 developers over 9.0 weeks deliver the 36.0 dev-weeks of build work with standard velocity.",
    },
    billing_impact:
      "Billing milestones delayed: UAT Deployment (+43d), Go-Live (+29d). Contract billing facts remain unchanged; contract amendment recommended.",
    governance_note:
      "A planning assumption is recorded. Project monitoring tracks progress against derived dates; milestone-at-risk alerts inform the Engagement Manager.",
    planning_assumption: "Contract amendment recommended; contract billing terms unchanged.",
  };

  const scC: Scenario = conflict.scenarios?.scenario_c ?? {
    key: "PROVISIONAL_STRICT",
    title: "Option C: Proceed Provisionally (Stricter Alerts)",
    badge: "Provisional",
    badge_color: "amber",
    approach:
      "Acknowledge contradiction and proceed provisionally without altering planning baseline or contract dates. Automated execution alerts flag all deliverables exceeding original milestone dates.",
    capacity: {
      demand_dev_weeks: 36.0,
      available_dev_weeks: 10.1,
      headcount_available: 5,
      developers_needed: 5,
      shortfall_dev_weeks: 0.0,
      feasibility: "CONDITIONAL",
      capacity_warning:
        "Execution monitoring active: 5 developers will track against the stricter contract dates, generating active alerts for PM intervention.",
    },
    billing_impact:
      "Original contract dates remain active for alerting. Deliverables exceeding milestone date will raise immediate high-priority milestone alerts.",
  };

  const derivedDates = conflict.scenarios?.derived_dates;
  const contractDates = conflict.scenarios?.contract_dates;

  return (
    <div className="w-full rounded-2xl border border-red-500/40 bg-gradient-to-b from-red-500/10 via-bg-card/90 to-bg-card overflow-hidden shadow-2xl space-y-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-6 py-4 bg-red-500/15 border-b border-red-500/30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 border border-red-500/40 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-black text-red-200">Critical: Timeline Contradiction Detected</p>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase tracking-wider">
                HITL Required
              </span>
            </div>
            <p className="text-xs text-red-300/80 mt-0.5">
              Stated phase durations mathematically cannot complete before contractual billing milestones
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-bg-card/80 border border-border-subtle text-text-muted">
            Tolerance: <span className="text-text-primary font-bold">3 days</span>
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
            Variance: +{overrunDays}d
          </span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Mathematical Conflict Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="rounded-xl bg-bg-card/70 border border-border-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Stated Phases</span>
              <Clock className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <p className="text-xl font-black text-text-primary">{phaseDays}d</p>
            <p className="text-[11px] text-text-muted mt-1">
              {breakdown.length > 0 ? breakdown.map((p) => `${p.name}: ${p.days}d`).join(" | ") : "9w build + 3w UAT + 2w Hypercare"}
            </p>
          </div>

          <div className="rounded-xl bg-bg-card/70 border border-border-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Milestone Window</span>
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <p className="text-xl font-black text-text-primary">{availDays}d</p>
            <p className="text-[11px] text-text-muted mt-1">
              {conflict.milestone_name ? `${conflict.milestone_name} (${conflict.earliest_milestone_date})` : `First billing milestone: ${conflict.earliest_milestone_date}`}
            </p>
          </div>

          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-red-400 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Build Overrun</span>
              <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            </div>
            <p className="text-xl font-black text-red-300">+{breakdown[0]?.days ? breakdown[0].days - availDays : 43}d</p>
            <p className="text-[11px] text-red-300/80 mt-1">
              Initial build ({breakdown[0]?.days ?? 63}d) exceeds billing date by {breakdown[0]?.days ? breakdown[0].days - availDays : 43} days
            </p>
          </div>

          <div className="rounded-xl bg-bg-card/70 border border-border-subtle p-3.5 flex flex-col justify-between">
            <div className="flex items-center justify-between text-text-muted mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider">Go-Live Comparison</span>
              <BadgeAlert className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="space-y-0.5">
              <p className="text-xs text-text-muted">
                Contract: <span className="font-bold text-amber-300">{contractDates?.go_live || "2027-03-18"}</span>
              </p>
              <p className="text-xs text-text-muted">
                Derived: <span className="font-bold text-emerald-300">{derivedDates?.go_live || "2027-04-16"}</span>
              </p>
            </div>
            <p className="text-[11px] text-purple-300 font-bold mt-1">+29d schedule variance</p>
          </div>
        </div>

        {/* Parallel Scenarios Comparison Card */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Parallel Execution Scenarios (Choose to Resolve)
              </h4>
              <p className="text-xs text-text-muted">
                The agent computes both timelines without choosing. Select an option to establish the project baseline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Option A: Contract-Anchored */}
            <div className="flex flex-col justify-between rounded-xl border border-red-500/40 bg-bg-card/80 p-5 space-y-4 hover:border-red-500/60 transition-all shadow-md">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500/20 text-red-300 text-xs font-black border border-red-500/40">
                      A
                    </span>
                    <h5 className="text-sm font-bold text-text-primary">Enforce Milestone Dates</h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/40 uppercase">
                    {scA.badge}
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">{scA.approach}</p>

                {/* Capacity impact callout */}
                <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-red-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Capacity Consequence:
                    </span>
                    <span className="font-bold text-red-200">
                      ~{scA.capacity.developers_needed} Developers Needed
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-bg-card/60 rounded p-1.5 border border-border-subtle">
                      <p className="text-[10px] text-text-muted">Available</p>
                      <p className="font-bold text-text-primary">{scA.capacity.headcount_available} devs</p>
                    </div>
                    <div className="bg-bg-card/60 rounded p-1.5 border border-border-subtle">
                      <p className="text-[10px] text-text-muted">Required</p>
                      <p className="font-bold text-red-300">~{scA.capacity.developers_needed} devs</p>
                    </div>
                    <div className="bg-red-500/20 rounded p-1.5 border border-red-500/40">
                      <p className="text-[10px] text-red-300">Shortfall</p>
                      <p className="font-bold text-red-200">-{scA.capacity.shortfall_dev_weeks} dev-wks</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-red-300/90 leading-tight">
                    Compressing 9 weeks of build work into ~3 calendar weeks (~15 working days) requires tripling developer capacity at full utilisation.
                  </p>
                </div>

                {/* Commercial / Contract impact */}
                <div className="text-xs space-y-1 text-text-muted">
                  <p>
                    <span className="font-semibold text-text-secondary">Commercial Impact:</span>{" "}
                    {scA.billing_impact}
                  </p>
                  <p className="text-amber-400/90 text-[11px]">
                    <span className="font-semibold">Staffing requirement:</span> Needs +13 developers immediately or severe scope descoping.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleResolve("CONTRACT_ANCHORED")}
                disabled={resolving}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-blue-500/50 bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 font-bold text-xs py-2.5 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {resolving && chosenOption === "CONTRACT_ANCHORED" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Select Option A (Contract-Anchored)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>

            {/* Option B: Duration-Anchored (Recommended) */}
            <div className="flex flex-col justify-between rounded-xl border border-emerald-500/40 bg-bg-card/80 p-5 space-y-4 hover:border-emerald-500/60 transition-all shadow-md relative overflow-hidden">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2 w-16 h-16 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/40">
                      B
                    </span>
                    <h5 className="text-sm font-bold text-text-primary">Enforce Phase Durations</h5>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 uppercase">
                    {scB.badge}
                  </span>
                </div>

                <p className="text-xs text-text-muted leading-relaxed">{scB.approach}</p>

                {/* Capacity impact callout */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Capacity Feasibility:
                    </span>
                    <span className="font-bold text-emerald-200">
                      5 Developers Feasible (0 Shortfall)
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-bg-card/60 rounded p-1.5 border border-border-subtle">
                      <p className="text-[10px] text-text-muted">Available</p>
                      <p className="font-bold text-text-primary">{scB.capacity.headcount_available} devs</p>
                    </div>
                    <div className="bg-bg-card/60 rounded p-1.5 border border-border-subtle">
                      <p className="text-[10px] text-text-muted">Required</p>
                      <p className="font-bold text-emerald-300">{scB.capacity.developers_needed} devs</p>
                    </div>
                    <div className="bg-emerald-500/20 rounded p-1.5 border border-emerald-500/40">
                      <p className="text-[10px] text-emerald-300">Shortfall</p>
                      <p className="font-bold text-emerald-200">0.0 dev-wks</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-emerald-300/90 leading-tight">
                    Standard team velocity over stated 9 weeks build + 3 weeks UAT cleanly delivers the entire committed scope.
                  </p>
                </div>

                {/* Commercial / Contract impact */}
                <div className="text-xs space-y-1 text-text-muted">
                  <p>
                    <span className="font-semibold text-text-secondary">Projected Go-Live:</span>{" "}
                    <span className="text-emerald-300 font-bold">{derivedDates?.go_live || "2027-04-16"}</span>{" "}
                    (vs contract billing {contractDates?.go_live || "2027-03-18"})
                  </p>
                  <p className="text-emerald-400/90 text-[11px]">
                    <span className="font-semibold">Contract Integrity:</span> Signed contract billing records remain immutable in database. Contract amendment recommended.
                  </p>
                </div>
              </div>

              <button
                onClick={() => handleResolve("DURATION_ANCHORED")}
                disabled={resolving}
                className="w-full mt-4 flex items-center justify-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 font-bold text-xs py-2.5 px-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-emerald-950/20"
              >
                {resolving && chosenOption === "DURATION_ANCHORED" ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Select Option B (Duration-Anchored — Recommended)</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Option C: Proceed Provisionally */}
          <div className="rounded-xl border border-border-subtle bg-bg-card/50 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
                  C
                </span>
                <p className="text-xs font-bold text-text-primary">{scC.title}</p>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                  {scC.badge}
                </span>
              </div>
              <p className="text-xs text-text-muted">{scC.approach}</p>
            </div>

            <button
              onClick={() => handleResolve("PROVISIONAL_STRICT")}
              disabled={resolving}
              className="shrink-0 flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs py-2 px-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {resolving && chosenOption === "PROVISIONAL_STRICT" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <span>Select Option C (Provisional)</span>
                  <ArrowRight className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Resolution Notes */}
        <div>
          <label className="block text-xs font-semibold text-text-secondary mb-1.5">
            Audit Resolution Notes <span className="text-text-muted font-normal">(optional — persisted with user ID and timestamp)</span>
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="e.g. Engagement Manager reviewed with steering committee: 5 developers allocated, contract amendment in progress for Go-Live on April 16."
            className="w-full text-xs rounded-xl bg-bg-card border border-border-subtle px-3.5 py-2.5 text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl px-3.5 py-2.5 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between text-[11px] text-text-muted pt-1 border-t border-border-subtle/50">
          <p>
            Governance Guarantee: Original contract dates remain immutable in records. Resolution will be permanently logged.
          </p>
          <span className="font-semibold text-text-secondary">Agent: Flag, Don't Fix</span>
        </div>
      </div>
    </div>
  );
};

export default TimelineConflictResolver;