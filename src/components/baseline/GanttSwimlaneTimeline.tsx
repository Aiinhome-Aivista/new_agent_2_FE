import React, { useState, useMemo } from "react";
import {
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Filter,
  List,
  BarChart3,
  ChevronRight,
  Search,
  X,
  Users,
} from "lucide-react";
import { useTheme } from "../../context/ThemeContext";

interface GanttSwimlaneTimelineProps {
  items: any[];
  milestones?: any[];
  project?: any;
  selectedId: number | null;
  onSelect: (id: number) => void;
  formatDate: (dateStr: string | null | undefined) => string;
}

export const GanttSwimlaneTimeline: React.FC<GanttSwimlaneTimelineProps> = ({
  items,
  milestones = [],
  project,
  selectedId,
  onSelect,
  formatDate,
}) => {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const [viewMode, setViewMode] = useState<"GANTT" | "TABLE">("GANTT");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("" );

  // Dynamic Timeline Anchors
  const CONTRACT_START = useMemo(() => {
    if (project?.start_date && !isNaN(new Date(project.start_date).getTime())) {
      return new Date(project.start_date).getTime();
    }
    const validStarts = (items || [])
      .map((i) => i.estimated_start_date || i.predicted_start_date || i.start_date)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    if (validStarts.length > 0) return Math.min(...validStarts);
    return new Date("2027-01-22").getTime();
  }, [project?.start_date, items]);

  const CONTRACT_END = useMemo(() => {
    if (project?.end_date && !isNaN(new Date(project.end_date).getTime())) {
      return new Date(project.end_date).getTime();
    }
    const validEnds = (items || [])
      .map((i) => i.deadline || i.estimated_deadline || i.predicted_deadline)
      .filter(Boolean)
      .map((d) => new Date(d).getTime())
      .filter((t) => !isNaN(t));
    if (validEnds.length > 0) return Math.max(...validEnds);
    return CONTRACT_START + 98 * 86400000;
  }, [project?.end_date, items, CONTRACT_START]);

  const SUPPORT_END = useMemo(() => {
    return CONTRACT_END + 92 * 86400000;
  }, [CONTRACT_END]);

  // Normalize item dates and modules
  const processedItems = useMemo(() => {
    return items.map((item, idx) => {
      const rawStart =
        item.estimated_start_date ||
        item.predicted_start_date ||
        item.start_date ||
        new Date(CONTRACT_START).toISOString().split("T")[0];
      const rawDeadline =
        item.deadline ||
        item.estimated_deadline ||
        item.predicted_deadline ||
        item.deadline_normalized ||
        item.deadline_text;

      let startMs = new Date(rawStart).getTime();
      if (isNaN(startMs)) startMs = CONTRACT_START;

      let deadlineMs = rawDeadline ? new Date(rawDeadline).getTime() : startMs + 14 * 86400000;
      if (isNaN(deadlineMs)) deadlineMs = startMs + 14 * 86400000;

      const name = item.name || item.item_name || `Item ${idx + 1}`;
      const nameLower = name.toLowerCase();
      const descLower = (item.description || "").toLowerCase();

      // Dynamic Module grouping with intelligent fallback
      let moduleName = item.module || item.system_module || item.functional_area || item.section_name;
      if (!moduleName) {
        if (
          nameLower.includes("employee collaboration") ||
          nameLower.includes("landing page") ||
          nameLower.includes("announcement") ||
          nameLower.includes("notification") ||
          nameLower.includes("vconnect") ||
          descLower.includes("employee collaboration")
        ) {
          moduleName = "Employee Collaboration";
        } else if (
          nameLower.includes("internal job posting") ||
          nameLower.includes("job requisition") ||
          nameLower.includes("candidate view") ||
          nameLower.includes("applicant") ||
          nameLower.includes("hiring") ||
          descLower.includes("internal job posting")
        ) {
          moduleName = "Internal Job Posting";
        } else {
          moduleName = "General / Foundation";
        }
      }

      // Check if exceeds contract end date
      const isOverrun = deadlineMs > CONTRACT_END;
      const overrunDays = isOverrun ? Math.round((deadlineMs - CONTRACT_END) / 86400000) : 0;
      const isContractConfirmed =
        item.date_provenance === "CONTRACT_CONFIRMED" || item.deadline_type === "CONTRACT_CONFIRMED";

      return {
        ...item,
        _id: item.id || idx,
        _name: name,
        _startMs: startMs,
        _deadlineMs: deadlineMs,
        _module: moduleName,
        _isOverrun: isOverrun,
        _overrunDays: overrunDays,
        _isContractConfirmed: isContractConfirmed,
      };
    });
  }, [items, CONTRACT_START, CONTRACT_END]);

  // Dynamic modules list for dropdown filter
  const availableModules = useMemo(() => {
    const set = new Set<string>();
    processedItems.forEach((i) => {
      if (i._module) set.add(i._module);
    });
    return Array.from(set).sort();
  }, [processedItems]);

  // Filter items
  const filteredItems = useMemo(() => {
    return processedItems.filter((item) => {
      if (moduleFilter !== "ALL" && item._module !== moduleFilter) return false;
      if (statusFilter === "OVERRUN" && !item._isOverrun) return false;
      if (statusFilter === "ON_TRACK" && item._isOverrun) return false;
      if (statusFilter === "CONTRACT_CONFIRMED" && !item._isContractConfirmed) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return (
          item._name.toLowerCase().includes(q) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.candidate_id && item.candidate_id.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [processedItems, moduleFilter, statusFilter, searchQuery]);

  // Group by module for swimlanes
  const lanes = useMemo(() => {
    const map = new Map<string, typeof processedItems>();
    for (const item of filteredItems) {
      if (!map.has(item._module)) map.set(item._module, []);
      map.get(item._module)!.push(item);
    }
    return Array.from(map.entries());
  }, [filteredItems]);

  // Overall timeline bounds
  const minMs = CONTRACT_START - 7 * 86400000;
  const maxMs = SUPPORT_END + 7 * 86400000;
  const totalRange = maxMs - minMs;

  const toPct = (ms: number) => {
    return Math.max(0, Math.min(100, ((ms - minMs) / totalRange) * 100));
  };

  const contractEndPct = toPct(CONTRACT_END);
  const supportEndPct = toPct(SUPPORT_END);

  // Month header markers
  const months = useMemo(() => {
    const list: { name: string; pct: number }[] = [];
    const cur = new Date(minMs);
    cur.setDate(1);
    cur.setHours(0, 0, 0, 0);
    const end = new Date(maxMs);
    while (cur <= end) {
      const ms = cur.getTime();
      if (ms >= minMs && ms <= maxMs) {
        list.push({
          name: cur.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
          pct: toPct(ms),
        });
      }
      cur.setMonth(cur.getMonth() + 1);
    }
    return list;
  }, [minMs, maxMs]);

  const totalOverruns = processedItems.filter((i) => i._isOverrun).length;
  const totalConfirmed = processedItems.filter((i) => i._isContractConfirmed).length;

  return (
    <div
      className={`rounded-3xl p-6 sm:p-8 border transition-all duration-300 ${
        isDark
          ? "bg-[#141416] border-white/10 shadow-2xl"
          : "bg-white border-slate-200/90 shadow-sm"
      }`}
    >
      {/* ── TOP HEADER (Matching Deliverables Timeline Format) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-200/80 dark:border-white/10">
        {/* Left: Orange Brand Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#FF5A14] text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/20">
            <Layers className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Contract Work-Items & Delivery Plan
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-orange-500/10 text-[#FF5A14] border border-orange-500/20">
                {processedItems.length} Scheduled Items
              </span>
              {totalOverruns > 0 && (
                <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-500 dark:text-amber-400 border border-amber-500/20">
                  <AlertTriangle className="w-3 h-3" />
                  {totalOverruns} Overruns
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
              Parallel team allocation (5 Devs @ 70% capacity) • Solid: Contract Confirmed • Dashed: AI Predicted
            </p>
          </div>
        </div>

        {/* Right: Filter Pills, Module Selector & View Mode Switcher */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Filter Tabs (Reference Style) */}
          <div className="flex items-center gap-1.5">
            {[
              { value: "ALL", label: "All" },
              { value: "ON_TRACK", label: "On Track" },
              { value: "OVERRUN", label: "Overrun" },
              { value: "CONTRACT_CONFIRMED", label: "Confirmed" },
            ].map((opt) => (
              <button
                key={opt.value}
                onClick={() => setStatusFilter(opt.value)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === opt.value
                    ? "bg-[#FF5A14] text-white shadow-xs"
                    : isDark
                    ? "bg-white/5 hover:bg-white/10 text-gray-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Module Selector */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer focus:outline-none focus:border-[#FF5A14] ${
              isDark
                ? "bg-[#19191f] text-gray-200 border-white/10"
                : "bg-slate-50 text-slate-800 border-slate-200"
            }`}
          >
            <option value="ALL">All Modules ({availableModules.length})</option>
            {availableModules.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>

          {/* View Toggle: Swimlane Gantt vs Item Table */}
          <div
            className={`flex items-center p-1 rounded-xl border ${
              isDark ? "bg-white/5 border-white/10" : "bg-slate-100 border-slate-200/80"
            }`}
          >
            <button
              onClick={() => setViewMode("GANTT")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "GANTT"
                  ? "bg-[#FF5A14] text-white shadow-xs"
                  : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Swimlane Gantt</span>
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                viewMode === "TABLE"
                  ? "bg-[#FF5A14] text-white shadow-xs"
                  : "text-slate-600 dark:text-gray-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Item Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── SEARCH & FILTER STRIP ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 pb-2">
        <div className="relative min-w-[220px] max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search work items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border transition-all focus:outline-none focus:border-[#FF5A14] ${
              isDark
                ? "bg-white/5 text-white border-white/10 placeholder-gray-500"
                : "bg-slate-50 text-slate-900 border-slate-200 placeholder-slate-400"
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:text-gray-500 dark:hover:text-gray-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-gray-400 flex-wrap">
          <span>
            Showing <strong>{filteredItems.length}</strong> of {processedItems.length} items
          </span>
          <span>•</span>
          <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
            {totalConfirmed} Confirmed
          </span>
          <span>•</span>
          <span className="text-orange-600 dark:text-orange-400 font-semibold">
            {processedItems.length - totalConfirmed} Forecasted
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT (Shorter Height & Scrollable: max-h-[460px]) ── */}
      <div className="mt-4">
        {viewMode === "GANTT" ? (
          /* Gantt Swimlane View: Scrollable Horizontally and Vertically */
          <div
            className={`rounded-2xl border overflow-hidden ${
              isDark ? "border-white/10 bg-[#121215]" : "border-slate-200/90 bg-slate-50/50"
            }`}
          >
            <div className="max-h-[460px] overflow-y-auto overflow-x-auto custom-scrollbar p-4">
              <div className="min-w-[1020px] relative pb-4">
                {/* Sticky Month Axis Header */}
                <div
                  className={`sticky top-0 z-30 backdrop-blur-md pb-2 mb-4 border-b ${
                    isDark
                      ? "bg-[#121215]/95 border-white/10"
                      : "bg-slate-50/95 border-slate-200/90"
                  }`}
                >
                  <div className="relative h-8">
                    {months.map((m, idx) => (
                      <div
                        key={idx}
                        className="absolute text-[11px] font-semibold text-slate-500 dark:text-gray-400 -translate-x-1/2 flex flex-col items-center"
                        style={{ left: `${m.pct}%` }}
                      >
                        <span>{m.name}</span>
                        <div className="w-px h-2.5 bg-slate-300 dark:bg-white/15 mt-0.5"></div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Vertical Anchor Reference Lines */}
                {/* Contract Validity End */}
                <div
                  className="absolute top-8 bottom-0 w-0.5 border-r-2 border-dashed border-rose-500/70 z-20 pointer-events-none"
                  style={{ left: `${contractEndPct}%` }}
                >
                  <span className="absolute top-0 -translate-x-1/2 -translate-y-full bg-rose-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                    Contract Validity ({formatDate(new Date(CONTRACT_END).toISOString().split("T")[0])})
                  </span>
                </div>

                {/* Production Support End */}
                <div
                  className="absolute top-8 bottom-0 w-0.5 border-r-2 border-dashed border-sky-500/70 z-20 pointer-events-none"
                  style={{ left: `${supportEndPct}%` }}
                >
                  <span className="absolute top-0 -translate-x-1/2 -translate-y-full bg-sky-500 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs whitespace-nowrap">
                    Support End ({formatDate(new Date(SUPPORT_END).toISOString().split("T")[0])})
                  </span>
                </div>

                {/* Swimlanes for each module */}
                <div className="space-y-4 pt-4">
                  {lanes.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 dark:text-gray-400">
                      No scheduled work items match the selected filters.
                    </div>
                  ) : (
                    lanes.map(([laneName, laneItems]) => (
                      <div
                        key={laneName}
                        className={`rounded-2xl p-4 border transition-all duration-200 ${
                          isDark
                            ? "bg-[#19191f] border-white/10 shadow-sm"
                            : "bg-white border-slate-200/80 shadow-xs"
                        }`}
                      >
                        {/* Lane Title Header */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-bold text-slate-900 dark:text-gray-200 uppercase tracking-wider flex items-center gap-2">
                            <Layers className="w-3.5 h-3.5 text-[#FF5A14]" />
                            {laneName}
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-200 dark:border-white/10">
                              {laneItems.length}
                            </span>
                          </span>
                        </div>

                        {/* Lane Tasks Grid */}
                        <div className="relative min-h-[72px] space-y-2.5 py-1">
                          {laneItems.map((item) => {
                            const leftPct = toPct(item._startMs);
                            const rightPct = toPct(item._deadlineMs);
                            const widthPct = Math.max(2.5, rightPct - leftPct);
                            const isSelected = selectedId === item._id;

                            return (
                              <div
                                key={item._id}
                                onClick={() => onSelect(item._id)}
                                style={{
                                  left: `${leftPct}%`,
                                  width: `${widthPct}%`,
                                  minWidth: "150px",
                                }}
                                className={`relative group rounded-xl px-3 py-2 text-left cursor-pointer transition-all duration-200 border ${
                                  isSelected
                                    ? "ring-2 ring-[#FF5A14] bg-orange-500/15 border-[#FF5A14] shadow-md z-20"
                                    : item._isOverrun
                                    ? isDark
                                      ? "bg-[#271d15] hover:bg-[#342418] border-amber-500/50 text-gray-100 hover:border-amber-400"
                                      : "bg-amber-50/90 hover:bg-amber-100/90 border-amber-300 text-slate-900 hover:border-amber-500"
                                    : item._isContractConfirmed
                                    ? isDark
                                      ? "bg-[#18261e] hover:bg-[#203429] border-emerald-500/40 text-gray-100 hover:border-emerald-400"
                                      : "bg-emerald-50/90 hover:bg-emerald-100/90 border-emerald-200 text-slate-900 hover:border-emerald-500"
                                    : isDark
                                    ? "bg-[#1f1f26] hover:bg-[#272730] border-white/10 text-gray-200 hover:border-[#FF5A14]/60"
                                    : "bg-white hover:bg-slate-50 border-slate-200 text-slate-900 hover:border-[#FF5A14]/60 shadow-xs"
                                } ${item._isContractConfirmed ? "border-solid" : "border-dashed"}`}
                              >
                                <div className="flex items-center justify-between gap-1 overflow-hidden">
                                  <span
                                    className="text-xs font-bold truncate flex-1 leading-snug"
                                    title={item._name}
                                  >
                                    {item._name}
                                  </span>
                                  {item._isOverrun && (
                                    <span
                                      className="flex-shrink-0 text-[10px] font-extrabold text-amber-500 dark:text-amber-400 flex items-center gap-0.5 bg-amber-500/10 px-1.5 py-0.5 rounded"
                                      title={`Forecast completion exceeds contract by ${item._overrunDays} days`}
                                    >
                                      <AlertTriangle className="w-2.5 h-2.5" />
                                      +{item._overrunDays}d
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 dark:text-gray-400">
                                  <span className="truncate font-medium">
                                    {formatDate(item.deadline || item.estimated_deadline)}
                                  </span>
                                  <span>•</span>
                                  <span
                                    className={`font-semibold ${
                                      item._isContractConfirmed
                                        ? "text-emerald-600 dark:text-emerald-400"
                                        : "text-orange-600 dark:text-orange-400"
                                    }`}
                                  >
                                    {item._isContractConfirmed ? "Confirmed" : "AI Forecast"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Sortable Tabular Work Items List (Shorter Height & Scrollable: max-h-[460px]) */
          <div
            className={`rounded-2xl border overflow-hidden max-h-[460px] overflow-y-auto custom-scrollbar ${
              isDark ? "bg-[#19191f] border-white/10" : "bg-white border-slate-200/90 shadow-xs"
            }`}
          >
            <table className="w-full text-left text-xs">
              <thead
                className={`sticky top-0 z-10 text-xs font-bold border-b ${
                  isDark
                    ? "bg-[#1e1e24] text-gray-300 border-white/10"
                    : "bg-slate-100/90 text-slate-700 border-slate-200"
                }`}
              >
                <tr>
                  <th className="py-3 px-4">Candidate / ID</th>
                  <th className="py-3 px-4">Work Item Title</th>
                  <th className="py-3 px-4">Module</th>
                  <th className="py-3 px-4">Start Date</th>
                  <th className="py-3 px-4">Predicted Deadline</th>
                  <th className="py-3 px-4">Provenance</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? "divide-white/5" : "divide-slate-200/70"}`}>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500 dark:text-gray-400">
                      No work items found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredItems.map((item) => {
                    const isSelected = selectedId === item._id;
                    return (
                      <tr
                        key={item._id}
                        onClick={() => onSelect(item._id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected
                            ? isDark
                              ? "bg-orange-500/15 font-semibold"
                              : "bg-orange-50 font-semibold"
                            : isDark
                            ? "hover:bg-white/5 text-gray-200"
                            : "hover:bg-slate-50 text-slate-800"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono text-[11px] text-slate-400 dark:text-gray-400">
                          {item.candidate_id || `#${item._id}`}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900 dark:text-white max-w-xs truncate">
                          {item._name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-gray-300">
                            {item._module}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-gray-400">
                          {formatDate(item.estimated_start_date || "2027-01-22")}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-900 dark:text-white">
                          {formatDate(item.deadline || item.estimated_deadline)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                              item._isContractConfirmed
                                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
                                : "bg-orange-50 dark:bg-orange-950/40 text-[#FF5A14] dark:text-[#FF7A45] border-orange-200/60 dark:border-orange-800/40"
                            }`}
                          >
                            {item._isContractConfirmed ? "Contract Confirmed" : "AI Forecast"}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {item._isOverrun ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Overrun (+{item._overrunDays}d)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                              <CheckCircle2 className="w-2.5 h-2.5" />
                              On Track
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelect(item._id);
                            }}
                            className="text-xs text-[#FF5A14] hover:text-orange-600 font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── FOOTER LEGEND BAR ── */}
      <div
        className={`flex flex-wrap items-center justify-between gap-3 pt-5 mt-4 border-t text-xs ${
          isDark ? "border-white/10 text-gray-400" : "border-slate-200/80 text-slate-500"
        }`}
      >
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded border border-emerald-500 bg-emerald-500/20"></span>
            <span className="font-medium">Contract Confirmed (Solid)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-2 rounded border border-dashed border-orange-500 bg-orange-500/20"></span>
            <span className="font-medium">AI Forecast (Dashed)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
            <span className="font-medium">Forecast Overrun</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-rose-500"></span>
            <span className="font-medium">Contract Validity End</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-sky-500"></span>
            <span className="font-medium">Support End</span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-medium">
          <Users className="w-3.5 h-3.5 text-[#FF5A14]" />
          <span>Team Allocation: 5 Devs @ 70% capacity</span>
        </div>
      </div>
    </div>
  );
};
