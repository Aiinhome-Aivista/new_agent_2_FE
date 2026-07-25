import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { Loader } from "../components/Loader";

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
  Circle,
  Calendar,
  MapPin,
} from "lucide-react";

export const BaselineReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [baseline, setBaseline] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<any[]>([]);
  const [expandedVersions, setExpandedVersions] = useState<
    Record<number, boolean>
  >({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [baselineRes, projectRes, versionsRes] = await Promise.all([
          apiClient.get(`/projects/${id}/baseline/`),
          apiClient.get(`/projects/${id}`),
          apiClient.get(`/projects/${id}/baseline/versions`),
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

  // Compute timelineItems early so handlers can reference it
  const timelineItems = React.useMemo(() => {
    return (baseline?.scope_items || [])
      .filter((item: any) => item.deadline || item.milestone)
      .sort((a: any, b: any) => {
        if (!a.deadline) return 1;
        if (!b.deadline) return -1;
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      });
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

  const activeIndex =
    timelineItems.findIndex(
      (d: any) => d.id === selectedDeliverableId,
    ) ?? -1;

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

  const toggleDocSelection = (docId: number) => {
    setSelectedDocIds((prev) =>
      prev.includes(docId)
        ? prev.filter((id) => id !== docId)
        : [...prev, docId],
    );
  };

  const [isApproving, setIsApproving] = useState(false);

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const res = await apiClient.post(`/projects/${id}/baseline/approve`);
      if (res.data.success) {
        showNotification("Baseline Approved!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
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
        `/projects/${id}/baseline/items`,
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
          apiClient.get(`/projects/${id}/baseline/`),
          apiClient.get(`/projects/${id}/baseline/versions`),
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
        `/projects/${id}/baseline/items/${itemId}`,
      );
      if (res.data.success) {
        showNotification("Scope item deleted successfully!", "success");
        setDeletingItemId(null);

        const [baselineRes, versionsRes] = await Promise.all([
          apiClient.get(`/projects/${id}/baseline/`),
          apiClient.get(`/projects/${id}/baseline/versions`),
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
        `/projects/${id}/baseline/items/${itemId}/completion`,
        { completion_status: newStatus },
      );
      if (res.data.success) {
        showNotification(res.data.message, "success");
        const baselineRes = await apiClient.get(`/projects/${id}/baseline/`);
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

  const handleExtractClick = async () => {
    try {
      const res = await apiClient.get(`/projects/${id}/documents/`);
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
        setSelectedDocIds(contracts.map((d: any) => d.id));
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
          `/projects/${id}/baseline/extract?document_id=${doc.id}`,
        );
        setCompletedDocIds((prev) => [...prev, doc.id]);
      }

      // Fetch baseline data in the background to update page
      const [baselineRes, versionsRes] = await Promise.all([
        apiClient.get(`/projects/${id}/baseline/`),
        apiClient.get(`/projects/${id}/baseline/versions`),
      ]);
      if (baselineRes.data.success) {
        setBaseline(baselineRes.data.data);
      }
      if (versionsRes.data.success) {
        setVersions(versionsRes.data.data);
      }
      setShowExtractModal(false);
      showNotification(
        "Baseline extraction completed successfully!",
        "success",
      );
    } catch (error: any) {
      showNotification(
        "Extraction failed: " +
          (error.response?.data?.detail || "Server error"),
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
      (item: any) => item.scope_type === "IN_SCOPE",
    ) || [];
  const outOfScopeItems =
    baseline?.scope_items?.filter(
      (item: any) => item.scope_type !== "IN_SCOPE",
    ) || [];

  // timelineItems is now computed via useMemo above the handlers

  const isBaselineExtracted = !!(
    baseline &&
    (inScopeItems.length > 0 ||
      outOfScopeItems.length > 0 ||
      (baseline.deliverables && baseline.deliverables.length > 0))
  );

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
                    ? "bg-green-600/20 border border-green-500/40 text-green-300"
                    : "bg-amber-600/20 border border-amber-500/40 text-amber-300"
                }`}
              >
                Status: {baseline.status}
              </span>
            )}

            {user?.role !== "PROJECT_LEAD" && (
              <button
                onClick={handleExtractClick}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md"
              >
                Extract Baseline
              </button>
            )}
            {baseline &&
              baseline.status === "DRAFT" &&
              (user?.role === "ENGAGEMENT_MANAGER" ||
                user?.role === "ADMIN") && (
                <button
                  onClick={handleApprove}
                  disabled={isApproving}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-800 disabled:opacity-70 rounded-md flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed transition-colors"
                >
                  {isApproving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    "Approve Baseline"
                  )}
                </button>
              )}
          </div>
        </div>

        {/* Status display section */}
        {!isBaselineExtracted ? (
          <div className="text-center py-16 bg-amber-950/10 border border-amber-500/20 rounded-2xl animate-fade-in-up p-8 max-w-2xl mx-auto my-8">
            <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">
              No document is extracted please extract document for baseline
              review
            </h3>
          </div>
        ) : (
          <div>
            <div className="mb-8 border-b border-gray-800"></div>

            {/* Deliverables timeline */}
            <div className="mb-8">
              {/* Section Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-400 to-violet-500"></div>
                <h2 className="text-xl font-bold tracking-tight">Deliverables Timeline</h2>
                <span className="ml-auto text-xs font-medium text-gray-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date().toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })}
                </span>
              </div>

              {timelineItems.length === 0 ? (
                <p className="text-gray-400 mb-8">
                  No scheduled scope items found.
                </p>
              ) : (() => {
                /* ── Colour palette for deliverables ── */
                const palette = [
                  { bg: "rgba(6,182,212,0.12)",  border: "#06b6d4", text: "#67e8f9", dot: "#06b6d4", glow: "rgba(6,182,212,0.3)" },
                  { bg: "rgba(139,92,246,0.12)", border: "#8b5cf6", text: "#c4b5fd", dot: "#8b5cf6", glow: "rgba(139,92,246,0.3)" },
                  { bg: "rgba(245,158,11,0.12)", border: "#f59e0b", text: "#fcd34d", dot: "#f59e0b", glow: "rgba(245,158,11,0.3)" },
                  { bg: "rgba(244,63,94,0.12)",  border: "#f43f5e", text: "#fda4af", dot: "#f43f5e", glow: "rgba(244,63,94,0.3)" },
                  { bg: "rgba(16,185,129,0.12)", border: "#10b981", text: "#6ee7b7", dot: "#10b981", glow: "rgba(16,185,129,0.3)" },
                  { bg: "rgba(99,102,241,0.12)", border: "#6366f1", text: "#a5b4fc", dot: "#6366f1", glow: "rgba(99,102,241,0.3)" },
                  { bg: "rgba(217,70,239,0.12)", border: "#d946ef", text: "#f0abfc", dot: "#d946ef", glow: "rgba(217,70,239,0.3)" },
                  { bg: "rgba(20,184,166,0.12)", border: "#14b8a6", text: "#5eead4", dot: "#14b8a6", glow: "rgba(20,184,166,0.3)" },
                ];

                /* ── Parse dates & compute timeline bounds ── */
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayMs = today.getTime();

                const parsedItems = timelineItems.map((item: any, idx: number) => {
                  const raw = item.deadline || item.deadline_text || null;
                  let dateMs: number | null = null;
                  if (raw) {
                    const d = new Date(typeof raw === "string" ? raw.replace(" ", "T") : raw);
                    if (!isNaN(d.getTime())) {
                      d.setHours(0, 0, 0, 0);
                      dateMs = d.getTime();
                    }
                  }
                  return { ...item, _dateMs: dateMs, _idx: idx, _color: palette[idx % palette.length] };
                });

                const datedItems = parsedItems.filter((i: any) => i._dateMs !== null);
                const hasDates = datedItems.length >= 1;

                let minMs = todayMs;
                let maxMs = todayMs;
                if (hasDates) {
                  const allMs = [...datedItems.map((i: any) => i._dateMs as number), todayMs];
                  minMs = Math.min(...allMs);
                  maxMs = Math.max(...allMs);
                  // Add padding on each side so edge items aren't clipped
                  const range = maxMs - minMs || 86400000 * 30;
                  minMs -= range * 0.08;
                  maxMs += range * 0.08;
                }

                const totalRange = maxMs - minMs || 1;
                const toPercent = (ms: number) => Math.max(2, Math.min(98, ((ms - minMs) / totalRange) * 100));
                const todayPct = hasDates ? toPercent(todayMs) : -1;

                /* ── Generate month tick marks ── */
                const monthTicks: { pct: number; label: string }[] = [];
                if (hasDates) {
                  const startDate = new Date(minMs);
                  const endDate = new Date(maxMs);
                  const cur = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
                  while (cur <= endDate) {
                    const pct = ((cur.getTime() - minMs) / totalRange) * 100;
                    if (pct >= 0 && pct <= 100) {
                      monthTicks.push({
                        pct,
                        label: cur.toLocaleDateString(undefined, { month: "short", year: "2-digit" }),
                      });
                    }
                    cur.setMonth(cur.getMonth() + 1);
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
                    const d = new Date(typeof raw === "string" ? raw.replace(" ", "T") : raw);
                    if (isNaN(d.getTime())) return raw;
                    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
                  } catch { return raw; }
                };

                const isPast = (item: any) => item._dateMs !== null && item._dateMs < todayMs;

                const selectedItem = parsedItems.find((d: any) => d.id === selectedDeliverableId) || parsedItems[0];

                /* ── Determine alternating above/below positions ── */
                const sortedByPosition = [...parsedItems].sort((a: any, b: any) => getLeftPct(a, a._idx) - getLeftPct(b, b._idx));
                const positionMap = new Map<number, boolean>();
                sortedByPosition.forEach((item: any, i: number) => {
                  positionMap.set(item.id, i % 2 === 0); // true = above, false = below
                });

                /* ── Track midpoint Y for consistent reference ── */
                const TRACK_Y = 120;
                const ABOVE_LABEL_TOP = 16;
                const BELOW_LABEL_START = TRACK_Y + 8;

                return (
                  <div>
                    {/* ── Navigation row ── */}
                    <div className="flex items-center gap-3 mb-3">
                      <button
                        onClick={handlePrev}
                        disabled={activeIndex <= 0}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-900/80 border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer z-10 shadow-md backdrop-blur-sm"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <div className="flex-1 flex items-center justify-center">
                        <span className="text-[11px] text-gray-500 tracking-wide">
                          {activeIndex + 1} of {timelineItems.length} deliverables
                        </span>
                      </div>
                      <button
                        onClick={handleNext}
                        disabled={activeIndex >= timelineItems.length - 1}
                        className="flex-shrink-0 w-9 h-9 rounded-full bg-gray-900/80 border border-gray-700/60 text-gray-400 hover:text-white hover:bg-gray-800 hover:border-gray-600 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-all cursor-pointer z-10 shadow-md backdrop-blur-sm"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                    {/* ── Timeline Canvas ── */}
                    <div className="relative rounded-2xl border border-gray-800/60 bg-gradient-to-br from-gray-900/60 via-gray-950/80 to-gray-900/60 backdrop-blur-sm overflow-visible">
                      {/* Subtle grid background pattern */}
                      <div className="absolute inset-0 rounded-2xl overflow-hidden opacity-[0.03]" style={{
                        backgroundImage: "radial-gradient(circle, #fff 1px, transparent 1px)",
                        backgroundSize: "24px 24px"
                      }}></div>

                      {/* Responsive track container — no horizontal scroll, uses % positioning */}
                      <div
                        ref={timelineContainerRef}
                        className="relative w-full"
                        style={{ height: "260px", padding: "0 16px" }}
                      >

                        {/* ── Month tick marks ── */}
                        {monthTicks.map((tick, i) => (
                          <div key={`tick-${i}`} className="absolute flex flex-col items-center pointer-events-none" style={{ left: `${tick.pct}%`, top: "10px", bottom: "40px" }}>
                            <span className="text-[9px] text-gray-600 font-medium tracking-wider uppercase whitespace-nowrap" style={{ transform: "translateX(-50%)" }}>
                              {tick.label}
                            </span>
                            <div className="w-px flex-1 bg-gray-800/40 mt-1"></div>
                          </div>
                        ))}

                        {/* ── Main track line ── */}
                        <div
                          className="absolute h-[3px] rounded-full timeline-track-shimmer"
                          style={{ top: `${TRACK_Y}px`, left: "16px", right: "16px" }}
                        ></div>

                        {/* ── Gradient overlay on track (past = colored, future = dim) ── */}
                        {hasDates && todayPct >= 0 && todayPct <= 100 && (
                          <div
                            className="absolute h-[3px] rounded-l-full"
                            style={{
                              top: `${TRACK_Y}px`,
                              left: "16px",
                              width: `calc(${todayPct}% - 16px)`,
                              background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)",
                              opacity: 0.6,
                            }}
                          ></div>
                        )}

                        {/* ── TODAY marker ── */}
                        {hasDates && todayPct >= 0 && todayPct <= 100 && (
                          <div className="absolute flex flex-col items-center z-30 pointer-events-none" style={{ left: `${todayPct}%`, top: `${TRACK_Y - 46}px`, transform: "translateX(-50%)" }}>
                            {/* Label */}
                            <div className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest bg-orange-500/20 text-orange-300 border border-orange-500/40 shadow-lg whitespace-nowrap"
                              style={{ animation: "todayPulse 2s ease-in-out infinite" }}>
                              ● Today
                            </div>
                            {/* Vertical line from label down through track and below */}
                            <div className="w-0.5 bg-orange-400/60 rounded-full mt-1" style={{ height: `${46 + 50}px`, animation: "todayLinePulse 2s ease-in-out infinite" }}></div>
                            {/* Date below */}
                            <span className="text-[9px] text-orange-400/70 mt-0.5 whitespace-nowrap font-medium">
                              {today.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                            </span>
                          </div>
                        )}

                        {/* ── Deliverable Nodes ── */}
                        {parsedItems.map((item: any, idx: number) => {
                          const isSelected = selectedDeliverableId === item.id;
                          const leftPct = getLeftPct(item, idx);
                          const color = item._color;
                          const isAbove = positionMap.get(item.id) ?? true;
                          const dateStr = formatItemDate(item);
                          const past = isPast(item);
                          const completionStatus = item.completion_status || "ACTIVE";
                          const isCompleted = completionStatus === "COMPLETED";
                          const isCancelled = completionStatus === "CANCELLED";

                          return (
                            <div
                              key={item.id}
                              data-active={isSelected}
                              className="absolute flex flex-col items-center cursor-pointer group"
                              style={{
                                left: `${leftPct}%`,
                                top: isAbove ? `${ABOVE_LABEL_TOP}px` : `${TRACK_Y - 6}px`,
                                transform: "translateX(-50%)",
                                zIndex: isSelected ? 20 : 10,
                              }}
                              onClick={() => setSelectedDeliverableId(item.id)}
                            >
                              {isAbove ? (
                                <>
                                  {/* Date label */}
                                  <div
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-md transition-all duration-300 border whitespace-nowrap max-w-[110px] truncate text-center"
                                    style={isSelected ? {
                                      borderColor: color.border,
                                      backgroundColor: color.bg,
                                      color: color.text,
                                      boxShadow: `0 2px 12px ${color.glow}`,
                                    } : {
                                      borderColor: "rgba(55,65,81,0.5)",
                                      backgroundColor: "rgba(17,24,39,0.85)",
                                      color: "#9ca3af",
                                    }}
                                    title={dateStr}
                                  >
                                    {dateStr}
                                  </div>
                                  {/* Name */}
                                  <span
                                    className={`text-[9px] mt-0.5 max-w-[100px] truncate text-center leading-tight transition-colors ${
                                      isSelected ? "font-semibold" : "text-gray-600 group-hover:text-gray-400"
                                    }`}
                                    style={isSelected ? { color: color.text } : {}}
                                    title={item.scope_item_normalized || item.name}
                                  >
                                    {item.scope_item_normalized || item.name}
                                  </span>
                                  {/* Connector line down to track */}
                                  <div className="w-px transition-colors duration-300" style={{ height: `${TRACK_Y - ABOVE_LABEL_TOP - 40}px`, backgroundColor: isSelected ? color.border : "#374151", minHeight: "12px" }}></div>
                                  {/* Node dot on the track */}
                                  <div
                                    className={`relative w-[14px] h-[14px] rounded-full timeline-node-enter transition-all duration-300 flex-shrink-0 ${
                                      isSelected ? "scale-[1.4]" : "group-hover:scale-125"
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? color.dot : (past ? color.dot : "#4b5563"),
                                      boxShadow: isSelected ? `0 0 10px ${color.glow}, 0 0 20px ${color.glow}` : "none",
                                      opacity: isCompleted ? 0.5 : isCancelled ? 0.3 : 1,
                                      animationDelay: `${idx * 60}ms`,
                                    }}
                                  >
                                    {isCompleted && (
                                      <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-emerald-400" style={{ filter: "drop-shadow(0 0 2px rgba(16,185,129,0.5))" }} />
                                    )}
                                    {isSelected && (
                                      <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color.dot, opacity: 0.25 }}></span>
                                    )}
                                  </div>
                                </>
                              ) : (
                                <>
                                  {/* Node dot on the track */}
                                  <div
                                    className={`relative w-[14px] h-[14px] rounded-full timeline-node-enter transition-all duration-300 flex-shrink-0 ${
                                      isSelected ? "scale-[1.4]" : "group-hover:scale-125"
                                    }`}
                                    style={{
                                      backgroundColor: isSelected ? color.dot : (past ? color.dot : "#4b5563"),
                                      boxShadow: isSelected ? `0 0 10px ${color.glow}, 0 0 20px ${color.glow}` : "none",
                                      opacity: isCompleted ? 0.5 : isCancelled ? 0.3 : 1,
                                      animationDelay: `${idx * 60}ms`,
                                    }}
                                  >
                                    {isCompleted && (
                                      <CheckCircle2 className="absolute -top-1 -right-1 w-3 h-3 text-emerald-400" style={{ filter: "drop-shadow(0 0 2px rgba(16,185,129,0.5))" }} />
                                    )}
                                    {isSelected && (
                                      <span className="absolute inset-0 rounded-full animate-ping" style={{ backgroundColor: color.dot, opacity: 0.25 }}></span>
                                    )}
                                  </div>
                                  {/* Connector line down from track */}
                                  <div className="w-px transition-colors duration-300" style={{ height: "16px", backgroundColor: isSelected ? color.border : "#374151" }}></div>
                                  {/* Date label */}
                                  <div
                                    className="px-2 py-0.5 rounded-md text-[10px] font-semibold shadow-md transition-all duration-300 border whitespace-nowrap max-w-[110px] truncate text-center"
                                    style={isSelected ? {
                                      borderColor: color.border,
                                      backgroundColor: color.bg,
                                      color: color.text,
                                      boxShadow: `0 2px 12px ${color.glow}`,
                                    } : {
                                      borderColor: "rgba(55,65,81,0.5)",
                                      backgroundColor: "rgba(17,24,39,0.85)",
                                      color: "#9ca3af",
                                    }}
                                    title={dateStr}
                                  >
                                    {dateStr}
                                  </div>
                                  {/* Name */}
                                  <span
                                    className={`text-[9px] mt-0.5 max-w-[100px] truncate text-center leading-tight transition-colors ${
                                      isSelected ? "font-semibold" : "text-gray-600 group-hover:text-gray-400"
                                    }`}
                                    style={isSelected ? { color: color.text } : {}}
                                    title={item.scope_item_normalized || item.name}
                                  >
                                    {item.scope_item_normalized || item.name}
                                  </span>
                                </>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* ── Legend ── */}
                      <div className="flex items-center gap-4 px-5 py-3 border-t border-gray-800/40 flex-wrap">
                        {hasDates && (
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-orange-400" style={{ animation: "todayPulse 2s ease-in-out infinite" }}></div>
                            <span className="text-[10px] text-gray-500">Today</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-0.5 rounded-full" style={{ background: "linear-gradient(90deg, #06b6d4, #8b5cf6, #f59e0b)" }}></div>
                          <span className="text-[10px] text-gray-500">Past</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-0.5 rounded-full bg-gray-700"></div>
                          <span className="text-[10px] text-gray-500">Future</span>
                        </div>
                        {parsedItems.some((i: any) => (i.completion_status || "ACTIVE") === "COMPLETED") && (
                          <div className="flex items-center gap-1.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-[10px] text-gray-500">Completed</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* ── Selected Item Detail Card ── */}
                    {selectedItem && (() => {
                      const color = selectedItem._color;
                      const completionStatus = selectedItem.completion_status || "ACTIVE";

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
                          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl" style={{
                            background: `linear-gradient(90deg, ${color.dot}, transparent)`,
                          }}></div>

                          <div className="p-5">
                            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color.dot }}></span>
                                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: color.text }}>
                                    Selected Deliverable
                                  </span>
                                </div>
                                <h3 className="font-bold text-lg text-white mt-0.5 leading-snug">
                                  {selectedItem.scope_item_normalized || selectedItem.name}
                                </h3>
                                
                                <details className="mt-3 group cursor-pointer">
                                  <summary className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors list-none flex items-center">
                                    <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">▶</span>
                                    AI Extraction Details
                                  </summary>
                                  <div className="mt-3 space-y-3 p-3 bg-gray-900/60 rounded-lg border border-gray-700/40">
                                    {selectedItem.description && (
                                      <div>
                                        <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">AI Reasoning</h5>
                                        <p className="text-xs text-gray-300 italic leading-relaxed">{selectedItem.description}</p>
                                      </div>
                                    )}
                                    {selectedItem.evidence_text && (
                                      <div>
                                        <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Evidence</h5>
                                        <p className="text-xs text-gray-300 italic leading-relaxed">{selectedItem.evidence_text}</p>
                                      </div>
                                    )}
                                    {(selectedItem.name && selectedItem.scope_item_normalized) && (
                                      <div>
                                        <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Original Text</h5>
                                        <p className="text-xs text-gray-300 font-serif italic">{selectedItem.name}</p>
                                      </div>
                                    )}
                                  </div>
                                </details>
                              </div>

                              {/* Status indicator */}
                              <div className="flex-shrink-0">
                                <div className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border ${
                                  completionStatus === "COMPLETED"
                                    ? "bg-emerald-950/40 text-emerald-300 border-emerald-700/40"
                                    : completionStatus === "CANCELLED"
                                    ? "bg-red-950/40 text-red-300 border-red-700/40"
                                    : "bg-gray-800/60 text-gray-300 border-gray-700/40"
                                }`}>
                                  {completionStatus === "COMPLETED" && <CheckCircle2 className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                                  {completionStatus === "CANCELLED" && <X className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                                  {completionStatus === "ACTIVE" && <Clock className="w-3 h-3 inline mr-1.5 -mt-0.5" />}
                                  {completionStatus.replace("_", " ")}
                                </div>
                              </div>
                            </div>

                            {/* Meta badges */}
                            <div className="flex flex-wrap gap-2 mt-3">
                              {(selectedItem.milestone_normalized || selectedItem.milestone) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-950/30 text-blue-300 border border-blue-800/25 shadow-sm">
                                  <MapPin className="w-3 h-3" />
                                  {selectedItem.milestone_normalized || selectedItem.milestone}
                                </span>
                              )}
                              {(selectedItem.deadline_text || selectedItem.deadline) && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border shadow-sm" style={{
                                  backgroundColor: `${color.bg}`,
                                  borderColor: `${color.border}30`,
                                  color: color.text,
                                }}>
                                  <Calendar className="w-3 h-3" />
                                  {formatItemDate(selectedItem)}
                                </span>
                              )}
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-gray-800/50 border border-gray-700/40 text-gray-400 text-xs font-medium">
                                {selectedItem.scope_type?.replace("_", " ") || "Scope Item"}
                              </span>
                              {selectedItem._dateMs !== null && (
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium border ${
                                  selectedItem._dateMs < todayMs
                                    ? "bg-red-950/20 text-red-300/80 border-red-800/20"
                                    : selectedItem._dateMs === todayMs
                                    ? "bg-orange-950/20 text-orange-300/80 border-orange-800/20"
                                    : "bg-green-950/20 text-green-300/80 border-green-800/20"
                                }`}>
                                  {selectedItem._dateMs < todayMs ? "⏰ Overdue" : selectedItem._dateMs === todayMs ? "📍 Due Today" : `📅 ${Math.ceil((selectedItem._dateMs - todayMs) / 86400000)} days left`}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                );
              })()}
            </div>
            <div className="mb-12 border-b border-gray-800"></div>

            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Scope Items Baseline</h2>
              <div className="flex items-center gap-3">
                {(user?.role === "ADMIN" ||
                  user?.role === "ENGAGEMENT_MANAGER") && (
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
                      className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 hover:border-gray-600 rounded-md flex items-center gap-2 cursor-pointer transition-colors"
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
                        <div className="absolute right-0 mt-2 w-48 bg-gray-900 border border-gray-700 rounded-lg shadow-xl py-1 z-25 animate-fadeIn">
                          <button
                            onClick={() => {
                              handleExportWord();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-blue-400" />
                            <span>Word Document (.doc)</span>
                          </button>
                          <button
                            onClick={() => {
                              handleExportPDF();
                              setShowExportDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2.5 text-sm text-gray-200 hover:bg-gray-800 hover:text-white transition-colors flex items-center gap-2.5 cursor-pointer"
                          >
                            <FileText className="w-4 h-4 text-rose-400" />
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
              <div className="flex flex-col bg-gray-900/30 backdrop-blur-md rounded-2xl p-6 border border-gray-800/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
                    </span>
                    <h3 className="text-lg font-bold text-gray-100 tracking-tight">
                      In Scope
                    </h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-emerald-500/10 text-emerald-400 rounded-full border border-emerald-500/20 shadow-sm">
                    {inScopeItems.length}{" "}
                    {inScopeItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {inScopeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-gray-850 rounded-xl bg-gray-850/10">
                    <p className="text-gray-500 text-sm">
                      No in-scope items identified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                    {inScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-gray-800/60 hover:bg-gray-800/90 rounded-xl border border-gray-700/60 hover:border-emerald-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors flex items-center gap-2">
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
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/30">
                                    {versionLabel}
                                  </span>
                                );
                              })()}
                              {(user?.role === "ADMIN" ||
                                user?.role === "ENGAGEMENT_MANAGER") && (
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
                            <summary className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors list-none flex items-center">
                              <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">▶</span>
                              AI Extraction Details
                            </summary>
                            <div className="mt-3 space-y-3 p-3 bg-gray-900/60 rounded-lg border border-gray-700/40">
                              {item.description && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">AI Reasoning</h5>
                                  <p className="text-xs text-gray-300 italic leading-relaxed">{item.description}</p>
                                </div>
                              )}
                              {item.evidence_text && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Evidence</h5>
                                  <p className="text-xs text-gray-300 italic leading-relaxed">{item.evidence_text}</p>
                                </div>
                              )}
                              {(item.name && item.scope_item_normalized) && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Original Text</h5>
                                  <p className="text-xs text-gray-300 font-serif italic">{item.name}</p>
                                </div>
                              )}
                            </div>
                          </details>

                          {item.status_change_tag && (
                            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {item.status_change_tag}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-700/20">
                          {/* Milestone & Deadline Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.milestone && (
                              <span className="text-blue-300 font-semibold bg-blue-950/45 px-2 py-0.5 rounded border border-blue-800/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                {item.milestone}
                              </span>
                            )}
                            {item.deadline_text && (
                              <span
                                className="text-purple-300 font-semibold bg-purple-950/45 px-2 py-0.5 rounded border border-purple-800/30 flex items-center gap-1"
                                title={
                                  item.deadline
                                    ? formatDate(item.deadline)
                                    : "Unnormalized"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {item.deadline_text}
                              </span>
                            )}
                            {item.extraction_method && (
                              <span className="text-gray-400 font-medium text-[10px] bg-gray-800 px-1.5 py-0.5 rounded ml-auto">
                                By: {item.extraction_method}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-semibold text-emerald-400 px-2.5 py-0.5 bg-emerald-950/40 rounded border border-emerald-800/30">
                              {item.scope_type}
                            </span>
                            <span className="text-gray-500 font-medium">
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
              <div className="flex flex-col bg-gray-900/30 backdrop-blur-md rounded-2xl p-6 border border-gray-800/80 shadow-2xl">
                <div className="flex items-center justify-between pb-4 mb-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-3.5 w-3.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
                    </span>
                    <h3 className="text-lg font-bold text-gray-100 tracking-tight">
                      Out of Scope
                    </h3>
                  </div>
                  <span className="px-3 py-1 text-xs font-semibold bg-rose-500/10 text-rose-400 rounded-full border border-rose-500/20 shadow-sm">
                    {outOfScopeItems.length}{" "}
                    {outOfScopeItems.length === 1 ? "item" : "items"}
                  </span>
                </div>

                {outOfScopeItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center border border-dashed border-gray-850 rounded-xl bg-gray-850/10">
                    <p className="text-gray-500 text-sm">
                      No out-of-scope items identified.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4 flex-1 max-h-[750px] overflow-y-auto pr-2 custom-scrollbar">
                    {outOfScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-gray-800/60 hover:bg-gray-800/90 rounded-xl border border-gray-700/60 hover:border-rose-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-white group-hover:text-rose-300 transition-colors flex items-center gap-2">
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
                                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950/40 text-purple-300 border border-purple-800/30">
                                    {versionLabel}
                                  </span>
                                );
                              })()}
                              {(user?.role === "ADMIN" ||
                                user?.role === "ENGAGEMENT_MANAGER") && (
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
                            <summary className="text-xs font-bold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors list-none flex items-center">
                              <span className="mr-1.5 transition-transform group-open:rotate-90 text-[10px]">▶</span>
                              AI Extraction Details
                            </summary>
                            <div className="mt-3 space-y-3 p-3 bg-gray-900/60 rounded-lg border border-gray-700/40">
                              {item.description && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">AI Reasoning</h5>
                                  <p className="text-xs text-gray-300 italic leading-relaxed">{item.description}</p>
                                </div>
                              )}
                              {item.evidence_text && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Evidence</h5>
                                  <p className="text-xs text-gray-300 italic leading-relaxed">{item.evidence_text}</p>
                                </div>
                              )}
                              {(item.name && item.scope_item_normalized) && (
                                <div>
                                  <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">Original Text</h5>
                                  <p className="text-xs text-gray-300 font-serif italic">{item.name}</p>
                                </div>
                              )}
                            </div>
                          </details>

                          {item.status_change_tag && (
                            <div className="mb-4 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                              <p className="text-amber-400 text-xs font-semibold flex items-center gap-1.5">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                {item.status_change_tag}
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col gap-2 mt-auto pt-3 border-t border-gray-700/20">
                          {/* Milestone & Deadline Row */}
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {item.milestone && (
                              <span className="text-blue-300 font-semibold bg-blue-950/45 px-2 py-0.5 rounded border border-blue-800/30 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                {item.milestone}
                              </span>
                            )}
                            {item.deadline_text && (
                              <span
                                className="text-purple-300 font-semibold bg-purple-950/45 px-2 py-0.5 rounded border border-purple-800/30 flex items-center gap-1"
                                title={
                                  item.deadline
                                    ? formatDate(item.deadline)
                                    : "Unnormalized"
                                }
                              >
                                <Clock className="w-3.5 h-3.5 text-purple-400" />
                                {item.deadline_text}
                              </span>
                            )}
                            {item.extraction_method && (
                              <span className="text-gray-400 font-medium text-[10px] bg-gray-800 px-1.5 py-0.5 rounded ml-auto">
                                By: {item.extraction_method}
                              </span>
                            )}
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span
                              className={`font-semibold px-2.5 py-0.5 rounded border ${
                                item.scope_type === "OUT_OF_SCOPE"
                                  ? "text-rose-400 bg-rose-950/40 border-rose-800/30"
                                  : "text-blue-400 bg-blue-950/40 border-blue-800/30"
                              }`}
                            >
                              {item.scope_type}
                            </span>
                            <span className="text-gray-500 font-medium">
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

            {/* Baseline Version History */}
            {versions && versions.length > 0 && (
              <div className="mt-16">
                <div className="mb-12 border-b border-gray-800"></div>
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
                    const rawItems = ver.scope_items || [];
                    const filteredItems =
                      ver.version === 1
                        ? rawItems
                        : rawItems.filter(
                            (item: any) =>
                              item.source_document_id ===
                              ver.source_document_id,
                          );

                    const inScope = filteredItems.filter(
                      (i: any) => i.scope_type === "IN_SCOPE",
                    );
                    const outOfScope = filteredItems.filter(
                      (i: any) => i.scope_type === "OUT_OF_SCOPE",
                    );
                    const uncertain = filteredItems.filter(
                      (i: any) => i.scope_type === "UNCERTAIN",
                    );

                    const approvedDate = formatDate(ver.approved_at);
                    const createdDate = formatDate(ver.created_at);

                    return (
                      <div
                        key={ver.id}
                        className="border border-gray-800 rounded-xl bg-gray-900/30 backdrop-blur-md overflow-hidden transition-all duration-300"
                      >
                        {/* Header */}
                        <button
                          onClick={() =>
                            setExpandedVersions((prev) => ({
                              ...prev,
                              [ver.id]: !isExpanded,
                            }))
                          }
                          className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-850/50 transition-colors cursor-pointer select-none"
                        >
                          <div className="flex flex-wrap items-center gap-4">
                            <span className="text-lg font-bold text-white">
                              {displayVersion}
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded text-xs font-bold ${
                                ver.status === "APPROVED"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : ver.status === "SUPERSEDED"
                                    ? "bg-gray-500/10 text-gray-400 border border-gray-500/20"
                                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                              }`}
                            >
                              {ver.status}
                            </span>
                            {ver.document_name && (
                              <span className="text-xs text-cyan-400 font-medium">
                                Doc: {ver.document_name}
                              </span>
                            )}
                            <span className="text-xs text-gray-400">
                              {ver.status === "APPROVED"
                                ? `Approved on: ${approvedDate}`
                                : `Created on: ${createdDate}`}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500 font-semibold bg-gray-850 px-2.5 py-1 rounded-full">
                              {filteredItems.length}{" "}
                              {filteredItems.length === 1 ? "item" : "items"}
                            </span>
                            <ChevronDown
                              className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            />
                          </div>
                        </button>

                        {/* Collapsible Content */}
                        {isExpanded && (
                          <div className="px-6 pb-6 pt-2 border-t border-gray-850 animate-fadeIn bg-gray-950/20">
                            {filteredItems.length === 0 ? (
                              <p className="text-gray-500 text-sm py-4 italic text-center">
                                No scope items found for this baseline version.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
                                {/* In Scope */}
                                <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-800/80">
                                  <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
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
                                          className="p-3 bg-gray-850/40 rounded-lg border border-gray-800/50 flex flex-col justify-between gap-2"
                                        >
                                          <div>
                                            <p className="text-xs font-semibold text-gray-200">
                                              {item.scope_item_normalized || item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">▶</span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Reasoning</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.description}</p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Evidence</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.evidence_text}</p>
                                                  </div>
                                                )}
                                                {(item.name && item.scope_item_normalized) && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Original</h5>
                                                    <p className="text-[11px] text-gray-400 font-serif italic">{item.name}</p>
                                                  </div>
                                                )}
                                              </div>
                                            </details>
                                          </div>
                                          {item.deadline && (
                                            <div className="text-[10px] text-purple-300 font-semibold bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/20 w-fit flex items-center gap-1 mt-1">
                                              <Clock className="w-3 h-3 text-purple-400" />
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
                                  <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-800/80">
                                    <h4 className="text-sm font-bold text-rose-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
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
                                            className="p-3 bg-gray-850/40 rounded-lg border border-gray-800/50"
                                          >
                                            <p className="text-xs font-semibold text-gray-200">
                                              {item.scope_item_normalized || item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">▶</span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Reasoning</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.description}</p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Evidence</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.evidence_text}</p>
                                                  </div>
                                                )}
                                                {(item.name && item.scope_item_normalized) && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Original</h5>
                                                    <p className="text-[11px] text-gray-400 font-serif italic">{item.name}</p>
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
                                    <div className="bg-gray-900/40 p-5 rounded-lg border border-gray-800/80">
                                      <h4 className="text-sm font-bold text-amber-400 uppercase tracking-wider mb-4 border-b border-gray-800 pb-2">
                                        Uncertain ({uncertain.length})
                                      </h4>
                                      <div className="space-y-3">
                                        {uncertain.map((item: any) => (
                                          <div
                                            key={item.id}
                                            className="p-3 bg-gray-850/40 rounded-lg border border-gray-800/50"
                                          >
                                            <p className="text-xs font-semibold text-gray-200">
                                              {item.scope_item_normalized || item.name}
                                            </p>
                                            <details className="mt-1 group cursor-pointer">
                                              <summary className="text-[10px] font-bold text-gray-500 uppercase tracking-wider hover:text-gray-300 transition-colors list-none flex items-center">
                                                <span className="mr-1 transition-transform group-open:rotate-90">▶</span>
                                                Details
                                              </summary>
                                              <div className="mt-2 space-y-2">
                                                {item.description && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Reasoning</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.description}</p>
                                                  </div>
                                                )}
                                                {item.evidence_text && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Evidence</h5>
                                                    <p className="text-[11px] text-gray-400 italic">{item.evidence_text}</p>
                                                  </div>
                                                )}
                                                {(item.name && item.scope_item_normalized) && (
                                                  <div>
                                                    <h5 className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Original</h5>
                                                    <p className="text-[11px] text-gray-400 font-serif italic">{item.name}</p>
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
            <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-xl font-bold mb-2 text-white">
                Select Contract for Baseline
              </h2>
              <p className="text-gray-400 text-sm mb-6">
                Choose a processed contract to extract scope items or budget
                details into your baseline.
              </p>

              <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
                {eligibleDocs.map((doc) => {
                  const isExtractingThis = extractingDocId === doc.id;
                  const isCompletedThis = completedDocIds.includes(doc.id);
                  const isChecked = selectedDocIds.includes(doc.id);
                  return (
                    <div
                      key={doc.id}
                      className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleDocSelection(doc.id)}
                          disabled={extracting}
                          className="w-4 h-4 rounded border-gray-600 text-[#00e5ff] focus:ring-[#00e5ff] bg-gray-700 cursor-pointer"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-medium text-gray-200 truncate">
                            {doc.document_name}
                          </span>
                          <span className="text-[10px] text-cyan-400 font-semibold uppercase">
                            {doc.document_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {isExtractingThis ? (
                          <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Extracting...</span>
                          </div>
                        ) : isCompletedThis ? (
                          <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Completed</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
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
                  className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
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
              <div className="bg-[#0b0e17] border border-gray-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto">
                <button
                  onClick={() => setShowAddItemModal(false)}
                  className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
                >
                  <X className="w-5 h-5" />
                </button>

                <h3 className="text-xl font-bold text-white mb-1">
                  Add Scope Item
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Manually add an in-scope or out-of-scope clause item to this
                  baseline.
                </p>

                <form onSubmit={handleAddItem} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Scope Classification *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewItemScopeType("IN_SCOPE")}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                          newItemScopeType === "IN_SCOPE"
                            ? "bg-emerald-500/20 border-emerald-500 text-emerald-300"
                            : "bg-gray-900 border-gray-700 text-gray-400"
                        }`}
                      >
                        In Scope
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewItemScopeType("OUT_OF_SCOPE")}
                        className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                          newItemScopeType === "OUT_OF_SCOPE"
                            ? "bg-rose-500/20 border-rose-500 text-rose-300"
                            : "bg-gray-900 border-gray-700 text-gray-400"
                        }`}
                      >
                        Out of Scope
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Item Title / Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. SOC 2 Type II Audit Compliance"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Description & Scope Details
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Summarize the scope requirement or exclusion details..."
                      value={newItemDescription}
                      onChange={(e) => setNewItemDescription(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1.5">
                      Reasoning / Reference Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Manually added during EM baseline review"
                      value={newItemEvidence}
                      onChange={(e) => setNewItemEvidence(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-800">
                    <button
                      type="button"
                      onClick={() => setShowAddItemModal(false)}
                      disabled={addingItem}
                      className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addingItem || !newItemName.trim()}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
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
              <div className="bg-[#0b0e17] border border-gray-700/80 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-center my-auto">
                <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                  <Trash2 className="w-6 h-6" />
                </div>

                <h3 className="text-lg font-bold text-white mb-2">
                  Remove Scope Item
                </h3>
                <p className="text-xs text-gray-400 mb-6">
                  Are you sure you want to delete this scope item from the
                  baseline?
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingItemId(null)}
                    disabled={deletingItem}
                    className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteItem(deletingItemId)}
                    disabled={deletingItem}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
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

        {notification && (
          <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-3 animate-slideIn select-none">
            <div className="flex-1">
              <p
                className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                  notification.type === "success"
                    ? "text-emerald-400"
                    : notification.type === "error"
                      ? "text-rose-400"
                      : "text-cyan-400"
                }`}
              >
                {notification.type === "success"
                  ? "Success"
                  : notification.type === "error"
                    ? "Error"
                    : "Notice"}
              </p>
              <p className="text-sm text-gray-200">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-gray-400 hover:text-white transition-colors text-lg font-bold self-start leading-none"
            >
              &times;
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
