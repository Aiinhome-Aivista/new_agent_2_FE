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
  addingItem: boolean;

  // Delete Item Modal Props
  deletingItemId: number | null;
  setDeletingItemId: (id: number | null) => void;
  handleDeleteItem: (id: number) => void;
  deletingItem: boolean;
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
  addingItem,

  deletingItemId,
  setDeletingItemId,
  handleDeleteItem,
  deletingItem,
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
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
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
                          ? "bg-rose-500/20 border-rose-500 text-rose-600 dark:text-rose-300"
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
                    className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
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
