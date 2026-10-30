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
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";

interface GanttSwimlaneTimelineProps {
  items: any[];
  milestones?: any[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  formatDate: (dateStr: string | null | undefined) => string;
}

export const GanttSwimlaneTimeline: React.FC<GanttSwimlaneTimelineProps> = ({
  items,
  milestones = [],
  selectedId,
  onSelect,
  formatDate,
}) => {
  const [viewMode, setViewMode] = useState<"GANTT" | "TABLE">("GANTT");
  const [moduleFilter, setModuleFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Timeline anchors
  const CONTRACT_START = new Date("2027-01-22").getTime();
  const CONTRACT_END = new Date("2027-04-30").getTime();
  const SUPPORT_END = new Date("2027-07-31").getTime();

  // Normalize item dates and modules
  const processedItems = useMemo(() => {
    return items.map((item, idx) => {
      const rawStart =
        item.estimated_start_date ||
        item.predicted_start_date ||
        item.start_date ||
        "2027-01-22";
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

      // Module lane grouping
      let moduleName = "General / Foundation";
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
      }

      // Check if exceeds contract end date
      const isOverrun = deadlineMs > CONTRACT_END;
      const overrunDays = isOverrun ? Math.round((deadlineMs - CONTRACT_END) / 86400000) : 0;
      const isContractConfirmed = item.date_provenance === "CONTRACT_CONFIRMED" || item.deadline_type === "CONTRACT_CONFIRMED";

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
  }, [items]);

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
    const cur = new Date("2027-01-01T00:00:00");
    const end = new Date("2027-08-01T00:00:00");
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

  return (
    <div className="bg-bg-card/70 border border-border-subtle rounded-2xl p-5 mb-8 shadow-sm backdrop-blur-sm">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-5 pb-4 border-b border-border-subtle">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-1.5 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-pink-500"></div>
            <h3 className="text-lg font-bold text-text-primary tracking-tight">
              Contract Work-Items & Delivery Plan
            </h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              {processedItems.length} Scheduled Work Items
            </span>
            {totalOverruns > 0 && (
              <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">
                <AlertTriangle className="w-3 h-3" />
                {totalOverruns} Forecast Overruns
              </span>
            )}
          </div>
          <p className="text-xs text-text-muted mt-1">
            Parallel team allocation (5 Devs @ 70% capacity) • Solid: Contract Confirmed • Dashed: AI Predicted
          </p>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Module Filter */}
          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-bg-base border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Modules</option>
            <option value="Employee Collaboration">Employee Collaboration</option>
            <option value="Internal Job Posting">Internal Job Posting</option>
            <option value="General / Foundation">General / Foundation</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-bg-base border border-border-subtle rounded-lg text-text-primary focus:outline-none focus:border-indigo-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ON_TRACK">On Track (≤ April 30)</option>
            <option value="OVERRUN">Overrun (&gt; April 30)</option>
            <option value="CONTRACT_CONFIRMED">Contract Confirmed</option>
          </select>

          {/* Toggle View */}
          <div className="flex items-center bg-bg-base border border-border-subtle rounded-lg p-0.5">
            <button
              onClick={() => setViewMode("GANTT")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "GANTT"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Swimlane Gantt
            </button>
            <button
              onClick={() => setViewMode("TABLE")}
              className={`flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                viewMode === "TABLE"
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "text-text-muted hover:text-text-primary"
              }`}
            >
              <List className="w-3.5 h-3.5" />
              Item Table
            </button>
          </div>
        </div>
      </div>

      {viewMode === "GANTT" ? (
        /* Gantt Swimlane View */
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[1000px] relative">
            {/* Timeline Header Months Axis */}
            <div className="relative h-8 border-b border-border-subtle/80 mb-3">
              {months.map((m, idx) => (
                <div
                  key={idx}
                  className="absolute text-[11px] font-semibold text-text-muted -translate-x-1/2 flex flex-col items-center"
                  style={{ left: `${m.pct}%` }}
                >
                  <span>{m.name}</span>
                  <div className="w-px h-2 bg-border-subtle mt-0.5"></div>
                </div>
              ))}
            </div>

            {/* Vertical Anchor Reference Lines */}
            {/* Contract Validity End (April 30, 2027) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 border-r-2 border-dashed border-rose-500/60 z-10 pointer-events-none"
              style={{ left: `${contractEndPct}%` }}
            >
              <span className="absolute top-0 -translate-x-1/2 -translate-y-full bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                Contract Validity (30 Apr 2027)
              </span>
            </div>

            {/* Production Support End (July 31, 2027) */}
            <div
              className="absolute top-0 bottom-0 w-0.5 border-r-2 border-dashed border-sky-500/50 z-10 pointer-events-none"
              style={{ left: `${supportEndPct}%` }}
            >
              <span className="absolute top-0 -translate-x-1/2 -translate-y-full bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm whitespace-nowrap">
                Support End (31 Jul 2027)
              </span>
            </div>

            {/* Swimlanes */}
            <div className="space-y-6 pt-6">
              {lanes.map(([laneName, laneItems]) => (
                <div key={laneName} className="relative bg-bg-base/40 rounded-xl p-3 border border-border-subtle/40">
                  {/* Lane Title Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      {laneName} ({laneItems.length})
                    </span>
                  </div>

                  {/* Lane Tasks Grid */}
                  <div className="relative min-h-[70px] space-y-2 py-1">
                    {laneItems.map((item) => {
                      const leftPct = toPct(item._startMs);
                      const rightPct = toPct(item._deadlineMs);
                      const widthPct = Math.max(2, rightPct - leftPct);
                      const isSelected = selectedId === item._id;

                      return (
                        <div
                          key={item._id}
                          onClick={() => onSelect(item._id)}
                          style={{
                            left: `${leftPct}%`,
                            width: `${widthPct}%`,
                            minWidth: "140px",
                          }}
                          className={`relative group rounded-lg px-2.5 py-1.5 text-left cursor-pointer transition-all duration-200 border ${
                            isSelected
                              ? "ring-2 ring-indigo-400 bg-indigo-500/25 border-indigo-400 shadow-lg z-20"
                              : item._isOverrun
                              ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-text-primary hover:border-amber-400"
                              : item._isContractConfirmed
                              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-text-primary hover:border-emerald-400"
                              : "bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 text-text-primary hover:border-purple-400"
                          } ${item._isContractConfirmed ? "border-solid" : "border-dashed"}`}
                        >
                          <div className="flex items-center justify-between gap-1 overflow-hidden">
                            <span className="text-xs font-semibold truncate flex-1" title={item._name}>
                              {item._name}
                            </span>
                            {item._isOverrun && (
                              <span
                                className="flex-shrink-0 text-[10px] font-bold text-amber-400 flex items-center gap-0.5"
                                title={`Predicted completion exceeds April 30 by ${item._overrunDays} days`}
                              >
                                <AlertTriangle className="w-2.5 h-2.5" />
                                +{item._overrunDays}d
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[10px] text-text-muted">
                            <span className="truncate">
                              {formatDate(item.deadline || item.estimated_deadline)}
                            </span>
                            <span>•</span>
                            <span className={item._isContractConfirmed ? "text-emerald-400" : "text-purple-400"}>
                              {item._isContractConfirmed ? "Confirmed" : "AI Forecast"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Sortable Tabular Work Items List */
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-text-muted font-bold">
                <th className="py-2.5 px-3">Candidate / ID</th>
                <th className="py-2.5 px-3">Work Item Title</th>
                <th className="py-2.5 px-3">Module</th>
                <th className="py-2.5 px-3">Start Date</th>
                <th className="py-2.5 px-3">Predicted Deadline</th>
                <th className="py-2.5 px-3">Provenance</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/50">
              {filteredItems.map((item) => {
                const isSelected = selectedId === item._id;
                return (
                  <tr
                    key={item._id}
                    onClick={() => onSelect(item._id)}
                    className={`hover:bg-bg-base/60 transition-colors cursor-pointer ${
                      isSelected ? "bg-indigo-500/10 font-medium" : ""
                    }`}
                  >
                    <td className="py-2.5 px-3 text-text-muted font-mono text-[11px]">
                      {item.candidate_id || `#${item._id}`}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-text-primary max-w-xs truncate">
                      {item._name}
                    </td>
                    <td className="py-2.5 px-3 text-text-muted">{item._module}</td>
                    <td className="py-2.5 px-3 text-text-muted">
                      {formatDate(item.estimated_start_date || "2027-01-22")}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-text-primary">
                      {formatDate(item.deadline || item.estimated_deadline)}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                          item._isContractConfirmed
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                        }`}
                      >
                        {item._isContractConfirmed ? "Contract" : "AI Forecast"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {item._isOverrun ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <AlertTriangle className="w-2.5 h-2.5" />
                          Overrun (+{item._overrunDays}d)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          On Track
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelect(item._id);
                        }}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-bold inline-flex items-center gap-1"
                      >
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

