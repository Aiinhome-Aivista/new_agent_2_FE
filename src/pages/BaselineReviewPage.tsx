import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { Loader } from "../components/Loader";
import {
  Loader2,
  CheckCircle2,
  Clock,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  X,
} from "lucide-react";

export const BaselineReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [baseline, setBaseline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const res = await apiClient.get(`/projects/${id}/baseline/`);
        if (res.data.success) {
          setBaseline(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch baseline");
      } finally {
        setLoading(false);
      }
    };
    fetchBaseline();
  }, [id]);
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

  useEffect(() => {
    if (baseline?.deliverables?.length > 0 && selectedDeliverableId === null) {
      setSelectedDeliverableId(baseline.deliverables[0].id);
    }
  }, [baseline, selectedDeliverableId]);

  const activeIndex =
    baseline?.deliverables?.findIndex(
      (d: any) => d.id === selectedDeliverableId,
    ) ?? -1;

  const handlePrev = () => {
    if (baseline?.deliverables && activeIndex > 0) {
      setSelectedDeliverableId(baseline.deliverables[activeIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (
      baseline?.deliverables &&
      activeIndex < baseline.deliverables.length - 1
    ) {
      setSelectedDeliverableId(baseline.deliverables[activeIndex + 1].id);
    }
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
  const [newItemScopeType, setNewItemScopeType] = useState<"IN_SCOPE" | "OUT_OF_SCOPE">("IN_SCOPE");
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
      const res = await apiClient.post(`/projects/${id}/baseline/items`, payload);
      if (res.data.success) {
        showNotification("Scope item added successfully!", "success");
        setShowAddItemModal(false);
        setNewItemName("");
        setNewItemDescription("");
        setNewItemScopeType("IN_SCOPE");
        setNewItemEvidence("");
        
        const baselineRes = await apiClient.get(`/projects/${id}/baseline/`);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification("Failed to add item: " + (error.response?.data?.detail || "Server error"), "error");
    } finally {
      setAddingItem(false);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    setDeletingItem(true);
    try {
      const res = await apiClient.delete(`/projects/${id}/baseline/items/${itemId}`);
      if (res.data.success) {
        showNotification("Scope item deleted successfully!", "success");
        setDeletingItemId(null);
        
        const baselineRes = await apiClient.get(`/projects/${id}/baseline/`);
        if (baselineRes.data.success) {
          setBaseline(baselineRes.data.data);
        }
      }
    } catch (error: any) {
      showNotification("Failed to delete item: " + (error.response?.data?.detail || "Server error"), "error");
    } finally {
      setDeletingItem(false);
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
      const baselineRes = await apiClient.get(`/projects/${id}/baseline/`);
      if (baselineRes.data.success) {
        setBaseline(baselineRes.data.data);
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
        </style>
      </head>
      <body>
        <h1>Contract Scope Baseline Review Report</h1>
        <p><strong>Baseline Status:</strong> ${baseline.status}</p>
        <p><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</p>
        <hr style="border: 0; border-top: 1px solid #dddddd; margin-bottom: 20px;" />
        
        <h2>In Scope Items (${inScopeItems.length})</h2>
        ${
          inScopeItems.length === 0
            ? "<p>No in-scope items identified.</p>"
            : inScopeItems
                .map(
                  (item: any) => `
          <div class="item-card">
            <div class="item-title">${item.name}</div>
            <div class="item-desc">${item.description}</div>
            ${item.evidence_text ? `<div class="evidence"><strong>AI Reasoning:</strong> "${item.evidence_text}"</div>` : ""}
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
            <div class="item-title">${item.name}</div>
            <div class="item-desc">${item.description}</div>
            ${item.evidence_text ? `<div class="evidence"><strong>AI Reasoning:</strong> "${item.evidence_text}"</div>` : ""}
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
            .header-meta { font-size: 13px; color: #6b7280; margin-bottom: 30px; }
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
            <span><strong>Baseline Status:</strong> ${baseline.status}</span> &bull; 
            <span><strong>Export Date:</strong> ${new Date().toLocaleDateString()}</span>
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
                  <div class="item-title">${item.name}</div>
                  <div class="item-desc">${item.description}</div>
                  ${item.evidence_text ? `<div class="evidence"><strong>AI Reasoning:</strong> "${item.evidence_text}"</div>` : ""}
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
                  <div class="item-title">${item.name}</div>
                  <div class="item-desc">${item.description}</div>
                  ${item.evidence_text ? `<div class="evidence"><strong>AI Reasoning:</strong> "${item.evidence_text}"</div>` : ""}
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

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4 items-center">
            <h1 className="text-3xl font-bold">Baseline Review</h1>
          </div>
          <div className="flex gap-4 items-center">
            <button
              onClick={() => navigate(`/projects/${id}`)}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md"
            >
              Back to Dashboard
            </button>

            {(!baseline || baseline.status !== "APPROVED") &&
              user?.role !== "PROJECT_LEAD" && (
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

        {!baseline ? (
          <p className="text-gray-400">No baseline exists yet.</p>
        ) : (
          <div>
            <div className="mb-6">
              <span
                className={`px-3 py-1 rounded text-sm ${baseline.status === "APPROVED" ? "bg-green-600" : "bg-yellow-600"}`}
              >
                Status: {baseline.status}
              </span>
            </div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Scope Items Baseline</h2>
              <div className="flex items-center gap-3">
                {(user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") && (
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
                  <div className="space-y-4 flex-1">
                    {inScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-gray-800/60 hover:bg-gray-800/90 rounded-xl border border-gray-700/60 hover:border-emerald-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-white group-hover:text-emerald-300 transition-colors">
                              {item.name}
                            </h4>
                            {(user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") && (
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
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            {item.description}
                          </p>

                          {item.evidence_text && (
                            <div className="mb-4 p-3 bg-gray-900/60 rounded-lg border border-gray-700/40">
                              <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                AI Reasoning
                              </h5>
                              <p className="text-gray-300 text-xs italic leading-relaxed">
                                "{item.evidence_text}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs mt-auto pt-3 border-t border-gray-700/20">
                          <span className="font-semibold text-emerald-400 px-2.5 py-0.5 bg-emerald-950/40 rounded border border-emerald-800/30">
                            {item.scope_type}
                          </span>
                          <span className="text-gray-500 font-medium">
                            Confidence: {(item.confidence * 100).toFixed(0)}%
                          </span>
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
                  <div className="space-y-4 flex-1">
                    {outOfScopeItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="group p-5 bg-gray-800/60 hover:bg-gray-800/90 rounded-xl border border-gray-700/60 hover:border-rose-500/30 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between min-h-[160px]"
                      >
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-2">
                            <h4 className="font-bold text-lg text-white group-hover:text-rose-300 transition-colors">
                              {item.name}
                            </h4>
                            {(user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") && (
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
                            )}
                          </div>
                          <p className="text-gray-400 text-sm mb-4 leading-relaxed">
                            {item.description}
                          </p>

                          {item.evidence_text && (
                            <div className="mb-4 p-3 bg-gray-900/60 rounded-lg border border-gray-700/40">
                              <h5 className="text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-wider">
                                AI Reasoning
                              </h5>
                              <p className="text-gray-300 text-xs italic leading-relaxed">
                                "{item.evidence_text}"
                              </p>
                            </div>
                          )}
                        </div>

                        <div className="flex justify-between items-center text-xs mt-auto pt-3 border-t border-gray-700/20">
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
                    ))}
                  </div>
                )}
              </div>
            </div>

            <h2 className="text-xl font-bold mb-4">
              Deliverables & IFA Allocations
            </h2>
            {baseline.deliverables?.length === 0 ? (
              <p className="text-gray-400 mb-8">
                No deliverables or budget allocations found.
              </p>
            ) : (
              <div>
                {/* Horizontal Timeline Container */}
                <div className="flex items-center gap-4 my-10 relative">
                  {/* Left navigation arrow */}
                  <button
                    onClick={handlePrev}
                    disabled={activeIndex <= 0}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer z-10 shadow-md"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>

                  {/* Horizontal Timeline Track */}
                  <div className="flex-1 relative py-6 overflow-visible">
                    {/* Horizontal Track Line */}
                    <div className="absolute top-[96px] left-12 right-12 h-1 bg-gray-800 rounded-full z-0"></div>

                    {/* Nodes wrapper */}
                    <div className="flex justify-between items-center z-10 relative overflow-x-auto pt-4 pb-4 pl-12 pr-12 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent">
                      {baseline.deliverables?.map(
                        (item: any, index: number) => {
                          const isSelected = selectedDeliverableId === item.id;
                          const displayName =
                            item.deadline || `Item ${index + 1}`;

                          return (
                            <div
                              key={item.id}
                              className="flex flex-col items-center flex-shrink-0 cursor-pointer group mx-6 first:ml-0 last:mr-0 relative pt-12"
                              onClick={() => setSelectedDeliverableId(item.id)}
                            >
                              {/* Date Label bubble with down caret */}
                              <div className="absolute top-0 left-1/2 -translate-x-1/2 flex flex-col items-center pointer-events-none">
                                <div
                                  className={`px-3 py-1 rounded text-xs font-semibold shadow-md transition-all duration-300 border whitespace-nowrap ${
                                    isSelected
                                      ? "bg-purple-650 text-white border-purple-500 scale-105"
                                      : "bg-[#1e293b] text-gray-300 border-gray-750"
                                  }`}
                                >
                                  {displayName}
                                </div>
                                <div
                                  className={`w-2 h-2 rotate-45 -mt-1 border-r border-b transition-colors ${
                                    isSelected
                                      ? "bg-purple-650 border-purple-500"
                                      : "bg-[#1e293b] border-gray-750"
                                  }`}
                                ></div>
                              </div>

                              {/* Node Circle */}
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center transition-all duration-300 border-2 z-10 bg-gray-900 ${
                                  isSelected
                                    ? "border-purple-500 scale-125 bg-gray-100 shadow-lg shadow-purple-500/20"
                                    : "border-gray-600 group-hover:border-gray-450"
                                }`}
                              >
                                {isSelected && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-purple-600 animate-pulse"></span>
                                )}
                              </div>

                              {/* Mini label below */}
                              <span
                                className={`text-[10px] mt-2.5 transition-colors max-w-[90px] truncate text-center ${
                                  isSelected
                                    ? "text-purple-300 font-semibold"
                                    : "text-gray-500 group-hover:text-gray-400"
                                }`}
                                title={item.name}
                              >
                                {item.name}
                              </span>
                            </div>
                          );
                        },
                      )}
                    </div>
                  </div>

                  {/* Right navigation arrow */}
                  <button
                    onClick={handleNext}
                    disabled={activeIndex >= baseline.deliverables.length - 1}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 border border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center transition-colors cursor-pointer z-10 shadow-md"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                {/* Selected Item Detail View */}
                {(() => {
                  const selectedItem =
                    baseline.deliverables.find(
                      (d: any) => d.id === selectedDeliverableId,
                    ) || baseline.deliverables[0];
                  if (!selectedItem) return null;

                  const caretLeft =
                    baseline.deliverables.length > 1
                      ? `calc(96px + (${activeIndex} / ${baseline.deliverables.length - 1}) * (100% - 192px))`
                      : "50%";

                  return (
                    <div className="relative p-6 bg-gray-900/90 backdrop-blur-sm rounded-2xl border border-gray-850 shadow-2xl animate-fadeIn mb-12">
                      {/* Caret pointing up to selected node */}
                      <div
                        className="absolute -top-[9px] w-4 h-4 bg-gray-900 border-l border-t border-gray-850 z-10 transition-all duration-300"
                        style={{
                          left: caretLeft,
                          transform: "translateX(-50%) rotate(45deg)",
                        }}
                      ></div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400">
                            Selected Deliverable Details
                          </span>
                          <h3 className="font-bold text-xl text-white mt-0.5">
                            {selectedItem.name}
                          </h3>
                        </div>
                        <div className="flex flex-wrap gap-2.5">
                          {selectedItem.deadline && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-purple-950/40 text-purple-300 border border-purple-800/25 shadow-sm">
                              Date: {selectedItem.deadline}
                            </span>
                          )}
                          <span className="inline-flex items-center px-3 py-1 rounded bg-gray-850/60 border border-gray-700/60 text-gray-300 text-xs font-medium">
                            Owner: {selectedItem.owner || "Unassigned"}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}
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
        {showAddItemModal && createPortal(
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-[#0b0e17] border border-gray-700/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-bold text-white mb-1">Add Scope Item</h3>
              <p className="text-xs text-gray-400 mb-6">
                Manually add an in-scope or out-of-scope clause item to this baseline.
              </p>

              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Scope Classification *</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType('IN_SCOPE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                        newItemScopeType === 'IN_SCOPE'
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-gray-900 border-gray-700 text-gray-400'
                      }`}
                    >
                      In Scope
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewItemScopeType('OUT_OF_SCOPE')}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 ${
                        newItemScopeType === 'OUT_OF_SCOPE'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-gray-900 border-gray-700 text-gray-400'
                      }`}
                    >
                      Out of Scope
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Item Title / Name *</label>
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
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Description & Scope Details</label>
                  <textarea
                    rows={3}
                    placeholder="Summarize the scope requirement or exclusion details..."
                    value={newItemDescription}
                    onChange={(e) => setNewItemDescription(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-teal-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1.5">Reasoning / Reference Notes</label>
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
                    {addingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save Scope Item'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* DELETE SCOPE ITEM MODAL */}
        {deletingItemId !== null && createPortal(
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-[#0b0e17] border border-gray-700/80 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-center my-auto">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>

              <h3 className="text-lg font-bold text-white mb-2">Remove Scope Item</h3>
              <p className="text-xs text-gray-400 mb-6">
                Are you sure you want to delete this scope item from the baseline?
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
                  {deletingItem ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
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
