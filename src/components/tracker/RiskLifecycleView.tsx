import React, { useState, useEffect } from "react";
import apiClient from "../../api/apiClient";
import { API_ENDPOINTS } from "../../api/endpoints";
import {
  ShieldAlert,
  History,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Clock,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  RotateCcw,
  PlusCircle,
  FileText,
  Lock,
  Layers,
} from "lucide-react";

interface RiskLifecycleViewProps {
  projectId: string | number;
}

export const RiskLifecycleView: React.FC<RiskLifecycleViewProps> = ({ projectId }) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lifecycleData, setLifecycleData] = useState<any>(null);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [selectedSnapshot, setSelectedSnapshot] = useState<any | null>(null);

  // Completion Modal State
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [completionEvidence, setCompletionEvidence] = useState<string>("");
  const [completing, setCompleting] = useState<boolean>(false);
  const [completionSuccess, setCompletionSuccess] = useState<string | null>(null);

  const fetchLifecycle = async () => {
    setLoading(true);
    setError(null);
    try {
      const [lifeRes, snapRes] = await Promise.allSettled([
        apiClient.get(API_ENDPOINTS.TRACKER.LIFECYCLE(projectId)),
        apiClient.get(API_ENDPOINTS.TRACKER.SNAPSHOTS(projectId)),
      ]);

      if (lifeRes.status === "fulfilled" && lifeRes.value?.data?.success) {
        setLifecycleData(lifeRes.value.data.data);
      }
      if (snapRes.status === "fulfilled" && snapRes.value?.data?.success) {
        const snaps = snapRes.value.data.data || [];
        setSnapshots(snaps);
        if (snaps.length > 0) {
          setSelectedSnapshot(snaps[0]);
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || "Failed to load risk lifecycle");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId) {
      fetchLifecycle();
    }
  }, [projectId]);

  const handleCompleteProject = async () => {
    if (!completionEvidence.trim()) return;
    setCompleting(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.TRACKER.COMPLETE_PROJECT(projectId), {
        completion_evidence: completionEvidence,
      });
      if (res.data?.success) {
        setCompletionSuccess("Project marked complete. Final risk summary snapshot generated.");
        setShowCompletionModal(false);
        fetchLifecycle();
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to complete project risk lifecycle");
    } finally {
      setCompleting(false);
    }
  };

  const getTransitionBadge = (state: string) => {
    switch (state) {
      case "NEW":
        return {
          bg: "bg-blue-500/10 text-blue-400 border-blue-500/30",
          icon: PlusCircle,
          label: "NEW",
        };
      case "CONTINUING":
        return {
          bg: "bg-amber-500/10 text-amber-400 border-amber-500/30",
          icon: Clock,
          label: "CONTINUING",
        };
      case "INCREASING":
        return {
          bg: "bg-rose-500/10 text-rose-400 border-rose-500/30",
          icon: TrendingUp,
          label: "INCREASING SEVERITY",
        };
      case "DECREASING":
        return {
          bg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
          icon: TrendingDown,
          label: "DECREASING",
        };
      case "RESOLVED":
        return {
          bg: "bg-teal-500/10 text-teal-400 border-teal-500/30",
          icon: CheckCircle2,
          label: "RESOLVED",
        };
      case "REOPENED":
        return {
          bg: "bg-purple-500/10 text-purple-400 border-purple-500/30",
          icon: RotateCcw,
          label: "REOPENED",
        };
      default:
        return {
          bg: "bg-surface text-text-muted border-border-subtle",
          icon: Clock,
          label: state || "MONITORED",
        };
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <RefreshCw className="w-8 h-8 text-accent animate-spin mb-3" />
        <p className="text-sm text-text-muted">Loading Risk Assessment Lifecycle...</p>
      </div>
    );
  }

  const currentRegister = lifecycleData?.current_register || {};
  const activeRisks = Object.values(currentRegister.active_risks || {}) as any[];
  const resolvedRisks = Object.values(currentRegister.resolved_risks || {}) as any[];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-bg-card/60 backdrop-blur-md border border-border-subtle rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-mono tracking-wider uppercase text-text-muted bg-surface/60 px-2.5 py-0.5 rounded-full border border-border-subtle">
              Continuous Risk Governance
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
              {snapshots.length} Versioned Snapshots
            </span>
          </div>
          <h2 className="text-xl font-bold text-text-primary">
            Risk Assessment Lifecycle & History
          </h2>
          <p className="text-xs text-text-muted mt-1">
            Tracks contractual risks from EL upload and operational risks recalculated across every MoM and Status Report upload.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCompletionModal(true)}
            className="px-3.5 py-2 bg-surface hover:bg-surface-hover text-rose-400 hover:text-rose-300 text-xs font-semibold rounded-lg border border-rose-500/30 transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" />
            Finalize & Close Project
          </button>
          <button
            onClick={fetchLifecycle}
            className="p-2 bg-surface hover:bg-surface-hover text-text-primary rounded-lg border border-border-base transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {completionSuccess && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400">
          {completionSuccess}
        </div>
      )}

      {/* Main Grid: Left = Current Active Register, Right = Versioned Snapshots Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Current Operational Risk Register (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-bg-card/60 border border-border-subtle rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-text-primary">
                  Current Operational Risk Register
                </h3>
                <p className="text-xs text-text-muted">
                  Stable ID tracking with explicit evidence-based transitions. Risks persist across reports unless verified resolved.
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-accent/10 text-accent">
                {activeRisks.length} Active • {resolvedRisks.length} Resolved
              </span>
            </div>

            {activeRisks.length === 0 ? (
              <div className="text-center py-8 text-xs text-text-muted border border-dashed border-border-subtle rounded-xl">
                No active operational risks currently tracked.
              </div>
            ) : (
              <div className="space-y-3">
                {activeRisks.map((risk: any) => {
                  const stateBadge = getTransitionBadge(risk.lifecycle_state || "CONTINUING");
                  const StateIcon = stateBadge.icon;
                  return (
                    <div
                      key={risk.risk_id}
                      className="p-4 bg-surface/40 hover:bg-surface/60 border border-border-subtle rounded-xl transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[10px] font-mono font-bold text-accent px-1.5 py-0.5 rounded bg-accent/10">
                              {risk.risk_id}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${stateBadge.bg}`}
                            >
                              <StateIcon className="w-3 h-3" />
                              {stateBadge.label}
                            </span>
                            <span className="text-[10px] font-mono text-text-muted">
                              Origin: {risk.origin_doc_type || "EL"}
                            </span>
                          </div>
                          <h4 className="text-xs font-semibold text-text-primary">
                            {risk.title}
                          </h4>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400">
                          {risk.severity || "MEDIUM"}
                        </span>
                      </div>

                      <p className="text-xs text-text-muted leading-relaxed">
                        {risk.description}
                      </p>

                      <div className="pt-2 border-t border-border-subtle flex flex-wrap items-center gap-4 text-[11px] text-text-muted">
                        <span>
                          <strong className="text-text-primary">Impact:</strong> {risk.impact || "Schedule / Scope"}
                        </span>
                        <span>
                          <strong className="text-text-primary">Mitigation:</strong> {risk.mitigation || "Under review"}
                        </span>
                        {risk.latest_evidence && (
                          <span className="text-amber-400/90 font-medium">
                            Evidence: {risk.latest_evidence}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Historical Snapshots Version Timeline (1 col) */}
        <div className="space-y-4">
          <div className="bg-bg-card/60 border border-border-subtle rounded-2xl p-5">
            <h3 className="text-sm font-bold text-text-primary mb-1">
              Historical Snapshots
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Immutable versioned audit trail for each uploaded document.
            </p>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {snapshots.map((snap: any, idx: number) => {
                const isSelected = selectedSnapshot?.snapshot_id === snap.snapshot_id;
                return (
                  <div
                    key={snap.snapshot_id || idx}
                    onClick={() => setSelectedSnapshot(snap)}
                    className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all ${
                      isSelected
                        ? "bg-accent/10 border-accent text-text-primary"
                        : "bg-surface/30 hover:bg-surface/50 border-border-subtle text-text-muted"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-mono font-bold text-accent">
                        {snap.assessment_type}
                      </span>
                      <span className="text-[10px] text-text-muted">
                        {snap.timestamp ? new Date(snap.timestamp).toLocaleDateString() : ""}
                      </span>
                    </div>
                    <h5 className="text-xs font-semibold text-text-primary truncate">
                      {snap.triggering_document_name || "Assessment"}
                    </h5>
                    <div className="mt-2 flex items-center justify-between text-[10px] text-text-muted">
                      <span>{snap.risks_count ?? 0} Risks Evaluated</span>
                      <span className="font-mono text-emerald-400">
                        {snap.transitions_summary?.new || 0} New • {snap.transitions_summary?.continuing || 0} Cont
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Completion Modal */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-bg-card border border-border-subtle rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <Lock className="w-6 h-6" />
              <h3 className="text-base font-bold text-text-primary">
                Formal Project Completion & Final Risk Summary
              </h3>
            </div>
            <p className="text-xs text-text-muted">
              Closing the risk lifecycle generates a final project summary snapshot. Only risks with verified completion evidence or an authorized resolution will be marked closed. Historical audit records remain preserved.
            </p>

            <div>
              <label className="block text-xs font-semibold text-text-primary mb-1">
                Completion Evidence / Authorized Sign-Off Decision *
              </label>
              <textarea
                value={completionEvidence}
                onChange={(e) => setCompletionEvidence(e.target.value)}
                placeholder="Enter client formal sign-off reference, deliverable handover memo, or final acceptance certificate..."
                className="w-full h-24 p-3 bg-surface border border-border-base rounded-lg text-xs text-text-primary focus:outline-none focus:border-accent"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCompletionModal(false)}
                className="px-4 py-2 bg-surface hover:bg-surface-hover text-text-muted text-xs font-medium rounded-lg border border-border-subtle"
              >
                Cancel
              </button>
              <button
                onClick={handleCompleteProject}
                disabled={completing || !completionEvidence.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-all"
              >
                {completing ? "Generating Final Summary..." : "Confirm Project Completion"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

