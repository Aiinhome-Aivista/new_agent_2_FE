import React, { useEffect, useRef, useState } from "react";
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

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [items, setItems] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ACTIVE" | "RESOLVED">("ACTIVE");
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const activeItems = items.filter((item) => item.status !== "RESOLVED");
  const resolvedItems = items.filter((item) => item.status === "RESOLVED");
  const currentTabItems = activeTab === "ACTIVE" ? activeItems : resolvedItems;

  const fetchTrackerAndProject = async () => {
    try {
      const [trackerRes, projectRes] = await Promise.all([
        apiClient.get(`/projects/${id}/tracker/`),
        apiClient.get(`/projects/${id}`),
      ]);
      if (trackerRes.data.success) setItems(trackerRes.data.data);
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

  // Check active progress on mount
  useEffect(() => {
    if (id) {
      checkActiveProgress(Number(id));
    }
  }, [id]);

  // Reload page data when evaluation completes
  useEffect(() => {
    if (evaluationProgress?.status === "completed") {
      fetchTrackerAndProject();
    }
  }, [evaluationProgress?.status]);

  useEffect(() => {
    setSelectedItemIds([]);
  }, [activeTab]);

  const toggleSelectItem = (itemId: number) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId],
    );
  };

  const generateExportHtml = (itemsToExport: any[], title: string) => {
    const projectName = project?.project_name || "Project Details";
    const userName = user?.name || "System User";
    const userEmail = user?.email || "";
    const exportTime = new Date().toLocaleString();
    const startDate = project?.start_date
      ? new Date(project.start_date).toLocaleDateString(undefined, {
          dateStyle: "medium",
        })
      : "N/A";
    const endDate = project?.end_date
      ? new Date(project.end_date).toLocaleDateString(undefined, {
          dateStyle: "medium",
        })
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
                ? `
              <p style="color: #64748b; font-style: italic; text-align: center; margin-top: 40px; font-size: 14px;">No risk items found matching this filter.</p>
            `
                : itemsToExport
                    .map((item) => {
                      const level = item.risk_level || "LOW";
                      const levelClass = level.toLowerCase();
                      const categoryLabels: Record<string, string> = {
                        SCOPE_CREEP: "Scope Creep",
                        DELAY: "Delay Risk",
                        MISSING_DELIVERABLE: "Missing Deliverable",
                        DEPENDENCY: "Customer Dependency",
                        STAKEHOLDER: "Stakeholder Risk",
                        GENERAL: "General Risk",
                      };
                      const categoryLabel =
                        categoryLabels[item.risk_category] ||
                        categoryLabels.GENERAL;
                      const typeLabels: Record<string, string> = {
                        ACTIVITY: "Activity",
                        NEW_REQUEST: "New Request",
                        ACTION_ITEM: "Action Item",
                      };
                      const typeLabel =
                        typeLabels[item.item_type] || item.item_type;

                      // Extract description & reasoning splits
                      const reasoningText = item.reasoning || "";
                      const hasSplit =
                        reasoningText.includes("\nReasoning:\n") ||
                        reasoningText.includes("\nReasoning:\r\n");
                      let description = reasoningText;
                      let detailedReasoning = "";
                      if (hasSplit) {
                        const parts = reasoningText.split(/\nReasoning:\r?\n/);
                        description = parts[0]
                          .replace(/Description:\r?\n/, "")
                          .trim();
                        detailedReasoning = parts[1].trim();
                      } else if (
                        reasoningText.startsWith("Description:\n") ||
                        reasoningText.startsWith("Description:\r\n")
                      ) {
                        description = reasoningText
                          .replace(/Description:\r?\n/, "")
                          .trim();
                      }

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
                  </div>

                  ${
                    description
                      ? `
                    <div class="reason-box">
                      <div class="reason-title">Risk Description</div>
                      <div>${description}</div>
                      ${
                        detailedReasoning
                          ? `
                        <div class="reason-title" style="margin-top: 10px; color: #475569;">Detailed AI Reasoning</div>
                        <div style="font-size: 11.5px; color: #475569;">${detailedReasoning}</div>
                      `
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }

                  ${
                    item.status === "RESOLVED"
                      ? `
                    <div class="resolution-box">
                      <div class="reason-title" style="color: #14532d;">Resolution Details</div>
                      <div>${item.resolution}</div>
                      ${
                        item.resolved_by_name || item.resolved_at
                          ? `
                        <div class="resolution-meta">
                          ${item.resolved_by_name ? `<span><strong>Resolved By:</strong> ${item.resolved_by_name} ${item.resolved_by_email ? `(${item.resolved_by_email})` : ""}</span>` : ""}
                          ${item.resolved_at ? `<span><strong>Resolved At:</strong> ${new Date(item.resolved_at).toLocaleString()}</span>` : ""}
                        </div>
                      `
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }
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
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to export PDF.");
        return;
      }
      const scriptToAdd = `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      `;
      const completeHtml = htmlContent.replace(
        "</body>",
        `${scriptToAdd}</body>`,
      );
      printWindow.document.write(completeHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name.replace(/\s+/g, "_")}_Risk_Report.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportBatch = (
    itemsToExport: any[],
    format: "pdf" | "docx",
    reportTitle: string,
  ) => {
    if (itemsToExport.length === 0) {
      alert("No items selected to export.");
      return;
    }
    const htmlContent = generateExportHtml(itemsToExport, reportTitle);

    if (format === "pdf") {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to export PDF.");
        return;
      }
      const scriptToAdd = `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      `;
      const completeHtml = htmlContent.replace(
        "</body>",
        `${scriptToAdd}</body>`,
      );
      printWindow.document.write(completeHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], {
        type: "application/msword",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, "_")}_Report.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const [resolveModalState, setResolveModalState] = useState<{
    isOpen: boolean;
    itemId: number | null;
  }>({ isOpen: false, itemId: null });
  const [resolutionText, setResolutionText] = useState("");

  const openResolveModal = (itemId: number) => {
    setResolveModalState({ isOpen: true, itemId });
    setResolutionText("");
  };

  const submitResolve = async () => {
    if (!resolutionText.trim() || resolveModalState.itemId === null) return;
    try {
      const res = await apiClient.post(
        `/projects/${id}/tracker/${resolveModalState.itemId}/resolve`,
        {
          resolution: resolutionText,
          status: "RESOLVED",
        },
      );
      if (res.data.success) {
        const updatedItem = res.data.data;
        setItems(
          items.map((i) =>
            i.id === resolveModalState.itemId ? { ...i, ...updatedItem } : i,
          ),
        );
        setResolveModalState({ isOpen: false, itemId: null });
      }
    } catch (error) {
      alert("Failed to resolve item");
    }
  };

  const handleReactivate = async (itemId: number) => {
    if (
      !window.confirm(
        "Are you sure you want to reactivate this risk and move it back to Active Risks?",
      )
    )
      return;
    try {
      const res = await apiClient.post(
        `/projects/${id}/tracker/${itemId}/reactivate`,
      );
      if (res.data.success) {
        const updatedItem = res.data.data;
        setItems(
          items.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  ...updatedItem,
                  status: "OPEN",
                  resolution: null,
                  resolved_by_name: null,
                  resolved_at: null,
                }
              : i,
          ),
        );
      }
    } catch (error) {
      alert("Failed to reactivate item");
    }
  };

  const handleDownloadDocument = async (
    documentId: number,
    documentName: string,
  ) => {
    try {
      const response = await apiClient.get(
        `/projects/${id}/documents/${documentId}/download`,
        {
          responseType: "blob",
        },
      );
      const contentType =
        (response.headers["content-type"] as string) ||
        "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", documentName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Failed to download document");
    }
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [openExportCardId, setOpenExportCardId] = useState<number | null>(null);

  // ---- Process Status Document Modal State ----
  const [processing, setProcessing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [eligibleDocs, setEligibleDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setNotification({ message, type });
  };

  const handleOpenProcessModal = async () => {
    setLoadingDocs(true);
    setShowProcessModal(true);
    try {
      const res = await apiClient.get(`/projects/${id}/documents/`);
      if (res.data.success) {
        // Filter: exclude EL and IFA, exclude already-extracted docs (only show COMPLETED ones not yet processed by tracker)
        const docs = res.data.data.filter(
          (doc: any) =>
            doc.document_type !== "EL" &&
            doc.document_type !== "IFA" &&
            doc.processing_status === "COMPLETED",
        );
        setEligibleDocs(docs);
        if (docs.length > 0) {
          setSelectedDocId(String(docs[0].id));
        } else {
          setSelectedDocId("");
        }
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
      const documentName =
        eligibleDocs.find((d: any) => d.id === docId)?.document_name ||
        "Document";
      setShowProcessModal(false);
      setSelectedDocId("");
      showNotification("AI Evaluation started!", "success");

      // Start global SSE stream
      startSSEStream(Number(id), docId, documentName);
    } catch (error: any) {
      showNotification(
        "Failed to start processing: " +
          (error.response?.data?.detail || "Server error"),
        "error",
      );
    } finally {
      setProcessing(false);
    }
  };

  const isBaselineExtraction =
    evaluationProgress?.document_type === "EL" ||
    evaluationProgress?.document_type === "IFA" ||
    evaluationProgress?.document_type?.toUpperCase() === "EL" ||
    evaluationProgress?.document_type?.toUpperCase() === "IFA" ||
    [
      "Detect Sections",
      "Extract Candidates",
      "Classify Items",
      "Deduplicate",
      "Enrich Dates",
      "Save Draft",
      "Detecting Scope Sections",
      "Extracting Scope Candidates",
      "Classifying Scope Items",
      "Deduplicating Candidates",
      "Extracting Milestones & Deadlines",
      "Saving Baseline Draft",
    ].includes(evaluationProgress?.currentStage || "");
  const currentSteps = isBaselineExtraction ? baselineSteps : steps;

  const getStepState = (index: number) => {
    if (!evaluationProgress) {
      return index === 0 ? "running" : "pending";
    }
    const status = evaluationProgress.status;
    const currentStage = evaluationProgress.currentStage;
    const activeIndex = currentSteps.findIndex(
      (s) =>
        s.name === currentStage ||
        s.key === currentStage ||
        (currentStage &&
          currentStage
            .toLowerCase()
            .includes(s.name.toLowerCase().split(" ")[0])),
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
          <button
            onClick={resetProgress}
            className="absolute top-4 right-4 p-2 bg-gray-900/50 hover:bg-gray-800 border border-gray-800/50 hover:border-gray-700 rounded-lg text-gray-400 hover:text-white transition-colors cursor-pointer z-50 flex items-center justify-center"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-800/60 pb-6 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Loader2
                className={`w-5 h-5 text-cyan-400 ${isFailed ? "" : "animate-spin"}`}
              />
              {isFailed
                ? "Evaluation Failed"
                : isBaselineExtraction
                  ? "Baseline Scope Extraction in Progress..."
                  : "Analyzing Project Risks & Timeline..."}
            </h2>
            <p className="text-xs text-gray-400 mt-1">
              {isFailed
                ? "An error occurred during evaluation."
                : isBaselineExtraction
                  ? "AI agents are analyzing and classifying contract scope sections and deliverables."
                  : "AI agents are running automated checks against your project baseline."}
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Elapsed Time
              </p>
              <p className="text-lg font-black text-white">{elapsedTime}s</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Overall Progress
              </p>
              <p className="text-lg font-black text-cyan-400">
                {overallProgress}%
              </p>
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
              <p className="text-[11px] text-gray-400 mt-1 font-mono leading-relaxed">
                {errorText}
              </p>
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
              iconBgClass =
                "bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent scale-100";
              textClass = "text-gray-200";
            } else if (state === "running") {
              iconElement = (
                <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
              );
              iconBgClass =
                "bg-gray-950 border-[#00e5ff] scale-110 shadow-lg shadow-cyan-500/10";
              textClass = "text-white font-bold";
            } else if (state === "failed") {
              iconElement = <X className="w-4 h-4 text-white" />;
              iconBgClass =
                "bg-red-600 shadow-lg shadow-rose-500/20 border-transparent scale-100";
              textClass = "text-rose-400 font-bold";
            } else {
              iconElement = <Circle className="w-3 h-3 text-gray-750" />;
              iconBgClass = "bg-gray-950 border-gray-800 scale-90";
              textClass = "text-gray-600";
            }

            const details = evaluationProgress.details || {};
            let detailSummary = null;
            if (state === "completed" || state === "running") {
              if (
                step.metricKey === "matched_activities" &&
                details.matched_activities !== undefined
              ) {
                detailSummary = (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded-md mt-1.5 animate-fadeIn">
                    ✓ {details.matched_activities} Matched Activities
                  </span>
                );
              } else if (
                step.metricKey === "oos_activities" &&
                details.oos_activities !== undefined
              ) {
                const count = details.oos_activities;
                detailSummary = (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${count > 0 ? "bg-rose-500/15 text-rose-400 border border-rose-500/25" : "bg-gray-800 text-gray-400 border-gray-750"} rounded-md mt-1.5 animate-fadeIn`}
                  >
                    {count > 0
                      ? `⚠ ${count} Suspected Out-of-Scope`
                      : "No out-of-scope activities"}
                  </span>
                );
              } else if (
                step.metricKey === "delayed_deliverables" &&
                details.delayed_deliverables !== undefined
              ) {
                const count = details.delayed_deliverables;
                detailSummary = (
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 ${count > 0 ? "bg-amber-500/15 text-amber-400 border border-amber-500/25" : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"} rounded-md mt-1.5 animate-fadeIn`}
                  >
                    {count > 0
                      ? `🕒 ${count} Delayed Deliverables`
                      : "✓ Deliverables on track"}
                  </span>
                );
              }
            }

            return (
              <div
                key={step.key}
                className="relative transition-all duration-300"
              >
                <div
                  className={`absolute -left-12 top-1.5 w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${iconBgClass}`}
                >
                  {iconElement}
                </div>

                <div>
                  <h4
                    className={`text-sm font-semibold tracking-wide flex items-center gap-2 ${textClass}`}
                  >
                    {step.name}
                    {state === "running" && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/25 rounded uppercase tracking-wider animate-pulse">
                        Running
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {step.desc}
                  </p>
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

  return (
    <div className="flex-1 bg-[#080b14] text-white p-6 md:p-10 relative overflow-hidden min-h-screen">
      {/* Background Glows */}
      <div className="fixed top-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-cyan-500/5 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative z-10 space-y-8">
        {/* Modern Breadcrumb & Header Row */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Link
                to="/dashboard"
                className="text-[11px] font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              >
                Cockpit
              </Link>
              <ChevronRight className="w-3 h-3 text-gray-650" />
              <Link
                to="/projects"
                className="text-[11px] font-bold text-gray-500 hover:text-cyan-400 transition-colors uppercase tracking-wider"
              >
                Projects
              </Link>
              <ChevronRight className="w-3 h-3 text-gray-650" />
              <span className="text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                Risk Tracker
              </span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <ShieldAlert className="w-8 h-8 text-rose-500 shrink-0" />
              Risk Tracker & Audit
            </h1>
            <p className="text-gray-400 text-xs mt-1.5 leading-relaxed max-w-xl">
              Track compliance alerts, scope creep warnings, and delay risks
              automatically extracted and analyzed by AI agents.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Scoring Rules Tooltip */}
            <div className="relative group">
              <button className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-cyan-400 rounded-xl text-xs font-bold transition-all cursor-help shadow-lg">
                <Info className="w-4 h-4 shrink-0" />
                Scoring Rules
              </button>

              {/* Tooltip Content */}
              <div className="absolute right-0 lg:right-1/2 lg:translate-x-1/2 top-full mt-3 w-80 p-5 bg-gray-950/98 border border-gray-800 rounded-2xl shadow-2xl backdrop-blur-md opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 text-left">
                <h4 className="font-bold text-sm text-[#00e5ff] mb-3 border-b border-gray-850 pb-2 flex items-center gap-1.5">
                  Item Risk Scoring Rules
                </h4>
                <div className="space-y-4 text-xs text-gray-300">
                  <p className="text-gray-400 leading-relaxed font-medium">
                    Individual item scores (out of 100) are determined by these
                    rules:
                  </p>

                  <div>
                    <span className="font-bold text-white block mb-1">
                      Scope Creep (OutOfScope Agent)
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                      <li>
                        <strong className="text-white">80/100</strong> for
                        direct baseline violations (out of scope).
                      </li>
                      <li>
                        <strong className="text-white">50/100</strong> for
                        warnings or borderline review items.
                      </li>
                    </ul>
                  </div>

                  <div>
                    <span className="font-bold text-white block mb-1">
                      Timeline Delays & Risks (Timeline Agent)
                    </span>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                      <li>
                        <strong className="text-white">85/100</strong> for
                        critical delays or active blockers.
                      </li>
                      <li>
                        <strong className="text-white">65/100</strong> for high
                        timeline risk deliverables.
                      </li>
                      <li>
                        <strong className="text-white">45/100</strong> for
                        medium timeline risk.
                      </li>
                      <li>
                        <strong className="text-white">15/100</strong> for low
                        timeline risk.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleOpenProcessModal}
              disabled={
                processing ||
                isEvaluating ||
                project?.monitoring_status !== "ACTIVE"
              }
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-[0.98] shadow-lg flex items-center gap-2 border ${
                processing ||
                isEvaluating ||
                project?.monitoring_status !== "ACTIVE"
                  ? "bg-gray-800/40 border-gray-800 text-gray-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border-blue-500/20 shadow-cyan-500/10 cursor-pointer"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              {processing || isEvaluating
                ? "Processing Analysis..."
                : "Analyze Status Document"}
            </button>

            {/* Global Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                disabled={items.length === 0}
                className={`px-4 py-2.5 text-xs font-bold rounded-xl flex items-center gap-2 border transition-all duration-200 active:scale-[0.98] shadow-lg ${
                  items.length === 0
                    ? "bg-gray-800/40 border-gray-800 text-gray-500 cursor-not-allowed"
                    : "bg-gray-900 border-gray-700 hover:border-gray-600 text-gray-300 hover:text-white cursor-pointer shadow-black/30"
                }`}
              >
                <Download className="w-3.5 h-3.5 text-gray-400" />
                <span>Export Report</span>
                <span className="text-[9px] text-gray-500">▼</span>
              </button>

              {showExportDropdown && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportDropdown(false)}
                  />

                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md z-50 text-left p-2 space-y-1 animate-fade-in-up">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                      Active Risks
                    </div>
                    <button
                      onClick={() => {
                        handleExportBatch(
                          activeItems,
                          "pdf",
                          "All Active Risks",
                        );
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>All Active Risks (PDF)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportBatch(
                          activeItems,
                          "docx",
                          "All Active Risks",
                        );
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2"
                    >
                      <span>All Active Risks (Word)</span>
                    </button>

                    {selectedItemIds.length > 0 && (
                      <>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-cyan-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                          Selected Risks ({selectedItemIds.length})
                        </div>
                        <button
                          onClick={() => {
                            handleExportBatch(
                              activeItems.filter((i) =>
                                selectedItemIds.includes(i.id),
                              ),
                              "pdf",
                              "Selected Active Risks",
                            );
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                        >
                          <span>Selected Risks (PDF)</span>
                        </button>
                        <button
                          onClick={() => {
                            handleExportBatch(
                              activeItems.filter((i) =>
                                selectedItemIds.includes(i.id),
                              ),
                              "docx",
                              "Selected Active Risks",
                            );
                            setShowExportDropdown(false);
                          }}
                          className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2"
                        >
                          <span>Selected Risks (Word)</span>
                        </button>
                      </>
                    )}

                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                      Resolved Risks
                    </div>
                    <button
                      onClick={() => {
                        handleExportBatch(
                          resolvedItems,
                          "pdf",
                          "All Resolved Risks",
                        );
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>All Resolved Risks (PDF)</span>
                    </button>
                    <button
                      onClick={() => {
                        handleExportBatch(
                          resolvedItems,
                          "docx",
                          "All Resolved Risks",
                        );
                        setShowExportDropdown(false);
                      }}
                      className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span>All Resolved Risks (Word)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {project?.monitoring_status !== "ACTIVE" ? (
          <div className="text-center py-20 bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-white/5 rounded-3xl animate-fade-in-up p-10 max-w-2xl mx-auto shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[150px] h-[150px] bg-amber-500/5 blur-[50px] pointer-events-none" />
            <AlertTriangle className="w-14 h-14 text-amber-500 mx-auto mb-5 animate-bounce" />
            <h3 className="font-display text-xl font-extrabold text-white mb-3">
              {project?.monitoring_status === "DRAFT"
                ? "Extract Project Baseline First"
                : "Baseline Awaiting Approval"}
            </h3>
            <p className="text-gray-400 text-sm leading-relaxed mb-8 max-w-md mx-auto">
              Before AI agents can analyze status updates for risks, deviations,
              and delay items, a contract baseline must be extracted and
              approved.
            </p>
            <div>
              <Link
                to={`/projects/${id}/baseline`}
                className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/10 active:scale-[0.98]"
              >
                Go to Baseline Review
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ) : isEvaluating || evaluationProgress ? (
          renderProgressTimeline()
        ) : items.length === 0 ? (
          <div className="text-center py-24 bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-white/5 rounded-3xl animate-fade-in-up shadow-2xl backdrop-blur-md max-w-xl mx-auto">
            <div className="w-16 h-16 bg-gray-800/40 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-gray-700/30 shadow-inner">
              <ShieldAlert className="w-8 h-8 text-gray-500" />
            </div>
            <h3 className="font-display text-lg font-bold text-white mb-2">
              No Risk Items Found
            </h3>
            <p className="text-gray-400 text-xs max-w-sm mx-auto leading-relaxed">
              No risk or audit findings have been recorded. Choose "Analyze
              Status Document" above to start evaluation.
            </p>
          </div>
        ) : (
          <>
            {/* Highest Action Priority AI Summary */}
            {project?.highestActionPriority && (
              <div className="mb-8 p-6 bg-gradient-to-br from-cyan-950/40 to-blue-900/20 border border-cyan-500/30 rounded-2xl shadow-lg shadow-cyan-500/5 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-cyan-500/20">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                  <h3 className="font-display font-bold text-white text-lg">
                    AI Recommendation: Highest Action Priority
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="col-span-1">
                    <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
                      Activity
                    </p>
                    <p className="text-sm font-bold text-white bg-gray-900/50 p-3 rounded-lg border border-gray-700/50">
                      {project.highestActionPriority.activity}
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
                          Status
                        </p>
                        <p className="text-xs font-semibold text-cyan-400">
                          {project.highestActionPriority.status}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-1">
                          Due Date
                        </p>
                        <p className="text-xs font-semibold text-rose-400">
                          {project.highestActionPriority.dueDate}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-2 space-y-4">
                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                        Blockers & Cascade Impact
                      </p>
                      <div className="text-xs text-gray-300 leading-relaxed bg-gray-900/30 p-3 rounded-lg border border-gray-800 whitespace-pre-line">
                        {project.highestActionPriority.reason}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider mb-2">
                        Recommended Action
                      </p>
                      <div className="text-xs font-semibold text-white leading-relaxed bg-cyan-500/10 p-3 rounded-lg border border-cyan-500/20 shadow-inner">
                        {project.highestActionPriority.recommendedAction}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Animated Capsule Tab Control */}
            <div className="relative flex p-1 bg-gray-900/60 backdrop-blur-md border border-white/5 rounded-2xl max-w-md mb-8 shadow-lg shadow-black/20">
              {/* Sliding Background Indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-xl bg-gradient-to-r from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 shadow-lg shadow-cyan-500/5 transition-all duration-300 ease-out"
                style={{
                  width: "calc(50% - 4px)",
                  left: activeTab === "ACTIVE" ? "4px" : "calc(50%)",
                }}
              />

              {/* Active Risks Tab */}
              <button
                onClick={() => setActiveTab("ACTIVE")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-350 cursor-pointer ${
                  activeTab === "ACTIVE"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-205"
                }`}
              >
                <span>Active Risks</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] rounded-md border font-black font-mono transition-all duration-300 ${
                    activeTab === "ACTIVE"
                      ? "bg-red-500/10 text-red-400 border-red-500/20 shadow-md shadow-red-500/5"
                      : "bg-gray-800/40 text-gray-500 border-gray-700/30"
                  }`}
                >
                  {activeItems.length}
                </span>
              </button>

              {/* Resolved Risks Tab */}
              <button
                onClick={() => setActiveTab("RESOLVED")}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all duration-355 cursor-pointer ${
                  activeTab === "RESOLVED"
                    ? "text-white"
                    : "text-gray-400 hover:text-gray-205"
                }`}
              >
                <span>Resolved</span>
                <span
                  className={`px-2.5 py-0.5 text-[10px] rounded-md border font-black font-mono transition-all duration-300 ${
                    activeTab === "RESOLVED"
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-md shadow-emerald-500/5"
                      : "bg-gray-800/40 text-gray-500 border-gray-700/30"
                  }`}
                >
                  {resolvedItems.length}
                </span>
              </button>
            </div>

            {/* Filtered items list */}
            {currentTabItems.length === 0 ? (
              <div className="text-center py-20 bg-gradient-to-br from-gray-900/60 to-gray-950/80 border border-white/5 rounded-3xl animate-fade-in-up shadow-2xl backdrop-blur-md max-w-xl mx-auto">
                <div className="w-14 h-14 bg-gray-800/30 rounded-full flex items-center justify-center mx-auto mb-5 border border-gray-700/30">
                  <CheckCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h3 className="font-display text-base font-bold text-white mb-1">
                  No {activeTab === "ACTIVE" ? "Active" : "Resolved"} Risks
                </h3>
                <p className="text-gray-400 text-xs max-w-xs mx-auto leading-relaxed">
                  {activeTab === "ACTIVE"
                    ? "Fantastic! All identified risks have been reviewed and resolved."
                    : "No resolved items are currently in history."}
                </p>
              </div>
            ) : (
              <div key={activeTab} className="space-y-6">
                {currentTabItems.map((item, index) => {
                  const riskLevelConfig: Record<
                    string,
                    { bg: string; text: string; border: string }
                  > = {
                    LOW: {
                      bg: "bg-emerald-500/10",
                      text: "text-emerald-400",
                      border: "border-emerald-500/20",
                    },
                    MEDIUM: {
                      bg: "bg-yellow-500/10",
                      text: "text-yellow-400",
                      border: "border-yellow-500/20",
                    },
                    HIGH: {
                      bg: "bg-orange-500/10",
                      text: "text-orange-400",
                      border: "border-orange-500/20",
                    },
                    CRITICAL: {
                      bg: "bg-rose-500/10",
                      text: "text-rose-400",
                      border: "border-rose-500/20",
                    },
                  };
                  const level = item.risk_level || "LOW";
                  const levelStyle =
                    riskLevelConfig[level] || riskLevelConfig.LOW;

                  // Risk category display
                  const categoryLabels: Record<string, string> = {
                    SCOPE_CREEP: "Scope Creep",
                    DELAY: "Delay Risk",
                    MISSING_DELIVERABLE: "Missing Deliverable",
                    DEPENDENCY: "Customer Dependency",
                    STAKEHOLDER: "Stakeholder Risk",
                    GENERAL: "General",
                  };
                  const categoryLabel =
                    categoryLabels[item.risk_category] ||
                    categoryLabels.GENERAL;

                  // Item type labels
                  const typeLabels: Record<string, string> = {
                    ACTIVITY: "Activity",
                    NEW_REQUEST: "New Request",
                    BLOCKER: "Blocker",
                    ACTION_ITEM: "Action Item",
                    DECISION: "Decision",
                    RISK_MENTIONED: "Risk Mentioned",
                  };

                  // Border color based on risk level
                  const borderColor =
                    item.status === "RESOLVED"
                      ? "border-emerald-500/20 bg-emerald-950/[0.01]"
                      : level === "CRITICAL"
                        ? "border-red-500/30"
                        : level === "HIGH"
                          ? "border-orange-500/30"
                          : level === "MEDIUM"
                            ? "border-yellow-500/20"
                            : "border-emerald-500/20";

                  // Split reasoning into description and detailed reasoning
                  const reasoningParts = (item.reasoning || "").split("\n\n");
                  const description = reasoningParts[0] || "";
                  const detailedReasoning =
                    reasoningParts.slice(1).join("\n\n") || "";

                  return (
                    <div
                      key={item.id}
                      className={`group rounded-2xl border ${borderColor} bg-gradient-to-br from-gray-900/70 to-gray-950/90 backdrop-blur-lg shadow-xl shadow-black/20 hover:shadow-2xl hover:shadow-cyan-500/[0.01] hover:border-gray-700/60 transition-all duration-300 ease-out overflow-hidden`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div
                        className={`px-4 py-2.5 border-b flex items-center justify-between gap-3 ${
                          level === "CRITICAL"
                            ? "bg-red-500/[0.04]"
                            : level === "HIGH"
                              ? "bg-orange-500/[0.03]"
                              : level === "MEDIUM"
                                ? "bg-yellow-500/[0.02]"
                                : "bg-white/[0.01]"
                        }`}
                      >
                        {/* Left: checkbox + dot + title row */}
                        <div className="flex items-center gap-2.5 flex-1 min-w-0">
                          {activeTab === "ACTIVE" && (
                            <input
                              type="checkbox"
                              checked={selectedItemIds.includes(item.id)}
                              onChange={() => toggleSelectItem(item.id)}
                              className="w-3.5 h-3.5 rounded border-gray-700 bg-gray-950 text-cyan-500 focus:ring-cyan-500/30 cursor-pointer accent-cyan-500 shrink-0"
                            />
                          )}
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              level === "CRITICAL"
                                ? "bg-red-400 shadow-[0_0_6px_rgba(239,68,68,0.6)] animate-pulse"
                                : level === "HIGH"
                                  ? "bg-orange-400 shadow-[0_0_6px_rgba(249,115,22,0.5)]"
                                  : level === "MEDIUM"
                                    ? "bg-yellow-400 shadow-[0_0_6px_rgba(234,179,8,0.5)]"
                                    : "bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
                            }`}
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[8px] font-extrabold text-gray-500 bg-gray-800/70 border border-gray-700/40 px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0">
                                {typeLabels[item.item_type] || item.item_type}
                              </span>
                              <h3 className="font-semibold text-sm text-gray-200 truncate group-hover:text-white transition-colors">
                                {item.name ||
                                  `${typeLabels[item.item_type] || item.item_type} #${item.id}`}
                              </h3>
                            </div>
                            {/* source doc inline */}
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <Briefcase className="w-2.5 h-2.5 text-gray-600 shrink-0" />
                              <span
                                className="text-[10px] text-gray-500 truncate max-w-[260px]"
                                title={item.document_name}
                              >
                                {item.document_name}
                              </span>
                              <button
                                onClick={() =>
                                  handleDownloadDocument(
                                    item.source_document_id,
                                    item.document_name,
                                  )
                                }
                                className="text-[9px] text-cyan-500 hover:text-cyan-400 font-bold transition-colors cursor-pointer shrink-0"
                              >
                                ↓ DL
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Right: badges */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {!!item.is_out_of_scope && (
                            <span className="px-1.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded text-[8px] font-bold uppercase tracking-wide">
                              OOS
                            </span>
                          )}
                          {!!item.requires_escalation && (
                            <span className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded text-[8px] font-bold uppercase tracking-wide">
                              Esc
                            </span>
                          )}
                          <span className="text-[8px] font-bold text-gray-500 bg-gray-800/40 px-1.5 py-0.5 rounded border border-gray-700/30 hidden sm:inline">
                            {categoryLabel}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}
                          >
                            {level}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-black ${
                              item.risk_score >= 71
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : item.risk_score >= 41
                                  ? "bg-orange-500/10 text-orange-400 border border-orange-500/20"
                                  : item.risk_score >= 21
                                    ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            }`}
                          >
                            {item.risk_score}/100
                          </span>
                        </div>
                      </div>

                      {/* ── Body ── */}
                      <div className="px-4 py-3 space-y-2.5">
                        {/* Description — always collapsed */}
                        {(description || item.reasoning) && (
                          <details className="group/desc border border-white/5 rounded-lg overflow-hidden bg-white/[0.01]">
                            <summary className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-200 cursor-pointer select-none transition-colors">
                              <span className="flex items-center gap-1.5 truncate">
                                <Info className="w-2.5 h-2.5 text-gray-500 shrink-0" />
                                <span className="truncate">
                                  {description
                                    ? description.slice(0, 80) +
                                      (description.length > 80 ? "…" : "")
                                    : "View Reasoning"}
                                </span>
                              </span>
                              <span className="text-gray-600 text-[8px] shrink-0 ml-2">
                                ▼
                              </span>
                            </summary>
                            <div className="px-3 pb-3 pt-1 text-[11px] text-gray-400 leading-relaxed border-t border-white/[0.04] whitespace-pre-line">
                              {description || item.reasoning}
                            </div>
                          </details>
                        )}

                        {/* AI Detailed Reasoning — only if exists */}
                        {detailedReasoning && (
                          <details className="group/ai border border-purple-500/10 rounded-lg overflow-hidden bg-purple-500/[0.02]">
                            <summary className="flex items-center justify-between px-3 py-2 text-[10px] font-bold text-gray-400 hover:text-gray-200 cursor-pointer select-none transition-colors">
                              <span className="flex items-center gap-1.5">
                                <Sparkles className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                                AI Reasoning & Recommendations
                              </span>
                              <span className="text-gray-600 text-[8px] shrink-0">
                                ▼
                              </span>
                            </summary>
                            <div className="px-3 pb-3 pt-1 text-[11px] text-gray-400 leading-relaxed border-t border-purple-500/10 whitespace-pre-line">
                              {detailedReasoning}
                            </div>
                          </details>
                        )}

                        {/* Actions */}
                        {item.status === "RESOLVED" ? (
                          <div className="flex items-start justify-between gap-3 p-2.5 bg-emerald-500/[0.04] border border-emerald-500/15 rounded-lg">
                            <div className="flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">
                                ✓ Resolved —{" "}
                              </span>
                              <span className="text-[10px] text-gray-400">
                                {item.resolution}
                              </span>
                              {(item.resolved_by_name || item.resolved_at) && (
                                <div className="flex gap-2 mt-1 text-[9px] text-gray-600">
                                  {item.resolved_by_name && (
                                    <span>
                                      by{" "}
                                      <strong className="text-gray-500">
                                        {item.resolved_by_name}
                                      </strong>
                                    </span>
                                  )}
                                  {item.resolved_at && (
                                    <span>
                                      at{" "}
                                      <strong className="text-gray-500">
                                        {new Date(
                                          item.resolved_at,
                                        ).toLocaleDateString()}
                                      </strong>
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <button
                              onClick={() => handleReactivate(item.id)}
                              className="px-2.5 py-1 bg-gray-900 border border-gray-800 hover:border-gray-700 text-gray-400 hover:text-white rounded-md text-[9px] font-bold transition-all cursor-pointer active:scale-[0.98] shrink-0 whitespace-nowrap"
                            >
                              ↺ Reactivate
                            </button>
                          </div>
                        ) : (
                          <div>
                            <button
                              onClick={() => openResolveModal(item.id)}
                              className="px-4 py-1.5 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-md shadow-emerald-500/10 active:scale-[0.98]"
                            >
                              ✓ Mark Resolved
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      {selectedItemIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4 animate-fade-in-up">
          <div className="bg-gray-950/90 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-4 shadow-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <span className="text-[10px] text-cyan-400 font-bold font-mono">
                  {selectedItemIds.length}
                </span>
              </div>
              <span className="text-xs text-gray-300 font-bold">
                risks selected
              </span>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelectedItemIds([])}
                className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-xl transition-all cursor-pointer"
              >
                Clear Selection
              </button>

              <button
                onClick={() =>
                  handleExportBatch(
                    activeItems.filter((i) => selectedItemIds.includes(i.id)),
                    "pdf",
                    "Selected Active Risks",
                  )
                }
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 rounded-xl transition-all shadow-md shadow-cyan-500/10 cursor-pointer shadow-inner active:scale-[0.98]"
              >
                Export PDF
              </button>

              <button
                onClick={() =>
                  handleExportBatch(
                    activeItems.filter((i) => selectedItemIds.includes(i.id)),
                    "docx",
                    "Selected Active Risks",
                  )
                }
                className="px-3.5 py-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-305 bg-cyan-950/40 border border-cyan-500/20 rounded-xl transition-all cursor-pointer active:scale-[0.98]"
              >
                Export Word
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {resolveModalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-white">
              Resolve Risk Item
            </h2>
            <p className="text-gray-400 text-sm mb-4">
              Please provide official notes detailing how this scope deviation
              is being handled.
            </p>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] transition-all resize-none mb-6"
              rows={4}
              placeholder="e.g. Discussed with client. Added as Change Request #102..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() =>
                  setResolveModalState({ isOpen: false, itemId: null })
                }
                className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitResolve}
                disabled={!resolutionText.trim()}
                className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${!resolutionText.trim() ? "bg-green-900/50 text-green-700 cursor-not-allowed" : "bg-[#00e5ff] text-black hover:bg-[#00cce5]"}`}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Status Document Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">
              Process Status Document
            </h2>
            <p className="text-gray-400 text-sm mb-6">
              Select a processed document (excluding EL & IFA) to analyze for
              risk and audit items.
            </p>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#00e5ff]" />
                <span className="ml-3 text-gray-400">Loading documents...</span>
              </div>
            ) : eligibleDocs.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-400 mb-2">
                  No eligible documents found.
                </p>
                <p className="text-gray-500 text-sm">
                  Please upload and process a Status Report, MOM, or other
                  document first from the dashboard.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">
                    Select Document
                  </label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={processing}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] disabled:opacity-50"
                  >
                    {eligibleDocs.map((doc) => (
                      <option key={doc.id} value={String(doc.id)}>
                        {doc.document_name} ({doc.document_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedDocId("");
                }}
                disabled={processing}
                className={`px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProcess}
                disabled={
                  processing || !selectedDocId || eligibleDocs.length === 0
                }
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center cursor-pointer ${
                  processing || !selectedDocId || eligibleDocs.length === 0
                    ? "bg-blue-900/50 text-blue-700 cursor-not-allowed"
                    : "bg-[#00e5ff] text-black hover:bg-[#00cce5]"
                }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right duration-300">
          <div
            className={`px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm max-w-sm ${
              notification.type === "success"
                ? "bg-green-900/80 border-green-500/50 text-green-200"
                : notification.type === "error"
                  ? "bg-red-900/80 border-red-500/50 text-red-200"
                  : "bg-blue-900/80 border-blue-500/50 text-blue-200"
            }`}
          >
            <div className="flex items-start gap-3">
              <p className="text-sm font-medium flex-1">
                {notification.message}
              </p>
              <button
                onClick={() => setNotification(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
