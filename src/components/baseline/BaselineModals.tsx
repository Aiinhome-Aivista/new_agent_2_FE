import React from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  Zap,
  ScanSearch,
  Info,
} from "lucide-react";

export interface BaselineModalsProps {
  // Extract Modal Props
  showExtractModal: boolean;
  setShowExtractModal: (show: boolean) => void;
  eligibleDocs: any[];
  extractingDocId: number | null;
  setExtractingDocId: (id: number | null) => void;
  completedDocIds: number[];
  selectedDocIds: number[];
  toggleDocSelection: (id: number) => void;
  extracting: boolean;
  confirmExtractAll: () => void;
  extractionMode: "QUICK" | "DEEP_SCAN";
  setExtractionMode: (mode: "QUICK" | "DEEP_SCAN") => void;

  // Add Item Modal Props
  showAddItemModal: boolean;
  setShowAddItemModal: (show: boolean) => void;
  handleAddItem: (e: React.FormEvent) => void;
  newItemScopeType: "IN_SCOPE" | "OUT_OF_SCOPE";
  setNewItemScopeType: (type: "IN_SCOPE" | "OUT_OF_SCOPE") => void;
  newItemName: string;
  setNewItemName: (name: string) => void;
  newItemDescription: string;
  setNewItemDescription: (desc: string) => void;
  newItemEvidence: string;
  setNewItemEvidence: (ev: string) => void;
  newItemMilestone: string;
  setNewItemMilestone: (m: string) => void;
  newItemDeadline: string;
  setNewItemDeadline: (d: string) => void;
  addingItem: boolean;

  // Delete Item Modal Props
  deletingItemId: number | null;
  setDeletingItemId: (id: number | null) => void;
  handleDeleteItem: (id: number) => void;
  deletingItem: boolean;

  // Schedule Deliverable / Milestone Modal Props
  showScheduleModal?: boolean;
  setShowScheduleModal?: (show: boolean) => void;
  schedulingItem?: any | null;
  scheduleMilestone?: string;
  setScheduleMilestone?: (m: string) => void;
  scheduleDeadline?: string;
  setScheduleDeadline?: (d: string) => void;
  scheduleDependencies?: string[];
  setScheduleDependencies?: React.Dispatch<React.SetStateAction<string[]>>;
  availablePredecessors?: any[];
  handleConfirmSchedule?: (e: React.FormEvent) => void;
  savingSchedule?: boolean;
}

