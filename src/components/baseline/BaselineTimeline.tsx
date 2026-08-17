import React from "react";
import { Calendar, ChevronLeft, ChevronRight, Repeat, RefreshCw, FileText, CheckCircle2, X, Clock, MapPin, AlertTriangle } from "lucide-react";

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
  handleUpdateCompletionStatus: (id: number, status: string) => void;
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
  return (
    <>
            {/* Deliverables timeline */}
            <div className="mb-8">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500"></div>
                <h2 className="text-xl font-bold tracking-tight">
                  Deliverables Timeline
                </h2>
                {recurringGroups.length > 0 && (
                  <span
                    title={`${recurringGroups.length} recurring commitment${recurringGroups.length > 1 ? "s" : ""} auto-expanded from EL`}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/15 border border-violet-500/35 text-violet-300 text-[10px] font-bold uppercase tracking-wider cursor-default"
                  >
                    <Repeat className="w-3 h-3" />
                    {recurringGroups.length} Recurring
                  </span>
                )}
                <span className="ml-auto text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date().toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>

              {timelineItems.length === 0 ? (
                <p className="text-text-muted mb-8">
                  No scheduled scope items found.
                </p>
              ) : (
                (() => {
                  /* ── Parse dates & compute timeline bounds ── */
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const todayMs = today.getTime();

                  const parsedItems = timelineItems.map(
                    (item: any, idx: number) => {
                      const raw = item.deadline || item.deadline_text || null;
                      let dateMs: number | null = null;
                      if (raw) {
                        let d = new Date(raw);
                        if (isNaN(d.getTime()) && typeof raw === "string") {
                          d = new Date(raw.replace(" ", "T"));
                        }
                        if (!isNaN(d.getTime())) {
                          d.setHours(0, 0, 0, 0);
                          dateMs = d.getTime();
                        }
                      }

                      // Check for Execution Prerequisites
                      let hasPrerequisites = false;
                      let prereqCount = 0;
                      try {
                        const rawDeps =
                          item.latest_progress?.dependencies ||
                          item.dependencies ||
                          item.prerequisites ||
                          item.execution_prerequisites;
                        if (rawDeps) {
                          const parsed =
                            typeof rawDeps === "string"
                              ? JSON.parse(rawDeps)
                              : rawDeps;
                          if (Array.isArray(parsed) && parsed.length > 0) {
                            hasPrerequisites = true;
                            prereqCount = parsed.length;
                          }
                        }
                      } catch (e) {}

                      const mData = getMilestoneData(
                        item.name,
                        item.milestone_normalized,
                      );
                      if (mData) {
                        const blockedByIds = mData.blocked_by_ids
                          ? mData.blocked_by_ids.split(",").filter(Boolean)
                          : [];
                        if (
                          mData.predecessor_details ||
                          blockedByIds.length > 0
                        ) {
                          hasPrerequisites = true;
                          if (prereqCount === 0)
                            prereqCount = blockedByIds.length || 1;
                        }
                      }

                      // Determine status-based color scheme
                      const completionStatus =
                        item.completion_status || "ACTIVE";
                      let itemColor = {
                        bg: "rgba(245,158,11,0.12)",
                        border: "#f59e0b",
                        text: "#fcd34d",
                        dot: "#f59e0b",
                        glow: "rgba(245,158,11,0.3)",
                      }; // Pending/Active (Amber)
                      if (completionStatus === "COMPLETED") {
                        itemColor = {
                          bg: "rgba(16,185,129,0.12)",
                          border: "#10b981",
                          text: "#6ee7b7",
                          dot: "#10b981",
                          glow: "rgba(16,185,129,0.3)",
                        }; // Completed (Green)
                      } else if (completionStatus === "CANCELLED") {
                        itemColor = {
                          bg: "rgba(244,63,94,0.12)",
                          border: "#f43f5e",
                          text: "#fda4af",
                          dot: "#f43f5e",
                          glow: "rgba(244,63,94,0.3)",
                        }; // Cancelled (Red)
                      }

                      return {
                        ...item,
                        _dateMs: dateMs,
                        _idx: idx,
                        _color: itemColor,
                        _hasPrerequisites: hasPrerequisites,
                        _prereqCount: prereqCount,
                      };
                    },
                  );

                  const datedItems = parsedItems.filter(
                    (i: any) => i._dateMs !== null,
                  );
                  const hasDates = datedItems.length >= 1;

                  let minMs = todayMs;
                  let maxMs = todayMs;
                  if (hasDates) {
                    const allMs = [
                      ...datedItems.map((i: any) => i._dateMs as number),
                      todayMs,
                    ];
                    minMs = Math.min(...allMs);
                    maxMs = Math.max(...allMs);
                    // Add padding on each side so edge items aren't clipped
                    const range = maxMs - minMs || 86400000 * 30;
                    minMs -= range * 0.08;
                    maxMs += range * 0.08;
                  }

                  const totalRange = maxMs - minMs || 1;
                  const toPercent = (ms: number) =>
                    Math.max(
                      2,
                      Math.min(98, ((ms - minMs) / totalRange) * 100),
                    );
                  const todayPct = hasDates ? toPercent(todayMs) : -1;

                  /* ── Generate month tick marks ── */
                  const monthTicks: { pct: number; label: string }[] = [];
                  if (hasDates) {
                    const startDate = new Date(minMs);
                    const endDate = new Date(maxMs);
                    
                    const totalMonths =
                      (endDate.getFullYear() - startDate.getFullYear()) * 12 +
                      (endDate.getMonth() - startDate.getMonth()) +
                      1;
                    const monthStep = totalMonths > 12 ? 3 : totalMonths > 6 ? 2 : 1;

                    const cur = new Date(
                      startDate.getFullYear(),
                      startDate.getMonth(),
                      1,
                    );
                    while (cur <= endDate) {
                      const pct = ((cur.getTime() - minMs) / totalRange) * 100;
                      if (pct >= 0 && pct <= 100) {
                        monthTicks.push({
                          pct,
                          label: cur.toLocaleDateString(undefined, {
                            month: "short",
                            year: "2-digit",
                          }),
                        });
                      }
                      cur.setMonth(cur.getMonth() + monthStep);
                    }
                  }

                  /* ── Position items ── */
                  const getLeftPct = (item: any, idx: number) => {
                    if (hasDates && item._dateMs !== null) {
                      return toPercent(item._dateMs);
                    }
                    // Fallback: evenly spaced between 8% and 92%
                    const count = parsedItems.length;
                    return count === 1 ? 50 : 8 + (idx / (count - 1)) * 84;
                  };

                  const formatItemDate = (item: any) => {
                    const raw = item.deadline_text || item.deadline;
                    if (!raw) return item.milestone || `Item ${item._idx + 1}`;
                    try {
                      let d = new Date(raw);
                      if (isNaN(d.getTime()) && typeof raw === "string") {
                        d = new Date(raw.replace(" ", "T"));
                      }
                      if (isNaN(d.getTime())) return raw;
                      return d.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    } catch {
                      return raw;
                    }
                  };

                  const isPast = (item: any) =>
                    item._dateMs !== null && item._dateMs < todayMs;

                  const selectedItem =
                    parsedItems.find(
                      (d: any) => d.id === selectedDeliverableId,
                    ) || parsedItems[0];

                  /* ── Determine alternating above/below positions ── */
                  const sortedByPosition = [...parsedItems].sort(
                    (a: any, b: any) =>
                      getLeftPct(a, a._idx) - getLeftPct(b, b._idx),
                  );
                  const positionMap = new Map<number, boolean>();
                  sortedByPosition.forEach((item: any, i: number) => {
                    positionMap.set(item.id, i % 2 === 0); // true = above, false = below
                  });

                  /* ── Track midpoint Y for consistent reference ── */
                  const TRACK_Y = 135;
                  const ABOVE_LABEL_TOP = 40;
                  const BELOW_LABEL_START = TRACK_Y + 8;

                  return (
                    <div>
                      {/* ── Navigation row ── */}
                      <div className="flex items-center gap-3 mb-3">
                        <button
                          onClick={handlePrev}
                          disabled={activeIndex <= 0}
                          className="flex-shrink-0 w-9 h-9 rounded-full bg-bg-card/80 border border-border-strong/60 text-text-muted hover:text-text-primary hover:bg-bg-hover hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer z-10 shadow-md backdrop-blur-sm"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="flex-1 flex items-center justify-center">
                          <span className="text-[11px] text-text-muted tracking-wide">
                            {activeIndex + 1} of {timelineItems.length}{" "}
                            deliverables
                          </span>
                        </div>
                        <button
                          onClick={handleNext}
                          disabled={activeIndex >= timelineItems.length - 1}
                          className="flex-shrink-0 w-9 h-9 rounded-full bg-bg-card/80 border border-border-strong/60 text-text-muted hover:text-text-primary hover:bg-bg-hover hover:border-border-strong disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer z-10 shadow-md backdrop-blur-sm"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* ── Timeline Canvas ── */}
                      <div className="relative rounded-2xl border border-border-subtle/60 bg-gradient-to-br from-bg-card via-bg-base to-bg-card backdrop-blur-sm overflow-visible">
                        {/* Subtle grid background pattern */}
                        <div
                          className="absolute inset-0 rounded-2xl overflow-hidden opacity-[0.03]"
                          style={{
                            backgroundImage:
                              "radial-gradient(circle, #fff 1px, transparent 1px)",
                            backgroundSize: "24px 24px",
                          }}
                        ></div>

                        {/* Responsive track container — no horizontal scroll, uses % positioning */}
                        <div
                          ref={timelineContainerRef}
                          className="relative w-full"
                          style={{ height: "280px", padding: "0 16px" }}
                        >
                          {/* ── Month tick marks ── */}
                          {monthTicks.map((tick, i) => (
                            <div
                              key={`tick-${i}`}
                              className="absolute flex flex-col items-center pointer-events-none"
                              style={{
                                left: `${tick.pct}%`,
                                top: "8px",
                                bottom: "20px",
                              }}
                            >
                              <span
                                className="text-[9px] text-gray-500/80 dark:text-gray-400/70 font-semibold tracking-wider uppercase whitespace-nowrap px-1 rounded bg-bg-card/40"
                                style={{ transform: "translateX(-50%)" }}
                              >
                                {tick.label}
                              </span>
                              <div className="w-px flex-1 bg-border-subtle/20 mt-1 border-r border-dashed border-border-subtle/30"></div>
                            </div>
                          ))}

                          {/* ── Main track line ── */}
                          <div
                            className="absolute h-[3px] rounded-full timeline-track-shimmer"
                            style={{
                              top: `${TRACK_Y}px`,
                              left: "16px",
                              right: "16px",
                            }}
                          ></div>

                          {/* ── Gradient overlay on track (past = colored, future = dim) ── */}
                          {hasDates && todayPct >= 0 && todayPct <= 100 && (
                            <div
                              className="absolute h-[3px] rounded-l-full"
                              style={{
                                top: `${TRACK_Y}px`,
                                left: "16px",
                                width: `calc(${todayPct}% - 16px)`,
                                background:
                                  "linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)",
                                opacity: 0.6,
                              }}
                            ></div>
                          )}

                          {/* ── TODAY marker ── */}
                          {hasDates && todayPct >= 0 && todayPct <= 100 && (
                            <div
                              className="absolute flex flex-col items-center z-30 pointer-events-none"
                              style={{
                                left: `${todayPct}%`,
                                top: `${TRACK_Y - 46}px`,
                                transform: "translateX(-50%)",
                              }}
                            >
                              {/* Label */}
                              <div
                                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-lg whitespace-nowrap"
                                style={{
                                  animation:
                                    "todayPulse 2s ease-in-out infinite",
                                }}
                              >
                                ● Today
                              </div>
                              {/* Vertical line from label down through track and below */}
                              <div
                                className="w-0.5 bg-orange-400/60 rounded-full mt-1"
                                style={{
                                  height: `${46 + 50}px`,
                                  animation:
                                    "todayLinePulse 2s ease-in-out infinite",
                                }}
                              ></div>
                              {/* Date below */}
                              <span className="text-[9px] text-orange-400/70 mt-0.5 whitespace-nowrap font-medium">
                                {today.toLocaleDateString(undefined, {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                            </div>
                          )}

                          {/* ── Deliverable Nodes ── */}
                          {parsedItems.map((item: any, idx: number) => {
                            const isSelected =
                              selectedDeliverableId === item.id;
                            const leftPct = getLeftPct(item, idx);
                            const color = item._color;
                            const isAbove = positionMap.get(item.id) ?? true;
                            const dateStr = formatItemDate(item);
                            const past = isPast(item);
                            const completionStatus =
                              item.latest_progress?.status_code ||
                              item.completion_status ||
                              "ACTIVE";
                            const isCompleted =
                              completionStatus === "COMPLETED" ||
                              completionStatus === "CANCELLED" ||
                              (item.latest_progress?.progress_percentage || 0) >= 100;
                            const isCancelled =
                              completionStatus === "CANCELLED";
                            const isAlert =
                              past && !isCompleted && !isCancelled;

                            const renderCardContent = () => {
                              const mData = getMilestoneData(
                                item.name,
                                item.milestone_normalized,
                              );
                              const progressPct =
                                item.latest_progress?.progress_percentage || 0;
                              let milestoneStatus = (
                                mData?.status || "PENDING"
                              ).toUpperCase();
                              if (
                                progressPct > 0 &&
                                milestoneStatus === "BLOCKED"
                              ) {
                                milestoneStatus = "IN_PROGRESS";
                              }
                              const isCompletedStatus =
                                milestoneStatus === "COMPLETED" ||
                                milestoneStatus === "CANCELLED";

                              const blockedByIds = mData?.blocked_by_ids
                                ? mData.blocked_by_ids.split(",")
                                : [];
                              const blockingIds = mData?.blocking_ids
                                ? mData.blocking_ids.split(",")
                                : [];

                              const incompletePredecessors = blockedByIds
                                .map((id: string) => milestoneMap.get(id))
                                .filter(
                                  (
                                    m: any,
                                  ): m is NonNullable<typeof m> =>
                                    !!m &&
                                    m.status?.toUpperCase() !== "COMPLETED" &&
                                    m.status?.toUpperCase() !== "CANCELLED",
                                );

                              const activelyBlockingSuccessors = blockingIds
                                .map((id: string) => milestoneMap.get(id))
                                .filter(
                                  (
                                    m: any,
                                  ): m is NonNullable<typeof m> =>
                                    !!m &&
                                    m.status?.toUpperCase() !== "COMPLETED" &&
                                    m.status?.toUpperCase() !== "CANCELLED",
                                );

                              return (
                                <>
                                  {/* Date label */}
                                  <div
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-md transition-all duration-300 border whitespace-nowrap max-w-[120px] truncate text-center flex items-center justify-center gap-1"
                                    style={
                                      isSelected
                                        ? {
                                            borderColor: color.border,
                                            backgroundColor: color.bg,
                                            color: color.text,
                                            boxShadow: `0 2px 12px ${color.glow}`,
                                          }
                                        : {
                                            borderColor: "rgba(55,65,81,0.5)",
                                            backgroundColor:
                                              "rgba(17,24,39,0.85)",
                                            color: "#9ca3af",
                                          }
                                    }
                                    title={dateStr}
                                  >
                                    <span>{dateStr}</span>
                                    {item._hasPrerequisites && !isCompleted && (
                                      <span
                                        className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-black text-[9px] flex items-center justify-center shadow-[0_0_10px_rgba(245,158,11,1)] leading-none flex-shrink-0 animate-pulse border border-amber-200 ring-2 ring-amber-400/40"
                                        title="Has Execution Prerequisites (!)"
                                      >
                                        !
                                      </span>
                                    )}
                                  </div>

                                  {/* Name */}
                                  <span
                                    className={`text-[9px] mt-0.5 max-w-[100px] truncate text-center leading-tight transition-colors ${
                                      isSelected
                                        ? "font-semibold"
                                        : "text-gray-600 group-hover:text-text-muted"
                                    }`}
                                    style={
                                      isSelected ? { color: color.text } : {}
                                    }
                                    title={
                                      item.scope_item_normalized || item.name
                                    }
                                  >
                                    {item.scope_item_normalized || item.name}
                                  </span>

                                  {/* Recurring occurrence badge */}
                                  {item._is_occurrence && (
                                    <span
                                      className="mt-0.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-violet-500/20 border border-violet-500/35 text-violet-300 text-[8px] font-bold uppercase tracking-wider whitespace-nowrap"
                                      title={`Recurring ${item.recurrence_frequency || item._parent_item?.recurrence_frequency || ""} occurrence from EL`}
                                    >
                                      <Repeat className="w-2 h-2" />
                                      {item.occurrence_period ||
                                        item.recurrence_frequency ||
                                        item._parent_item?.recurrence_frequency ||
                                        "Recurring"}
                                    </span>
                                  )}

                                  {/* Status badges */}
                                  <div className="flex flex-col gap-0.5 mt-1 items-center">
                                    {!isCompletedStatus &&
                                      milestoneStatus === "BLOCKED" && (
                                        <span
                                          className="text-[8px] bg-red-900/40 text-red-300 border border-red-800/50 px-1.5 py-0.5 rounded-sm truncate max-w-[120px] shadow-sm font-medium"
                                          title="Waiting for predecessor"
                                        >
                                          ⛔ Waiting for predecessor
                                        </span>
                                      )}
                                    {!isCompletedStatus &&
                                      milestoneStatus === "PENDING" &&
                                      incompletePredecessors.length > 0 && (
                                        <span
                                          className="text-[8px] bg-blue-900/40 text-blue-300 border border-blue-800/50 px-1.5 py-0.5 rounded-sm truncate max-w-[120px] shadow-sm font-medium"
                                          title="Waiting to start"
                                        >
                                          ⏳ Waiting to start
                                        </span>
                                      )}
                                    {!isCompletedStatus &&
                                      (milestoneStatus === "IN_PROGRESS" ||
                                        milestoneStatus === "ACTIVE") &&
                                      activelyBlockingSuccessors.length > 0 && (
                                        <span
                                          className="text-[8px] bg-orange-900/40 text-orange-300 border border-orange-800/50 px-1.5 py-0.5 rounded-sm truncate max-w-[120px] shadow-sm font-medium"
                                          title={`Blocking ${activelyBlockingSuccessors.length} Milestones`}
                                        >
                                          🚧 Blocking:{" "}
                                          {activelyBlockingSuccessors.length}
                                        </span>
                                      )}
                                  </div>
                                </>
                              );
                            };

                            return (
                              <div
                                key={item.id}
                                data-active={isSelected}
                                className="absolute cursor-pointer group flex flex-col items-center"
                                style={{
                                  left: `${leftPct}%`,
                                  top: `${TRACK_Y - 6}px`,
                                  transform: "translateX(-50%)",
                                  zIndex: isSelected ? 20 : 10,
                                }}
                                onClick={() =>
                                  setSelectedDeliverableId(item.id)
                                }
                              >
                                {/* Node dot on the track line - ALWAYS FIXED AT TRACK_Y - 6px */}
                                <div
                                  className={`relative w-[14px] h-[14px] rounded-full timeline-node-enter transition-all duration-300 flex-shrink-0 ${
                                    isSelected
                                      ? "scale-[1.4]"
                                      : "group-hover:scale-125"
                                  }`}
                                  style={{
                                    backgroundColor:
                                      isAlert || isCompleted
                                        ? "transparent"
                                        : isSelected
                                          ? color.dot
                                          : isCancelled
                                            ? color.dot
                                            : "#4b5563",
                                    boxShadow:
                                      isSelected && !(isAlert || isCompleted)
                                        ? `0 0 10px ${color.glow}, 0 0 20px ${color.glow}`
                                        : "none",
                                    opacity: isCompleted
                                      ? 0.75
                                      : isCancelled
                                        ? 0.5
                                        : 1,
                                    animationDelay: `${idx * 60}ms`,
                                  }}
                                >
                                  {item._hasPrerequisites && !isCompleted && (
                                    <span
                                      className="absolute -top-2.5 -right-2.5 w-4 h-4 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-gray-950 font-black text-[10px] flex items-center justify-center border-2 border-amber-100 shadow-[0_0_12px_rgba(245,158,11,1)] z-20 animate-pulse ring-2 ring-amber-400/50"
                                      title="Has Execution Prerequisites (!)"
                                    >
                                      !
                                    </span>
                                  )}
                                  {isCompleted ? (
                                    <CheckCircle2
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] text-emerald-400 bg-bg-card rounded-full z-10"
                                      style={{
                                        filter:
                                          "drop-shadow(0 0 2px rgba(16,185,129,0.5))",
                                      }}
                                    />
                                  ) : isAlert ? (
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      viewBox="0 0 24 24"
                                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[18px] h-[18px] z-10"
                                      style={{
                                        filter:
                                          "drop-shadow(0 0 4px rgba(239,68,68,0.8))",
                                      }}
                                    >
                                      <path
                                        d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"
                                        fill="#ef4444"
                                      />
                                      <line
                                        x1="12"
                                        y1="9"
                                        x2="12"
                                        y2="13"
                                        stroke="#ffffff"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                      />
                                      <circle
                                        cx="12"
                                        cy="17"
                                        r="1.25"
                                        fill="#ffffff"
                                      />
                                    </svg>
                                  ) : null}
                                  {isSelected && (
                                    <span
                                      className="absolute inset-0 rounded-full animate-ping"
                                      style={{
                                        backgroundColor: isAlert
                                          ? "#ef4444"
                                          : isCompleted
                                            ? "#10b981"
                                            : color.dot,
                                        opacity: 0.25,
                                      }}
                                    ></span>
                                  )}
                                </div>

                                {/* Card Content & Connecting Line */}
                                {isAbove ? (
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 flex flex-col items-center mb-0.5 pointer-events-auto">
                                    {renderCardContent()}
                                    {/* Connector line down to dot */}
                                    <div
                                      className="w-px mt-1 transition-colors duration-300 min-h-[14px]"
                                      style={{
                                        height: "18px",
                                        backgroundColor: isSelected
                                          ? color.border
                                          : "#374151",
                                      }}
                                    ></div>
                                  </div>
                                ) : (
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 flex flex-col items-center mt-0.5 pointer-events-auto">
                                    {/* Connector line down from dot */}
                                    <div
                                      className="w-px mb-1 transition-colors duration-300 min-h-[14px]"
                                      style={{
                                        height: "18px",
                                        backgroundColor: isSelected
                                          ? color.border
                                          : "#374151",
                                      }}
                                    ></div>
                                    {renderCardContent()}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* ── Legend ── */}
                        <div className="flex items-center gap-4 px-5 py-3 border-t border-border-subtle/40 flex-wrap">
                          {hasDates && (
                            <div className="flex items-center gap-1.5">
                              <div
                                className="w-2.5 h-2.5 rounded-full bg-orange-400"
                                style={{
                                  animation:
                                    "todayPulse 2s ease-in-out infinite",
                                }}
                              ></div>
                              <span className="text-[10px] text-text-muted font-medium">
                                Today
                              </span>
                            </div>
                          )}
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
                            <span className="text-[10px] text-text-muted font-medium">
                              Pending
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                            <span className="text-[10px] text-text-muted font-medium">
                              Completed
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className="text-[10px] text-text-muted font-medium">
                              Cancelled
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 shadow-sm">
                            <span className="w-3.5 h-3.5 rounded-full bg-amber-400 text-gray-950 font-black text-[9px] flex items-center justify-center flex-shrink-0 leading-none">!</span>
                            <span className="text-[10px] text-amber-300 font-semibold">
                              Execution Prerequisites
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* ── Recurring Commitments Summary ── */}
                      {recurringGroups.length > 0 && (
                        <div className="mt-8">
                          <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Repeat className="w-4 h-4 text-violet-400" />
                            Recurring Commitments
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {recurringGroups.map((group: any) => (
                              <div
                                key={group.id}
                                className="p-4 rounded-xl bg-bg-card border border-border-subtle shadow-sm flex flex-col gap-2 relative overflow-hidden group/card cursor-pointer transition-colors hover:border-violet-500/50 hover:bg-violet-950/10"
                                onClick={() => {
                                  // Find the first occurrence of this group
                                  const firstOcc = timelineItems.find(
                                    (item) => item._parent_item?.id === group.id
                                  );
                                  if (firstOcc) setSelectedDeliverableId(firstOcc.id);
                                }}
                              >
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-bl-full -z-10 group-hover/card:bg-violet-500/10 transition-colors"></div>
                                <div className="flex items-start justify-between gap-4">
                                  <h4 className="font-bold text-sm text-text-primary leading-snug">
                                    {group.scope_item_normalized || group.name}
                                  </h4>
                                  <span className="flex-shrink-0 px-2 py-1 rounded-md bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[10px] font-bold uppercase tracking-wider">
                                    {group.recurrence_frequency}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-xs text-text-muted mt-auto">
                                  <span className="flex items-center gap-1.5">
                                    <RefreshCw className="w-3.5 h-3.5" />
                                    {group.recurring_occurrences?.length || 0} Occurrences
                                  </span>
                                  {(group.recurrence_start_date || group.recurrence_end_date) && (
                                    <span className="flex items-center gap-1.5 border-l border-border-subtle pl-3">
                                      <Calendar className="w-3.5 h-3.5" />
                                      {group.recurrence_start_date ? new Date(group.recurrence_start_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Start'}
                                      {" - "}
                                      {group.recurrence_end_date ? new Date(group.recurrence_end_date).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'End'}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* ── Selected Item Detail Card ── */}
                      {selectedItem &&
                        (() => {
                          const color = selectedItem._color;
                          const latestProgress = selectedItem.latest_progress;
                          const completionStatus =
                            latestProgress?.status_code ||
                            selectedItem.completion_status ||
                            "ACTIVE";
                          let statusLabel =
                            latestProgress?.status_label ||
                            completionStatus.replace("_", " ");
                          const progressPct =
                            latestProgress?.progress_percentage;

                          if (
                            (progressPct || 0) > 0 &&
                            completionStatus === "BLOCKED"
                          ) {
                            statusLabel = "IN PROGRESS";
                          }
                          const executionSummary =
                            latestProgress?.execution_summary;
                          const updateSource = latestProgress?.document_name;
                          const updateDate = latestProgress?.status_updated_at;
                          let dependencies: string[] = [];
                          try {
                            if (latestProgress?.dependencies) {
                              dependencies =
                                typeof latestProgress.dependencies === "string"
                                  ? JSON.parse(latestProgress.dependencies)
                                  : latestProgress.dependencies;
                            }
                          } catch (e) {
                            console.error("Failed to parse dependencies", e);
                          }

                          return (
                            <div
                              key={selectedItem.id}
                              className="relative mt-5 rounded-2xl border backdrop-blur-sm shadow-2xl timeline-detail-enter overflow-hidden"
                              style={{
                                borderColor: `${color.border}25`,
                                background: `linear-gradient(135deg, ${color.bg}, rgba(17,24,39,0.95))`,
                              }}
                            >
                              {/* Accent bar */}
                              <div
                                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl"
                                style={{
                                  background: `linear-gradient(90deg, ${color.dot}, transparent)`,
                                }}
                              ></div>

                              <div className="p-5">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: color.dot }}
                                      ></span>
                                      <span
                                        className="text-[10px] font-bold uppercase tracking-widest"
                                        style={{ color: color.text }}
                                      >
                                        Selected Deliverable
                                      </span>
                                    </div>
                                    <h3 className="font-bold text-lg text-text-primary mt-0.5 leading-snug">
                                      {selectedItem.scope_item_normalized ||
                                        selectedItem.name}
                                    </h3>

                                    {selectedItem._is_occurrence && (
                                      <div className="mt-2.5 flex items-center gap-2">
                                        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-violet-500/15 border border-violet-500/30 text-violet-300 text-[10px] font-bold uppercase tracking-wider">
                                          <Repeat className="w-3 h-3" />
                                          Recurring {selectedItem.recurrence_frequency || selectedItem._parent_item?.recurrence_frequency || "Commitment"}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                          Occurrence for <strong className="text-gray-200">{selectedItem.occurrence_period || selectedItem.deadline_text}</strong>
                                        </span>
                                      </div>
                                    )}

                                    {executionSummary && (
                                      <div className="mt-4 p-3 bg-blue-950/20 border border-blue-900/30 rounded-lg">
                                        <h5 className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                          <FileText className="w-3 h-3" />{" "}
                                          Latest Update
                                        </h5>
                                        <p className="text-sm text-text-primary leading-relaxed">
                                          {executionSummary}
                                        </p>
                                      </div>
                                    )}

                                    {progressPct !== null &&
                                      progressPct !== undefined && (
                                        <div className="mt-4">
                                          <div className="flex justify-between items-center mb-1.5">
                                            <span className="text-xs font-semibold text-gray-400">
                                              Execution Readiness
                                            </span>
                                            <span className="text-xs font-bold text-text-primary">
                                              {progressPct}%
                                            </span>
                                          </div>
                                          <div className="w-full bg-bg-hover rounded-full h-1.5">
                                            <div
                                              className="bg-emerald-500 h-1.5 rounded-full"
                                              style={{
                                                width: `${progressPct}%`,
                                              }}
                                            ></div>
                                          </div>
                                        </div>
                                      )}

                                    {(() => {
                                      const mData = getMilestoneData(
                                        selectedItem.name,
                                        selectedItem.milestone_normalized,
                                      );

                                      // Parse predecessor/successor details (name||FS format)
                                      const parseMilestoneDetails = (
                                        raw?: string,
                                      ) =>
                                        raw
                                          ? raw
                                              .split(";;")
                                              .filter(Boolean)
                                              .map((entry) => {
                                                const parts = entry.split("||");
                                                const name = parts[0]?.trim();
                                                const type = parts[1]?.trim();
                                                const typeLabel: Record<
                                                  string,
                                                  string
                                                > = {
                                                  FINISH_TO_START:
                                                    "Finish-to-Start",
                                                  START_TO_START:
                                                    "Start-to-Start",
                                                  FINISH_TO_FINISH:
                                                    "Finish-to-Finish",
                                                  START_TO_FINISH:
                                                    "Start-to-Finish",
                                                };
                                                return {
                                                  name,
                                                  typeLabel:
                                                    typeLabel[type] ||
                                                    "Finish-to-Start",
                                                };
                                              })
                                          : [];

                                      const predecessors =
                                        parseMilestoneDetails(
                                          mData?.predecessor_details,
                                        );
                                      const successors = parseMilestoneDetails(
                                        mData?.successor_details,
                                      );
                                      const hasPredecessors =
                                        predecessors.length > 0;
                                      const hasSuccessors =
                                        successors.length > 0;

                                      if (!mData) return null;

                                      let milestoneStatus = (
                                        mData.status || "PENDING"
                                      ).toUpperCase();
                                      if (
                                        (progressPct || 0) > 0 &&
                                        milestoneStatus === "BLOCKED"
                                      ) {
                                        milestoneStatus = "IN_PROGRESS";
                                      }
                                      const isCompleted =
                                        milestoneStatus === "COMPLETED" ||
                                        milestoneStatus === "CANCELLED";

                                      // Execution state: which predecessors are still incomplete
                                      const blockedByIds = mData?.blocked_by_ids
                                        ? mData.blocked_by_ids.split(",")
                                        : [];
                                      const blockingIds = mData?.blocking_ids
                                        ? mData.blocking_ids.split(",")
                                        : [];

                                      const incompletePredecessors =
                                        blockedByIds
                                          .map((id: string) =>
                                            milestoneMap.get(id),
                                          )
                                          .filter(
                                            (
                                              m: any,
                                            ): m is NonNullable<typeof m> =>
                                              !!m &&
                                              m.status?.toUpperCase() !==
                                                "COMPLETED" &&
                                              m.status?.toUpperCase() !==
                                                "CANCELLED",
                                          );

                                      // Which successors are still waiting (not complete)
                                      const activelyBlockingSuccessors =
                                        blockingIds
                                          .map((id: string) =>
                                            milestoneMap.get(id),
                                          )
                                          .filter(
                                            (
                                              m: any,
                                            ): m is NonNullable<typeof m> =>
                                              !!m &&
                                              m.status?.toUpperCase() !==
                                                "COMPLETED" &&
                                              m.status?.toUpperCase() !==
                                                "CANCELLED",
                                          );

                                      return (
                                        <div className="mt-4 space-y-3">
                                          {/* ── Section 1: Permanent Dependency Graph (never changes) ── */}
                                          <div className="p-3 bg-gray-900/40 border border-indigo-900/30 rounded-lg">
                                            <h5 className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                              <svg
                                                className="w-3 h-3"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                                stroke="currentColor"
                                              >
                                                <path
                                                  strokeLinecap="round"
                                                  strokeLinejoin="round"
                                                  strokeWidth={2}
                                                  d="M13 10V3L4 14h7v7l9-11h-7z"
                                                />
                                              </svg>
                                              Dependency Graph
                                            </h5>

                                            {hasPredecessors ? (
                                              <div className="mb-2">
                                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                                  Predecessors
                                                </span>
                                                <ul className="space-y-1">
                                                  {predecessors.map((p, i) => {
                                                    const predM = [
                                                      ...milestoneMap.values(),
                                                    ].find(
                                                      (m) => m.name === p.name,
                                                    );
                                                    const predDone =
                                                      predM?.status?.toUpperCase() ===
                                                        "COMPLETED" ||
                                                      predM?.status?.toUpperCase() ===
                                                        "CANCELLED";
                                                    return (
                                                      <li
                                                        key={i}
                                                        className="text-xs text-gray-300 flex items-center gap-2 px-2 py-1.5 rounded bg-indigo-950/20 border border-indigo-900/20"
                                                      >
                                                        {predDone ? (
                                                          <span className="text-emerald-500 text-[12px] font-bold flex-shrink-0">
                                                            ✓
                                                          </span>
                                                        ) : (
                                                          <span className="text-indigo-400 text-[12px] font-bold flex-shrink-0">
                                                            →
                                                          </span>
                                                        )}
                                                        <span
                                                          className={
                                                            predDone
                                                              ? "text-gray-400"
                                                              : ""
                                                          }
                                                        >
                                                          {p.name}
                                                        </span>
                                                        <span className="text-gray-500 text-[10px]">
                                                          ({p.typeLabel})
                                                        </span>
                                                        {predDone && (
                                                          <span className="ml-auto text-gray-500 text-[10px] italic">
                                                            (Completed)
                                                          </span>
                                                        )}
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 italic mb-2">
                                                No predecessor milestones
                                              </p>
                                            )}

                                            {hasSuccessors ? (
                                              <div>
                                                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                                  Successors
                                                </span>
                                                <ul className="space-y-1">
                                                  {successors.map((s, i) => {
                                                    const succM = [
                                                      ...milestoneMap.values(),
                                                    ].find(
                                                      (m) => m.name === s.name,
                                                    );
                                                    const succDone =
                                                      succM?.status?.toUpperCase() ===
                                                        "COMPLETED" ||
                                                      succM?.status?.toUpperCase() ===
                                                        "CANCELLED";
                                                    const succActive =
                                                      succM &&
                                                      succM.status?.toUpperCase() !==
                                                        "PENDING" &&
                                                      succM.status?.toUpperCase() !==
                                                        "BLOCKED";
                                                    return (
                                                      <li
                                                        key={i}
                                                        className="text-xs text-gray-300 flex items-center gap-2 px-2 py-1.5 rounded bg-gray-800/40 border border-gray-700/30"
                                                      >
                                                        {succDone ? (
                                                          <span className="text-emerald-500 text-[12px] font-bold flex-shrink-0">
                                                            ✓
                                                          </span>
                                                        ) : (
                                                          <span className="text-gray-500 text-[12px] font-bold flex-shrink-0">
                                                            →
                                                          </span>
                                                        )}
                                                        <span
                                                          className={
                                                            succDone
                                                              ? "text-gray-400"
                                                              : ""
                                                          }
                                                        >
                                                          {s.name}
                                                        </span>
                                                        <span className="text-gray-500 text-[10px]">
                                                          ({s.typeLabel})
                                                        </span>
                                                        {succDone ? (
                                                          <span className="ml-auto text-gray-500 text-[10px] italic">
                                                            Completed
                                                          </span>
                                                        ) : (
                                                          <span
                                                            className={`ml-auto text-[10px] font-semibold flex items-center gap-1 ${
                                                              succM?.status?.toUpperCase() ===
                                                              "BLOCKED"
                                                                ? "text-red-400"
                                                                : succM?.status?.toUpperCase() ===
                                                                    "PENDING"
                                                                  ? "text-blue-400"
                                                                  : "text-amber-400"
                                                            }`}
                                                          >
                                                            {succM?.status?.toUpperCase() ===
                                                            "BLOCKED"
                                                              ? "🔴"
                                                              : succM?.status?.toUpperCase() ===
                                                                  "PENDING"
                                                                ? "⏳"
                                                                : "🚧"}{" "}
                                                            {succM?.status ||
                                                              "Pending"}
                                                          </span>
                                                        )}
                                                      </li>
                                                    );
                                                  })}
                                                </ul>
                                              </div>
                                            ) : (
                                              <p className="text-xs text-gray-500 italic">
                                                No successor milestones
                                              </p>
                                            )}
                                          </div>

                                          {/* ── Section 2: Execution State (changes with project progress) ── */}
                                          <div
                                            className={`p-3 rounded-lg border ${
                                              isCompleted
                                                ? "bg-emerald-950/10 border-emerald-900/20"
                                                : incompletePredecessors.length >
                                                    0
                                                  ? "bg-red-950/10 border-red-900/20"
                                                  : "bg-amber-950/10 border-amber-900/20"
                                            }`}
                                          >
                                            <h5
                                              className={`text-[10px] font-bold uppercase tracking-wider mb-3 flex items-center gap-1.5 ${
                                                isCompleted
                                                  ? "text-emerald-400"
                                                  : incompletePredecessors.length >
                                                      0
                                                    ? "text-red-400"
                                                    : "text-amber-400"
                                              }`}
                                            >
                                              <AlertTriangle className="w-3 h-3" />
                                              Execution State
                                            </h5>

                                            {isCompleted ? (
                                              <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-xs text-emerald-400">
                                                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                  ✓ All predecessor milestones
                                                  completed
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-emerald-400">
                                                  <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                  No active blockers
                                                </div>
                                                {hasSuccessors &&
                                                  activelyBlockingSuccessors.length ===
                                                    0 && (
                                                    <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                                                      <span className="w-2 h-2 rounded-full bg-gray-600 flex-shrink-0" />
                                                      All successors unblocked
                                                      by this completion
                                                    </div>
                                                  )}
                                              </div>
                                            ) : milestoneStatus === "PENDING" &&
                                              incompletePredecessors.length >
                                                0 ? (
                                              <div>
                                                <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-wider mb-1.5 block">
                                                  Waiting For
                                                </span>
                                                <ul className="space-y-1">
                                                  {incompletePredecessors.map(
                                                    (
                                                      m: {
                                                        name: string;
                                                        status: string;
                                                      },
                                                      i: number,
                                                    ) => (
                                                      <li
                                                        key={i}
                                                        className="text-xs flex items-center gap-2 px-2 py-1 rounded bg-blue-950/15 border border-blue-900/20"
                                                      >
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                                                        <span className="text-gray-300">
                                                          {m.name}
                                                        </span>
                                                        <span className="ml-auto text-[10px] text-blue-400 font-semibold">
                                                          {m.status}
                                                        </span>
                                                      </li>
                                                    ),
                                                  )}
                                                </ul>
                                                <p className="mt-2 text-[10px] text-gray-500">
                                                  Cannot start until all
                                                  predecessors are completed.
                                                </p>
                                              </div>
                                            ) : incompletePredecessors.length >
                                              0 ? (
                                              <div>
                                                <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider mb-1.5 block">
                                                  Blocked By
                                                </span>
                                                <ul className="space-y-1">
                                                  {incompletePredecessors.map(
                                                    (
                                                      m: {
                                                        name: string;
                                                        status: string;
                                                      },
                                                      i: number,
                                                    ) => (
                                                      <li
                                                        key={i}
                                                        className="text-xs flex items-center gap-2 px-2 py-1 rounded bg-red-950/15 border border-red-900/20"
                                                      >
                                                        <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                                                        <span className="text-gray-300">
                                                          {m.name}
                                                        </span>
                                                        <span className="ml-auto text-[10px] text-red-400 font-semibold">
                                                          {m.status}
                                                        </span>
                                                      </li>
                                                    ),
                                                  )}
                                                </ul>
                                              </div>
                                            ) : hasPredecessors ? (
                                              <div className="flex items-center gap-2 text-xs text-emerald-400">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0" />
                                                {(progressPct || 0) > 0
                                                  ? `✓ Execution started (${progressPct}% complete)`
                                                  : "All predecessors complete — ready to execute"}
                                              </div>
                                            ) : null}

                                            {/* Currently Blocking — only show if this milestone is not yet done */}
                                            {!isCompleted &&
                                              activelyBlockingSuccessors.length >
                                                0 && (
                                                <div className="mt-3">
                                                  <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider mb-1.5 block">
                                                    Waiting Successors
                                                  </span>
                                                  <ul className="space-y-1">
                                                    {activelyBlockingSuccessors.map(
                                                      (
                                                        m: {
                                                          name: string;
                                                          status: string;
                                                        },
                                                        i: number,
                                                      ) => (
                                                        <li
                                                          key={i}
                                                          className="text-xs flex items-center gap-2 px-2 py-1 rounded bg-orange-950/10 border border-orange-900/20"
                                                        >
                                                          <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                                                          <span className="text-gray-300">
                                                            {m.name}
                                                          </span>
                                                          <span className="ml-auto text-[10px] text-orange-400 font-semibold">
                                                            {m.status}
                                                          </span>
                                                        </li>
                                                      ),
                                                    )}
                                                  </ul>
                                                </div>
                                              )}
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {dependencies &&
                                      dependencies.length > 0 && (
                                        <div className="mt-4 p-3 rounded-lg bg-gradient-to-br from-amber-950/40 via-gray-900/90 to-amber-950/30 border border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)] relative overflow-hidden">
                                          <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-amber-500/25">
                                            <h5 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                                              <span className="w-4 h-4 rounded-full bg-amber-500 text-gray-950 font-black text-[10px] flex items-center justify-center shadow-[0_0_8px_rgba(245,158,11,0.9)] animate-pulse">
                                                !
                                              </span>
                                              Execution Prerequisites
                                            </h5>
                                            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold shadow-xs">
                                              {dependencies.filter((d: any) =>
                                                typeof d === "object" &&
                                                d !== null
                                                  ? d.status === "COMPLETED"
                                                  : false,
                                              ).length}{" "}
                                              / {dependencies.length} Satisfied
                                            </span>
                                          </div>
                                          <ul className="space-y-2">
                                            {dependencies.map((dep, idx) => {
                                              const depObj = dep as any;
                                              const isObject =
                                                typeof dep === "object" &&
                                                dep !== null;
                                              const depName = isObject
                                                ? depObj.name
                                                : dep;

                                              // Only use heuristic for legacy strings
                                              const isDone = isObject
                                                ? depObj.status === "COMPLETED"
                                                : selectedItem.completion_status ===
                                                    "COMPLETED" ||
                                                  selectedItem.completion_status ===
                                                    "CANCELLED";

                                              return (
                                                <li
                                                  key={idx}
                                                  className={`text-xs flex flex-col gap-1.5 px-3.5 py-3 rounded-lg border-l-4 transition-all duration-300 ${
                                                    isDone
                                                      ? "bg-emerald-950/15 border-l-emerald-500 border-y-emerald-950/20 border-r-emerald-950/20 text-gray-400"
                                                      : "bg-amber-950/20 border-l-amber-500 border-y-amber-950/30 border-r-amber-950/30 text-amber-100 shadow-[0_2px_8px_rgba(245,158,11,0.08)]"
                                                  }`}
                                                >
                                                  <div className="flex items-start justify-between gap-2 leading-tight">
                                                    <div className="flex items-center gap-2">
                                                      {isDone ? (
                                                        <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] flex items-center justify-center font-bold flex-shrink-0">
                                                          ✓
                                                        </span>
                                                      ) : (
                                                        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 text-[10px] flex items-center justify-center font-bold animate-pulse flex-shrink-0">
                                                          !
                                                        </span>
                                                      )}
                                                      <span
                                                        className={`font-semibold tracking-wide ${
                                                          isDone
                                                            ? "line-through text-gray-500"
                                                            : "text-amber-200"
                                                        }`}
                                                      >
                                                        {depName}
                                                      </span>
                                                    </div>
                                                    {isObject &&
                                                      depObj.owner && (
                                                        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 shadow-xs flex-shrink-0">
                                                          {depObj.owner}
                                                        </span>
                                                      )}
                                                  </div>
                                                  <div className="flex items-center gap-1.5 pl-6 text-[10px]">
                                                    <span
                                                      className={`font-semibold uppercase tracking-wider ${
                                                        isDone
                                                          ? "text-emerald-400"
                                                          : "text-amber-400 animate-pulse"
                                                      }`}
                                                    >
                                                      {isDone
                                                        ? "Ready"
                                                        : "Pending Action"}
                                                    </span>
                                                  </div>
                                                  {isObject &&
                                                    depObj.evidence && (
                                                      <div className="ml-6 mt-1 text-[10px] text-gray-400 italic border-l border-gray-700/60 pl-2.5">
                                                        <strong>AI Evidence:</strong>{" "}
                                                        {depObj.evidence}
                                                      </div>
                                                    )}
                                                  {isObject &&
                                                    depObj.resolved_by_document &&
                                                    isDone && (
                                                      <div className="ml-4 text-[9px] text-emerald-500/50">
                                                        Resolved in document{" "}
                                                        {
                                                          depObj.resolved_by_document
                                                        }
                                                      </div>
                                                    )}
                                                </li>
                                              );
                                            })}
                                          </ul>
                                        </div>
                                      )}

                                    <details className="mt-5 group cursor-pointer">
                                      <summary className="text-xs font-bold text-text-muted uppercase tracking-wider hover:text-text-primary transition-colors list-none flex items-center">
                                        <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">
                                          ▶
                                        </span>
                                        AI Extraction Details
                                      </summary>
                                      <div className="mt-3 space-y-3 p-3 bg-bg-card/60 rounded-lg border border-border-strong/40">
                                        {(updateSource || updateDate) && (
                                          <div>
                                            <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                              Updated From
                                            </h5>
                                            <p className="text-xs text-text-secondary italic">
                                              {updateSource
                                                ? updateSource
                                                : "Unknown Document"}
                                              {updateDate &&
                                                ` • ${formatDate(updateDate)}`}
                                            </p>
                                          </div>
                                        )}
                                        {latestProgress?.evidence_text && (
                                          <div>
                                            <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                              Progress Evidence
                                            </h5>
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                              {latestProgress.evidence_text}
                                            </p>
                                          </div>
                                        )}
                                        {selectedItem.description && (
                                          <div>
                                            <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                              AI Reasoning (Baseline)
                                            </h5>
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                              {selectedItem.description}
                                            </p>
                                          </div>
                                        )}
                                        {selectedItem.evidence_text && (
                                          <div>
                                            <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                              Evidence (Baseline)
                                            </h5>
                                            <p className="text-xs text-text-secondary italic leading-relaxed">
                                              {selectedItem.evidence_text}
                                            </p>
                                          </div>
                                        )}
                                        {selectedItem.name &&
                                          selectedItem.scope_item_normalized && (
                                            <div>
                                              <h5 className="text-[10px] font-bold text-text-muted mb-1 uppercase tracking-wider">
                                                Original Text
                                              </h5>
                                              <p className="text-xs text-text-secondary font-serif italic">
                                                {selectedItem.name}
                                              </p>
                                            </div>
                                          )}
                                      </div>
                                    </details>
                                  </div>

                                  {/* Status indicator */}
                                  <div className="flex-shrink-0">
                                    <div
                                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border shadow-sm ${
                                        completionStatus === "COMPLETED"
                                          ? "bg-emerald-950/60 text-emerald-300 border-emerald-700/50"
                                          : completionStatus === "BLOCKED" ||
                                              completionStatus === "DELAYED"
                                            ? "bg-red-950/60 text-red-300 border-red-700/50"
                                            : completionStatus === "IN_PROGRESS"
                                              ? "bg-blue-950/60 text-blue-300 border-blue-700/50"
                                              : "bg-bg-hover/80 text-text-secondary border-border-strong/60"
                                      }`}
                                    >
                                      {completionStatus === "COMPLETED" && (
                                        <CheckCircle2 className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                      )}
                                      {completionStatus === "BLOCKED" && (
                                        <X className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                      )}
                                      {(completionStatus === "IN_PROGRESS" ||
                                        completionStatus === "ACTIVE") && (
                                        <Clock className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
                                      )}
                                      {statusLabel}
                                    </div>
                                  </div>
                                </div>

                                {/* Meta badges */}
                                <div className="flex flex-wrap gap-2 mt-3">
                                  {(selectedItem.milestone_normalized ||
                                    selectedItem.milestone) && (
                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/30 text-blue-300 border border-blue-800/25 shadow-sm">
                                      <MapPin className="w-3 h-3" />
                                      {selectedItem.milestone_normalized ||
                                        selectedItem.milestone}
                                    </span>
                                  )}
                                  {(selectedItem.deadline_text ||
                                    selectedItem.deadline) && (
                                    <span
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm"
                                      style={{
                                        backgroundColor: `${color.bg}`,
                                        borderColor: `${color.border}30`,
                                        color: color.text,
                                      }}
                                    >
                                      <Calendar className="w-3 h-3" />
                                      {formatItemDate(selectedItem)}
                                    </span>
                                  )}
                                  <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-bg-hover/50 border border-border-strong/40 text-text-muted text-xs font-medium">
                                    {selectedItem.scope_type?.replace(
                                      "_",
                                      " ",
                                    ) || "Scope Item"}
                                  </span>
                                  {selectedItem._dateMs !== null && (
                                    <span
                                      className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                        completionStatus === "COMPLETED"
                                          ? "bg-emerald-950/20 text-emerald-300/80 border-emerald-800/20"
                                          : selectedItem._dateMs < todayMs
                                            ? "bg-red-950/20 text-red-300/80 border-red-800/20"
                                            : selectedItem._dateMs === todayMs
                                              ? "bg-orange-950/20 text-orange-300/80 border-orange-800/20"
                                              : "bg-green-950/20 text-green-300/80 border-green-800/20"
                                      }`}
                                    >
                                      {completionStatus === "COMPLETED"
                                        ? "✅ Completed"
                                        : selectedItem._dateMs < todayMs
                                          ? "⏰ Overdue"
                                          : selectedItem._dateMs === todayMs
                                            ? "📍 Due Today"
                                            : `📅 ${Math.ceil((selectedItem._dateMs - todayMs) / 86400000)} days left`}
                                    </span>
                                  )}
                                </div>

                                {/* Interactive Update & Reschedule Controls */}
                                {(user?.role === "ADMIN" ||
                                  user?.role === "ENGAGEMENT_MANAGER" ||
                                  user?.role === "PROJECT_LEAD") && (
                                  <div className="mt-5 pt-4 border-t border-border-subtle/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Update Status:
                                      </span>
                                      <div className="flex rounded-lg overflow-hidden border border-border-strong bg-bg-card/60 p-0.5">
                                        {[
                                          {
                                            value: "ACTIVE",
                                            label: "Pending",
                                            color:
                                              "hover:bg-blue-600/80 hover:text-text-primary",
                                          },
                                          {
                                            value: "COMPLETED",
                                            label: "Completed",
                                            color:
                                              "hover:bg-emerald-600/80 hover:text-text-primary",
                                          },
                                          {
                                            value: "CANCELLED",
                                            label: "Cancelled",
                                            color:
                                              "hover:bg-red-600/80 hover:text-text-primary",
                                          },
                                        ].map((opt) => (
                                          <button
                                            key={opt.value}
                                            onClick={() =>
                                              handleUpdateCompletionStatus(
                                                selectedItem.id,
                                                opt.value,
                                              )
                                            }
                                            className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                              completionStatus === opt.value
                                                ? opt.value === "COMPLETED"
                                                  ? "bg-emerald-600 text-text-primary shadow-md shadow-emerald-600/25"
                                                  : opt.value === "CANCELLED"
                                                    ? "bg-red-600 text-text-primary shadow-md shadow-red-600/25"
                                                    : "bg-blue-600 text-text-primary shadow-md shadow-blue-600/25"
                                                : `text-text-muted ${opt.color}`
                                            }`}
                                            disabled={
                                              project?.monitoring_status ===
                                              "CLOSED"
                                            }
                                          >
                                            {opt.label}
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2.5">
                                      <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                                        Reschedule:
                                      </span>
                                      <input
                                        id="reschedule-date-input"
                                        type="date"
                                        className="px-2.5 py-1 text-xs font-semibold rounded-md border border-border-strong bg-bg-card/60 text-text-primary focus:outline-none focus:border-violet-500 cursor-pointer shadow-inner"
                                        value={
                                          selectedItem.deadline
                                            ? new Date(selectedItem.deadline)
                                                .toISOString()
                                                .split("T")[0]
                                            : ""
                                        }
                                        onChange={(e) =>
                                          handleRescheduleDeadline(
                                            selectedItem.id,
                                            e.target.value,
                                          )
                                        }
                                        disabled={
                                          project?.monitoring_status ===
                                          "CLOSED"
                                        }
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                    </div>
                  );
                })()
              )}
            </div>

    </>
  );
};
