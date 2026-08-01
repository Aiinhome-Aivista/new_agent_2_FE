import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { Loader } from "../components/Loader";
import { useDocumentProgress } from "../context/DocumentProgressContext";
import {
  Loader2,
  Info,
  Download,
  CheckCheck,
  Circle,
  AlertCircle,
  X,
  AlertTriangle,
  ChevronRight,
  ShieldAlert,
  Briefcase,
  Sparkles,
  Clock,
  FileText,
  User,
  Activity,
  TrendingUp,
  RotateCcw,
  CheckCircle2,
  History,
  ScrollText,
  Tag,
  Hash,
} from "lucide-react";
import { useAuth } from "../auth/AuthContext";

interface TrackerStep {
  key: string;
  name: string;
  desc: string;
  metricKey?: string;
}

const steps: TrackerStep[] = [
  {
    key: "Loading Project Baseline",
    name: "Loading Project Baseline",
    desc: "Loading Engagement Letter / IFA baseline.",
  },
  {
    key: "Reading Uploaded Document",
    name: "Reading Uploaded Document",
    desc: "Parsing uploaded Status Report / MoM.",
  },
  {
    key: "Extracting Activities",
    name: "Extracting Activities",
    desc: "Extracting activities, action items, blockers and decisions.",
  },
  {
    key: "Running In-Scope Evaluation Agent",
    name: "Running In-Scope Evaluation Agent",
    desc: "Comparing extracted activities against approved scope.",
    metricKey: "matched_activities",
  },
  {
    key: "Running Out-of-Scope Detection Agent",
    name: "Running Out-of-Scope Detection Agent",
    desc: "Detecting possible scope creep.",
    metricKey: "oos_activities",
  },
  {
    key: "Running Deliverable Evaluation Agent",
    name: "Running Deliverable Evaluation Agent",
    desc: "Evaluating deliverables, milestones, blockers and delays.",
    metricKey: "delayed_deliverables",
  },
  {
    key: "Calculating Risk Score",
    name: "Calculating Risk Score",
    desc: "Combining all evaluation results.",
  },
  {
    key: "Generating AI Summary",
    name: "Generating AI Summary",
    desc: "Generating overall project risk explanation.",
  },
  {
    key: "Saving Results",
    name: "Saving Results",
    desc: "Updating Risk History and Scope Tracker.",
  },
  {
    key: "Completed",
    name: "Completed",
    desc: "Risk Evaluation Complete. Automatically loading dashboard.",
  },
];

const baselineSteps: TrackerStep[] = [
  {
    key: "Detecting Scope Sections",
    name: "Detect Sections",
    desc: "Identifying contract scope and deliverables sections.",
  },
  {
    key: "Extracting Scope Candidates",
    name: "Extract Candidates",
    desc: "Extracting candidate sentences and clauses.",
  },
  {
    key: "Classifying Scope Items",
    name: "Classify Items",
    desc: "Classifying items into IN_SCOPE/OUT_OF_SCOPE using LLM.",
  },
  {
    key: "Deduplicating Candidates",
    name: "Deduplicate",
    desc: "Merging similar items and resolving overlaps.",
  },
  {
    key: "Extracting Milestones & Deadlines",
    name: "Enrich Dates",
    desc: "Extracting milestone tags and deadline dates.",
  },
  {
    key: "Saving Baseline Draft",
    name: "Save Draft",
    desc: "Saving draft baseline and performing smart diff checks.",
  },
];

const categoryLabels: Record<string, string> = {
  SCOPE_CREEP: "Scope Creep",
  DELAY: "Delay Risk",
  MISSING_DELIVERABLE: "Missing Deliverable",
  DEPENDENCY: "Customer Dependency",
  STAKEHOLDER: "Stakeholder Risk",
  ROOT_CAUSE: "Root Cause Blocker",
  EXECUTION_BLOCKER: "Execution Blocker",
  CUSTOMER_DEPENDENCY: "Customer Dependency",
  TECHNICAL_DEPENDENCY: "Technical Dependency",
  GENERAL: "General",
};

const typeLabels: Record<string, string> = {
  ACTIVITY: "Activity",
  NEW_REQUEST: "New Request",
  BLOCKER: "Blocker",
  ACTION_ITEM: "Action Item",
  DECISION: "Decision",
  RISK_MENTIONED: "Risk Mentioned",
};

const riskLevelConfig: Record<string, { bg: string; text: string; border: string; glow: string; dot: string }> = {
  LOW: {
    bg: "bg-emerald-500/10",
    text: "text-emerald-400",
    border: "border-emerald-500/20",
    glow: "shadow-emerald-500/10",
    dot: "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]",
  },
  MEDIUM: {
    bg: "bg-yellow-500/10",
    text: "text-yellow-400",
    border: "border-yellow-500/20",
    glow: "shadow-yellow-500/10",
    dot: "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]",
  },
  HIGH: {
    bg: "bg-orange-500/10",
    text: "text-orange-400",
    border: "border-orange-500/20",
    glow: "shadow-orange-500/10",
    dot: "bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.5)]",
  },
  CRITICAL: {
    bg: "bg-rose-500/10",
    text: "text-rose-400",
    border: "border-rose-500/20",
    glow: "shadow-rose-500/10",
    dot: "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse",
  },
};