export const BaselineModals: React.FC<BaselineModalsProps> = ({
  showExtractModal,
  setShowExtractModal,
  eligibleDocs,
  extractingDocId,
  setExtractingDocId,
  completedDocIds,
  selectedDocIds,
  toggleDocSelection,
  extracting,
  confirmExtractAll,
  extractionMode,
  setExtractionMode,

  showAddItemModal,
  setShowAddItemModal,
  handleAddItem,
  newItemScopeType,
  setNewItemScopeType,
  newItemName,
  setNewItemName,
  newItemDescription,
  setNewItemDescription,
  newItemEvidence,
  setNewItemEvidence,
  newItemMilestone,
  setNewItemMilestone,
  newItemDeadline,
  setNewItemDeadline,
  addingItem,

  deletingItemId,
  setDeletingItemId,
  handleDeleteItem,
  deletingItem,

  showScheduleModal = false,
  setShowScheduleModal = () => {},
  schedulingItem = null,
  scheduleMilestone = "",
  setScheduleMilestone = () => {},
  scheduleDeadline = "",
  setScheduleDeadline = () => {},
  scheduleDependencies = [],
  setScheduleDependencies = () => {},
  availablePredecessors = [],
  handleConfirmSchedule = () => {},
  savingSchedule = false,
}) => {
  return (
    <>
      {/* EXTRACT BASELINE MODAL */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-border-strong rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-text-primary">
              Select Contract for Baseline
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Choose a processed contract to extract scope items or budget details into your baseline.
            </p>

            {/* Extraction mode selector */}
            <div className="mb-6">
              <label className="block text-xs font-semibold uppercase tracking-wide text-text-muted mb-2">
                Extraction Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setExtractionMode("QUICK")}
                  disabled={extracting}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    extractionMode === "QUICK"
                      ? "border-[#00e5ff] bg-[#00e5ff]/10 ring-1 ring-[#00e5ff]"
                      : "border-border-strong bg-bg-hover hover:border-cyan-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Zap
                      className={`h-4 w-4 ${
                        extractionMode === "QUICK"
                          ? "text-[#00e5ff]"
                          : "text-text-muted"
                      }`}
                    />
                    <span className="text-sm font-semibold text-text-primary">
                      Quick Extract
                    </span>
                  </div>
                  <span className="text-[11px] leading-snug text-text-muted">
                    Fast &amp; token-efficient. Best for standard contracts.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setExtractionMode("DEEP_SCAN")}
                  disabled={extracting}
                  className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
                    extractionMode === "DEEP_SCAN"
                      ? "border-[#00e5ff] bg-[#00e5ff]/10 ring-1 ring-[#00e5ff]"
                      : "border-border-strong bg-bg-hover hover:border-cyan-700"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ScanSearch
                      className={`h-4 w-4 ${
                        extractionMode === "DEEP_SCAN"
                          ? "text-[#00e5ff]"
                          : "text-text-muted"
                      }`}
                    />
                    <span className="text-sm font-semibold text-text-primary">
                      Deep Scan
                    </span>
                  </div>
                  <span className="text-[11px] leading-snug text-text-muted">
                    Thorough Map-Reduce sweep. Best for dense or complex docs.
                  </span>
                </button>
              </div>
            </div>

            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {eligibleDocs.map((doc) => {
                const isExtractingThis = extractingDocId === doc.id;
                const isCompletedThis = completedDocIds.includes(doc.id);
                const isChecked = selectedDocIds.includes(doc.id);
                return (
                  <div
                    key={doc.id}
                    className="flex justify-between items-center bg-bg-hover p-3 rounded-lg border border-border-strong gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="contract_selection"
                        checked={isChecked}
                        onChange={() => toggleDocSelection(doc.id)}
                        disabled={extracting}
                        className="w-4 h-4 rounded-full border-gray-600 text-[#00e5ff] focus:ring-[#00e5ff] bg-bg-hover cursor-pointer"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-medium text-text-primary break-words">
                          {doc.document_name}
                        </span>
                        <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold uppercase">
                          {doc.document_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExtractingThis ? (
                        <div className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Extracting...</span>
                        </div>
                      ) : isCompletedThis ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-text-muted text-xs font-semibold">
                          <Clock className="h-4 w-4" />
                          <span>Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Processing Duration Disclaimer */}
            <div className="mb-6 p-3 bg-cyan-950/20 border border-cyan-500/20 rounded-xl text-text-muted text-[11px] leading-relaxed flex items-start gap-2.5">
              <Info className="w-4 h-4 text-[#00e5ff] shrink-0 mt-0.5" />
              <span>
                <strong className="text-text-primary">Note:</strong> Processing may take from a few minutes up to an hour depending on contract size, token density, internet speed, and LLM model response latency.
              </span>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:bg-bg-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={extracting}
              >
                Cancel
              </button>
              <button
                onClick={confirmExtractAll}
                disabled={extracting || selectedDocIds.length === 0}
                className="flex items-center gap-2 px-4 py-2 bg-[#00e5ff] hover:bg-[#00cce5] disabled:bg-cyan-900/50 text-black disabled:text-cyan-700 font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    Extracting...
                  </>
                ) : (
                  "Extract Baseline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD SCOPE ITEM MODAL */}
      {showAddItemModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-bg-panel border border-border-strong/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-text-primary mb-1">
                Add Scope Item
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Manually add an in-scope or out-of-scope clause item to this
                baseline.
              </p>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Scope Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType("IN_SCOPE")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                        newItemScopeType === "IN_SCOPE"
                          ? "bg-emerald-100 dark:bg-emerald-500/20 border-emerald-400 dark:border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold shadow-xs"
                          : "bg-bg-card border-border-strong text-text-muted"
                      }`}
                    >
                      In Scope
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType("OUT_OF_SCOPE")}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer ${
                        newItemScopeType === "OUT_OF_SCOPE"
                          ? "bg-rose-100 dark:bg-rose-500/20 border-rose-400 dark:border-rose-500 text-rose-800 dark:text-rose-300 font-bold shadow-xs"
                          : "bg-bg-card border-border-strong text-text-muted"
                      }`}
                    >
                      Out of Scope
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Item Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SOC 2 Type II Audit Compliance"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className="w-full bg-bg-card border border-border-strong rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Description & Scope Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Summarize the scope requirement or exclusion details..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full bg-bg-card border border-border-strong rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Reasoning / Reference Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manually added during EM baseline review"
                    value={newItemEvidence}
                    onChange={(e) => setNewItemEvidence(e.target.value)}
                    className="w-full bg-bg-card border border-border-strong rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-teal-500"
                  />
                </div>

                {newItemScopeType === "IN_SCOPE" && (
                  <div className="p-3.5 bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-3">
                    <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Timeline &amp; Milestone Planning (Optional)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-text-muted mb-1">
                          Milestone / Phase Name (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Phase 1 - Discovery"
                          value={newItemMilestone}
                          onChange={(e) => setNewItemMilestone(e.target.value)}
                          className="w-full bg-bg-card border border-border-strong rounded-xl px-3 py-2 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-text-muted mb-1">
                          Target Completion Date (Optional)
                        </label>
                        <input
                          type="date"
                          value={newItemDeadline}
                          onChange={(e) => setNewItemDeadline(e.target.value)}
                          className="w-full bg-bg-card border border-border-strong rounded-xl px-3 py-2 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-teal-500"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-text-muted leading-relaxed">
                      Leave blank if the delivery timeline is not yet determined. You can schedule it or link dependencies later directly from the scope list or when MoM updates arrive.
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    disabled={addingItem}
                    className="flex-1 py-2.5 bg-bg-hover hover:bg-bg-hover text-text-secondary rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem || !newItemName.trim()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {addingItem ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Save Scope Item"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* SCHEDULE MILESTONE / ADD TO TIMELINE CONFIRMATION MODAL */}
      {showScheduleModal && schedulingItem &&
        createPortal(
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-bg-panel border border-border-strong/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto">
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">
                    Schedule on Deliverables Timeline
                  </h3>
                  <p className="text-xs text-text-muted">
                    Assign a target completion date &amp; milestone to add this deliverable to the interactive timeline.
                  </p>
                </div>
              </div>

              {/* Selected Item Summary */}
              <div className="my-4 p-3 bg-bg-card/70 border border-border-subtle rounded-xl">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-1">
                  In-Scope Deliverable
                </span>
                <p className="text-xs font-semibold text-text-primary">
                  {schedulingItem.scope_item_normalized || schedulingItem.name}
                </p>
                {schedulingItem.description && (
                  <p className="text-[11px] text-text-muted mt-1 line-clamp-2">
                    {schedulingItem.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleConfirmSchedule} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Milestone / Phase Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sprint 3 Deliverable, Phase 1 - Discovery"
                    value={scheduleMilestone}
                    onChange={(e) => setScheduleMilestone(e.target.value)}
                    className="w-full bg-bg-card border border-border-strong rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Target Completion Date (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDeadline}
                    onChange={(e) => setScheduleDeadline(e.target.value)}
                    className="w-full bg-bg-card border border-border-strong rounded-xl px-4 py-2.5 text-xs text-text-primary placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {availablePredecessors && availablePredecessors.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1.5">
                      Execution Prerequisites / Dependencies (Optional)
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 bg-bg-card/50 border border-border-subtle rounded-xl">
                      {availablePredecessors
                        .filter((p: any) => p.id !== schedulingItem.id)
                        .map((pred: any) => {
                          const val = pred.name || pred.scope_item_normalized;
                          const isChecked = scheduleDependencies.includes(val);
                          return (
                            <label
                              key={pred.id}
                              className="flex items-center gap-2 p-1.5 hover:bg-bg-hover rounded-lg text-xs cursor-pointer text-text-secondary hover:text-text-primary transition-colors"
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setScheduleDependencies((prev) => [...prev, val]);
                                  } else {
                                    setScheduleDependencies((prev) => prev.filter((x) => x !== val));
                                  }
                                }}
                                className="rounded border-border-strong text-cyan-600 focus:ring-cyan-500"
                              />
                              <span className="truncate">{val}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-border-subtle">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    disabled={savingSchedule}
                    className="flex-1 py-2.5 bg-bg-hover hover:bg-bg-hover text-text-secondary rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSchedule || !scheduleDeadline || !scheduleMilestone.trim()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-cyan-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {savingSchedule ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Confirm & Add to Timeline"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body,
        )}

      {/* DELETE SCOPE ITEM MODAL */}
      {deletingItemId !== null &&
        createPortal(
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-bg-panel border border-border-strong/80 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-center my-auto">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500 dark:text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-text-primary mb-2">
                Remove Scope Item
              </h3>
              <p className="text-xs text-text-muted mb-6">
                Are you sure you want to delete this scope item from the
                baseline?
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setDeletingItemId(null)}
                  disabled={deletingItem}
                  className="flex-1 py-2.5 bg-bg-hover hover:bg-bg-hover text-text-secondary rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteItem(deletingItemId)}
                  disabled={deletingItem}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  {deletingItem ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Confirm Delete"
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
};
