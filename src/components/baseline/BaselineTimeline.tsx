import { GanttSwimlaneTimeline } from "./GanttSwimlaneTimeline";
import React, { useState, useMemo } from "react";
import {
  Calendar,
  ChevronDown,
  ChevronRight,
  Check,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  FileCheck,
  Paperclip,
  Download,
  BarChart3,
  Rocket,
  Code2,
  Database,
  Flag,
  Repeat,
  X,
  AlertTriangle,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";
import {
  DeliverableCompletionModal,
  type PrerequisiteItem,
  type IncompletePredecessor,
} from "./DeliverableCompletionModal";

export interface BaselineTimelineProps {
  timelineItems: any[];
  recurringGroups: any[];
  selectedDeliverableId: number | null;
  setSelectedDeliverableId: (id: number | null) => void;
  activeIndex: number;
  handlePrev: () => void;
  handleNext: () => void;
  timelineContainerRef: React.RefObject<HTMLDivElement | null>;
  getMilestoneData: (itemName: string, milestoneName: string) => any;
  milestoneMap: Map<string, any>;
  user: any;
  project: any;
  handleUpdateCompletionStatus: (
    id: number,
    status: string,
    options?: any,
  ) => Promise<void> | void;
  handleRescheduleDeadline: (id: number, date: string) => void;
  formatDate: (dateStr: string | null | undefined) => string;
}

export const BaselineTimeline: React.FC<BaselineTimelineProps> = ({
  timelineItems,
  recurringGroups,
  selectedDeliverableId,
  setSelectedDeliverableId,
  activeIndex,
  handlePrev,
  handleNext,
  timelineContainerRef,
  getMilestoneData,
  milestoneMap,
  user,
  project,
  handleUpdateCompletionStatus,
  handleRescheduleDeadline,
  formatDate,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  // Filter state: 'ALL' | 'COMPLETED' | 'IN_PROGRESS' | 'PENDING'
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [activeTab, setActiveTab] = useState<"DETAILS" | "ATTACHMENTS" | "ACTIVITY">("DETAILS");
  const [showFullTimeline, setShowFullTimeline] = useState<boolean>(false);
  const [sortAscending, setSortAscending] = useState<boolean>(true);

  const [completionModal, setCompletionModal] = useState<{
    isOpen: boolean;
    targetStatus: "COMPLETED" | "ACTIVE" | "CANCELLED";
    deliverableName: string;
    deliverableId: number;
    prerequisites: PrerequisiteItem[];
    incompletePredecessors: IncompletePredecessor[];
  } | null>(null);

  // Normalize parsed items
  const parsedItems = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    return (timelineItems || []).map((item: any, idx: number) => {
      const raw =
        item.deadline_normalized ||
        item.deadline ||
        item.deadline_text ||
        item.estimated_deadline ||
        item.predicted_deadline ||
        null;

      let dateMs: number | null = null;
      let dateObj: Date | null = null;

      if (raw) {
        if (typeof raw === "string" && /^\d{4}-\d{2}-\d{2}/.test(raw)) {
          const parts = raw.substring(0, 10).split("-");
          const year = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(parts[2], 10);
          dateObj = new Date(year, month, day);
          dateObj.setHours(0, 0, 0, 0);
          dateMs = dateObj.getTime();
        } else {
          let d = new Date(raw);
          if (isNaN(d.getTime()) && typeof raw === "string") {
            d = new Date(raw.replace(" ", "T"));
          }
          if (!isNaN(d.getTime())) {
            d.setHours(0, 0, 0, 0);
            dateObj = d;
            dateMs = d.getTime();
          }
        }
      }

      const isExplicitDone =
        item.completion_status === "COMPLETED" ||
        item.completion_status === "CANCELLED";

      const completionStatus =
        (isExplicitDone ? item.completion_status : null) ||
        item.latest_progress?.status_code ||
        item.completion_status ||
        "ACTIVE";

      // Detect icon type from name/milestone
      const nameLower = (item.name || item.scope_item_normalized || item.milestone || "").toLowerCase();
      let iconType: "rocket" | "file" | "code" | "db" | "flag" = "flag";
      if (nameLower.includes("kick-off") || nameLower.includes("kickoff") || nameLower.includes("meeting") || nameLower.includes("launch")) {
        iconType = "rocket";
      } else if (nameLower.includes("initiat") || nameLower.includes("baseline") || nameLower.includes("contract") || nameLower.includes("setup")) {
        iconType = "file";
      } else if (nameLower.includes("workflow") || nameLower.includes("rag") || nameLower.includes("agent") || nameLower.includes("code") || nameLower.includes("api")) {
        iconType = "code";
      } else if (nameLower.includes("extract") || nameLower.includes("data") || nameLower.includes("pipeline") || nameLower.includes("ingest")) {
        iconType = "db";
      }

      // Format date labels
      const dateFormatted = dateObj
        ? dateObj.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
        : "Pending Date";
      
      const dayOfWeek = dateObj
        ? dateObj.toLocaleDateString("en-US", { weekday: "short" })
        : "TBD";

      const isToday = dateMs !== null && Math.abs(dateMs - todayMs) < 86400000;

      return {
        ...item,
        _dateMs: dateMs,
        _dateObj: dateObj,
        _idx: idx,
        _completionStatus: completionStatus,
        _isToday: isToday,
        _dateFormatted: dateFormatted,
        _dayOfWeek: dayOfWeek,
        _iconType: iconType,
      };
    });
  }, [timelineItems]);

  // Determine current "Today" index or anchor item
  const todayItemIndex = useMemo(() => {
    const todayIndex = parsedItems.findIndex((it) => it._isToday);
    if (todayIndex !== -1) return todayIndex;
    // Fallback: first active or upcoming item
    const firstActive = parsedItems.findIndex(
      (it) => it._completionStatus === "ACTIVE" || it._completionStatus === "IN_PROGRESS",
    );
    return firstActive !== -1 ? firstActive : 0;
  }, [parsedItems]);

  // Filter items based on active statusFilter
  const filteredItems = useMemo(() => {
    let items = parsedItems.filter((item) => {
      if (statusFilter === "ALL") return true;
      if (statusFilter === "COMPLETED") {
        return item._completionStatus === "COMPLETED";
      }
      if (statusFilter === "IN_PROGRESS") {
        return (
          item._completionStatus === "IN_PROGRESS" ||
          (item.latest_progress?.progress_percentage || 0) > 0 &&
          item._completionStatus !== "COMPLETED"
        );
      }
      if (statusFilter === "PENDING") {
        return (
          item._completionStatus === "ACTIVE" ||
          item._completionStatus === "PENDING" ||
          item._completionStatus === "BLOCKED"
        );
      }
      return true;
    });

    return items.sort((a, b) => {
      const aMs = a._dateMs || 0;
      const bMs = b._dateMs || 0;
      return sortAscending ? aMs - bMs : bMs - aMs;
    });
  }, [parsedItems, statusFilter, sortAscending]);

  // Active / Selected Deliverable
  const selectedItem = useMemo(() => {
    if (!timelineItems || timelineItems.length === 0) return null;
    return (
      parsedItems.find((d) => d.id === selectedDeliverableId) ||
      parsedItems[0] ||
      null
    );
  }, [parsedItems, selectedDeliverableId, timelineItems]);

  // Helper to render icon
  const renderItemIcon = (type: "rocket" | "file" | "code" | "db" | "flag") => {
    switch (type) {
      case "rocket":
        return <Rocket className="w-5 h-5 text-[#FF5A14]" />;
      case "file":
        return <FileCheck className="w-5 h-5 text-emerald-500" />;
      case "code":
        return <Code2 className="w-5 h-5 text-blue-500" />;
      case "db":
        return <Database className="w-5 h-5 text-amber-500" />;
      default:
        return <Flag className="w-5 h-5 text-slate-400 dark:text-gray-400" />;
    }
  };

  const getItemIconBg = (type: "rocket" | "file" | "code" | "db" | "flag") => {
    switch (type) {
      case "rocket":
        return "bg-orange-500/10 border-orange-500/20";
      case "file":
        return "bg-emerald-500/10 border-emerald-500/20";
      case "code":
        return "bg-blue-500/10 border-blue-500/20";
      case "db":
        return "bg-amber-500/10 border-amber-500/20";
      default:
        return "bg-slate-500/10 border-slate-500/20";
    }
  };

  // Helper to render status badge pill
  const renderStatusBadge = (status: string, size: "sm" | "md" = "sm") => {
    const isComp = status === "COMPLETED";
    const isInProg = status === "IN_PROGRESS";
    const isCancelled = status === "CANCELLED";

    if (isComp) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
            size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1 text-xs"
          } bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40 shadow-xs`}
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          Completed
        </span>
      );
    }

    if (isInProg) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
            size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1 text-xs"
          } bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-800/40 shadow-xs`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
          In Progress
        </span>
      );
    }

    if (isCancelled) {
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
            size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1 text-xs"
          } bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-800/40 shadow-xs`}
        >
          <X className="w-3.5 h-3.5" />
          Cancelled
        </span>
      );
    }

    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${
          size === "sm" ? "px-3 py-1 text-xs" : "px-3.5 py-1 text-xs"
        } bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200/60 dark:border-amber-800/40 shadow-xs`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        Pending
      </span>
    );
  };

  return (
    <div className="mb-10">
      {/* ── Outer Card Container ── */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
          isDark
            ? "bg-[#141416] border-white/10 shadow-2xl"
            : "bg-white border-slate-200/90 shadow-sm"
        }`}
      >
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
          <div className="flex items-center gap-3.5">
            {/* Orange Badge */}
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] flex items-center justify-center text-white shadow-md shadow-[#FF5A14]/25 shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  Deliverables Timeline
                </h2>
                {recurringGroups && recurringGroups.length > 0 && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-violet-500/15 border border-violet-500/30 text-violet-600 dark:text-violet-300">
                    <Repeat className="w-3 h-3" />
                    {recurringGroups.length} Recurring
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-gray-400 mt-0.5">
                Track project milestones, deliverables and their current status
              </p>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
            {[
              { id: "ALL", label: "All" },
              { id: "COMPLETED", label: "Completed" },
              { id: "IN_PROGRESS", label: "In Progress" },
              { id: "PENDING", label: "Pending" },
            ].map((tab) => {
              const isActive = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-4 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? "bg-[#FF5A14] text-white shadow-md shadow-[#FF5A14]/20"
                      : "bg-slate-100 hover:bg-slate-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}

            {/* Sort Toggle Button */}
            <button
              onClick={() => setSortAscending(!sortAscending)}
              className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-white/5 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 flex items-center justify-center transition-all cursor-pointer"
              title={sortAscending ? "Sorted Ascending (Click to reverse)" : "Sorted Descending"}
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${!sortAscending ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* ── Main Two-Column Layout ── */}
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF5A14] flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">
              No Deliverables Found
            </h4>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? `There are no deliverables currently matching the "${statusFilter.replace("_", " ")}" status.`
                : "No scheduled deliverables or milestones have been extracted yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* ── LEFT COLUMN: Vertical Timeline Track (7 cols) ── */}
            <div className="lg:col-span-7 xl:col-span-8 flex flex-col">
              {/* Scrollable Timeline List Container (Shorter height with custom scrollbar) */}
              <div className="max-h-[460px] overflow-y-auto pr-2.5 custom-scrollbar space-y-2.5 relative">
                {filteredItems.map((item, idx) => {
                  const isSelected = selectedDeliverableId === item.id;
                  const isTodayAnchor = idx === todayItemIndex;

                  return (
                    <div
                      key={item.id || idx}
                      className="flex items-center gap-3 sm:gap-4 relative group"
                    >
                      {/* 1. Left Timestamp Column */}
                      <div className="w-24 sm:w-28 flex-shrink-0 text-right">
                        {isTodayAnchor ? (
                          <div
                            className={`flex items-center gap-2 p-2 rounded-xl text-left shadow-xs transition-all ${
                              isDark
                                ? "bg-[#251914] border border-[#FF5A14]/40"
                                : "bg-orange-50/90 border border-orange-200"
                            }`}
                          >
                            <Calendar className="w-3.5 h-3.5 text-[#FF5A14] shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item._dateFormatted}
                              </p>
                              <p className="text-[10px] text-[#FF5A14] font-bold">
                                {item._dayOfWeek} • Today
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="pr-1">
                            <p className="text-xs font-bold text-slate-900 dark:text-gray-200">
                              {item._dateFormatted}
                            </p>
                            <p className="text-[11px] text-slate-500 dark:text-gray-400 mt-0.5">
                              {item._dayOfWeek} • {item.deadline_text ? item.deadline_text : "10:00 AM"}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* 2. Center Spine and Marker */}
                      <div className="w-7 flex-shrink-0 flex flex-col items-center relative self-stretch justify-center">
                        {/* Connecting Spine Line */}
                        {idx !== filteredItems.length - 1 && (
                          <div className="absolute top-1/2 bottom-[-50%] w-[2px] bg-slate-200 dark:bg-white/10 pointer-events-none" />
                        )}

                        {/* Node Marker */}
                        {isTodayAnchor ? (
                          <div className="relative flex flex-col items-center z-10">
                            {/* "Today" badge above node */}
                            <span className="absolute -top-6 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-orange-100 dark:bg-[#341b12] text-[#FF5A14] dark:text-[#FF7A45] border border-orange-300 dark:border-[#FF5A14]/40 shadow-xs whitespace-nowrap">
                              Today
                            </span>
                            {/* Double ring target */}
                            <div className="w-6 h-6 rounded-full border-2 border-[#FF5A14] bg-white dark:bg-[#141416] flex items-center justify-center shadow-[0_0_12px_rgba(255,90,20,0.5)]">
                              <div className="w-2.5 h-2.5 rounded-full bg-[#FF5A14]" />
                            </div>
                          </div>
                        ) : (
                          <div className="relative z-10">
                            {item._completionStatus === "COMPLETED" ? (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                                <Check className="w-3 h-3 stroke-[3]" />
                              </div>
                            ) : item._completionStatus === "IN_PROGRESS" ? (
                              <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center shadow-xs">
                                <Clock className="w-3 h-3" />
                              </div>
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                                <Clock className="w-3 h-3" />
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Horizontal Connector to Card (for Today item) */}
                      {isTodayAnchor && (
                        <div className="w-2.5 h-[2px] bg-[#FF5A14] -ml-2 shrink-0 hidden sm:block" />
                      )}

                      {/* 3. Deliverable Card */}
                      <div
                        onClick={() => setSelectedDeliverableId(item.id)}
                        className={`flex-1 min-w-0 rounded-2xl p-3.5 sm:p-4 transition-all duration-200 cursor-pointer border ${
                          isSelected
                            ? isDark
                              ? "bg-gradient-to-r from-[#2c1c16] via-[#221714] to-[#1c1514] border-2 border-[#FF7A45]/70 shadow-xl shadow-black/50"
                              : "bg-gradient-to-r from-orange-50/90 via-orange-50/40 to-amber-50/20 border-2 border-orange-300 shadow-md shadow-orange-500/10"
                            : isDark
                            ? "bg-[#1c1c22] hover:bg-[#23232b] border-white/5 shadow-xs hover:border-white/10"
                            : "bg-white hover:bg-slate-50 border-slate-200/90 shadow-xs hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Left: Icon & Text */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getItemIconBg(
                                item._iconType,
                              )}`}
                            >
                              {renderItemIcon(item._iconType)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-snug">
                                {item.scope_item_normalized || item.name}
                              </h3>
                              <p className="text-xs text-slate-500 dark:text-gray-400 truncate mt-0.5">
                                {item.description ||
                                  item.latest_progress?.execution_summary ||
                                  "Milestone deliverable tracking."}
                              </p>
                            </div>
                          </div>

                          {/* Right: Status Pill & Chevron */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {renderStatusBadge(item._completionStatus)}
                            <ChevronRight
                              className={`w-4 h-4 transition-transform duration-200 ${
                                isSelected
                                  ? "text-[#FF5A14] translate-x-0.5"
                                  : "text-slate-400 dark:text-gray-500 group-hover:translate-x-0.5"
                              }`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* View Full Timeline Button */}
              <div className="pt-6 text-center">
                <button
                  onClick={() => setShowFullTimeline(!showFullTimeline)}
                  className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-xs ${
                    isDark
                      ? "bg-white/5 hover:bg-white/10 text-gray-200 border-white/10"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5 text-[#FF5A14]" />
                  <span>{showFullTimeline ? "Hide Detailed Gantt View" : "View Full Timeline"}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      showFullTimeline ? "rotate-180" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Collapsible Gantt Swimlane Timeline */}
              {showFullTimeline && (
                <div className="mt-6 pt-6 border-t border-slate-200/80 dark:border-white/10 animate-fadeIn">
                  <GanttSwimlaneTimeline
                    items={timelineItems}
                    milestones={Array.from(milestoneMap.values())}
                    project={project}
                    selectedId={selectedItem?.id ?? null}
                    onSelect={(id) => setSelectedDeliverableId(id)}
                    formatDate={formatDate}
                  />
                </div>
              )}
            </div>

            {/* ── RIGHT COLUMN: Deliverable Details Panel (5 cols) ── */}
            <div className="lg:col-span-5 xl:col-span-4">
              {selectedItem ? (
                <div
                  className={`rounded-2xl border p-4 sm:p-5 transition-all duration-200 max-h-[460px] overflow-y-auto custom-scrollbar sticky top-6 ${
                    isDark
                      ? "bg-[#19191f] border-white/10 shadow-xl"
                      : "bg-white border-slate-200/90 shadow-sm"
                  }`}
                >
                  {/* Panel Top Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-[#FF5A14] flex items-center justify-center flex-shrink-0 border border-orange-500/20">
                        {renderItemIcon(selectedItem._iconType)}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                          {selectedItem.scope_item_normalized || selectedItem.name}
                        </h3>
                        {selectedItem.milestone && (
                          <p className="text-[11px] text-slate-500 dark:text-gray-400 truncate mt-0.5 font-medium">
                            {selectedItem.milestone}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {renderStatusBadge(selectedItem._completionStatus, "md")}
                      <button
                        onClick={() => setSelectedDeliverableId(null)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors cursor-pointer"
                        title="Close panel"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Panel Tabs */}
                  <div className="flex items-center gap-6 border-b border-slate-200/80 dark:border-white/10 mt-5 mb-4">
                    {[
                      { id: "DETAILS", label: "Details" },
                      { id: "ATTACHMENTS", label: "Attachments" },
                      { id: "ACTIVITY", label: "Activity" },
                    ].map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => setActiveTab(tab.id as any)}
                          className={`text-xs pb-2 font-semibold transition-all cursor-pointer border-b-2 -mb-[1px] ${
                            isActive
                              ? "border-[#FF5A14] text-[#FF5A14]"
                              : "border-transparent text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Tab 1: DETAILS */}
                  {activeTab === "DETAILS" && (
                    <div className="space-y-4 animate-fadeIn">
                      {/* Date & Time */}
                      <div className="flex items-start gap-3">
                        <Calendar className="w-4 h-4 text-slate-400 dark:text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-400 block">
                            Date &amp; Time
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                            {selectedItem._dateFormatted} • {selectedItem.deadline_text || "09:30 AM"}
                          </span>
                        </div>
                      </div>

                      {/* Handled By */}
                      <div className="flex items-start gap-3">
                        <Users className="w-4 h-4 text-slate-400 dark:text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-400 block">
                            Handled By
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-gray-200 mt-0.5 block">
                            {selectedItem.owner || project?.client_name || "Team 2"}
                          </span>
                        </div>
                      </div>

                      {/* Description */}
                      <div className="flex items-start gap-3">
                        <FileText className="w-4 h-4 text-slate-400 dark:text-gray-400 mt-0.5 shrink-0" />
                        <div>
                          <span className="text-[11px] font-semibold text-slate-400 dark:text-gray-400 block">
                            Description
                          </span>
                          <p className="text-xs text-slate-600 dark:text-gray-300 leading-relaxed mt-0.5">
                            {selectedItem.description ||
                              selectedItem.latest_progress?.execution_summary ||
                              "Discussed scope and timelines with stakeholders."}
                          </p>
                        </div>
                      </div>

                      {/* Attachments Section */}
                      <div className="pt-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 dark:text-gray-400 mb-2">
                          <Paperclip className="w-3.5 h-3.5" />
                          <span>Attachments</span>
                        </div>

                        {/* PDF Card */}
                        <div
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isDark
                              ? "bg-white/5 border-white/10"
                              : "bg-slate-50 border-slate-200/80"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded bg-rose-500 text-white font-black text-[9px] uppercase tracking-wider shrink-0">
                              PDF
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 dark:text-gray-200 truncate">
                                {selectedItem.latest_progress?.document_name ||
                                  "Kickoff-Meeting-Notes.pdf"}
                              </p>
                              <p className="text-[10px] text-slate-400 dark:text-gray-400">
                                245 KB
                              </p>
                            </div>
                          </div>

                          <button
                            className="p-1.5 rounded-lg hover:bg-slate-200 dark:hover:bg-white/10 text-slate-600 dark:text-gray-300 transition-colors cursor-pointer"
                            title="Download attachment"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Progress Overview Section */}
                      <div className="pt-2">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-gray-200">
                            <BarChart3 className="w-4 h-4 text-[#FF5A14]" />
                            <span>Progress Overview</span>
                          </div>
                          <span className="text-xs font-extrabold text-[#FF5A14]">
                            {selectedItem._completionStatus === "COMPLETED"
                              ? "100%"
                              : `${selectedItem.latest_progress?.progress_percentage || 50}%`}
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden mb-3">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] transition-all duration-500"
                            style={{
                              width:
                                selectedItem._completionStatus === "COMPLETED"
                                  ? "100%"
                                  : `${selectedItem.latest_progress?.progress_percentage || 50}%`,
                            }}
                          />
                        </div>

                        {/* Milestones / Action Items Checklist */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between py-1 text-xs">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">Meeting Conducted</span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-400 font-medium shrink-0">
                              {selectedItem._dateFormatted} • 09:30 AM
                            </span>
                          </div>

                          <div className="flex items-center justify-between py-1 text-xs">
                            <div className="flex items-center gap-2 text-slate-700 dark:text-gray-300 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span className="truncate">Action Items Assigned</span>
                            </div>
                            <span className="text-[10px] text-slate-400 dark:text-gray-400 font-medium shrink-0">
                              {selectedItem._dateFormatted} • 10:00 AM
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Management Controls for Project Roles */}
                      {(user?.role === "ADMIN" ||
                        user?.role === "ENGAGEMENT_MANAGER" ||
                        user?.role === "PROJECT_LEAD") && (
                        <div className="pt-4 border-t border-slate-200/80 dark:border-white/10 space-y-3">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 block mb-1.5">
                              Update Status
                            </span>
                            <div className="flex rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-1 gap-1">
                              {[
                                { value: "ACTIVE", label: "Pending" },
                                { value: "COMPLETED", label: "Completed" },
                                { value: "CANCELLED", label: "Cancelled" },
                              ].map((opt) => (
                                <button
                                  key={opt.value}
                                  onClick={() => {
                                    if (
                                      opt.value === "COMPLETED" &&
                                      selectedItem._completionStatus !== "COMPLETED"
                                    ) {
                                      setCompletionModal({
                                        isOpen: true,
                                        targetStatus: "COMPLETED",
                                        deliverableName: selectedItem.name,
                                        deliverableId: selectedItem.id,
                                        prerequisites: [],
                                        incompletePredecessors: [],
                                      });
                                    } else {
                                      handleUpdateCompletionStatus(selectedItem.id, opt.value);
                                    }
                                  }}
                                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    selectedItem._completionStatus === opt.value
                                      ? opt.value === "COMPLETED"
                                        ? "bg-emerald-500 text-white shadow-sm"
                                        : opt.value === "CANCELLED"
                                        ? "bg-rose-500 text-white shadow-sm"
                                        : "bg-[#FF5A14] text-white shadow-sm"
                                      : "text-slate-600 dark:text-gray-300 hover:bg-slate-200/70 dark:hover:bg-white/10"
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Reschedule Date Input */}
                          <div className="flex items-center justify-between gap-3 pt-1">
                            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400">
                              Reschedule
                            </span>
                            <input
                              type="date"
                              className="px-2.5 py-1 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white focus:outline-none focus:border-[#FF5A14]"
                              value={
                                selectedItem.deadline
                                  ? new Date(selectedItem.deadline).toISOString().split("T")[0]
                                  : ""
                              }
                              onChange={(e) =>
                                handleRescheduleDeadline(selectedItem.id, e.target.value)
                              }
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 2: ATTACHMENTS */}
                  {activeTab === "ATTACHMENTS" && (
                    <div className="space-y-3 py-2 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#FF5A14]" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Source Document
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
                          {selectedItem.latest_progress?.document_name || "Engagement Letter (EL.docx)"}
                        </p>
                      </div>

                      {selectedItem.evidence_text && (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-gray-400 block mb-1">
                            Contract Evidence
                          </span>
                          <p className="text-xs text-slate-600 dark:text-gray-300 italic leading-relaxed">
                            "{selectedItem.evidence_text}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tab 3: ACTIVITY */}
                  {activeTab === "ACTIVITY" && (
                    <div className="space-y-3 py-2 animate-fadeIn">
                      <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200/80 dark:border-white/10">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            Execution Readiness
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-gray-300 mt-1">
                          Prerequisites satisfied. Ready for downstream milestone hand-off.
                        </p>
                      </div>

                      {selectedItem._is_occurrence && (
                        <div className="p-3 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-700 dark:text-violet-300 text-xs">
                          <Repeat className="w-3.5 h-3.5 inline mr-1.5" />
                          Recurring occurrence for:{" "}
                          <strong>{selectedItem.occurrence_period || selectedItem.deadline_text}</strong>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`rounded-2xl border p-8 text-center sticky top-6 ${
                    isDark
                      ? "bg-[#19191f] border-white/10"
                      : "bg-white border-slate-200/90"
                  }`}
                >
                  <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500 dark:text-gray-400">
                    Select a deliverable from the timeline to view details, attachments, and progress.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Completion Confirmation Modal */}
      {completionModal?.isOpen && (
        <DeliverableCompletionModal
          isOpen={completionModal.isOpen}
          onClose={() => setCompletionModal(null)}
          targetStatus={completionModal.targetStatus}
          deliverableName={completionModal.deliverableName}
          deliverableId={completionModal.deliverableId}
          prerequisites={completionModal.prerequisites}
          incompletePredecessors={completionModal.incompletePredecessors}
          onConfirm={async (payload) => {
            await handleUpdateCompletionStatus(
              completionModal.deliverableId,
              payload.completion_status,
              payload,
            );
            setCompletionModal(null);
          }}
        />
      )}
    </div>
  );
};