// Format timestamp with full date and time
const formatTimestamp = (ts: string | null | undefined, opts?: { full?: boolean }) => {
  if (!ts) return "—";
  const d = new Date(ts);
  if (isNaN(d.getTime())) return ts;
  if (opts?.full) {
    return d.toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Build audit trail entries from a risk item
const buildAuditTrail = (item: any) => {
  const entries: {
    id: string;
    action: string;
    actor: string;
    email?: string;
    timestamp: string | null;
    note?: string;
    type: "created" | "resolved" | "reactivated" | "updated";
    document?: string;
    documentId?: number;
  }[] = [];

  // Created entry
  entries.push({
    id: `${item.id}-created`,
    action: "Risk Identified",
    actor: item.created_by_name || "AI Engine",
    email: item.created_by_email,
    timestamp: item.created_at,
    note: `Risk detected from document analysis. Score: ${item.risk_score}/100.`,
    type: "created",
    document: item.document_name,
    documentId: item.source_document_id,
  });

  // Resolved entry
  if (item.status === "RESOLVED" && item.resolved_at) {
    entries.push({
      id: `${item.id}-resolved`,
      action: "Marked as Resolved",
      actor: item.resolved_by_name || "User",
      email: item.resolved_by_email,
      timestamp: item.resolved_at,
      note: item.resolution,
      type: "resolved",
    });
  }

  // Additional audit entries from audit_trail field if it exists
  if (item.audit_trail && Array.isArray(item.audit_trail)) {
    item.audit_trail.forEach((entry: any, idx: number) => {
      // Skip CREATED event from backend since we manually add a richer "Risk Identified" entry
      if (entry.action === "CREATED" || entry.action === "CREATE_TRACKER_ITEM") {
        return;
      }
      
      let actionLabel = entry.action || "Updated";
      let type: "created" | "resolved" | "reactivated" | "updated" = "updated";
      let note = "";
      
      if (entry.action === "RESOLVE_TRACKER_ITEM") {
        actionLabel = "Marked as Resolved";
        type = "resolved";
        note = entry.details?.resolution || "";
      } else if (entry.action === "REACTIVATE_TRACKER_ITEM") {
        actionLabel = "Reactivated";
        type = "reactivated";
        note = entry.details?.reason || "";
      } else {
        note = typeof entry.details === "object" ? JSON.stringify(entry.details) : String(entry.details || "");
      }
      
      // Check if this is a duplicate of the current status resolution to avoid double entries
      if (type === "resolved" && item.status === "RESOLVED" && item.resolved_at === entry.created_at) {
        // Skip adding from audit_trail if we already added it in the basic block, OR 
        // we can just remove the basic block entirely and rely only on audit_trail.
        // Actually we will let it add, but we need to deduplicate.
      }
      
      entries.push({
        id: `${item.id}-trail-${idx}`,
        action: actionLabel,
        actor: entry.user_name || entry.agent_name || "System",
        email: entry.user_email,
        timestamp: entry.created_at,
        note: note,
        type: type,
      });
    });
  }

  // Deduplicate entries by timestamp and type
  const uniqueEntries = [];
  const seenKeys = new Set();
  
  for (const entry of entries) {
    if (!entry.timestamp) {
      uniqueEntries.push(entry);
      continue;
    }
    const key = `${entry.type}-${new Date(entry.timestamp).getTime()}`;
    if (!seenKeys.has(key)) {
      seenKeys.add(key);
      uniqueEntries.push(entry);
    }
  }

  // Sort by timestamp ascending
  return uniqueEntries.sort((a, b) => {
    if (!a.timestamp) return -1;
    if (!b.timestamp) return 1;
    return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
  });
};

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RESOLVED">("ACTIVE");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const activeItems = items.filter((item) => item.status !== "RESOLVED");
  const resolvedItems = items.filter((item) => item.status === "RESOLVED");
  const currentTabItems = activeTab === "ACTIVE" ? activeItems : resolvedItems;

  const fetchTrackerAndProject = async () => {
    try {
      const [trackerRes, projectRes] = await Promise.all([
        apiClient.get(`/projects/${id}/tracker/`),
        apiClient.get(`/projects/${id}`),
      ]);
      if (trackerRes.data.success) {
        setItems(trackerRes.data.data);
        if (trackerRes.data.data.length > 0 && !selectedItem) {
          setSelectedItem(trackerRes.data.data[0]);
        }
      }
      if (projectRes.data.success) setProject(projectRes.data.data);
    } catch (error) {
      console.error("Failed to fetch tracker items or project details:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerAndProject();
  }, [id]);

  const {
    isEvaluating,
    evaluationProgress,
    elapsedTime,
    startSSEStream,
    checkActiveProgress,
    resetProgress,
  } = useDocumentProgress();

  useEffect(() => {
    if (id) {
      checkActiveProgress(Number(id));
    }
  }, [id]);

  useEffect(() => {
    if (evaluationProgress?.status === "completed") {
      fetchTrackerAndProject();
    }
  }, [evaluationProgress?.status]);

  useEffect(() => {
    setSelectedItemIds([]);
    setSelectedItem(null);
  }, [activeTab]);

  // When items update, sync selectedItem
  useEffect(() => {
    if (selectedItem) {
      const updated = items.find((i) => i.id === selectedItem.id);
      if (updated) setSelectedItem(updated);
    }
  }, [items]);

  const toggleSelectItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const toggleCardExpand = (itemId: number) => {
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const generateExportHtml = (itemsToExport: any[], title: string) => {
    const projectName = project?.project_name || "Project Details";
    const userName = user?.name || "System User";
    const userEmail = user?.email || "";
    const exportTime = new Date().toLocaleString();
    const startDate = project?.start_date
      ? new Date(project.start_date).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "N/A";
    const endDate = project?.end_date
      ? new Date(project.end_date).toLocaleDateString(undefined, { dateStyle: "medium" })
      : "N/A";

    return `
      <html>
        <head>
          <title>${projectName} - ${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background-color: #ffffff; }
            .header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
            .header-meta { font-size: 13px; color: #4b5563; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            .meta-item { display: flex; gap: 6px; }
            .meta-label { font-weight: 600; color: #374151; }
            h2 { font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            .cards-list { display: flex; flex-direction: column; gap: 16px; }
            .card { border: 1px solid #e5e7eb; padding: 18px; border-radius: 12px; background-color: #f8fafc; page-break-inside: avoid; margin-bottom: 16px; }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .card-title { font-weight: 700; font-size: 16px; color: #0f172a; margin: 0; }
            .badges { display: flex; gap: 8px; align-items: center; }
            .badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; }
            .badge-low { background-color: #d1fae5; color: #065f46; }
            .badge-medium { background-color: #fef3c7; color: #92400e; }
            .badge-high { background-color: #ffedd5; color: #9a3412; }
            .badge-critical { background-color: #fee2e2; color: #991b1b; }
            .badge-resolved { background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
            .badge-type { background-color: #f1f5f9; color: #475569; font-weight: 600; text-transform: none; }
            .card-meta-line { font-size: 12px; color: #64748b; margin-bottom: 12px; display: flex; gap: 16px; }
            .reason-box { background-color: #f1f5f9; padding: 12px; border-left: 4px solid #0891b2; font-size: 12px; border-radius: 6px; color: #334155; line-height: 1.6; }
            .reason-title { font-weight: bold; margin-bottom: 4px; color: #0f172a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            .resolution-box { background-color: #f0fdf4; padding: 12px; border-left: 4px solid #16a34a; font-size: 12px; border-radius: 6px; color: #14532d; line-height: 1.6; margin-top: 12px; }
            .resolution-meta { font-size: 11px; color: #166534; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #bbf7d0; display: flex; gap: 16px; }
            .audit-section { margin-top: 12px; border-top: 1px dashed #e5e7eb; padding-top: 12px; }
            .audit-entry { font-size: 11px; color: #6b7280; margin-bottom: 8px; padding-left: 10px; border-left: 2px solid #d1d5db; }
            .audit-action { font-weight: bold; color: #111827; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectName} &mdash; ${title}</h1>
            <div class="header-meta">
              <div class="meta-item"><span class="meta-label">Project Name:</span> <span>${projectName}</span></div>
              <div class="meta-item"><span class="meta-label">Exported By:</span> <span>${userName} ${userEmail ? `(${userEmail})` : ""}</span></div>
              <div class="meta-item"><span class="meta-label">Start Date:</span> <span>${startDate}</span></div>
              <div class="meta-item"><span class="meta-label">End Date:</span> <span>${endDate}</span></div>
              <div class="meta-item"><span class="meta-label">Exported At:</span> <span>${exportTime}</span></div>
              <div class="meta-item"><span class="meta-label">Total Risks:</span> <span>${itemsToExport.length}</span></div>
            </div>
          </div>
          
          <div class="cards-list">
            ${
              itemsToExport.length === 0
                ? `<p style="color: #64748b; font-style: italic; text-align: center; margin-top: 40px; font-size: 14px;">No risk items found.</p>`
                : itemsToExport
                    .map((item) => {
                      const level = item.risk_level || "LOW";
                      const levelClass = level.toLowerCase();
                      const categoryLabel = categoryLabels[item.risk_category] || categoryLabels.GENERAL;
                      const typeLabel = typeLabels[item.item_type] || item.item_type;
                      const reasoningText = item.reasoning || "";
                      const hasSplit = reasoningText.includes("\nReasoning:\n") || reasoningText.includes("\nReasoning:\r\n");
                      let description = reasoningText;
                      let detailedReasoning = "";
                      if (hasSplit) {
                        const parts = reasoningText.split(/\nReasoning:\r?\n/);
                        description = parts[0].replace(/Description:\r?\n/, "").trim();
                        detailedReasoning = parts[1].trim();
                      } else if (reasoningText.startsWith("Description:\n") || reasoningText.startsWith("Description:\r\n")) {
                        description = reasoningText.replace(/Description:\r?\n/, "").trim();
                      }
                      const auditTrail = buildAuditTrail(item);
                      return `
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="badges">
                      <span class="badge badge-type">${typeLabel}</span>
                      <span class="badge badge-${levelClass}">${level} (${item.risk_score}/100)</span>
                      ${item.status === "RESOLVED" ? `<span class="badge badge-resolved">Resolved</span>` : ""}
                    </div>
                  </div>
                  <div class="card-meta-line">
                    <span><strong>Category:</strong> ${categoryLabel}</span>
                    <span><strong>Source Document:</strong> ${item.document_name || "N/A"}</span>
                    <span><strong>Detected At:</strong> ${formatTimestamp(item.created_at)}</span>
                  </div>
                  ${description ? `<div class="reason-box"><div class="reason-title">Risk Description</div><div>${description}</div>${detailedReasoning ? `<div class="reason-title" style="margin-top:10px;color:#475569;">AI Reasoning</div><div style="font-size:11.5px;color:#475569;">${detailedReasoning}</div>` : ""}</div>` : ""}
                  ${item.status === "RESOLVED" ? `<div class="resolution-box"><div class="reason-title" style="color:#14532d;">Resolution</div><div>${item.resolution}</div>${item.resolved_by_name || item.resolved_at ? `<div class="resolution-meta">${item.resolved_by_name ? `<span><strong>By:</strong> ${item.resolved_by_name}</span>` : ""}${item.resolved_at ? `<span><strong>At:</strong> ${formatTimestamp(item.resolved_at, { full: true })}</span>` : ""}</div>` : ""}</div>` : ""}
                  <div class="audit-section"><strong style="font-size:11px;text-transform:uppercase;color:#6b7280;">Audit Trail</strong>${auditTrail.map((e) => `<div class="audit-entry"><span class="audit-action">${e.action}</span> &mdash; ${e.actor}${e.email ? ` (${e.email})` : ""} &mdash; ${formatTimestamp(e.timestamp, { full: true })}${e.note ? `<div style="margin-top:3px;color:#9ca3af;">${e.note}</div>` : ""}</div>`).join("")}</div>
                </div>
              `;
                    })
                    .join("")
            }
          </div>
        </body>
      </html>
    `;
  };

  const handleExportSingle = (item: any, format: "pdf" | "docx") => {
    const title = `${item.name} Report`;
    const htmlContent = generateExportHtml([item], title);
    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) { alert("Pop-up blocked!"); return; }
      const scriptToAdd = `<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};<\/script>`;
      printWindow.document.write(htmlContent.replace("</body>", `${scriptToAdd}</body>`));
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${item.name.replace(/\s+/g, "_")}_Risk_Report.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportBatch = (itemsToExport: any[], format: "pdf" | "docx", reportTitle: string) => {
    if (itemsToExport.length === 0) { alert("No items selected to export."); return; }
    const htmlContent = generateExportHtml(itemsToExport, reportTitle);
    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) { alert("Pop-up blocked!"); return; }
      const scriptToAdd = `<script>window.onload=function(){window.print();setTimeout(function(){window.close();},500);};<\/script>`;
      printWindow.document.write(htmlContent.replace("</body>", `${scriptToAdd}</body>`));
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${reportTitle.replace(/\s+/g, "_")}_Report.doc`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const [resolveModalState, setResolveModalState] = useState<{ isOpen: boolean; itemId: number | null }>({ isOpen: false, itemId: null });
  const [reactivateModalState, setReactivateModalState] = useState<{ isOpen: boolean; itemId: number | null }>({ isOpen: false, itemId: null });
  const [resolutionText, setResolutionText] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [isReactivating, setIsReactivating] = useState(false);

  const openResolveModal = (itemId: number) => {
    setResolveModalState({ isOpen: true, itemId });
    setResolutionText("");
  };

  const submitResolve = async () => {
    if (!resolutionText.trim() || resolveModalState.itemId === null) return;
    setIsResolving(true);
    try {
      const res = await apiClient.post(
        `/projects/${id}/tracker/${resolveModalState.itemId}/resolve`,
        { resolution: resolutionText, status: "RESOLVED" },
      );
      if (res.data.success) {
        const updatedItem = res.data.data;
        const newItems = items.map((i) =>
          i.id === resolveModalState.itemId ? { ...i, ...updatedItem } : i,
        );
        setItems(newItems);
        if (selectedItem?.id === resolveModalState.itemId) {
          setSelectedItem({ ...selectedItem, ...updatedItem });
        }
        setResolveModalState({ isOpen: false, itemId: null });
      }
    } catch (error) {
      alert("Failed to resolve item");
    } finally {
      setIsResolving(false);
    }
  };

  const openReactivateModal = (itemId: number) => {
    setReactivateModalState({ isOpen: true, itemId });
  };

  const confirmReactivate = async () => {
    if (reactivateModalState.itemId === null) return;
    setIsReactivating(true);
    try {
      const res = await apiClient.post(`/projects/${id}/tracker/${reactivateModalState.itemId}/reactivate`);
      if (res.data.success) {
        const updatedItem = res.data.data;
        const newItems = items.map((i) =>
          i.id === reactivateModalState.itemId
            ? { ...i, ...updatedItem, status: "OPEN", resolution: null, resolved_by_name: null, resolved_at: null }
            : i,
        );
        setItems(newItems);
        if (selectedItem?.id === reactivateModalState.itemId) {
          setSelectedItem({ ...selectedItem, ...updatedItem, status: "OPEN", resolution: null, resolved_by_name: null, resolved_at: null });
        }
        setReactivateModalState({ isOpen: false, itemId: null });
      }
    } catch (error) {
      alert("Failed to reactivate item");
    } finally {
      setIsReactivating(false);
    }
  };

  const handleDownloadDocument = async (documentId: number, documentName: string) => {
    try {
      const response = await apiClient.get(`/projects/${id}/documents/${documentId}/download`, { responseType: "blob" });
      const contentType = (response.headers["content-type"] as string) || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.setAttribute("download", documentName);
      document.body.appendChild(link); link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Failed to download document");
    }
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);

  // ---- Process Status Document Modal State ----
  const [processing, setProcessing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [eligibleDocs, setEligibleDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [notification, setNotification] = useState<{ message: string; type: "info" | "error" | "success" } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 15000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: "info" | "error" | "success" = "info") => {
    setNotification({ message, type });
  };

  const handleOpenProcessModal = async () => {
    setLoadingDocs(true);
    setShowProcessModal(true);
    try {
      const res = await apiClient.get(`/projects/${id}/documents/`);
      if (res.data.success) {
        const docs = res.data.data.filter(
          (doc: any) => doc.document_type !== "EL" && doc.document_type !== "IFA" && doc.processing_status === "COMPLETED",
        );
        setEligibleDocs(docs);
        if (docs.length > 0) setSelectedDocId(String(docs[0].id));
        else setSelectedDocId("");
      }
    } catch (error) {
      showNotification("Failed to load documents", "error");
      setShowProcessModal(false);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleConfirmProcess = async () => {
    if (!selectedDocId) return;
    setProcessing(true);
    try {
      const docId = Number(selectedDocId);
      const documentName = eligibleDocs.find((d: any) => d.id === docId)?.document_name || "Document";
      setShowProcessModal(false);
      setSelectedDocId("");
      showNotification("AI Evaluation started!", "success");
      startSSEStream(Number(id), docId, documentName);
    } catch (error: any) {
      showNotification("Failed to start processing: " + (error.response?.data?.detail || "Server error"), "error");
    } finally {
      setProcessing(false);
    }
  };

  const isBaselineExtraction =
    evaluationProgress?.document_type === "EL" ||
    evaluationProgress?.document_type === "IFA" ||
    evaluationProgress?.document_type?.toUpperCase() === "EL" ||
    evaluationProgress?.document_type?.toUpperCase() === "IFA" ||
    ["Detect Sections", "Extract Candidates", "Classify Items", "Deduplicate", "Enrich Dates", "Save Draft",
     "Detecting Scope Sections", "Extracting Scope Candidates", "Classifying Scope Items",
     "Deduplicating Candidates", "Extracting Milestones & Deadlines", "Saving Baseline Draft",
    ].includes(evaluationProgress?.currentStage || "");
  const currentSteps = isBaselineExtraction ? baselineSteps : steps;

  const getStepState = (index: number) => {
    if (!evaluationProgress) return index === 0 ? "running" : "pending";
    const status = evaluationProgress.status;
    const currentStage = evaluationProgress.currentStage;
    const activeIndex = currentSteps.findIndex(
      (s) => s.name === currentStage || s.key === currentStage ||
        (currentStage && currentStage.toLowerCase().includes(s.name.toLowerCase().split(" ")[0])),
    );
    if (status === "completed") return "completed";
    if (status === "failed") {
      if (index < activeIndex) return "completed";
      if (index === activeIndex) return "failed";
      return "pending";
    }
    if (index < activeIndex) return "completed";
    if (index === activeIndex) return "running";
    return "pending";
  };

  const renderProgressTimeline = () => {
    if (!evaluationProgress) return null;
    const overallProgress = evaluationProgress.progress || 0;
    const isFailed = evaluationProgress.status === "failed";
    const errorText = evaluationProgress.error;

    return (
      <div className="w-full bg-[#0b0e17]/80 border border-gray-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden max-w-4xl mx-auto my-8 animate-fade-in-up">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[60px]" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-[60px]" />

        {isFailed && (
          <button onClick={resetProgress} className="absolute top-4 right-4 p-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-800/50 hover:border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer z-50 flex items-center justify-center" title="Dismiss">
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800/60 pb-6 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Loader2 className={`w-5 h-5 text-cyan-400 ${isFailed ? "" : "animate-spin"}`} />
              {isFailed ? "Evaluation Failed" : isBaselineExtraction ? "Baseline Scope Extraction in Progress..." : "Analyzing Project Risks & Timeline..."}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isFailed ? "An error occurred during evaluation." : isBaselineExtraction ? "AI agents are analyzing and classifying contract scope sections and deliverables." : "AI agents are running automated checks against your project baseline."}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Elapsed Time</p>
              <p className="text-lg font-black text-white">{elapsedTime}s</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Overall Progress</p>
              <p className="text-lg font-black text-cyan-400">{overallProgress}%</p>
            </div>
          </div>
        </div>

        <div className="mb-10">
          <div className="w-full h-3 bg-gray-900 rounded-full border border-gray-800/80 overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${isFailed ? "from-rose-600 to-red-500 shadow-rose-500/20" : "from-blue-600 to-cyan-500 shadow-cyan-500/20"} shadow-lg transition-all duration-500 ease-out`}
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </div>

        {isFailed && errorText && (
          <div className="mb-8 p-4 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex gap-3 text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-rose-300">Failure Reason</p>
              <p className="text-[11px] text-gray-400 mt-1 font-mono leading-relaxed">{errorText}</p>
            </div>
          </div>
        )}

        <div className="relative border-l border-gray-800/80 ml-4 pl-8 space-y-8">
          {currentSteps.map((step, idx) => {
            const state = getStepState(idx);
            let iconElement;
            let iconBgClass = "";
            let textClass = "text-gray-500";

            if (state === "completed") {
              iconElement = <CheckCheck className="w-4 h-4 text-white" />;
              iconBgClass = "bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent scale-100";
              textClass = "text-gray-200";
            } else if (state === "running") {
              iconElement = <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />;
              iconBgClass = "bg-gray-950 border-[#00e5ff] scale-110 shadow-lg shadow-cyan-500/10";
              textClass = "text-white font-bold";
            } else if (state === "failed") {
              iconElement = <X className="w-4 h-4 text-white" />;
              iconBgClass = "bg-red-600 shadow-lg shadow-rose-500/20 border-transparent scale-100";
              textClass = "text-rose-400 font-bold";
            } else {
              iconElement = <Circle className="w-3 h-3 text-gray-750" />;
              iconBgClass = "bg-gray-950 border-gray-800 scale-90";
              textClass = "text-gray-600";
            }

            const details = evaluationProgress.details || {};
            let detailSummary = null;
            if (state === "completed" || state === "running") {
              if (step.metricKey === "matched_activities" && details.matched_activities !== undefined) {
                detailSummary = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md mt-1.5 animate-fadeIn">
                    ✓ {details.matched_activities} Matched Activities
                  </span>
                );
              } else if (step.metricKey === "oos_activities" && details.oos_activities !== undefined) {
                const count = details.oos_activities;
                detailSummary = (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${count > 0 ? "bg-rose-500/15 text-rose-400 border border-rose-500/25" : "bg-gray-800 text-gray-400 border-gray-750"} rounded-md mt-1.5 animate-fadeIn`}>
                    {count > 0 ? `⚠ ${count} Suspected Out-of-Scope` : "No out-of-scope activities"}
                  </span>
                );
              } else if (step.metricKey === "delayed_deliverables" && details.delayed_deliverables !== undefined) {
                const count = details.delayed_deliverables;
                detailSummary = (
                  <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${count > 0 ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"} rounded-md mt-1.5 animate-fadeIn`}>
                    {count > 0 ? `🕒 ${count} Delayed Deliverables` : "✓ Deliverables on track"}
                  </span>
                );
              }
            }

            return (
              <div key={step.key} className="relative transition-all duration-300">
                <div className={`absolute -left-12 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${iconBgClass}`}>
                  {iconElement}
                </div>
                <div>
                  <h4 className={`text-sm font-semibold tracking-wide flex items-center gap-2 ${textClass}`}>
                    {step.name}
                    {state === "running" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded uppercase tracking-wider animate-pulse">Running</span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.desc}</p>
                  {detailSummary}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  if (loading) return <Loader message="Loading risk tracker & audits..." />;

  // ─── Audit Trail Right Panel ───
  const AuditTrailPanel = ({ item }: { item: any }) => {
    const auditEntries = buildAuditTrail(item);
    const level = item.risk_level || "LOW";
    const levelStyle = riskLevelConfig[level] || riskLevelConfig.LOW;
    const categoryLabel = categoryLabels[item.risk_category] || categoryLabels.GENERAL;
    const typeLabel = typeLabels[item.item_type] || item.item_type;

    // Parse description/reasoning
    const reasoningText = item.reasoning || "";
    const hasSplit = reasoningText.includes("\nReasoning:\n") || reasoningText.includes("\nReasoning:\r\n");
    let description = reasoningText;
    let detailedReasoning = "";
    if (hasSplit) {
      const parts = reasoningText.split(/\nReasoning:\r?\n/);
      description = parts[0].replace(/Description:\r?\n/, "").trim();
      detailedReasoning = parts[1]?.trim() || "";
    } else if (reasoningText.startsWith("Description:\n") || reasoningText.startsWith("Description:\r\n")) {
      description = reasoningText.replace(/Description:\r?\n/, "").trim();
    }

    let pmInsights = null;
    if (description.startsWith("Execution Priority Score:")) {
      const lines = description.split(/\r?\n/);
      if (lines.length >= 2 && lines[0].includes("Execution Priority Score:")) {
        const execMatch = lines[0].match(/Execution Priority Score:\s*(\d+)/);
        const sevMatch = lines[0].match(/Severity:\s*([A-Za-z]+)/);
        const catMatch = lines[1].match(/Category:\s*(.+)/);
        
        if (execMatch || sevMatch || catMatch) {
          pmInsights = {
            priority: execMatch ? execMatch[1] : null,
            severity: sevMatch ? sevMatch[1] : null,
            category: catMatch ? catMatch[1] : null,
          };
          description = lines.slice(2).join("\n").trim();
        }
      }
    }

    const auditIconMap: Record<string, React.ReactNode> = {
      created: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
      resolved: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
      reactivated: <RotateCcw className="w-3.5 h-3.5 text-amber-400" />,
      updated: <TrendingUp className="w-3.5 h-3.5 text-purple-400" />,
    };

    const auditColorMap: Record<string, string> = {
      created: "border-cyan-500/30 bg-cyan-500/5",
      resolved: "border-emerald-500/30 bg-emerald-500/5",
      reactivated: "border-amber-500/30 bg-amber-500/5",
      updated: "border-purple-500/30 bg-purple-500/5",
    };

    const auditDotMap: Record<string, string> = {
      created: "bg-cyan-400",
      resolved: "bg-emerald-400",
      reactivated: "bg-amber-400",
      updated: "bg-purple-400",
    };

    return (
      <div className="h-full flex flex-col overflow-hidden">
        {/* ── Risk Detail Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-white/[0.06] flex-shrink-0">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`w-2 h-2 rounded-full shrink-0 ${levelStyle.dot}`} />
              <span className={`text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                {level}
              </span>
              <span className="text-[9px] font-bold text-gray-500 bg-gray-800/60 border border-gray-700/40 px-1.5 py-0.5 rounded uppercase tracking-wide">
                {typeLabel}
              </span>
              {item.status === "RESOLVED" && (
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded uppercase tracking-wide">
                  ✓ Resolved
                </span>
              )}
            </div>
            <span className={`text-sm font-black font-mono px-2 py-1 rounded-lg border ${item.risk_score >= 71 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : item.risk_score >= 41 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : item.risk_score >= 21 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"} shrink-0`}>
              {item.risk_score}/100
            </span>
          </div>

          <h2 className="text-sm font-bold text-white leading-snug mb-3">
            {item.name || `${typeLabel} #${item.id}`}
          </h2>

          {/* Meta Grid */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2">
            <div>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Category</p>
              <p className="text-[10px] font-semibold text-gray-300">{categoryLabel}</p>
            </div>
            <div>
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Risk ID</p>
              <p className="text-[10px] font-mono font-semibold text-gray-300">#{item.id}</p>
            </div>
            {item.created_at && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Detected At</p>
                <p className="text-[10px] text-gray-400">{formatTimestamp(item.created_at)}</p>
              </div>
            )}
            {item.is_out_of_scope && (
              <div>
                <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-0.5">Scope</p>
                <span className="text-[9px] font-black px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded">OUT-OF-SCOPE</span>
              </div>
            )}
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-4">
          {/* Source Document */}
          {item.document_name && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <FileText className="w-3 h-3" /> Source Document
              </p>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center shrink-0">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                  <span className="text-[11px] text-gray-300 font-medium truncate" title={item.document_name}>
                    {item.document_name}
                  </span>
                </div>
                {item.source_document_id && (
                  <button
                    onClick={() => handleDownloadDocument(item.source_document_id, item.document_name)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-400 rounded-lg text-[9px] font-bold transition-all cursor-pointer shrink-0"
                  >
                    <Download className="w-3 h-3" /> Download
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PM Insights Dashboard */}
          {pmInsights && (
            <div className="p-3 rounded-xl bg-gradient-to-r from-blue-900/20 to-cyan-900/10 border border-blue-500/20 mb-4">
              <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Activity className="w-3 h-3" /> PM Insights Dashboard
              </p>
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-900/60 rounded-lg p-2 border border-gray-700/50">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Execution Priority</p>
                  <p className="text-sm font-black text-white">{pmInsights.priority || "—"}</p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-2 border border-gray-700/50">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Severity</p>
                  <p className={`text-sm font-black ${
                    pmInsights.severity === "CRITICAL" ? "text-rose-400" :
                    pmInsights.severity === "HIGH" ? "text-orange-400" :
                    pmInsights.severity === "MEDIUM" ? "text-yellow-400" : "text-emerald-400"
                  }`}>{pmInsights.severity || "—"}</p>
                </div>
                <div className="bg-gray-900/60 rounded-lg p-2 border border-gray-700/50">
                  <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Critical Path</p>
                  <p className={`text-[10px] font-bold mt-0.5 ${pmInsights.category?.includes("Blocker") || pmInsights.category?.includes("Root Cause") ? "text-rose-400" : "text-gray-300"}`}>
                    {pmInsights.category || "—"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          {(description || item.reasoning) && (
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
              <p className="text-[9px] font-bold text-gray-600 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Info className="w-3 h-3" /> Risk Description
              </p>
              <p className="text-[11px] text-gray-300 leading-relaxed whitespace-pre-line">
                {description || item.reasoning}
              </p>
            </div>
          )}

          {/* AI Reasoning */}
          {detailedReasoning && (
            <div className="p-3 rounded-xl bg-purple-500/[0.04] border border-purple-500/15">
              <p className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> AI Reasoning
              </p>
              <p className="text-[11px] text-gray-400 leading-relaxed whitespace-pre-line">
                {detailedReasoning}
              </p>
            </div>
          )}

          {/* Resolution (if resolved) */}
          {item.status === "RESOLVED" && item.resolution && (
            <div className="p-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
              <p className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> Resolution
              </p>
              <p className="text-[11px] text-gray-300 leading-relaxed">{item.resolution}</p>
              {(item.resolved_by_name || item.resolved_at) && (
                <div className="mt-2 pt-2 border-t border-emerald-500/15 flex flex-wrap gap-x-4 gap-y-1">
                  {item.resolved_by_name && (
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <User className="w-2.5 h-2.5" />
                      <span className="font-semibold text-gray-400">{item.resolved_by_name}</span>
                      {item.resolved_by_email && <span>({item.resolved_by_email})</span>}
                    </div>
                  )}
                  {item.resolved_at && (
                    <div className="flex items-center gap-1 text-[9px] text-gray-500">
                      <Clock className="w-2.5 h-2.5" />
                      <span>{formatTimestamp(item.resolved_at, { full: true })}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* ── FULL AUDIT TRAIL ── */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <ScrollText className="w-3.5 h-3.5 text-gray-500" />
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Full Audit Trail</p>
              <span className="text-[8px] font-black px-1.5 py-0.5 bg-gray-800 border border-gray-700/50 text-gray-500 rounded-full">
                {auditEntries.length} events
              </span>
            </div>

            <div className="relative">
              {/* vertical line */}
              <div className="absolute left-3.5 top-2 bottom-2 w-px bg-gradient-to-b from-gray-700/60 via-gray-700/30 to-transparent" />

              <div className="space-y-3">
                {auditEntries.map((entry, idx) => (
                  <div key={entry.id} className="relative flex gap-3 pl-2">
                    {/* dot on timeline */}
                    <div className={`relative z-10 w-4 h-4 rounded-full border-2 border-[#080b14] flex items-center justify-center shrink-0 mt-0.5 ${auditDotMap[entry.type] || "bg-gray-600"}`}>
                      <div className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    </div>

                    {/* content */}
                    <div className={`flex-1 p-3 rounded-xl border ${auditColorMap[entry.type] || "border-gray-700/30 bg-white/[0.01]"} min-w-0`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {auditIconMap[entry.type]}
                          <span className="text-[10px] font-bold text-gray-200">{entry.action}</span>
                          {idx === 0 && (
                            <span className="text-[8px] font-black px-1 py-px bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded uppercase tracking-wide">Initial</span>
                          )}
                          {idx === auditEntries.length - 1 && auditEntries.length > 1 && (
                            <span className="text-[8px] font-black px-1 py-px bg-gray-700/50 text-gray-400 border border-gray-600/30 rounded uppercase tracking-wide">Latest</span>
                          )}
                        </div>
                      </div>

                      {/* Actor */}
                      <div className="flex items-center gap-1.5 mb-1.5">
                        <User className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                        <span className="text-[10px] text-gray-400 font-medium">{entry.actor}</span>
                        {entry.email && <span className="text-[9px] text-gray-600">({entry.email})</span>}
                      </div>

                      {/* Timestamp — full */}
                      {entry.timestamp && (
                        <div className="flex items-center gap-1.5 mb-2">
                          <Clock className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                          <span className="text-[9px] text-gray-500 font-mono">{formatTimestamp(entry.timestamp, { full: true })}</span>
                        </div>
                      )}

                      {/* Note */}
                      {entry.note && (
                        <p className="text-[10px] text-gray-400 leading-relaxed border-t border-white/[0.05] pt-2 mt-1">
                          {entry.note}
                        </p>
                      )}

                      {/* Document link */}
                      {entry.document && entry.documentId && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <FileText className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                          <span className="text-[9px] text-gray-500 truncate" title={entry.document}>{entry.document}</span>
                          <button
                            onClick={() => handleDownloadDocument(entry.documentId!, entry.document!)}
                            className="flex items-center gap-0.5 text-[9px] text-cyan-500 hover:text-cyan-400 font-bold transition-colors cursor-pointer shrink-0"
                          >
                            <Download className="w-2.5 h-2.5" /> DL
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom padding */}
          <div className="pt-2 pb-1" />
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-[#080b14] text-white relative overflow-hidden min-h-screen">
      {/* Background Glows */}
      <div className="fixed top-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col h-full min-h-screen">
        {/* ── Top Header Bar ── */}
        <div className="px-6 md:px-8 pt-6 md:pt-8 pb-5 border-b border-white/[0.05] bg-[#080b14]/80 backdrop-blur-sm flex-shrink-0">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row justify-between items-start lg:items-center gap-5">
            {/* Breadcrumb + Title */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/dashboard" className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-wider">Cockpit</Link>
                <ChevronRight className="w-3 h-3 text-gray-650" />
                <Link to="/projects" className="text-[10px] font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-wider">Projects</Link>
                <ChevronRight className="w-3 h-3 text-gray-650" />
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Risk Tracker</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                <ShieldAlert className="w-7 h-7 text-rose-500 shrink-0" />
                Risk Tracker & Audit
              </h1>
              <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-xl">
                Track compliance alerts, scope creep warnings, and delay risks with full audit trails.
              </p>
            </div>

            {/* Header Actions */}
            <div className="flex flex-wrap gap-2.5 items-center">
              {/* Scoring Rules Tooltip */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-help shadow-lg">
                  <Info className="w-3.5 h-3.5 shrink-0" /> Scoring Rules
                </button>
                <div className="absolute right-0 lg:right-1/2 lg:translate-x-1/2 top-full mt-3 w-80 p-5 bg-gray-950/98 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-md opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 text-left">
                  <h4 className="font-bold text-sm text-[#00e5ff] mb-3 border-b border-gray-850 pb-2">Item Risk Scoring Rules</h4>
                  <div className="space-y-4 text-xs text-gray-300">
                    <p className="text-gray-400 leading-relaxed font-medium">Individual item scores (out of 100) are determined by these rules:</p>
                    <div>
                      <span className="font-bold text-white block mb-1">Scope Creep (OutOfScope Agent)</span>
                      <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                        <li><strong className="text-white">80/100</strong> for direct baseline violations.</li>
                        <li><strong className="text-white">50/100</strong> for warnings or borderline items.</li>
                      </ul>
                    </div>
                    <div>
                      <span className="font-bold text-white block mb-1">Timeline Delays & Risks</span>
                      <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                        <li><strong className="text-white">85/100</strong> for critical delays or active blockers.</li>
                        <li><strong className="text-white">65/100</strong> for high timeline risk deliverables.</li>
                        <li><strong className="text-white">45/100</strong> for medium timeline risk.</li>
                        <li><strong className="text-white">15/100</strong> for low timeline risk.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <button
                onClick={handleOpenProcessModal}
                disabled={processing || isEvaluating || project?.monitoring_status !== "ACTIVE"}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center gap-2 border ${
                  processing || isEvaluating || project?.monitoring_status !== "ACTIVE"
                    ? "bg-gray-800/40 border-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-500/20 shadow-cyan-500/10 cursor-pointer"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                {processing || isEvaluating ? "Processing..." : "Analyze Status Document"}
              </button>

              {/* Export Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowExportDropdown(!showExportDropdown)}
                  disabled={items.length === 0}
                  className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all duration-200 active:scale-[0.98] shadow-lg ${
                    items.length === 0
                      ? "bg-gray-800/40 border-gray-800 text-gray-500 cursor-not-allowed"
                      : "bg-gray-900 border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white cursor-pointer"
                  }`}
                >
                  <Download className="w-3.5 h-3.5 text-gray-400" />
                  <span>Export</span>
                  <span className="text-[9px] text-gray-500">▼</span>
                </button>
                {showExportDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md z-50 text-left p-2 space-y-1 animate-fade-in-up">
                      <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">Active Risks</div>
                      <button onClick={() => { handleExportBatch(activeItems, "pdf", "All Active Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">All Active Risks (PDF)</button>
                      <button onClick={() => { handleExportBatch(activeItems, "docx", "All Active Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2">All Active Risks (Word)</button>
                      {selectedItemIds.length > 0 && (
                        <>
                          <div className="px-2.5 py-1 text-[10px] font-bold text-cyan-500 uppercase tracking-wider border-b border-gray-850 mb-1">Selected ({selectedItemIds.length})</div>
                          <button onClick={() => { handleExportBatch(activeItems.filter((i) => selectedItemIds.includes(i.id)), "pdf", "Selected Active Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">Selected (PDF)</button>
                          <button onClick={() => { handleExportBatch(activeItems.filter((i) => selectedItemIds.includes(i.id)), "docx", "Selected Active Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2">Selected (Word)</button>
                        </>
                      )}
                      <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">Resolved</div>
                      <button onClick={() => { handleExportBatch(resolvedItems, "pdf", "All Resolved Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">All Resolved (PDF)</button>
                      <button onClick={() => { handleExportBatch(resolvedItems, "docx", "All Resolved Risks"); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">All Resolved (Word)</button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Content ── */}
        {project?.monitoring_status !== "ACTIVE" ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center py-20 bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-white/5 rounded-3xl p-10 max-w-2xl w-full shadow-2xl backdrop-blur-md relative overflow-hidden animate-fade-in-up">
              <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-amber-500/5 blur-[50px] pointer-events-none" />
              <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-5 animate-bounce" />
              <h3 className="font-display text-xl font-extrabold text-white mb-3">
                {project?.monitoring_status === "DRAFT" ? "Extract Project Baseline First" : "Baseline Awaiting Approval"}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
                Before AI agents can analyze status updates for risks, a contract baseline must be extracted and approved.
              </p>
              <Link to={`/projects/${id}/baseline`} className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]">
                Go to Baseline Review <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : isEvaluating || evaluationProgress ? (
          <div className="flex-1 p-6 md:p-10">
            {renderProgressTimeline()}
          </div>
        ) : items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center py-24 bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-white/5 rounded-3xl shadow-2xl backdrop-blur-md max-w-xl w-full animate-fade-in-up">
              <div className="w-16 h-16 bg-gray-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700/30 shadow-inner">
                <ShieldAlert className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="font-display text-lg font-bold text-white mb-2">No Risk Items Found</h3>
              <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
                No risk or audit findings have been recorded. Choose "Analyze Status Document" above to start evaluation.
              </p>
            </div>
          </div>
        ) : (
          /* ── SPLIT LAYOUT ── */
          <div className="flex-1 flex flex-col lg:flex-row overflow-hidden" style={{ minHeight: "calc(100vh - 140px)" }}>

            {/* ════ LEFT PANEL: Risk List + Tabs ════ */}
            <div className="flex flex-col border-b lg:border-b-0 lg:border-r border-white/[0.05] overflow-hidden w-full lg:w-[420px] lg:min-w-[340px] lg:max-w-[480px] h-[50vh] lg:h-auto shrink-0">

              {/* AI Priority Banner */}
              {project?.highestActionPriority && (
                <div className="mx-4 mt-4 p-3 bg-gradient-to-r from-cyan-950/50 to-blue-900/30 border border-cyan-500/25 rounded-xl flex-shrink-0 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-cyan-500/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                  <div className="flex items-center justify-between mb-1.5 relative z-10">
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-cyan-400" />
                      <span className="text-[9px] font-black text-cyan-400 uppercase tracking-widest">AI Top Priority</span>
                    </div>
                    {project.highestActionPriority.id && (
                      <button 
                        onClick={() => {
                          const item = activeItems.find(i => i.id === project.highestActionPriority.id);
                          if (item) {
                            setActiveTab("ACTIVE");
                            setSelectedItem(item);
                          }
                        }}
                        className="px-2 py-0.5 bg-cyan-500/10 hover:bg-cyan-500/25 border border-cyan-500/20 hover:border-cyan-500/40 text-cyan-300 rounded text-[9px] font-bold transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.1)] hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                      >
                        View Details
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] font-semibold text-white truncate relative z-10">{project.highestActionPriority.activity}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2 leading-relaxed relative z-10">{project.highestActionPriority.reason}</p>
                </div>
              )}

              {/* Stats Bar */}
              <div className="flex gap-px mx-4 mt-3 flex-shrink-0">
                <div className="flex-1 p-2.5 bg-gray-900/60 border border-white/[0.05] rounded-l-xl text-center">
                  <p className="text-lg font-black text-rose-400">{activeItems.length}</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">Active</p>
                </div>
                <div className="flex-1 p-2.5 bg-gray-900/60 border border-white/[0.05] text-center">
                  <p className="text-lg font-black text-emerald-400">{resolvedItems.length}</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">Resolved</p>
                </div>
                <div className="flex-1 p-2.5 bg-gray-900/60 border border-white/[0.05] rounded-r-xl text-center">
                  <p className="text-lg font-black text-gray-300">{items.length}</p>
                  <p className="text-[8px] font-bold text-gray-600 uppercase tracking-wider">Total</p>
                </div>
              </div>

              {/* Tab Control */}
              <div className="px-4 pt-3 pb-2 flex-shrink-0 space-y-3">
                <div className="relative flex p-1 bg-gray-900/60 backdrop-blur-md border border-white/[0.05] rounded-xl shadow-lg">
                  <div
                    className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-cyan-600/25 to-blue-600/25 border border-cyan-500/25 shadow-lg shadow-cyan-500/5 transition-all duration-300 ease-out"
                    style={{ width: "calc(50% - 4px)", left: activeTab === "ACTIVE" ? "4px" : "calc(50%)" }}
                  />
                  <button
                    onClick={() => setActiveTab("ACTIVE")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === "ACTIVE" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Active Risks
                    <span className={`px-1.5 py-0.5 text-[9px] rounded border font-black font-mono transition-all duration-300 ${activeTab === "ACTIVE" ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-gray-800/40 text-gray-500 border-gray-700/30"}`}>
                      {activeItems.length}
                    </span>
                  </button>
                  <button
                    onClick={() => setActiveTab("RESOLVED")}
                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-[10px] font-bold uppercase tracking-wider transition-all duration-300 cursor-pointer ${activeTab === "RESOLVED" ? "text-white" : "text-gray-500 hover:text-gray-300"}`}
                  >
                    <CheckCheck className="w-3 h-3" />
                    Resolved
                    <span className={`px-1.5 py-0.5 text-[9px] rounded border font-black font-mono transition-all duration-300 ${activeTab === "RESOLVED" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-800/40 text-gray-500 border-gray-700/30"}`}>
                      {resolvedItems.length}
                    </span>
                  </button>
                </div>

                {/* Inline Bulk Actions (Top) */}
                {selectedItemIds.length > 0 && (
                  <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-xl p-2.5 flex items-center justify-between gap-2 animate-fade-in-up">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-cyan-500/10 flex items-center justify-center shrink-0">
                        <span className="text-[10px] text-cyan-400 font-bold font-mono">{selectedItemIds.length}</span>
                      </div>
                      <span className="text-[10px] text-gray-300 font-bold">selected</span>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => setSelectedItemIds([])} className="px-2 py-1 text-[9px] font-bold text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700 rounded-lg cursor-pointer transition-colors">
                        Clear
                      </button>
                      <button onClick={() => handleExportBatch(activeItems.filter((i) => selectedItemIds.includes(i.id)), "pdf", "Selected Risks")} className="px-2 py-1 text-[9px] font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg cursor-pointer shadow-md shadow-cyan-500/10 transition-colors">
                        PDF
                      </button>
                      <button onClick={() => handleExportBatch(activeItems.filter((i) => selectedItemIds.includes(i.id)), "docx", "Selected Risks")} className="px-2 py-1 text-[9px] font-bold text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/10 rounded-lg cursor-pointer transition-colors">
                        Word
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Risk Cards List */}
              <div className="flex-1 overflow-y-auto custom-scrollbar px-4 pb-4 space-y-2">
                {currentTabItems.length === 0 ? (
                  <div className="text-center py-16 flex flex-col items-center">
                    <div className="w-12 h-12 bg-gray-800/30 rounded-full flex items-center justify-center mb-4 border border-gray-700/30">
                      <CheckCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="font-display text-sm font-bold text-white mb-1">No {activeTab === "ACTIVE" ? "Active" : "Resolved"} Risks</h3>
                    <p className="text-gray-400 text-[10px] max-w-[200px] mx-auto leading-relaxed">
                      {activeTab === "ACTIVE" ? "All identified risks have been resolved." : "No resolved items yet."}
                    </p>
                  </div>
                ) : (
                  currentTabItems.map((item, index) => {
                    const level = item.risk_level || "LOW";
                    const levelStyle = riskLevelConfig[level] || riskLevelConfig.LOW;
                    const categoryLabel = categoryLabels[item.risk_category] || categoryLabels.GENERAL;
                    const typeLabel = typeLabels[item.item_type] || item.item_type;
                    const isSelected = selectedItem?.id === item.id;

                    const borderColor = isSelected
                      ? "border-cyan-500/50 shadow-cyan-500/5"
                      : item.status === "RESOLVED"
                        ? "border-emerald-500/15"
                        : level === "CRITICAL"
                          ? "border-red-500/25"
                          : level === "HIGH"
                            ? "border-orange-500/20"
                            : level === "MEDIUM"
                              ? "border-yellow-500/15"
                              : "border-white/[0.05]";

                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedItem(item)}
                        className={`group rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${borderColor} ${isSelected ? "bg-gradient-to-br from-cyan-950/30 to-gray-900/80 shadow-lg" : "bg-gradient-to-br from-gray-900/60 to-gray-950/80 hover:border-gray-600/50 hover:bg-gray-900/80"}`}
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        {/* Card Top Bar — colored by risk level */}
                        <div className={`px-3 py-2.5 border-b ${isSelected ? "border-cyan-500/20" : "border-white/[0.04]"}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 flex-1 min-w-0">
                              {activeTab === "ACTIVE" && (
                                <input
                                  type="checkbox"
                                  checked={selectedItemIds.includes(item.id)}
                                  onChange={(e) => { e.stopPropagation(); toggleSelectItem(item.id); }}
                                  onClick={(e) => e.stopPropagation()}
                                  className="w-3 h-3 rounded border-gray-700 bg-gray-950 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer accent-cyan-500 shrink-0"
                                />
                              )}
                              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${levelStyle.dot}`} />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                  <span className="text-[7px] font-extrabold text-gray-500 bg-gray-800/70 border border-gray-700/40 px-1 py-px rounded uppercase tracking-wider shrink-0">
                                    {typeLabel}
                                  </span>
                                  {item.is_out_of_scope && (
                                    <span className="text-[7px] font-black px-1 py-px bg-red-500/10 text-red-400 border border-red-500/20 rounded uppercase">OOS</span>
                                  )}
                                  {item.requires_escalation && (
                                    <span className="text-[7px] font-black px-1 py-px bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded uppercase">Esc</span>
                                  )}
                                </div>
                                <h3 className={`text-[11px] font-semibold leading-snug transition-colors ${isSelected ? "text-white" : "text-gray-200 group-hover:text-white"}`}>
                                  {item.name || `${typeLabel} #${item.id}`}
                                </h3>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                                {level}
                              </span>
                              <span className={`text-[8px] font-mono font-black px-1.5 py-0.5 rounded border ${item.risk_score >= 71 ? "bg-rose-500/10 text-rose-400 border-rose-500/20" : item.risk_score >= 41 ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : item.risk_score >= 21 ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"}`}>
                                {item.risk_score}/100
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer */}
                        <div className="px-3 py-2 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Briefcase className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                            <span className="text-[9px] text-gray-500 truncate" title={item.document_name}>
                              {item.document_name || "—"}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[8px] font-bold text-gray-600 bg-gray-800/40 px-1 py-px rounded border border-gray-700/30">
                              {categoryLabel}
                            </span>
                            {item.status === "RESOLVED" && (
                              <span className="text-[7px] font-black px-1 py-px bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">✓ Done</span>
                            )}
                          </div>
                        </div>

                        {/* Timestamp row */}
                        {item.created_at && (
                          <div className="px-3 pb-2 flex items-center gap-1.5">
                            <Clock className="w-2.5 h-2.5 text-gray-700 shrink-0" />
                            <span className="text-[8px] text-gray-600">{formatTimestamp(item.created_at)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* ════ RIGHT PANEL: Audit Trail & Full Detail ════ */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {selectedItem ? (
                <div className="h-full flex flex-col">
                  {/* Right Panel Header */}
                  <div className="px-5 py-3.5 border-b border-white/[0.05] bg-white/[0.01] flex-shrink-0 flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                        <History className="w-3.5 h-3.5 text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">Full Audit Trail & Details</p>
                        <p className="text-[9px] text-gray-600">Risk #{selectedItem.id} · Complete history with timestamps</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Top Action Button */}
                      {selectedItem.status === "RESOLVED" ? (
                        <button
                          onClick={() => openReactivateModal(selectedItem.id)}
                          disabled={isReactivating}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isReactivating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          Reactivate
                        </button>
                      ) : (
                        <button
                          onClick={() => openResolveModal(selectedItem.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Resolved
                        </button>
                      )}

                      <div className="w-px h-6 bg-gray-700/50 mx-1 hidden sm:block"></div>

                      <button
                        onClick={() => handleExportSingle(selectedItem, "pdf")}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> PDF
                      </button>
                      <button
                        onClick={() => handleExportSingle(selectedItem, "docx")}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-900 border border-gray-700 hover:border-gray-600 text-gray-400 hover:text-white rounded-lg text-[9px] font-bold transition-all cursor-pointer"
                      >
                        <Download className="w-3 h-3" /> Word
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail Content */}
                  <div className="flex-1 overflow-hidden">
                    <AuditTrailPanel item={selectedItem} />
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-900/60 border border-white/[0.06] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ScrollText className="w-7 h-7 text-gray-600" />
                    </div>
                    <p className="text-sm font-bold text-gray-400 mb-1">Select a Risk</p>
                    <p className="text-[11px] text-gray-600 max-w-[200px] mx-auto leading-relaxed">
                      Click any risk item on the left to view full audit trail and details here.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>



      {/* Resolve Modal */}
      {resolveModalState.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1420] border border-gray-700/60 rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Resolve Risk Item</h2>
                <p className="text-gray-500 text-[10px]">This will be recorded in the full audit trail with timestamp.</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-4 leading-relaxed">
              Provide official notes detailing how this risk is being handled. This note will be permanently recorded.
            </p>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/50 transition-all resize-none mb-5 text-sm"
              rows={4}
              placeholder="e.g. Discussed with client. Added as Change Request #102..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button onClick={() => setResolveModalState({ isOpen: false, itemId: null })} className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm cursor-pointer">
                Cancel
              </button>
              <button
                onClick={submitResolve}
                disabled={!resolutionText.trim() || isResolving}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${(!resolutionText.trim() || isResolving) ? "bg-emerald-900/30 text-emerald-700 cursor-not-allowed" : "bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:from-emerald-400 hover:to-green-400"}`}
              >
                {isResolving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reactivate Modal */}
      {reactivateModalState.isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1420] border border-gray-700/60 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Reactivate Risk</h2>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Are you sure you want to reactivate this risk? It will be moved back to the Active Risks tab.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setReactivateModalState({ isOpen: false, itemId: null })} className="px-5 py-2.5 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm cursor-pointer">
                Cancel
              </button>
              <button
                onClick={confirmReactivate}
                disabled={isReactivating}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors cursor-pointer ${isReactivating ? "bg-amber-900/30 text-amber-700 cursor-not-allowed" : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-400 hover:to-orange-400 shadow-md shadow-amber-500/10"}`}
              >
                {isReactivating ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Status Document Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#0e1420] border border-gray-700/60 rounded-2xl p-6 w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Process Status Document</h2>
                <p className="text-gray-500 text-[10px]">Select a document for AI risk evaluation.</p>
              </div>
            </div>
            <p className="text-gray-400 text-xs mb-6 leading-relaxed">
              Select a processed document (excluding EL & IFA) to analyze for risk and audit items.
            </p>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-7 w-7 animate-spin text-[#00e5ff]" />
                <span className="ml-3 text-gray-400 text-sm">Loading documents...</span>
              </div>
            ) : eligibleDocs.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-400 mb-2 text-sm">No eligible documents found.</p>
                <p className="text-gray-500 text-xs">Please upload and process a Status Report, MOM, or other document first.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block text-gray-400 mb-2 text-xs font-semibold">Select Document</label>
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  disabled={processing}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff]/50 disabled:opacity-50 text-sm"
                >
                  {eligibleDocs.map((doc) => (
                    <option key={doc.id} value={String(doc.id)}>
                      {doc.document_name} ({doc.document_type})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowProcessModal(false); setSelectedDocId(""); }}
                disabled={processing}
                className={`px-4 py-2 rounded-xl font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm cursor-pointer ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProcess}
                disabled={processing || !selectedDocId || eligibleDocs.length === 0}
                className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors ${processing || !selectedDocId || eligibleDocs.length === 0 ? "bg-blue-900/30 text-blue-700 cursor-not-allowed" : "bg-gradient-to-r from-blue-500 to-cyan-500 text-white hover:from-blue-400 hover:to-cyan-400"}`}
              >
                {processing ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /> Processing...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Process Document</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-fade-in-up">
          <div className={`px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm max-w-sm ${
            notification.type === "success" ? "bg-green-900/80 border-green-500/50 text-green-200" :
            notification.type === "error" ? "bg-red-900/80 border-red-500/50 text-red-200" :
            "bg-blue-900/80 border-blue-500/50 text-blue-200"
          }`}>
            <div className="flex items-start gap-3">
              <p className="text-sm font-medium flex-1">{notification.message}</p>
              <button onClick={() => setNotification(null)} className="text-white/60 hover:text-white cursor-pointer">✕</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
