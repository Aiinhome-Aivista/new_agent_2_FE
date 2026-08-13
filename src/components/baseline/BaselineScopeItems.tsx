import React from "react";
import { Plus, Download, Search, Info, Edit, Trash2, MapPin, ExternalLink, ShieldAlert, ArrowRight, CornerDownRight, CheckCircle2, FileText, AlertTriangle, Clock } from "lucide-react";

export interface BaselineScopeItemsProps {
  user: any;
  project: any;
  baseline: any;
  showExportDropdown: boolean;
  setShowExportDropdown: (show: boolean) => void;
  handleExportWord: () => void;
  handleExportPDF: () => void;
  
  setShowAddItemModal: (show: boolean) => void;
  setShowExtractModal: (show: boolean) => void;
  inScopeItems: any[];
  getItemVersion: (itemId: number) => any;
  formatDate: (dateStr: string | null | undefined) => string;
  outOfScopeItems: any[];
  setDeletingItemId: (id: number | null) => void;
}

export const BaselineScopeItems: React.FC<BaselineScopeItemsProps> = ({
  user,
  project,
  baseline,
  showExportDropdown,
  setShowExportDropdown,
  handleExportWord,
  handleExportPDF,
  
  setShowAddItemModal,
  setShowExtractModal,
  inScopeItems,
  getItemVersion,
  formatDate,
  outOfScopeItems,
  setDeletingItemId,
}) => {
  return (
    <>
            <div className="mb-12 border-b border-border-subtle"></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Scope Items Baseline</h2>
              <div className="flex items-center gap-3">
                {(user?.role === "ADMIN" ||
                  user?.role === "ENGAGEMENT_MANAGER") &&
                  project?.monitoring_status !== "CLOSED" && (
                    <button
                      onClick={() => setShowAddItemModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-md flex items-center gap-2 cursor-pointer transition-all shadow-md text-xs font-semibold"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Scope Item</span>
                    </button>
                  )}
                {baseline && (
                  <div className="relative">
                    <button
                      onClick={() => setShowExportDropdown(!showExportDropdown)}
                      className="px-4 py-2 bg-bg-hover hover:bg-bg-hover text-text-primary border border-border-strong hover:border-border-strong rounded-md flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export</span>
                    </button>
                    {showExportDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowExportDropdown(false)}
                        ></div>
                        <div className="absolute right-0 mt-2 w-48 bg-bg-card border border-border-strong rounded-lg shadow-xl py-1 z-25 animate-fadeIn">
                          <button
                            onClick={() => {
                              handleExportWord();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                            <span>Word Document (.doc)</span>
                          </button>
                          <button
                            onClick={() => {
                              handleExportPDF();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-hover hover:text-text-primary transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-rose-500 dark:text-rose-400" />
                            <span>PDF Report</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Left Column - In Scope */}
              <div className="flex flex-col bg-bg-card/30 backdrop-blur-md rounded-2xl p-6 border border-border-subtle/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-lg font-bold text-text-primary tracking-tight">
                      In Scope
                    </h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shadow-sm">
                    {inScopeItems.length}{" "}
                    {inScopeItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {inScopeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border-subtle rounded-xl bg-bg-hover">
                    <p className="text-text-muted text-sm">
                      No in-scope items identified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                    {inScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-bg-hover/60 hover:bg-bg-hover/90 rounded-xl border border-border-strong/60 hover:border-emerald-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-text-primary group-hover:text-emerald-300 transition-colors flex items-center gap-2">
                              {item.scope_item_normalized || item.name}
                              {item.completion_status === "COMPLETED" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                                  COMPLETED
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(() => {
                                const versionLabel = getItemVersion(
                                  item.source_document_id,
                                );
                                if (!versionLabel) return null;
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-800/30">
                                    {versionLabel}
                                  </span>
                                );
                              })()}
                              {(user?.role === "ADMIN" ||
                                user?.role === "ENGAGEMENT_MANAGER") &&
                                project?.monitoring_status !== "CLOSED" && (
                                  <>
                                    {item.completion_status === "COMPLETED" && (
                                      <div
                                        title="Completed"
                                        className="p-1.5 rounded-lg flex-shrink-0 border text-emerald-400 bg-emerald-950/30 border-emerald-500/20"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingItemId(item.id);
                                      }}
                                      title="Delete scope item"
                                      className="p-1.5 text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </div>
                          <details className="mt-3 mb-4 group cursor-pointer">
                            <summary className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors list-none flex items-center">
                              <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">
                                ▶
                              </span>
                              AI Extraction Details
                            </summary>
                            <div className="mt-3 space-y-3 p-3 bg-bg-card/60 rounded-lg border border-border-strong/40">
                              {item.description && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    AI Reasoning
                                  </h5>
                                  <p className="text-xs text-text-secondary italic leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              )}
                              {item.evidence_text && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    Evidence
                                  </h5>
                                  <p className="text-xs text-text-secondary italic leading-relaxed">
                                    {item.evidence_text}
                                  </p>
                                </div>
                              )}
                              {item.name && item.scope_item_normalized && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    Original Text
                                  </h5>
                                  <p className="text-xs text-text-secondary font-serif italic">
                                    {item.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </details>

                          {item.status_change_tag && (
                            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-500 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {item.status_change_tag}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border-strong/20">
                          {/* Milestone & Deadline Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.milestone && (
                              <span className="text-blue-300 font-semibold bg-blue-950/45 px-2 py-0.5 rounded border border-blue-800/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                {item.milestone}
                              </span>
                            )}
                            {item.deadline_text && (
                              <span
                                className="text-purple-600 dark:text-purple-300 font-semibold bg-purple-950/45 px-2 py-0.5 rounded border border-purple-800/30 flex items-center gap-1"
                                title={
                                  item.deadline
                                    ? formatDate(item.deadline)
                                    : "Unnormalized"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                {item.deadline_text}
                              </span>
                            )}
                            {item.extraction_method && (
                              <span className="text-text-muted font-medium text-[10px] bg-bg-hover px-1.5 py-0.5 rounded ml-auto">
                                By: {item.extraction_method}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-emerald-400 px-2.5 py-0.5 bg-emerald-950/40 rounded border border-emerald-800/30">
                              {item.scope_type}
                            </span>
                            <span className="text-text-muted font-medium">
                              Confidence: {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right Column - Out of Scope */}
              <div className="flex flex-col bg-bg-card/30 backdrop-blur-md rounded-2xl p-6 border border-border-subtle/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-border-subtle">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                    </span>
                    <h3 className="text-lg font-bold text-text-primary tracking-tight">
                      Out of Scope
                    </h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-rose-500/10 text-rose-500 dark:text-rose-400 rounded-full border border-rose-500/20 shadow-sm">
                    {outOfScopeItems.length}{" "}
                    {outOfScopeItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {outOfScopeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-border-subtle rounded-xl bg-bg-hover">
                    <p className="text-text-muted text-sm">
                      No out-of-scope items identified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                    {outOfScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-bg-hover/60 hover:bg-bg-hover/90 rounded-xl border border-border-strong/60 hover:border-rose-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-text-primary group-hover:text-rose-600 dark:text-rose-300 transition-colors flex items-center gap-2">
                              {item.scope_item_normalized || item.name}
                              {item.completion_status === "COMPLETED" && (
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800/30">
                                  COMPLETED
                                </span>
                              )}
                            </h4>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {(() => {
                                const versionLabel = getItemVersion(
                                  item.source_document_id,
                                );
                                if (!versionLabel) return null;
                                return (
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-800/30">
                                    {versionLabel}
                                  </span>
                                );
                              })()}
                              {(user?.role === "ADMIN" ||
                                user?.role === "ENGAGEMENT_MANAGER") &&
                                project?.monitoring_status !== "CLOSED" && (
                                  <>
                                    {item.completion_status === "COMPLETED" && (
                                      <div
                                        title="Completed"
                                        className="p-1.5 rounded-lg flex-shrink-0 border text-emerald-400 bg-emerald-950/30 border-emerald-500/20"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeletingItemId(item.id);
                                      }}
                                      title="Delete scope item"
                                      className="p-1.5 text-rose-400 hover:text-white bg-rose-950/30 hover:bg-rose-900/50 border border-rose-500/20 rounded-lg transition-colors cursor-pointer flex-shrink-0"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                            </div>
                          </div>
                          <details className="mt-3 mb-4 group cursor-pointer">
                            <summary className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors list-none flex items-center">
                              <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">
                                ▶
                              </span>
                              AI Extraction Details
                            </summary>
                            <div className="mt-3 space-y-3 p-3 bg-bg-card/60 rounded-lg border border-border-strong/40">
                              {item.description && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    AI Reasoning
                                  </h5>
                                  <p className="text-xs text-text-secondary italic leading-relaxed">
                                    {item.description}
                                  </p>
                                </div>
                              )}
                              {item.evidence_text && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    Evidence
                                  </h5>
                                  <p className="text-xs text-text-secondary italic leading-relaxed">
                                    {item.evidence_text}
                                  </p>
                                </div>
                              )}
                              {item.name && item.scope_item_normalized && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                    Original Text
                                  </h5>
                                  <p className="text-xs text-text-secondary font-serif italic">
                                    {item.name}
                                  </p>
                                </div>
                              )}
                            </div>
                          </details>

                          {item.status_change_tag && (
                            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-500 dark:text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {item.status_change_tag}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-border-strong/20">
                          {/* Milestone & Deadline Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.milestone && (
                              <span className="text-blue-300 font-semibold bg-blue-950/45 px-2 py-0.5 rounded border border-blue-800/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />
                                {item.milestone}
                              </span>
                            )}
                            {item.deadline_text && (
                              <span
                                className="text-purple-600 dark:text-purple-300 font-semibold bg-purple-950/45 px-2 py-0.5 rounded border border-purple-800/30 flex items-center gap-1"
                                title={
                                  item.deadline
                                    ? formatDate(item.deadline)
                                    : "Unnormalized"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                                {item.deadline_text}
                              </span>
                            )}
                            {item.extraction_method && (
                              <span className="text-text-muted font-medium text-[10px] bg-bg-hover px-1.5 py-0.5 rounded ml-auto">
                                By: {item.extraction_method}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span
                              className={`font-semibold px-2.5 py-0.5 rounded border ${
                                item.scope_type === "OUT_OF_SCOPE"
                                  ? "text-rose-500 dark:text-rose-400 bg-rose-950/40 border-rose-800/30"
                                  : "text-blue-500 dark:text-blue-400 bg-blue-950/40 border-blue-800/30"
                              }`}
                            >
                              {item.scope_type}
                            </span>
                            <span className="text-text-muted font-medium">
                              Confidence: {(item.confidence * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

    </>
  );
};
