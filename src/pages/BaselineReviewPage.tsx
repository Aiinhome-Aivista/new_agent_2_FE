import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { Loader } from "../components/Loader";
import { useDocumentProgress } from "../context/DocumentProgressContext";
import { BaselineModals } from "../components/baseline/BaselineModals";
import { BaselineTimeline } from "../components/baseline/BaselineTimeline";
import { BaselineScopeItems } from "../components/baseline/BaselineScopeItems";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "N/A";
  try {
    const cleanStr =
      typeof dateStr === "string" ? dateStr.replace(" ", "T") : dateStr;
    const d = new Date(cleanStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch (e) {
    return "N/A";
  }
};
import {
  Loader2,
  CheckCircle2,
  CheckCheck,
  Clock,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  X,
  AlertTriangle,
  AlertCircle,
  Circle,
  Calendar,
  MapPin,
  Sparkles,
  Repeat,
  RefreshCw,
  Zap,
  ScanSearch,
} from "lucide-react";

const baselineSteps = [
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

export const BaselineReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const {
    isEvaluating,
    evaluationProgress,
    elapsedTime,
    startPolling,
    activeProjectId,
    checkActiveProgress,
    resetProgress,
  } = useDocumentProgress();
  const [baseline, setBaseline] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<any[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<
    Record<number, boolean>
  >({});

  const isCurrentBaselineExtracting =
    (isEvaluating ||
      evaluationProgress?.status === "running" ||
      evaluationProgress?.status === "pending") &&
    (!activeProjectId || Number(activeProjectId) === Number(id)) &&
    (evaluationProgress?.document_type === "EL" ||
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
      ].includes(evaluationProgress?.currentStage || ""));

  useEffect(() => {
    if (id) {
      checkActiveProgress(Number(id));
    }
  }, [id]);

  // Auto-refresh baseline data when background extraction completes
  useEffect(() => {
    if (
      evaluationProgress &&
      evaluationProgress.status === "completed" &&
      (evaluationProgress.document_type === "EL" ||
        evaluationProgress.document_type === "IFA" ||
        evaluationProgress.document_type?.toUpperCase() === "EL" ||
        evaluationProgress.document_type?.toUpperCase() === "IFA" ||
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
        ].includes(evaluationProgress.currentStage || "")) &&
      (!activeProjectId || activeProjectId === Number(id))
    ) {
      const refreshBaseline = async () => {
        try {
          const [baselineRes, versionsRes] = await Promise.all([
            apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!)),
            apiClient.get(API_ENDPOINTS.BASELINE.VERSIONS(id!)),
          ]);
          if (baselineRes.data.success) {
            setBaseline(baselineRes.data.data);
          }
          if (versionsRes.data.success) {
            setVersions(versionsRes.data.data);
          }
          showNotification("Baseline data updated!", "success");
        } catch (err) {
          console.error("Failed to refresh baseline:", err);
        }
      };
      refreshBaseline();
    }
  }, [evaluationProgress?.status]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [baselineRes, projectRes, versionsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!)),
          apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(id!)),
          apiClient.get(API_ENDPOINTS.BASELINE.VERSIONS(id!)),
        ]);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
        if (projectRes.data.success) {
          setProject(projectRes.data.data);
        }
        if (versionsRes.data.success) {
          setVersions(versionsRes.data.data);
        }
      } catch (error) {
        console.error(
          "Failed to fetch baseline, project details, or versions history",
        );
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const timelineContainerRef = useRef<HTMLDivElement>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);
  const [showExportDropdown, setShowExportDropdown] = useState(false);

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

  const [selectedDeliverableId, setSelectedDeliverableId] = useState<
    number | null
  >(null);

  const milestoneMap = React.useMemo(() => {
    const map = new Map();
    (baseline?.milestones || []).forEach((m: any) => {
      map.set(m.id.toString(), m);
      if (m.name) map.set(m.name.toLowerCase(), m);
    });
    return map;
  }, [baseline]);

  const getMilestoneData = (itemName: string, milestoneName: string) => {
    if (milestoneName) {
      const m = milestoneMap.get(milestoneName.toLowerCase());
      if (m) return m;
    }
    if (itemName) {
      const m = milestoneMap.get(itemName.toLowerCase());
      if (m) return m;
    }
    return null;
  };

  // Compute timelineItems early so handlers can reference it
  // Recurring parent items expand their occurrences; each occurrence becomes
  // its own timeline node tagged with _is_occurrence=true and _parent_item.
  const timelineItems = React.useMemo(() => {
    const result: any[] = [];
    const allItems: any[] = baseline?.scope_items || [];
    for (const item of allItems) {
      const isRecurringParent =
        item.is_recurring && !item.parent_scope_item_id;
      const occurrences: any[] = item.recurring_occurrences || [];
      if (isRecurringParent && occurrences.length > 0) {
        // Push each occurrence as its own timeline node
        for (const occ of occurrences) {
          result.push({
            ...occ,
            _is_occurrence: true,
            _parent_item: item,
          });
        }
        // Also add the parent itself (without deadline filtering) so the
        // group header is selectable, but only if it has its own deadline
        // (e.g. the LLM gave it one). If not, skip it — occurrences cover it.
        if (item.deadline || item.milestone) {
          result.push({ ...item, _is_occurrence: false, _parent_item: null });
        }
      } else if (item.deadline || item.milestone) {
        result.push({ ...item, _is_occurrence: false, _parent_item: null });
      }
    }
    return result.sort((a: any, b: any) => {
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [baseline]);

  // Recurring groups for summary badge
  const recurringGroups = React.useMemo(() => {
    return (baseline?.scope_items || []).filter(
      (item: any) => item.is_recurring && !item.parent_scope_item_id,
    );
  }, [baseline]);

  useEffect(() => {
    if (timelineItems.length > 0 && selectedDeliverableId === null) {
      setSelectedDeliverableId(timelineItems[0].id);
    }
  }, [timelineItems, selectedDeliverableId]);

  useEffect(() => {
    if (selectedDeliverableId && timelineContainerRef.current) {
      const activeNode =
        timelineContainerRef.current.querySelector(`[data-active="true"]`);
      if (activeNode) {
        activeNode.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [selectedDeliverableId]);

  // Handle URL query parameters for automated follow-up actions
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const selectedIdStr = params.get("selected");
    const action = params.get("action");

    if (selectedIdStr && timelineItems.length > 0) {
      const selectedId = parseInt(selectedIdStr, 10);
      const exists = timelineItems.some((item: any) => item.id === selectedId);
      if (exists) {
        setSelectedDeliverableId(selectedId);

        // Execute automated status change if requested
        if (action === "completed") {
          handleUpdateCompletionStatus(selectedId, "COMPLETED");
        } else if (action === "pending") {
          handleUpdateCompletionStatus(selectedId, "ACTIVE");
        } else if (action === "reschedule") {
          // Focus the reschedule date picker
          setTimeout(() => {
            const dateInput = document.getElementById("reschedule-date-input");
            if (dateInput) {
              dateInput.scrollIntoView({ behavior: "smooth", block: "center" });
              dateInput.focus();
            }
          }, 500);
        }

        // Clear parameters from URL so they don't re-run on subsequent page reloads
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [timelineItems]);

  const activeIndex =
    timelineItems.findIndex((d: any) => d.id === selectedDeliverableId) ?? -1;

  const handlePrev = () => {
    if (timelineItems.length > 0 && activeIndex > 0) {
      setSelectedDeliverableId(timelineItems[activeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (timelineItems.length > 0 && activeIndex < timelineItems.length - 1) {
      setSelectedDeliverableId(timelineItems[activeIndex + 1].id);
    }
  };

  const getItemVersion = (sourceDocId: number) => {
    if (!sourceDocId || !versions) return null;
    const foundVer = versions.find(
      (v: any) => v.source_document_id === sourceDocId,
    );
    return foundVer ? `v${foundVer.version}` : null;
  };

  const [eligibleDocs, setEligibleDocs] = useState<any[]>([]);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [completedDocIds, setCompletedDocIds] = useState<number[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<number[]>([]);
  const [extractionMode, setExtractionMode] = useState<"QUICK" | "DEEP_SCAN">(
    "QUICK",
  );

  const toggleDocSelection = (docId: number) => {
    setSelectedDocIds([docId]);
  };

  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsApproving(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.BASELINE.APPROVE(id!));
      if (res.data.success) {
        showNotification("Baseline Approved!", "success");
        const [baselineRes, projectRes, versionsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!)),
          apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(id!)),
          apiClient.get(API_ENDPOINTS.BASELINE.VERSIONS(id!)),
        ]);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
        if (projectRes.data.success) {
          setProject(projectRes.data.data);
        }
        if (versionsRes.data.success) {
          setVersions(versionsRes.data.data);
        }
        // Dispatch event so Sidebar can update without page reload
        window.dispatchEvent(new Event("project-updated"));
      }
    } catch (error: any) {
      showNotification(
        "Approval failed: " + (error.response?.data?.detail || "Server error"),
        "error",
      );
    } finally {
      setIsApproving(false);
    }
  };

  // Manual Scope Item Management States
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDescription, setNewItemDescription] = useState("");
  const [newItemScopeType, setNewItemScopeType] = useState<
    "IN_SCOPE" | "OUT_OF_SCOPE"
  >("IN_SCOPE");
  const [newItemEvidence, setNewItemEvidence] = useState("");
  const [addingItem, setAddingItem] = useState(false);

  const [deletingItemId, setDeletingItemId] = useState<number | null>(null);
  const [deletingItem, setDeletingItem] = useState(false);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      const payload = {
        name: newItemName.trim(),
        description: newItemDescription.trim(),
        scope_type: newItemScopeType,
        evidence_text: newItemEvidence.trim() || "Manually added scope item",
        confidence: 1.0,
      };
      const res = await apiClient.post(
        API_ENDPOINTS.BASELINE.ITEMS(id!),
        payload,
      );
      if (res.data.success) {
        showNotification("Scope item added successfully!", "success");
        setShowAddItemModal(false);
        setNewItemName("");
        setNewItemDescription("");
        setNewItemScopeType("IN_SCOPE");
        setNewItemEvidence("");

        const [baselineRes, versionsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!)),
          apiClient.get(API_ENDPOINTS.BASELINE.VERSIONS(id!)),
        ]);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
        if (versionsRes.data.success) {
          setVersions(versionsRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification(
        "Failed to add item: " +
          (error.response?.data?.detail || "Server error"),
        "error",
      );
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setDeletingItem(true);
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.BASELINE.ITEM_DETAIL(id!, itemId),
      );
      if (res.data.success) {
        showNotification("Scope item deleted successfully!", "success");
        setDeletingItemId(null);

        const [baselineRes, versionsRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!)),
          apiClient.get(API_ENDPOINTS.BASELINE.VERSIONS(id!)),
        ]);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
        if (versionsRes.data.success) {
          setVersions(versionsRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification(
        "Failed to delete item: " +
          (error.response?.data?.detail || "Server error"),
        "error",
      );
    } finally {
      setDeletingItem(false);
    }
  };

  const handleUpdateCompletionStatus = async (
    itemId: number,
    newStatus: string,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.BASELINE.ITEM_COMPLETION(id!, itemId),
        { completion_status: newStatus },
      );
      if (res.data.success) {
        showNotification(res.data.message, "success");
        const baselineRes = await apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!));
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification(
        "Failed to update status: " +
          (error.response?.data?.detail || "Server error"),
        "error",
      );
    }
  };

  const handleRescheduleDeadline = async (
    itemId: number,
    newDeadline: string,
  ) => {
    try {
      const res = await apiClient.patch(
        API_ENDPOINTS.BASELINE.ITEM_COMPLETION(id!, itemId),
        { deadline: newDeadline },
      );
      if (res.data.success) {
        showNotification("Deliverable rescheduled successfully", "success");
        const baselineRes = await apiClient.get(API_ENDPOINTS.BASELINE.LIST(id!));
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification(
        "Failed to reschedule deliverable: " +
          (error.response?.data?.detail || "Server error"),
        "error",
      );
    }
  };

  const handleExtractClick = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
      if (res.data.success) {
        // Filter documents that are COMPLETED and are EL or IFA
        const contracts = res.data.data.filter(
          (doc: any) =>
            doc.processing_status === "COMPLETED" &&
            (doc.document_type === "EL" || doc.document_type === "IFA"),
        );

        if (contracts.length === 0) {
          showNotification(
            "Please upload and process an Engagement Letter (EL) or Inter-Firm Approval (IFA) first.",
            "info",
          );
          return;
        }

        setEligibleDocs(contracts);
        setSelectedDocIds(contracts.length > 0 ? [contracts[0].id] : []);
        setShowExtractModal(true);
      }
    } catch (error) {
      showNotification("Failed to fetch project documents", "error");
    }
  };

  const confirmExtractAll = async () => {
    if (selectedDocIds.length === 0) return;
    setExtracting(true);
    setCompletedDocIds([]);
    try {
      const docsToExtract = eligibleDocs.filter((d) =>
        selectedDocIds.includes(d.id),
      );
      for (const doc of docsToExtract) {
        setExtractingDocId(doc.id);
        await apiClient.post(
          API_ENDPOINTS.BASELINE.EXTRACT(id!, doc.id),
          { mode: extractionMode },
        );
        // Start polling immediately in the global context
        startPolling(
          Number(id),
          doc.id,
          doc.document_name,
          0,
          doc.document_type || "EL",
        );
      }
      setShowExtractModal(false);
      showNotification(
        "Baseline extraction started in the background!",
        "success",
      );
    } catch (error: any) {
      showNotification(
        "Extraction failed: " +
          (error.response?.data?.message ||
            error.response?.data?.detail ||
            error.message ||
            "Server error"),
        "error",
      );
    } finally {
      setExtractingDocId(null);
      setExtracting(false);
    }
  };

  const handleExportWord = () => {
    if (!baseline) return;

    const content = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <title>Baseline Review Export</title>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 40px; color: #333333; }
          h1 { color: #002D62; border-bottom: 2px solid #002D62; padding-bottom: 5px; font-size: 24px; font-weight: bold; margin-bottom: 20px; }
          h2 { color: #111111; margin-top: 30px; font-size: 18px; border-bottom: 1px solid #dddddd; padding-bottom: 5px; }
          .item-card { border: 1px solid #dddddd; padding: 12px; margin-bottom: 15px; border-radius: 4px; background-color: #f9f9f9; }
          .item-title { font-weight: bold; color: #111111; font-size: 14px; margin-bottom: 4px; }
          .item-desc { color: #555555; font-size: 12px; margin-bottom: 8px; line-height: 1.4; }
          .evidence { font-style: italic; color: #444444; background-color: #f0f4f8; padding: 8px; border-left: 3px solid #005A9C; margin: 8px 0; font-size: 11px; }
          .meta { font-size: 11px; color: #777777; margin-top: 8px; border-top: 1px solid #eeeeee; padding-top: 4px; }
          .in-scope-badge { font-weight: bold; color: #2e7d32; }
          .out-scope-badge { font-weight: bold; color: #c62828; }
          .other-badge { font-weight: bold; color: #1565c0; }
          .project-details { background-color: #f4f6f8; border: 1px solid #dddddd; padding: 12px; margin-bottom: 20px; border-radius: 4px; }
          .project-details p { margin: 4px 0; font-size: 12px; color: #555555; }
          .project-details strong { color: #111111; }
        </style>
      </head>
      <body>
        <h1>Contract Scope Baseline Review Report</h1>
        <div class="project-details">
          <p><strong>Project Name:</strong> ${project?.project_name || "N/A"}</p>
          <p><strong>Start Date:</strong> ${formatDate(project?.start_date)}</p>
          <p><strong>End Date:</strong> ${formatDate(project?.end_date)}</p>
          <p><strong>Baseline Status:</strong> ${baseline.status}</p>
          <p><strong>Export Date:</strong> ${formatDate(new Date().toISOString())}</p>
        </div>
        <hr style="border: 0; border-top: 1px solid #dddddd; margin-bottom: 20px;" />
        
        <h2>In Scope Items (${inScopeItems.length})</h2>
        ${
          inScopeItems.length === 0
            ? "<p>No in-scope items identified.</p>"
            : inScopeItems
                .map(
                  (item: any) => `
          <div class="item-card">
            <div class="item-title">${item.scope_item_normalized || item.name}</div>
            <div class="item-desc"><strong>Original Text:</strong> "${item.name}"</div>
            <div class="item-desc"><strong>Reasoning:</strong> ${item.description}</div>
            ${item.evidence_text ? `<div class="evidence"><strong>Evidence:</strong> "${item.evidence_text}"</div>` : ""}
            <div class="meta">
              <span class="in-scope-badge">IN SCOPE</span> &bull; 
              <strong>Confidence:</strong> ${(item.confidence * 100).toFixed(0)}%
            </div>
          </div>
        `,
                )
                .join("")
        }

        <h2>Out of Scope Items (${outOfScopeItems.length})</h2>
        ${
          outOfScopeItems.length === 0
            ? "<p>No out-of-scope items identified.</p>"
            : outOfScopeItems
                .map(
                  (item: any) => `
          <div class="item-card">
            <div class="item-title">${item.scope_item_normalized || item.name}</div>
            <div class="item-desc"><strong>Original Text:</strong> "${item.name}"</div>
            <div class="item-desc"><strong>Reasoning:</strong> ${item.description}</div>
            ${item.evidence_text ? `<div class="evidence"><strong>Evidence:</strong> "${item.evidence_text}"</div>` : ""}
            <div class="meta">
              <span class="${item.scope_type === "OUT_OF_SCOPE" ? "out-scope-badge" : "other-badge"}">${item.scope_type}</span> &bull; 
              <strong>Confidence:</strong> ${(item.confidence * 100).toFixed(0)}%
            </div>
          </div>
        `,
                )
                .join("")
        }
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff" + content], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Project_${id}_Baseline_Review.doc`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showNotification("Exported to Word Document successfully!", "success");
  };

  const handleExportPDF = () => {
    if (!baseline) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      showNotification(
        "Pop-up blocked! Please allow pop-ups to export PDF.",
        "error",
      );
      return;
    }

    printWindow.document.write(`
      <html>
        <head>
          <title>Project_${id}_Baseline_Review_Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; }
            h1 { font-size: 26px; font-weight: bold; color: #111827; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-bottom: 8px; }
            .header-meta { font-size: 13px; color: #4b5563; margin-bottom: 30px; padding: 14px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; }
            .header-meta-row { display: flex; justify-content: space-between; margin-bottom: 8px; }
            .header-meta-row:last-child { margin-bottom: 0; }
            .header-meta-item { flex: 1; }
            h2 { font-size: 18px; font-weight: bold; color: #374151; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
            .column { display: flex; flex-direction: column; gap: 16px; }
            .item-card { border: 1px solid #e5e7eb; padding: 16px; border-radius: 8px; background-color: #f9fafb; page-break-inside: avoid; }
            .item-title { font-weight: bold; font-size: 15px; color: #111827; margin-bottom: 6px; }
            .item-desc { color: #4b5563; font-size: 13px; margin-bottom: 12px; }
            .evidence { font-style: italic; background-color: #f3f4f6; color: #374151; padding: 10px; border-left: 3px solid #2563eb; font-size: 11.5px; border-radius: 4px; margin-bottom: 12px; }
            .meta { display: flex; justify-content: space-between; font-size: 11.5px; color: #6b7280; border-top: 1px solid #f3f4f6; padding-top: 8px; }
            .badge-in { color: #059669; font-weight: 600; }
            .badge-out { color: #dc2626; font-weight: 600; }
            .badge-other { color: #2563eb; font-weight: 600; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <h1>Contract Scope Baseline Review Report</h1>
          <div class="header-meta">
            <div class="header-meta-row">
              <div class="header-meta-item"><strong>Project Name:</strong> ${project?.project_name || "N/A"}</div>
              <div class="header-meta-item" style="text-align: right;"><strong>Baseline Status:</strong> ${baseline.status}</div>
            </div>
            <div class="header-meta-row">
              <div class="header-meta-item">
                <strong>Start Date:</strong> ${formatDate(project?.start_date)}
                &nbsp;&bull;&nbsp;
                <strong>End Date:</strong> ${formatDate(project?.end_date)}
              </div>
              <div class="header-meta-item" style="text-align: right;"><strong>Export Date:</strong> ${formatDate(new Date().toISOString())}</div>
            </div>
          </div>
          
          <div class="grid">
            <div class="column">
              <h2>In Scope (${inScopeItems.length})</h2>
              ${
                inScopeItems.length === 0
                  ? '<p style="color: #9ca3af; font-style: italic; font-size: 13px;">No in-scope items identified.</p>'
                  : inScopeItems
                      .map(
                        (item: any) => `
                <div class="item-card">
                  <div class="item-title">${item.scope_item_normalized || item.name}</div>
                  <div class="item-desc"><strong>Original Text:</strong> "${item.name}"</div>
                  <div class="item-desc"><strong>Reasoning:</strong> ${item.description}</div>
                  ${item.evidence_text ? `<div class="evidence"><strong>Evidence:</strong> "${item.evidence_text}"</div>` : ""}
                  <div class="meta">
                    <span class="badge-in">IN SCOPE</span>
                    <span>Confidence: ${(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              `,
                      )
                      .join("")
              }
            </div>
            
            <div class="column">
              <h2>Out of Scope (${outOfScopeItems.length})</h2>
              ${
                outOfScopeItems.length === 0
                  ? '<p style="color: #9ca3af; font-style: italic; font-size: 13px;">No out-of-scope items identified.</p>'
                  : outOfScopeItems
                      .map(
                        (item: any) => `
                <div class="item-card">
                  <div class="item-title">${item.scope_item_normalized || item.name}</div>
                  <div class="item-desc"><strong>Original Text:</strong> "${item.name}"</div>
                  <div class="item-desc"><strong>Reasoning:</strong> ${item.description}</div>
                  ${item.evidence_text ? `<div class="evidence"><strong>Evidence:</strong> "${item.evidence_text}"</div>` : ""}
                  <div class="meta">
                    <span class="${item.scope_type === "OUT_OF_SCOPE" ? "badge-out" : "badge-other"}">${item.scope_type}</span>
                    <span>Confidence: ${(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              `,
                      )
                      .join("")
              }
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showNotification("Opened print view to export to PDF.", "success");
  };

  if (loading) return <Loader message="Loading contract scope baseline..." />;

  const inScopeItems =
    baseline?.scope_items?.filter(
      (item: any) =>
        item.scope_type === "IN_SCOPE" && item.category !== "MILESTONE",
    ) || [];
  const outOfScopeItems =
    baseline?.scope_items?.filter(
      (item: any) =>
        item.scope_type !== "IN_SCOPE" && item.category !== "MILESTONE",
    ) || [];

  // timelineItems is now computed via useMemo above the handlers

  const isBaselineExtracted = !!(
    baseline &&
    (inScopeItems.length > 0 ||
      outOfScopeItems.length > 0 ||
      (baseline.deliverables && baseline.deliverables.length > 0))
  );

  const renderBaselineProgressTimeline = () => {
    if (!evaluationProgress) return null;

    const overallProgress = evaluationProgress.progress || 0;
    const isFailed = evaluationProgress.status === "failed";
    const errorText = evaluationProgress.error;

    const getStepState = (index: number) => {
      const status = evaluationProgress.status;
      const currentStage = evaluationProgress.currentStage;
      const activeIndex = baselineSteps.findIndex(
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

    return (
      <div className="w-full bg-[#0b0e17]/90 border border-border-subtle rounded-3xl p-8 backdrop-blur-md shadow-2xl relative overflow-hidden max-w-4xl mx-auto my-8 animate-fade-in-up">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-cyan-500/10 blur-[60px]" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-purple-500/10 blur-[60px]" />

        {isFailed && (
          <button
            onClick={resetProgress}
            className="absolute top-4 right-4 p-2 bg-bg-card/50 hover:bg-bg-hover border border-border-subtle/50 hover:border-border-strong rounded-lg text-text-muted hover:text-text-primary transition-colors cursor-pointer z-50 flex items-center justify-center"
            title="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-subtle/60 pb-6 mb-8">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-text-primary flex items-center gap-2.5">
              {!isFailed && evaluationProgress.status !== "completed" && (
                <Loader2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-spin" />
              )}
              {evaluationProgress.status === "completed" && (
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              )}
              {isFailed && <AlertTriangle className="w-5 h-5 text-rose-500" />}
              <span>Baseline Scope Extraction in Progress...</span>
            </h2>
            <p className="text-text-muted text-xs mt-1">
              AI agents are analyzing and classifying contract scope sections
              and deliverables.
            </p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Elapsed Time
              </p>
              <p className="text-lg font-black text-text-primary font-mono">
                {elapsedTime}s
              </p>
            </div>
            <div className="h-8 w-px bg-bg-hover" />
            <div className="text-right">
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">
                Overall Progress
              </p>
              <p className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">
                {overallProgress}%
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-bg-base border border-border-subtle rounded-full overflow-hidden p-0.5 mb-8 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500 transition-all duration-500 ease-out shadow-[0_0_12px_rgba(6,182,212,0.4)]"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {isFailed && errorText && (
          <div className="mb-8 p-4 bg-rose-950/20 border border-rose-500/30 rounded-2xl flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold text-rose-600 dark:text-rose-300">
                Extraction Pipeline Error
              </h4>
              <p className="text-xs text-rose-200/80 mt-1 font-mono break-all">
                {errorText}
              </p>
            </div>
          </div>
        )}

        {/* Step-by-Step Vertical Timeline */}
        <div className="relative border-l border-border-subtle/80 ml-4 pl-8 space-y-6">
          {baselineSteps.map((step, idx) => {
            const state = getStepState(idx);

            let iconElement;
            let iconBgClass = "";
            let textClass = "text-text-muted";

            if (state === "completed") {
              iconElement = (
                <CheckCheck className="w-4 h-4 text-text-primary" />
              );
              iconBgClass =
                "bg-gradient-to-r from-emerald-500 to-teal-500 border-transparent scale-100";
              textClass = "text-text-primary";
            } else if (state === "running") {
              iconElement = (
                <Loader2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
              );
              iconBgClass =
                "bg-bg-base border-[#00e5ff] scale-110 shadow-lg shadow-cyan-500/10";
              textClass = "text-text-primary font-bold";
            } else if (state === "failed") {
              iconElement = <X className="w-4 h-4 text-text-primary" />;
              iconBgClass =
                "bg-red-600 shadow-lg shadow-rose-500/20 border-transparent scale-100";
              textClass = "text-rose-500 dark:text-rose-400 font-bold";
            } else {
              iconElement = <Circle className="w-3 h-3 text-gray-750" />;
              iconBgClass = "bg-bg-base border-border-subtle scale-90";
              textClass = "text-gray-600";
            }

            return (
              <div key={step.key} className="relative group">
                <div
                  className={`absolute -left-[41px] top-1 w-6 h-6 rounded-full border flex items-center justify-center transition-all duration-300 ${iconBgClass}`}
                >
                  {iconElement}
                </div>
                <div
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    state === "running"
                      ? "bg-bg-card/60 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                      : state === "completed"
                        ? "bg-bg-base border-border-subtle"
                        : "bg-bg-base border-border-subtle opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4
                      className={`text-sm font-semibold tracking-tight ${textClass}`}
                    >
                      {step.name}
                    </h4>
                    {state === "running" && (
                      <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20 animate-pulse">
                        Running...
                      </span>
                    )}
                    {state === "completed" && (
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        Done
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-muted mt-1">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        {/* Page header and action buttons */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4 items-center">
            <h1 className="text-3xl font-bold">Baseline Review</h1>
          </div>
          <div className="flex gap-4 items-center">
            {baseline && baseline.status && (
              <span
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${
                  baseline.status === "APPROVED"
                    ? "bg-emerald-100 dark:bg-green-600/20 border border-emerald-300 dark:border-green-500/40 text-emerald-800 dark:text-green-300 shadow-sm"
                    : "bg-amber-100 dark:bg-amber-600/20 border border-amber-300 dark:border-amber-500/40 text-amber-800 dark:text-amber-300 shadow-sm"
                }`}
              >
                Status: {baseline.status}
              </span>
            )}

            {user?.role !== "PROJECT_LEAD" &&
              project?.monitoring_status !== "CLOSED" && (
                <button
                  onClick={handleExtractClick}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-white transition-all duration-300 rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-400 hover:via-purple-400 hover:to-pink-400 shadow-[0_0_15px_rgba(168,85,247,0.4)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-pink-100 group-hover:animate-pulse" />
                  <span className="tracking-wide text-sm">
                    Extract Baseline
                  </span>
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20 pointer-events-none"></div>
                </button>
              )}
            {baseline &&
              baseline.status === "DRAFT" &&
              (user?.role === "ENGAGEMENT_MANAGER" || user?.role === "ADMIN") &&
              project?.monitoring_status !== "CLOSED" && (
                <button
                  type="button"
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 font-semibold text-text-primary transition-all duration-300 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600 hover:from-emerald-400 hover:via-teal-400 hover:to-green-500 shadow-[0_0_15px_rgba(16,185,129,0.4)] hover:shadow-[0_0_25px_rgba(20,184,166,0.6)] hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none cursor-pointer"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-100" />
                      <span className="tracking-wide text-sm">
                        Approving...
                      </span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-100 group-hover:scale-110 transition-transform" />
                      <span className="tracking-wide text-sm">
                        Approve Baseline
                      </span>
                    </>
                  )}
                  <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20 pointer-events-none"></div>
                </button>
              )}
          </div>
        </div>

        {/* Status display section */}
        {/* Status display section */}
        {isCurrentBaselineExtracting ? (
          renderBaselineProgressTimeline()
        ) : !isBaselineExtracted ? (
          <div className="text-center py-16 bg-amber-950/10 border border-amber-500/20 rounded-2xl animate-fade-in-up p-8 max-w-2xl mx-auto my-8">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-text-primary mb-2">
              No document is extracted please extract document for baseline
              review
            </h3>
          </div>
        ) : (
          <div>
            <div className="mb-8 border-b border-border-subtle"></div>


        <BaselineTimeline
          timelineItems={timelineItems}
          recurringGroups={recurringGroups}
          selectedDeliverableId={selectedDeliverableId}
          setSelectedDeliverableId={setSelectedDeliverableId}
          activeIndex={activeIndex}
          handlePrev={handlePrev}
          handleNext={handleNext}
          timelineContainerRef={timelineContainerRef}
          getMilestoneData={getMilestoneData}
          milestoneMap={milestoneMap}
          user={user}
          project={project}
          handleUpdateCompletionStatus={handleUpdateCompletionStatus}
          handleRescheduleDeadline={handleRescheduleDeadline}
          formatDate={formatDate}
        />

        <BaselineScopeItems
          user={user}
          project={project}
          baseline={baseline}
          showExportDropdown={showExportDropdown}
          setShowExportDropdown={setShowExportDropdown}
          handleExportWord={handleExportWord}
          handleExportPDF={handleExportPDF}
          getItemVersion={getItemVersion}
          formatDate={formatDate}
          setShowAddItemModal={setShowAddItemModal}
          setShowExtractModal={setShowExtractModal}
          inScopeItems={inScopeItems}
          outOfScopeItems={outOfScopeItems}
          setDeletingItemId={setDeletingItemId}
        />
            {/* Baseline Version History */}
            {versions && versions.length > 0 && (
              <div className="mt-16">
                <div className="mb-12 border-b border-border-subtle"></div>
                <h2 className="text-2xl font-bold mb-6">
                  Baseline Version History
                </h2>
                <div className="space-y-4">
                  {versions.map((ver) => {
                    const isExpanded = !!expandedVersions[ver.id];
                    const displayVersion = `Version ${ver.version} (v${ver.version})`;

                    // Filtering scope items for version history:
                    // If version === 1, show all items.
                    // If version > 1, show only items where source_document_id === ver.source_document_id.
                    const rawItems = (ver.scope_items || []).filter(
                      (i: any) => i.category !== "MILESTONE",
                    );
                    const filteredItems =
                      ver.version === 1
                        ? rawItems
                        : rawItems.filter(
                            (item: any) =>
                              item.source_document_id ===
                              ver.source_document_id,
                          );

                    const inScope = filteredItems.filter(
                      (i: any) =>
                        i.scope_type === "IN_SCOPE" &&
                        i.category !== "MILESTONE",
                    );
                    const outOfScope = filteredItems.filter(
                      (i: any) =>
                        i.scope_type === "OUT_OF_SCOPE" &&
                        i.category !== "MILESTONE",
                    );
                    const uncertain = filteredItems.filter(
                      (i: any) =>
                        i.scope_type === "UNCERTAIN" &&
                        i.category !== "MILESTONE",
                    );

                    const approvedDate = formatDate(ver.approved_at);
                    const createdDate = formatDate(ver.created_at);

                    return (
                      <div
                        key={ver.id}
                        className="border border-border-subtle rounded-xl bg-bg-card/30 backdrop-blur-md overflow-hidden transition-all duration-300"
                      >
                        {/* Header */}
                        <button
                          onClick={() =>
                            setExpandedVersions((prev) => ({
                              ...prev,
                              [ver.id]: !isExpanded,
                            }))
                          }
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-bg-hover transition-colors cursor-pointer select-none"
                        >
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-lg font-bold text-text-primary">
                              {displayVersion}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-bold shadow-xs ${
                                ver.status === "APPROVED"
                                  ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-500/20"
                                  : ver.status === "SUPERSEDED"
                                    ? "bg-gray-100 dark:bg-gray-500/10 text-gray-700 dark:text-text-muted border border-gray-300 dark:border-gray-500/20"
                                    : "bg-amber-100 dark:bg-amber-500/10 text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20"
                              }`}
                            >
                              {ver.status}
                            </span>
                            {ver.document_name && (
                              <span className="text-xs text-cyan-600 dark:text-cyan-400 font-medium">
                                Doc: {ver.document_name}
                              </span>
                            )}
                            <span className="text-xs text-text-muted">
                              {ver.status === "APPROVED"
                                ? `Approved on: ${approvedDate}`
                                : `Created on: ${createdDate}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-text-muted font-semibold bg-bg-hover px-2.5 py-1 rounded-full">
                              {filteredItems.length}{" "}
                              {filteredItems.length === 1 ? "item" : "items"}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 border-t border-border-subtle animate-fadeIn bg-bg-base">
                            {filteredItems.length === 0 ? (
                              <p className="text-text-muted text-sm py-4 italic text-center">
                                No scope items found for this baseline version.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                {/* In Scope */}
                                <div className="bg-bg-card/40 p-5 rounded-lg border border-border-subtle/80">
                                  <h4 className="text-sm font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                                    In Scope ({inScope.length})
                                  </h4>
                                  {inScope.length === 0 ? (
                                    <p className="text-gray-600 text-xs italic">
                                      No in-scope items.
                                    </p>
                                  ) : (
                                    <div className="space-y-3">
                                      {inScope.map((item: any) => (
                                        <div
                                          key={item.id}
                                          className="p-3 bg-bg-hover rounded-lg border border-border-subtle/50 flex flex-col justify-between gap-2"
                                        >
                                          <div>
                                            <p className="text-xs font-semibold text-text-primary">
                                              {item.scope_item_normalized ||
                                                item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">
                                                  ▶
                                                </span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Reasoning
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.description}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Evidence
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.evidence_text}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.name &&
                                                  item.scope_item_normalized && (
                                                    <div>
                                                      <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                        Original
                                                      </h5>
                                                      <p className="text-[11px] text-text-muted font-serif italic">
                                                        {item.name}
                                                      </p>
                                                    </div>
                                                  )}
                                              </div>
                                            </details>
                                          </div>
                                          {item.deadline && (
                                            <div className="text-[10px] text-purple-700 dark:text-purple-300 font-semibold bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800/20 w-fit flex items-center gap-1 mt-1 shadow-xs">
                                              <Clock className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                                              {formatDate(item.deadline)}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                {/* Out of Scope & Uncertain */}
                                <div className="space-y-6">
                                  {/* Out of Scope */}
                                  <div className="bg-bg-card/40 p-5 rounded-lg border border-border-subtle/80">
                                    <h4 className="text-sm font-bold text-rose-800 dark:text-rose-400 uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                                      Out of Scope ({outOfScope.length})
                                    </h4>
                                    {outOfScope.length === 0 ? (
                                      <p className="text-gray-600 text-xs italic">
                                        No out-of-scope items.
                                      </p>
                                    ) : (
                                      <div className="space-y-3">
                                        {outOfScope.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="p-3 bg-bg-hover rounded-lg border border-border-subtle/50"
                                          >
                                            <p className="text-xs font-semibold text-text-primary">
                                              {item.scope_item_normalized ||
                                                item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">
                                                  ▶
                                                </span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Reasoning
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.description}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Evidence
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.evidence_text}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.name &&
                                                  item.scope_item_normalized && (
                                                    <div>
                                                      <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                        Original
                                                      </h5>
                                                      <p className="text-[11px] text-text-muted font-serif italic">
                                                        {item.name}
                                                      </p>
                                                    </div>
                                                  )}
                                              </div>
                                            </details>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  {/* Uncertain */}
                                  {uncertain.length > 0 && (
                                    <div className="bg-bg-card/40 p-5 rounded-lg border border-border-subtle/80">
                                      <h4 className="text-sm font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-4 border-b border-border-subtle pb-2">
                                        Uncertain ({uncertain.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {uncertain.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="p-3 bg-bg-hover rounded-lg border border-border-subtle/50"
                                          >
                                            <p className="text-xs font-semibold text-text-primary">
                                              {item.scope_item_normalized ||
                                                item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-text-muted uppercase tracking-wider hover:text-text-secondary transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">
                                                  ▶
                                                </span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Reasoning
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.description}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                      Evidence
                                                    </h5>
                                                    <p className="text-[11px] text-text-muted italic">
                                                      {item.evidence_text}
                                                    </p>
                                                  </div>
                                                )}
                                                {item.name &&
                                                  item.scope_item_normalized && (
                                                    <div>
                                                      <h5 className="text-[9px] font-bold text-text-muted uppercase tracking-wider">
                                                        Original
                                                      </h5>
                                                      <p className="text-[11px] text-text-muted font-serif italic">
                                                        {item.name}
                                                      </p>
                                                    </div>
                                                  )}
                                              </div>
                                            </details>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {showExtractModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-[#111827] border border-border-strong rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-2 text-text-primary">
                Select Contract for Baseline
              </h2>
              <p className="text-text-muted text-sm mb-6">
                Choose a processed contract to extract scope items or budget
                details into your baseline.
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

        <BaselineModals
          showExtractModal={showExtractModal}
          setShowExtractModal={setShowExtractModal}
          extracting={extracting}
          extractingDocId={extractingDocId}
          setExtractingDocId={setExtractingDocId}
          eligibleDocs={eligibleDocs}
          confirmExtractAll={confirmExtractAll}
          completedDocIds={completedDocIds}
          selectedDocIds={selectedDocIds}
          toggleDocSelection={toggleDocSelection}
          extractionMode={extractionMode}
          setExtractionMode={setExtractionMode}
          showAddItemModal={showAddItemModal}
          setShowAddItemModal={setShowAddItemModal}
          handleAddItem={handleAddItem}
          newItemScopeType={newItemScopeType}
          setNewItemScopeType={setNewItemScopeType}
          newItemName={newItemName}
          setNewItemName={setNewItemName}
          newItemDescription={newItemDescription}
          setNewItemDescription={setNewItemDescription}
          newItemEvidence={newItemEvidence}
          setNewItemEvidence={setNewItemEvidence}
          addingItem={addingItem}
          deletingItemId={deletingItemId}
          setDeletingItemId={setDeletingItemId}
          handleDeleteItem={handleDeleteItem}
          deletingItem={deletingItem}
        />

        {notification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#111827] border border-border-strong rounded-2xl p-4 shadow-2xl flex gap-3 animate-slideIn select-none">
            <div className="flex-1">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  notification.type === "success"
                    ? "text-emerald-400"
                    : notification.type === "error"
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-cyan-600 dark:text-cyan-400"
                }`}
              >
                {notification.type === "success"
                  ? "Success"
                  : notification.type === "error"
                    ? "Error"
                    : "Notice"}
              </p>
              <p className="text-sm text-text-primary">
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-text-muted hover:text-text-primary transition-colors text-lg font-bold self-start leading-none"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
