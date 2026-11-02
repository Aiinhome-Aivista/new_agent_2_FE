import React from "react";
import { createPortal } from "react-dom";
import {
  Loader2,
  CheckCircle2,
  Clock,
  X,
  Trash2,
  Zap,
  Info,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

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
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <>
      {/* ── 1. EXTRACT BASELINE MODAL ── */}
      {showExtractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div
            className={`border rounded-3xl p-6 sm:p-7 w-full max-w-lg shadow-2xl transition-all ${
              isDark
                ? "bg-[#18181c] border-white/10 text-white"
                : "bg-white border-slate-200 text-slate-900"
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200/80 dark:border-white/10 mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] flex items-center justify-center text-white shadow-md shadow-[#FF5A14]/20 shrink-0">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold tracking-tight">
                    Select Contract for Baseline
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                    Extract structured scope items, deliverables, and milestones.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowExtractModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Document list */}
            <div className="space-y-2 mb-5 max-h-56 overflow-y-auto pr-1">
              {eligibleDocs.map((doc) => {
                const isExtractingThis = extractingDocId === doc.id;
                const isCompletedThis = completedDocIds.includes(doc.id);
                const isChecked = selectedDocIds.includes(doc.id);

                return (
                  <div
                    key={doc.id}
                    onClick={() => !extracting && toggleDocSelection(doc.id)}
                    className={`flex justify-between items-center p-3 rounded-xl border transition-all cursor-pointer ${
                      isChecked
                        ? isDark
                          ? "bg-[#251914] border-[#FF5A14]/50 shadow-xs"
                          : "bg-orange-50/70 border-orange-200 shadow-xs"
                        : isDark
                        ? "bg-white/5 border-white/5 hover:bg-white/10"
                        : "bg-slate-50 border-slate-200/80 hover:bg-slate-100"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="radio"
                        name="contract_selection"
                        checked={isChecked}
                        onChange={() => toggleDocSelection(doc.id)}
                        disabled={extracting}
                        className="w-4 h-4 text-[#FF5A14] focus:ring-[#FF5A14] cursor-pointer"
                      />
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold truncate">
                          {doc.document_name}
                        </span>
                        <span className="text-[10px] text-[#FF5A14] font-semibold uppercase mt-0.5">
                          {doc.document_type || "Contract"}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isExtractingThis ? (
                        <div className="flex items-center gap-1.5 text-[#FF5A14] text-xs font-semibold">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Extracting...</span>
                        </div>
                      ) : isCompletedThis ? (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-slate-400 dark:text-gray-400 text-xs">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Ready</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Note box */}
            <div
              className={`mb-6 p-3 rounded-xl border text-[11px] leading-relaxed flex items-start gap-2.5 ${
                isDark
                  ? "bg-white/5 border-white/10 text-gray-300"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <Info className="w-4 h-4 text-[#FF5A14] shrink-0 mt-0.5" />
              <span>
                <strong>Note:</strong> Extraction uses the LLM to identify all contract commitments, scope boundaries, and execution milestones.
              </span>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <button
                type="button"
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-gray-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                disabled={extracting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmExtractAll}
                disabled={extracting || selectedDocIds.length === 0}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#e04f12] hover:to-[#e06d3d] text-white text-xs font-bold rounded-xl shadow-md shadow-[#FF5A14]/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Extracting Baseline...</span>
                  </>
                ) : (
                  <span>Extract Baseline</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 2. ADD SCOPE ITEM MODAL ── */}
      {showAddItemModal &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div
              className={`border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative my-auto transition-all ${
                isDark
                  ? "bg-[#18181c] border-white/10 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <button
                onClick={() => setShowAddItemModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-extrabold tracking-tight mb-1">
                Add Scope Item
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-5">
                Manually add an in-scope deliverable or out-of-scope clause to this baseline.
              </p>

              <form onSubmit={handleAddItem} className="space-y-4">
                {/* Classification buttons */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1.5">
                    Scope Classification *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType("IN_SCOPE")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newItemScopeType === "IN_SCOPE"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-600 dark:text-emerald-400 shadow-xs"
                          : isDark
                          ? "bg-white/5 border-white/10 text-gray-400"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      ✓ In Scope
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType("OUT_OF_SCOPE")}
                      className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                        newItemScopeType === "OUT_OF_SCOPE"
                          ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-600 dark:text-rose-400 shadow-xs"
                          : isDark
                          ? "bg-white/5 border-white/10 text-gray-400"
                          : "bg-slate-50 border-slate-200 text-slate-500"
                      }`}
                    >
                      ✕ Out of Scope
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                    Item Title / Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Kick-off Meeting & Alignment"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs border focus:outline-none focus:border-[#FF5A14] transition-colors ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                    Description &amp; Deliverable Details
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Summarize the scope requirement or exclusion details..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs border focus:outline-none focus:border-[#FF5A14] resize-none transition-colors ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                    Reasoning / Reference Notes
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Manually added during EM baseline review"
                    value={newItemEvidence}
                    onChange={(e) => setNewItemEvidence(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs border focus:outline-none focus:border-[#FF5A14] transition-colors ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                {newItemScopeType === "IN_SCOPE" && (
                  <div
                    className={`p-4 rounded-2xl border space-y-3 ${
                      isDark
                        ? "bg-white/5 border-white/10"
                        : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[#FF5A14] font-bold text-xs">
                      <Clock className="w-3.5 h-3.5" />
                      Timeline &amp; Milestone Planning (Optional)
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                          Milestone Name
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Phase 1 - Discovery"
                          value={newItemMilestone}
                          onChange={(e) => setNewItemMilestone(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#FF5A14] ${
                            isDark
                              ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                              : "bg-white border-slate-200 text-slate-900 placeholder-slate-400"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                          Target Completion Date
                        </label>
                        <input
                          type="date"
                          value={newItemDeadline}
                          onChange={(e) => setNewItemDeadline(e.target.value)}
                          className={`w-full rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-[#FF5A14] ${
                            isDark
                              ? "bg-white/5 border-white/10 text-white"
                              : "bg-white border-slate-200 text-slate-900"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowAddItemModal(false)}
                    disabled={addingItem}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addingItem || !newItemName.trim()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#e04f12] hover:to-[#e06d3d] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5A14]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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

      {/* ── 3. SCHEDULE DELIVERABLE MODAL ── */}
      {showScheduleModal && schedulingItem &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div
              className={`border rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl relative my-auto transition-all ${
                isDark
                  ? "bg-[#18181c] border-white/10 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <button
                onClick={() => setShowScheduleModal(false)}
                className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] flex items-center justify-center text-white shadow-md shadow-[#FF5A14]/20 shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold tracking-tight">
                    Schedule on Deliverables Timeline
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Assign a target completion date to track this milestone on the timeline.
                  </p>
                </div>
              </div>

              {/* Selected Item Summary */}
              <div
                className={`my-4 p-3.5 rounded-2xl border ${
                  isDark
                    ? "bg-white/5 border-white/10"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <span className="text-[10px] font-bold text-[#FF5A14] uppercase tracking-wider block mb-1">
                  Deliverable Name
                </span>
                <p className="text-xs font-bold">
                  {schedulingItem.scope_item_normalized || schedulingItem.name}
                </p>
                {schedulingItem.description && (
                  <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-1 line-clamp-2">
                    {schedulingItem.description}
                  </p>
                )}
              </div>

              <form onSubmit={handleConfirmSchedule} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                    Milestone / Phase Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Project Kick-off, Phase 1 - Discovery"
                    value={scheduleMilestone}
                    onChange={(e) => setScheduleMilestone(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs border focus:outline-none focus:border-[#FF5A14] ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white placeholder-gray-500"
                        : "bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400"
                    }`}
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1">
                    Target Completion Date (Deadline) *
                  </label>
                  <input
                    type="date"
                    required
                    value={scheduleDeadline}
                    onChange={(e) => setScheduleDeadline(e.target.value)}
                    className={`w-full rounded-xl px-4 py-2.5 text-xs border focus:outline-none focus:border-[#FF5A14] ${
                      isDark
                        ? "bg-white/5 border-white/10 text-white"
                        : "bg-slate-50 border-slate-200 text-slate-900"
                    }`}
                  />
                </div>

                {availablePredecessors && availablePredecessors.length > 0 && (
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 mb-1.5">
                      Execution Prerequisites / Dependencies (Optional)
                    </label>
                    <div
                      className={`max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-xl border ${
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-slate-50 border-slate-200"
                      }`}
                    >
                      {availablePredecessors
                        .filter((p: any) => p.id !== schedulingItem.id)
                        .map((pred: any) => {
                          const val = pred.name || pred.scope_item_normalized;
                          const isChecked = scheduleDependencies.includes(val);
                          return (
                            <label
                              key={pred.id}
                              className={`flex items-center gap-2 p-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                                isDark
                                  ? "hover:bg-white/10 text-gray-300 hover:text-white"
                                  : "hover:bg-slate-100 text-slate-700 hover:text-slate-900"
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setScheduleDependencies((prev) => [...prev, val]);
                                  } else {
                                    setScheduleDependencies((prev) =>
                                      prev.filter((x) => x !== val),
                                    );
                                  }
                                }}
                                className="rounded text-[#FF5A14] focus:ring-[#FF5A14]"
                              />
                              <span className="truncate">{val}</span>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-slate-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setShowScheduleModal(false)}
                    disabled={savingSchedule}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingSchedule || !scheduleDeadline || !scheduleMilestone.trim()}
                    className="flex-1 py-2.5 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#e04f12] hover:to-[#e06d3d] text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-[#FF5A14]/25 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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

      {/* ── 4. DELETE SCOPE ITEM MODAL ── */}
      {deletingItemId !== null &&
        createPortal(
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div
              className={`border rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 sm:p-7 shadow-2xl text-center my-auto transition-all ${
                isDark
                  ? "bg-[#18181c] border-white/10 text-white"
                  : "bg-white border-slate-200 text-slate-900"
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto mb-4 text-rose-500">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-extrabold tracking-tight mb-1.5">
                Remove Scope Item
              </h3>
              <p className="text-xs text-slate-500 dark:text-gray-400 mb-6">
                Are you sure you want to delete this scope item from the baseline? This action cannot be undone.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setDeletingItemId(null)}
                  disabled={deletingItem}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-700 dark:text-gray-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteItem(deletingItemId)}
                  disabled={deletingItem}
                  className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
