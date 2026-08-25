import React, { useState } from "react";
import { CheckCircle2, AlertTriangle, RotateCcw, X, ShieldCheck, Link2 } from "lucide-react";

export interface PrerequisiteItem {
  id?: number;
  name: string;
  owner?: string;
  status?: string;
  isDone?: boolean;
}

export interface IncompletePredecessor {
  id?: number;
  name: string;
  status: string;
}

interface DeliverableCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetStatus: "COMPLETED" | "ACTIVE" | "CANCELLED";
  deliverableName: string;
  deliverableId: number;
  prerequisites: PrerequisiteItem[];
  incompletePredecessors: IncompletePredecessor[];
  onConfirm: (payload: {
    completion_status: string;
    completion_notes?: string;
    resolve_prerequisite_ids?: number[];
    resolve_prerequisite_names?: string[];
    resolve_upstream_scope_item_ids?: number[];
  }) => Promise<void>;
}

export const DeliverableCompletionModal: React.FC<DeliverableCompletionModalProps> = ({
  isOpen,
  onClose,
  targetStatus,
  deliverableName,
  deliverableId,
  prerequisites,
  incompletePredecessors,
  onConfirm,
}) => {
  if (!isOpen) return null;

  const isCompletedMode = targetStatus === "COMPLETED";
  const isRevertMode = targetStatus === "ACTIVE";

  // Filter pending prerequisites
  const pendingPrereqs = prerequisites.filter((p) => !p.isDone);

  // States
  const [notes, setNotes] = useState("");
  const [selectedPrereqIds, setSelectedPrereqIds] = useState<number[]>(
    pendingPrereqs.map((p, idx) => p.id || idx).filter((id): id is number => typeof id === "number")
  );
  const [resolveUpstream, setResolveUpstream] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const togglePrereq = (id: number) => {
    setSelectedPrereqIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const validPrereqDbIds = pendingPrereqs
        .filter((p, idx) => selectedPrereqIds.includes(p.id || idx) && p.id)
        .map((p) => p.id as number);

      const selectedPrereqNames = pendingPrereqs
        .filter((p, idx) => selectedPrereqIds.includes(p.id || idx))
        .map((p) => p.name);

      const upstreamIds = resolveUpstream
        ? incompletePredecessors.map((p) => p.id).filter((id): id is number => typeof id === "number")
        : [];

      await onConfirm({
        completion_status: targetStatus,
        completion_notes: notes.trim() || undefined,
        resolve_prerequisite_ids: isCompletedMode && validPrereqDbIds.length > 0 ? validPrereqDbIds : undefined,
        resolve_prerequisite_names: isCompletedMode && selectedPrereqNames.length > 0 ? selectedPrereqNames : undefined,
        resolve_upstream_scope_item_ids: isCompletedMode && upstreamIds.length > 0 ? upstreamIds : undefined,
      });
      onClose();
    } catch (err) {
      console.error("Completion update error:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div
          className={`px-6 py-4 flex items-center justify-between border-b ${
            isCompletedMode
              ? "bg-emerald-950/40 border-emerald-800/40"
              : isRevertMode
              ? "bg-amber-950/40 border-amber-800/40"
              : "bg-gray-800/50 border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {isCompletedMode ? (
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : isRevertMode ? (
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                <RotateCcw className="w-5 h-5" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-lg bg-gray-700 text-gray-300 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
            )}
            <div>
              <h3 className="text-sm font-bold text-gray-100">
                {isCompletedMode
                  ? "Complete Deliverable & Recalculate"
                  : isRevertMode
                  ? "Revert Deliverable to In Progress"
                  : "Update Deliverable Status"}
              </h3>
              <p className="text-[11px] text-gray-400 truncate max-w-sm">
                {deliverableName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-gray-300">
          {/* Revert Mode Warning */}
          {isRevertMode && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-800/50 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold text-amber-300">Reopening Deliverable</div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Setting this deliverable back to <strong>In Progress</strong> will update downstream milestones and restore dependent risk scores in the Risk Tracker.
                </p>
              </div>
            </div>
          )}

          {/* Upstream Predecessors Incomplete Warning (Zero-Assumption Architecture) */}
          {isCompletedMode && incompletePredecessors.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/30 border border-amber-600/50 space-y-2">
              <div className="flex items-center gap-2 text-amber-300 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>Upstream Predecessor Notice</span>
              </div>
              <p className="text-[11px] text-amber-200/80 leading-relaxed">
                The upstream item{" "}
                <strong>
                  "{incompletePredecessors.map((p) => p.name).join(", ")}"
                </strong>{" "}
                is still incomplete ({incompletePredecessors.map((p) => p.status).join(", ")}).
              </p>

              <div className="mt-2 space-y-1.5 pt-2 border-t border-amber-800/40">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="upstream_mode"
                    checked={!resolveUpstream}
                    onChange={() => setResolveUpstream(false)}
                    className="mt-0.5 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-gray-200">
                      Complete ONLY this deliverable (Recommended)
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Finished via sandbox, mock, or standalone auth. Upstream blockers remain active in the Risk Tracker.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="upstream_mode"
                    checked={resolveUpstream}
                    onChange={() => setResolveUpstream(true)}
                    className="mt-0.5 text-emerald-500 focus:ring-0"
                  />
                  <div>
                    <span className="font-semibold text-gray-200">
                      Also mark upstream predecessor(s) as COMPLETED
                    </span>
                    <p className="text-[10px] text-gray-400">
                      Select only if the upstream task was genuinely finalized as well.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Execution Prerequisites Checklist */}
          {isCompletedMode && pendingPrereqs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                  Associated Execution Prerequisites / Blockers:
                </label>
                <span className="text-[10px] text-gray-400">
                  {selectedPrereqIds.length} of {pendingPrereqs.length} selected
                </span>
              </div>
              <p className="text-[11px] text-gray-400">
                Check the items below if completing this deliverable also resolves them in the Risk Tracker:
              </p>

              <div className="space-y-1.5">
                {pendingPrereqs.map((prereq, idx) => {
                  const keyId = prereq.id || idx;
                  const isChecked = selectedPrereqIds.includes(keyId);
                  return (
                    <div
                      key={keyId}
                      onClick={() => togglePrereq(keyId)}
                      className={`p-2.5 rounded-lg border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                        isChecked
                          ? "bg-emerald-950/30 border-emerald-800/60 text-emerald-200"
                          : "bg-gray-800/40 border-gray-700/60 text-gray-400 hover:bg-gray-800/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}}
                          className="rounded text-emerald-500 focus:ring-0 cursor-pointer"
                        />
                        <span className="font-medium text-xs text-gray-200">
                          {prereq.name}
                        </span>
                      </div>
                      {prereq.owner && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-800 border border-gray-700 text-gray-300">
                          {prereq.owner}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Completion Context & Reason Input */}
          <div className="space-y-1.5">
            <label className="font-bold text-gray-200 block">
              {isCompletedMode
                ? "Completion Context & Notes (Fed to AI Agent):"
                : "Reopen / Change Reason (Optional):"}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={
                isCompletedMode
                  ? "e.g., Customer provided production credentials on email and integration testing passed successfully."
                  : "e.g., Deliverable was marked completed by mistake, reopened for further test verification."
              }
              className="w-full px-3 py-2 rounded-xl bg-gray-950/80 border border-gray-700 text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 text-xs transition-colors"
            />
            <p className="text-[10px] text-gray-500 italic">
              Logged to the project audit trail and immediately accessible by the RAG Chatbot & Risk Engine.
            </p>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer ${
                isCompletedMode
                  ? "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/30"
                  : isRevertMode
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/30"
                  : "bg-blue-600 hover:bg-blue-500 shadow-blue-900/30"
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Updating...
                </>
              ) : isCompletedMode ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Recalculate
                </>
              ) : (
                <>
                  <RotateCcw className="w-4 h-4" />
                  Confirm Status Change
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
