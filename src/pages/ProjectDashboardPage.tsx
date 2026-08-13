import React, { useEffect, useState, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import type { Project } from "../types";
import { Loader } from "../components/Loader";
import { useAuth } from "../auth/AuthContext";
import {
  UploadCloud,
  X,
  FileText,
  Play,
  Trash2,
  Loader2,
  Lock,
  FileSpreadsheet,
  Clock,
  Layers,
  Plus,
  Sparkles,
  // Check,
  FileCheck,
  AlertTriangle,
  CloudDownload,
  RefreshCw,
  SkipForward,
  RotateCcw,
} from "lucide-react";

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [baselineFile, setBaselineFile] = useState<File | null>(null);
  const [monitoringFile, setMonitoringFile] = useState<File | null>(null);

  const isProjectLead = user?.role === "PROJECT_LEAD";
  const [baselineDocType, setBaselineDocType] = useState<string>("EL");
  const [monitoringDocType, setMonitoringDocType] = useState<string>(
    isProjectLead ? "MOM" : "STATUS_REPORT",
  );
  const [uploadTarget, setUploadTarget] = useState<"BASELINE" | "MONITORING">(
    "BASELINE",
  );
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);

  // Reference documentTypes to satisfy TS compiler unused variable check
  if (false && documentTypes.length) {
    console.log(documentTypes);
  }

  const [uploading, setUploading] = useState(false);

  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [addingCustomType, setAddingCustomType] = useState(false);

  const [deletingDocId, setDeletingDocId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [processingDocId, setProcessingDocId] = useState<number | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const baselineFileInputRef = useRef<HTMLInputElement>(null);
  const monitoringFileInputRef = useRef<HTMLInputElement>(null);

  // ── Drive Inbox state ────────────────────────────────────────────────────
  const [showDriveInbox, setShowDriveInbox] = useState(false);
  const [driveItems, setDriveItems] = useState<any[]>([]);
  const [driveSyncing, setDriveSyncing] = useState(false);
  const [driveProcessingId, setDriveProcessingId] = useState<number | null>(null);

  const fetchDriveInbox = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.DRIVE.INBOX_BY_PROJECT(id!));
      setDriveItems(res.data?.data || []);
    } catch {
      // silent
    }
  };

  const handleDriveSync = async () => {
    setDriveSyncing(true);
    try {
      await apiClient.post(API_ENDPOINTS.DRIVE.SYNC);
      await fetchDriveInbox();
      setNotification({ message: "Drive sync complete.", type: "success" });
    } catch {
      setNotification({ message: "Drive sync failed.", type: "error" });
    } finally {
      setDriveSyncing(false);
    }
  };

  const handleDriveProcess = async (item: any) => {
    if (!item.matched_project_id && !id) return;
    setDriveProcessingId(item.id);
    try {
      await apiClient.post(API_ENDPOINTS.DRIVE.PROCESS_INBOX(item.id), {
        project_id: item.matched_project_id || parseInt(id!),
        doc_type: item.doc_type || "MOM",
      });
      setNotification({ message: `"${item.filename}" uploaded successfully! You can now process it.`, type: "success" });
      await fetchDriveInbox();
      
      // Refresh the Execution History section
      const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
      if (docsRes.data.success) setDocuments(docsRes.data.data);
    } catch (err: any) {
      setNotification({ message: err?.response?.data?.detail || "Processing failed.", type: "error" });
    } finally {
      setDriveProcessingId(null);
    }
  };

  const handleDriveSkip = async (item: any) => {
    try {
      await apiClient.patch(API_ENDPOINTS.DRIVE.SKIP_INBOX(item.id));
      await fetchDriveInbox();
    } catch { /* silent */ }
  };

  const handleDriveResume = async (item: any) => {
    try {
      await apiClient.patch(API_ENDPOINTS.DRIVE.RESUME_INBOX(item.id));
      await fetchDriveInbox();
    } catch { /* silent */ }
  };

  const handleDriveDelete = async (item: any) => {
    if (!confirm(`Are you sure you want to permanently delete "${item.filename}" from the inbox?`)) return;
    try {
      await apiClient.delete(API_ENDPOINTS.DRIVE.DELETE_INBOX(item.id));
      await fetchDriveInbox();
    } catch { /* silent */ }
  };

  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);

  // const [relevanceCheckResult, setRelevanceCheckResult] = useState<{
  //   score: number;
  //   reasoning: string;
  //   temp_key: string;
  //   original_name: string;
  // } | null>(null);
  // const [showRelevancePopup, setShowRelevancePopup] = useState(false);
  // const [confirmingUpload, setConfirmingUpload] = useState(false);

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

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projRes, docsRes, typesRes] = await Promise.all([
          apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(id!)),
          apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!)),
          apiClient.get(API_ENDPOINTS.DOCUMENTS.TYPES(id!)),
        ]);
        if (projRes.data.success) setProject(projRes.data.data);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (typesRes.data.success) setDocumentTypes(typesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch project data");
      }
    };
    fetchProject();
  }, [id]);

  const handleAddCustomType = async () => {
    if (!customName.trim()) return;
    setAddingCustomType(true);
    try {
      const payload = {
        name: customName.toUpperCase().replace(/\s+/g, "_"),
        label: customName,
        description: customDesc,
      };
      await apiClient.post(API_ENDPOINTS.DOCUMENTS.TYPES(id!), payload);

      const typesRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.TYPES(id!));
      if (typesRes.data.success) {
        setDocumentTypes(typesRes.data.data);
        setMonitoringDocType(payload.name);
        setUploadTarget("MONITORING");
      }

      setShowCustomModal(false);
      setCustomName("");
      setCustomDesc("");
      showNotification("Custom document type added successfully!", "success");
    } catch (error) {
      showNotification("Failed to add custom type", "error");
    } finally {
      setAddingCustomType(false);
    }
  };

  const validateAndSetFile = (
    selectedFile: File,
    target: "BASELINE" | "MONITORING",
  ) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext && ["pdf", "docx", "txt"].includes(ext)) {
      if (target === "BASELINE") setBaselineFile(selectedFile);
      else setMonitoringFile(selectedFile);
    } else {
      showNotification(
        "Unsupported file format. Please upload a .pdf, .docx, or .txt file.",
        "error",
      );
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    setIsDragging(false);
  };

  const handleDrop = (
    e: React.DragEvent,
    target: "BASELINE" | "MONITORING",
  ) => {
    e.preventDefault();
    if (uploading) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0], target);
    }
  };

  const triggerFileSelect = (target: "BASELINE" | "MONITORING") => {
    setUploadTarget(target);
    if (target === "BASELINE") baselineFileInputRef.current?.click();
    else monitoringFileInputRef.current?.click();
  };

  const handleProcessDocument = async (docId: number, docType: string) => {
    try {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, processing_status: "PROCESSING" } : d,
        ),
      );
      const res = await apiClient.post(API_ENDPOINTS.DOCUMENTS.PROCESS(id!, docId));
      if (res.data.success) {
        const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        showNotification("Document analysis has started!", "success");
      }
    } catch (error) {
      showNotification("Failed to start processing the document", "error");
      const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
      if (docsRes.data.success) setDocuments(docsRes.data.data);
    }
  };

  const confirmProcessDocument = async () => {
    if (!processingDocId) return;
    const docId = processingDocId;
    const doc = documents.find((d) => d.id === docId);
    setProcessingDocId(null);
    await handleProcessDocument(docId, doc?.document_type || "");
  };

  const handleDeleteDocument = (docId: number) => {
    setDeletingDocId(docId);
    setDeleteReason("");
  };

  const confirmDeleteDocument = async () => {
    if (!deletingDocId) return;
    if (!deleteReason.trim()) return;
    try {
      const res = await apiClient.delete(
        API_ENDPOINTS.DOCUMENTS.DETAIL(id!, deletingDocId) + `?reason=${encodeURIComponent(deleteReason)}`,
      );
      if (res.data.success) {
        setDeletingDocId(null);
        setDeleteReason("");
        const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        showNotification("Document deleted successfully!", "success");
      }
    } catch (error) {
      showNotification("Failed to delete document", "error");
    }
  };

  const handleUpload = async (
    e: React.FormEvent,
    target: "BASELINE" | "MONITORING",
  ) => {
    e.preventDefault();
    const fileToUpload = target === "BASELINE" ? baselineFile : monitoringFile;
    if (!fileToUpload) return;

    setUploadTarget(target);
    const formData = new FormData();
    formData.append("file", fileToUpload);
    formData.append(
      "document_type",
      target === "BASELINE" ? baselineDocType : monitoringDocType,
    );

    setUploading(true);
    try {
      const res = await apiClient.post(
        API_ENDPOINTS.DOCUMENTS.CONFIRM_UPLOAD(id!),
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (res.data.success) {
        const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (target === "BASELINE") {
          setBaselineFile(null);
          showNotification("Document uploaded successfully!", "success");
        } else {
          setMonitoringFile(null);
          showNotification(
            "Document uploaded successfully! You can now process it.",
            "success",
          );
        }
      }
    } catch (error: any) {
      console.error("Upload failed", error);
      const errMsg = error.response?.data?.detail || "Upload failed";
      showNotification(errMsg, "error");
    } finally {
      setUploading(false);
    }
  };

  /*
  const confirmUpload = async () => {
    if (!relevanceCheckResult) return;
    setConfirmingUpload(true);
    try {
      const res = await apiClient.post(
        `/projects/${id}/documents/confirm-upload`,
        {
          temp_key: relevanceCheckResult.temp_key,
          document_type: uploadTarget === "BASELINE" ? baselineDocType : monitoringDocType,
          original_name: relevanceCheckResult.original_name,
        },
      );
      if (res.data.success) {
        const docsRes = await apiClient.get(API_ENDPOINTS.DOCUMENTS.LIST(id!));
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (uploadTarget === "BASELINE") setBaselineFile(null);
        else setMonitoringFile(null);
        setShowRelevancePopup(false);
        setRelevanceCheckResult(null);
        showNotification("Document uploaded successfully!", "success");
      }
    } catch (error: any) {
      console.error("Upload confirmation failed", error);
      const errMsg =
        error.response?.data?.detail || "Upload confirmation failed";
      showNotification(errMsg, "error");
    } finally {
      setConfirmingUpload(false);
    }
  };
  */

  if (!project) return <Loader message="Loading project cockpit details..." />;

  const initiationDocs = documents.filter(
    (d) => d.document_type === "EL" || d.document_type === "IFA",
  );
  const trackerDocs = documents.filter(
    (d) => d.document_type !== "EL" && d.document_type !== "IFA",
  );

  const getDocTypeLabel = (typeName: string) => {
    switch (typeName) {
      case "EL":
        return "Engagement Letter (EL)";
      case "IFA":
        return "Independence & Financial Approval (IFA)";
      case "MOM":
        return "Minutes of Meeting (MOM)";
      case "STATUS_REPORT":
        return "Status Report";
      default:
        return typeName.replace(/_/g, " ");
    }
  };

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-text-primary">
              {project.project_name}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {project.description}
            </p>
            {(project.start_date || project.end_date) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 items-center text-xs text-text-muted mt-2.5">
                {project.start_date && (
                  <div>
                    <span className="font-semibold text-text-muted">
                      Start Date:
                    </span>{" "}
                    <span className="text-teal-500 dark:text-teal-700 dark:text-teal-400 font-semibold">
                      {new Date(project.start_date).toLocaleDateString(
                        undefined,
                        { dateStyle: "medium" },
                      )}
                    </span>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <span className="font-semibold text-text-muted">
                      End Date:
                    </span>{" "}
                    <span className="text-teal-500 dark:text-teal-700 dark:text-teal-400 font-semibold">
                      {new Date(project.end_date).toLocaleDateString(
                        undefined,
                        { dateStyle: "medium" },
                      )}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="bg-bg-card/40 border border-border-subtle rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border-subtle mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Section 1 • One-Time Onboarding
                </span>
                <span className="text-xs text-text-muted font-medium">
                  Project Initiation
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                Project Initiation & Baseline Setup
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Upload initial contract documents to build the project scope
                baseline. These documents are uploaded once during onboarding.
              </p>
            </div>

            <Link
              to={`/projects/${id}/baseline`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF5A14]/20 transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              Review Baseline &rarr;
            </Link>
          </div>

          {project.monitoring_status === "CLOSED" ? (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">
                Project Closed
              </h3>
              <p className="text-xs text-text-muted max-w-md leading-relaxed">
                This project has been marked as closed. No further initiation
                documents can be uploaded.
              </p>
            </div>
          ) : user?.role === "ENGAGEMENT_MANAGER" || user?.role === "ADMIN" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div
                  onClick={() => {
                    setBaselineDocType("EL");
                    setUploadTarget("BASELINE");
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    baselineDocType === "EL"
                      ? "bg-[#FFF7F2] dark:bg-[#332822] border-2 border-[#FF8A55] shadow-md shadow-[#FF5A14]/10"
                      : "bg-bg-card border border-[#D8D8D8] dark:border-[#444444] hover:border-[#FF8A55]/50 hover:bg-[#FFF7F2]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${baselineDocType === "EL" ? "bg-[#FF5A14]/20 text-[#FF5A14]" : "bg-bg-hover text-text-muted"}`}
                    >
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Engagement Letter (EL)
                      </h3>
                      <p className="text-xs text-text-muted">
                        Official signed client engagement contract
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setBaselineDocType("IFA");
                    setUploadTarget("BASELINE");
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    baselineDocType === "IFA"
                      ? "bg-[#FFF7F2] dark:bg-[#332822] border-2 border-[#FF8A55] shadow-md shadow-[#FF5A14]/10"
                      : "bg-bg-card border border-[#D8D8D8] dark:border-[#444444] hover:border-[#FF8A55]/50 hover:bg-[#FFF7F2]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${baselineDocType === "IFA" ? "bg-[#FF5A14]/20 text-[#FF5A14]" : "bg-bg-hover text-text-muted"}`}
                    >
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Independence & Financial (IFA)
                      </h3>
                      <p className="text-xs text-text-muted">
                        Inter-firm approval & financial budget document
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-hover/50 p-5 rounded-xl border border-border-strong/70 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-[#FF5A14]" />
                        Target Category:{" "}
                        <span className="text-[#FF5A14] font-bold">
                          {getDocTypeLabel(baselineDocType)}
                        </span>
                      </h4>
                    </div>

                    <form
                      onSubmit={(e) => handleUpload(e, "BASELINE")}
                      className="space-y-4"
                    >
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, "BASELINE")}
                        onClick={
                          uploading
                            ? undefined
                            : () => triggerFileSelect("BASELINE")
                        }
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                          uploading
                            ? "border-border-strong bg-bg-card/10 cursor-not-allowed opacity-50"
                            : isDragging
                              ? "border-[#FF8A55] bg-[#FF5A14]/10 cursor-pointer"
                              : baselineFile
                                ? "border-green-500 bg-green-950/10 cursor-pointer"
                                : "border-slate-300 dark:border-gray-600 hover:border-[#FF8A55] bg-bg-card/40 hover:bg-[#FFF7F2]/40 cursor-pointer"
                        }`}
                      >
                        <input
                          type="file"
                          ref={baselineFileInputRef}
                          accept=".pdf,.docx,.txt"
                          disabled={uploading}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              validateAndSetFile(e.target.files[0], "BASELINE");
                            }
                          }}
                          className="hidden"
                        />

                        {baselineFile ? (
                          <div className="flex flex-col items-center w-full">
                            <div className="flex items-center justify-between bg-bg-hover/80 border border-border-strong rounded-lg p-3 w-full max-w-xs">
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <span className="text-sm truncate text-text-primary">
                                  {baselineFile.name}
                                </span>
                              </div>
                              <button
                                type="button"
                                disabled={uploading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setBaselineFile(null);
                                }}
                                className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-red-400 transition-colors disabled:opacity-30"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {!uploading && (
                              <span className="text-xs text-text-muted mt-2">
                                Click or drag new file to replace
                              </span>
                            )}
                          </div>
                        ) : (
                          <>
                            <div className="bg-[#FF5A14]/10 p-4 rounded-full mb-4 ring-8 ring-[#FF5A14]/5">
                              <UploadCloud className="w-8 h-8 text-[#FF5A14]" />
                            </div>
                            <div className="text-center">
                              <p className="text-sm text-text-secondary font-medium">
                                Upload{" "}
                                <strong className="text-[#FF5A14]">
                                  {getDocTypeLabel(baselineDocType)}
                                </strong>
                              </p>
                              <p className="text-xs text-text-muted mt-1">
                                Drag & drop (.pdf, .docx, .txt) or click to
                                browse
                              </p>
                            </div>
                          </>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!baselineFile || uploading}
                        className="w-full py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-[#FF5A14]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                      >
                        {uploading
                          ? "Uploading Document..."
                          : `Upload ${getDocTypeLabel(baselineDocType)}`}
                      </button>
                    </form>
                  </div>
                </div>

                <div className="bg-bg-hover/50 p-5 rounded-xl border border-border-strong/70 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                      Initiation Baseline Artifacts ({initiationDocs.length})
                    </h4>

                    {initiationDocs.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-slate-300 dark:border-gray-750 rounded-xl bg-bg-card/20">
                        <FileCheck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-text-muted font-medium">
                          No initiation documents uploaded yet.
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Select EL or IFA above to upload.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2">
                        {initiationDocs.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex justify-between items-center p-3 bg-bg-card/60 rounded-xl border border-border-strong/50 hover:border-emerald-500/30 transition-all"
                          >
                            <div className="flex flex-col min-w-0 pr-2 w-full">
                              <span className="truncate font-semibold text-xs text-text-primary">
                                {doc.document_name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded font-semibold uppercase">
                                  {doc.document_type}
                                </span>
                              </div>
                              {doc.processing_status === "FAILED" &&
                                doc.processing_error && (
                                  <p className="text-[10px] text-rose-500 dark:text-rose-700 dark:text-rose-400 font-medium font-mono mt-1 whitespace-pre-wrap max-w-full break-words border border-rose-500/20 bg-rose-950/20 rounded-md px-2 py-1 select-text">
                                    Error: {doc.processing_error}
                                  </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  doc.processing_status === "COMPLETED"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : doc.processing_status === "PROCESSING" ||
                                        doc.processing_status === "PARSING"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                                      : doc.processing_status === "FAILED"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-blue-500/20 text-blue-500 dark:text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {doc.processing_status}
                              </span>
                              {user?.role === "ENGAGEMENT_MANAGER" &&
                                project.monitoring_status !== "CLOSED" &&
                                (doc.processing_status === "UPLOADED" ||
                                  doc.processing_status === "FAILED") && (
                                  <button
                                    onClick={() => setProcessingDocId(doc.id)}
                                    title="Extract and process document"
                                    className="p-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-text-primary rounded-lg transition-all"
                                  >
                                    <Play className="h-3 w-3" />
                                  </button>
                                )}

                              {user?.role === "ENGAGEMENT_MANAGER" &&
                                project.monitoring_status !== "CLOSED" &&
                                (doc.processing_status === "UPLOADED" ||
                                  doc.processing_status === "FAILED") && (
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Delete document"
                                    className="p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-text-primary rounded-lg transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-bg-hover/50 p-5 rounded-xl border border-border-strong/70 flex flex-col justify-between w-full">
              <div>
                <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                  Initiation Baseline Artifacts ({initiationDocs.length})
                </h4>

                {initiationDocs.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-slate-300 dark:border-gray-750 rounded-xl bg-bg-card/20">
                    <FileCheck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-text-muted font-medium">
                      No initiation documents uploaded yet.
                    </p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {initiationDocs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex justify-between items-center p-3 bg-bg-card/60 rounded-xl border border-border-strong/50 transition-all"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate font-semibold text-xs text-text-primary">
                            {doc.document_name}
                          </span>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/15 text-emerald-300 border border-emerald-500/20 rounded font-semibold uppercase">
                              {doc.document_type}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                              doc.processing_status === "COMPLETED"
                                ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                : doc.processing_status === "PROCESSING" ||
                                    doc.processing_status === "PARSING"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                                  : doc.processing_status === "FAILED"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-500 dark:text-blue-700 dark:text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {doc.processing_status}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-bg-card/40 border border-border-subtle rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-border-subtle mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-700 dark:text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                  Section 2 • Recurring Execution
                </span>
                <span className="text-xs text-text-muted font-medium">
                  Progress Tracker
                </span>
              </div>
              <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
                Progress Tracker & Continuous Ingestion
              </h2>
              <p className="text-xs text-text-muted mt-1">
                Upload recurring project documents (MOMs, status reports) to
                evaluate execution deliverables against the approved scope
                baseline.
              </p>
            </div>

            <Link
              to={`/projects/${id}/tracker`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold text-xs rounded-xl shadow-md shadow-[#FF5A14]/20 transition-all duration-300 active:scale-[0.98] cursor-pointer"
            >
              <Clock className="w-4 h-4 text-white" />
              View Risk Tracker &rarr;
            </Link>
          </div>

          {project.monitoring_status === "CLOSED" ? (
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">
                Project Closed
              </h3>
              <p className="text-xs text-text-muted max-w-md leading-relaxed">
                This project has been marked as closed. No further execution
                documents can be uploaded.
              </p>
            </div>
          ) : project.monitoring_status !== "ACTIVE" ? (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-text-primary mb-2">
                Progress Ingestion Locked
              </h3>
              <p className="text-xs text-text-muted max-w-md leading-relaxed">
                The Engagement Manager must extract and approve the initial{" "}
                <strong>Scope Baseline</strong> for this project before you can
                upload recurring execution documents (MOMs and Status Reports).
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div
                  onClick={() => {
                    setMonitoringDocType("MOM");
                    setUploadTarget("MONITORING");
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    monitoringDocType === "MOM"
                      ? "bg-[#FFF7F2] dark:bg-[#332822] border-2 border-[#FF8A55] shadow-md shadow-[#FF5A14]/10"
                      : "bg-bg-card border border-[#D8D8D8] dark:border-[#444444] hover:border-[#FF8A55]/50 hover:bg-[#FFF7F2]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${monitoringDocType === "MOM" ? "bg-[#FF5A14]/20 text-[#FF5A14]" : "bg-bg-hover text-text-muted"}`}
                    >
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Minutes of Meeting (MOM)
                      </h3>
                      <p className="text-xs text-text-muted">
                        Steering MoM & decision log
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => {
                    setMonitoringDocType("STATUS_REPORT");
                    setUploadTarget("MONITORING");
                  }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    monitoringDocType === "STATUS_REPORT"
                      ? "bg-[#FFF7F2] dark:bg-[#332822] border-2 border-[#FF8A55] shadow-md shadow-[#FF5A14]/10"
                      : "bg-bg-card border border-[#D8D8D8] dark:border-[#444444] hover:border-[#FF8A55]/50 hover:bg-[#FFF7F2]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`p-2.5 rounded-xl ${monitoringDocType === "STATUS_REPORT" ? "bg-[#FF5A14]/20 text-[#FF5A14]" : "bg-bg-hover text-text-muted"}`}
                    >
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Status Report
                      </h3>
                      <p className="text-xs text-text-muted">
                        Periodic sprint & status updates
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  onClick={() => setShowCustomModal(true)}
                  className="p-4 rounded-xl border border-dashed border-[#D8D8D8] dark:border-[#444444] hover:border-[#FF8A55] bg-bg-hover/20 hover:bg-[#FFF7F2]/50 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-[#FF5A14]/10 text-[#FF5A14]">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">
                        Add Custom Type
                      </h3>
                      <p className="text-xs text-text-muted">
                        Create custom category
                      </p>
                    </div>
                  </div>
                </div>

                {/* Google Drive Inbox card */}
                <div
                  onClick={() => { setShowDriveInbox(true); fetchDriveInbox(); }}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    showDriveInbox
                      ? "bg-[#EFF6FF] dark:bg-[#1e2d40] border-2 border-blue-500 shadow-md shadow-blue-500/10"
                      : "bg-bg-card border border-[#D8D8D8] dark:border-[#444444] hover:border-blue-400/60 hover:bg-[#EFF6FF]/50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${showDriveInbox ? "bg-blue-500/20 text-blue-500" : "bg-bg-hover text-text-muted"}`}>
                      <CloudDownload className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-text-primary">From Google Drive</h3>
                      <p className="text-xs text-text-muted">Auto-fetched documents</p>
                    </div>
                  </div>
                  {driveItems.filter(i => i.status === "PENDING" || i.status === "ASSIGNED").length > 0 && (
                    <span className="text-[9px] font-black px-2 py-0.5 bg-blue-500 text-white rounded-full">
                      {driveItems.filter(i => i.status === "PENDING" || i.status === "ASSIGNED").length}
                    </span>
                  )}
                </div>
              </div>

              {/* ── Drive Inbox Panel ─────────────────────────────────────── */}
              {showDriveInbox && (
                <div className="rounded-xl border border-blue-500/30 bg-blue-950/10 p-4 mb-4 animate-fadeIn">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <CloudDownload className="w-4 h-4 text-blue-400" />
                      <h3 className="text-sm font-bold text-text-primary">Google Drive Inbox</h3>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full uppercase">
                        {driveItems.filter(i => i.status === "PENDING" || i.status === "ASSIGNED").length} pending
                      </span>
                    </div>
                    <button
                      onClick={handleDriveSync}
                      disabled={driveSyncing}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${driveSyncing ? "animate-spin" : ""}`} />
                      {driveSyncing ? "Syncing..." : "Sync Now"}
                    </button>
                  </div>
                  {driveItems.length === 0 ? (
                    <div className="text-center py-8 text-text-muted text-xs">
                      No files fetched yet. Click "Sync Now" to poll Google Drive.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {driveItems.map((item) => {
                        const isPending = item.status === "PENDING" || item.status === "ASSIGNED";
                        const isDone = item.status === "DONE";
                        const isSkipped = item.status === "SKIPPED";
                        const isProcessing = driveProcessingId === item.id;
                        return (
                          <div key={item.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border ${isDone ? "border-emerald-500/20 bg-emerald-950/10" : isSkipped ? "border-gray-700/40 bg-gray-900/20 opacity-50" : "border-blue-500/20 bg-blue-950/5"}`}>
                            <div className="flex items-center gap-2 min-w-0">
                              <FileText className={`w-4 h-4 shrink-0 ${isDone ? "text-emerald-400" : "text-blue-400"}`} />
                              <div className="min-w-0">
                                <p className="text-[11px] font-semibold text-text-primary truncate">{item.filename}</p>
                                <p className="text-[9px] text-text-muted">{item.account_label} · {item.doc_type}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${isDone ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : isSkipped ? "bg-gray-700/30 text-gray-500 border border-gray-700/30" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>{item.status}</span>
                              {isPending && (
                                <>
                                  <button onClick={() => handleDriveProcess(item)} disabled={isProcessing} title="Process this document" className="w-7 h-7 flex items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors disabled:opacity-50">
                                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                                  </button>
                                  <button onClick={() => handleDriveSkip(item)} title="Skip this file" className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-700/20 text-text-muted border border-gray-700/30 hover:bg-gray-700/40 transition-colors">
                                    <SkipForward className="w-3 h-3" />
                                  </button>
                                </>
                              )}
                              {isSkipped && (
                                <button onClick={() => handleDriveResume(item)} title="Resume this file" className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                                  <RotateCcw className="w-3 h-3" />
                                </button>
                              )}
                              {!isDone && (
                                <button onClick={() => handleDriveDelete(item)} title="Delete from inbox" className="w-7 h-7 flex items-center justify-center rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-bg-hover/50 p-5 rounded-xl border border-border-strong/70 flex flex-col justify-between relative overflow-hidden min-h-[300px]">
                  {!(
                    user?.role === "PROJECT_LEAD" ||
                    user?.role === "ENGAGEMENT_MANAGER" ||
                    user?.role === "ADMIN"
                  ) ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center">
                      <div className="bg-amber-500/10 p-3 rounded-full mb-3 border border-amber-500/20 shadow-sm animate-pulse">
                        <Lock className="w-6 h-6 text-amber-500 dark:text-amber-400" />
                      </div>
                      <h4 className="text-sm font-bold text-text-primary mb-1">
                        Upload Restricted
                      </h4>
                      <p className="text-xs text-text-muted max-w-[280px] leading-relaxed">
                        Only users with the{" "}
                        <strong className="text-[#FF5A14]">Project Lead</strong>{" "}
                        or{" "}
                        <strong className="text-[#FF5A14]">
                          Engagement Manager
                        </strong>{" "}
                        role are authorized to upload or modify Progress
                        Ingestion documents (MOMs & Status Reports).
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider flex items-center gap-2">
                          <UploadCloud className="w-4 h-4 text-[#FF5A14]" />
                          Target Category:{" "}
                          <span className="text-[#FF5A14] font-bold">
                            {getDocTypeLabel(monitoringDocType)}
                          </span>
                        </h4>
                      </div>

                      <form
                        onSubmit={(e) => handleUpload(e, "MONITORING")}
                        className="space-y-4"
                      >
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, "MONITORING")}
                          onClick={
                            uploading
                              ? undefined
                              : () => triggerFileSelect("MONITORING")
                          }
                          className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                            uploading
                              ? "border-border-strong bg-bg-card/10 cursor-not-allowed opacity-50"
                              : isDragging
                                ? "border-[#FF8A55] bg-[#FF5A14]/10 cursor-pointer"
                                : monitoringFile
                                  ? "border-green-500 bg-green-950/10 cursor-pointer"
                                  : "border-slate-300 dark:border-gray-600 hover:border-[#FF8A55] bg-bg-card/40 hover:bg-[#FFF7F2]/40 cursor-pointer"
                          }`}
                        >
                          <input
                            type="file"
                            ref={monitoringFileInputRef}
                            accept=".pdf,.docx,.txt"
                            disabled={uploading}
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                validateAndSetFile(
                                  e.target.files[0],
                                  "MONITORING",
                                );
                              }
                            }}
                            className="hidden"
                          />

                          {monitoringFile ? (
                            <div className="flex flex-col items-center w-full">
                              <div className="flex items-center justify-between bg-bg-hover/80 border border-border-strong rounded-lg p-3 w-full max-w-xs">
                                <div className="flex items-center gap-2 overflow-hidden mr-2">
                                  <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                                  <span className="text-sm truncate text-text-primary">
                                    {monitoringFile.name}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  disabled={uploading}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMonitoringFile(null);
                                  }}
                                  className="p-1 hover:bg-bg-hover rounded text-text-muted hover:text-red-400 transition-colors disabled:opacity-30"
                                >
                                  <X className="h-4 w-4" />
                                </button>
                              </div>
                              {!uploading && (
                                <span className="text-xs text-text-muted mt-2">
                                  Click or drag new file to replace
                                </span>
                              )}
                            </div>
                          ) : (
                            <>
                              <div className="bg-[#FF5A14]/10 p-4 rounded-full mb-4 ring-8 ring-[#FF5A14]/5">
                                <UploadCloud className="w-8 h-8 text-[#FF5A14]" />
                              </div>
                              <div className="text-center">
                                <p className="text-sm text-text-secondary font-medium">
                                  Upload{" "}
                                  <strong className="text-[#FF5A14]">
                                    {getDocTypeLabel(monitoringDocType)}
                                  </strong>
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                  Drag & drop (.pdf, .docx, .txt) or click to
                                  browse
                                </p>
                              </div>
                            </>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={!monitoringFile || uploading}
                          className="w-full py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-[#FF5A14]/20 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-2"
                        >
                          {uploading
                            ? "Uploading Document..."
                            : `Upload ${getDocTypeLabel(monitoringDocType)}`}
                        </button>
                      </form>
                    </div>
                  )}
                </div>

                <div className="bg-bg-hover/50 p-5 rounded-xl border border-border-strong/70 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-3">
                      Execution & Progress History ({trackerDocs.length})
                    </h4>

                    {trackerDocs.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-slate-300 dark:border-gray-750 rounded-xl bg-bg-card/20">
                        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-text-muted font-medium">
                          No progress tracking documents ingested yet.
                        </p>
                        <p className="text-[11px] text-text-muted mt-0.5">
                          Select MOM or Status Report above to upload.
                        </p>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                        {trackerDocs.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex justify-between items-center p-3 bg-bg-card/60 rounded-xl border border-border-strong/50 hover:border-indigo-500/30 transition-all"
                          >
                            <div className="flex flex-col min-w-0 pr-2 w-full">
                              <span className="truncate font-semibold text-xs text-text-primary">
                                {doc.document_name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded font-semibold uppercase">
                                  {doc.document_type}
                                </span>
                              </div>
                              {doc.processing_status === "FAILED" &&
                                doc.processing_error && (
                                  <p className="text-[10px] text-rose-500 dark:text-rose-700 dark:text-rose-400 font-medium font-mono mt-1 whitespace-pre-wrap max-w-full break-words border border-rose-500/20 bg-rose-950/20 rounded-md px-2 py-1 select-text">
                                    Error: {doc.processing_error}
                                  </p>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  doc.processing_status === "COMPLETED"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : doc.processing_status === "PROCESSING" ||
                                        doc.processing_status === "PARSING"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                                      : doc.processing_status === "FAILED"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-blue-500/20 text-blue-500 dark:text-blue-700 dark:text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {doc.processing_status}
                              </span>

                              {(user?.role === "PROJECT_LEAD" ||
                                user?.role === "ENGAGEMENT_MANAGER" ||
                                user?.role === "ADMIN") &&
                                (doc.processing_status === "UPLOADED" ||
                                  doc.processing_status === "FAILED") && (
                                  <button
                                    onClick={() => setProcessingDocId(doc.id)}
                                    title="Extract and process document"
                                    className="p-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-text-primary rounded-lg transition-all"
                                  >
                                    <Play className="h-3 w-3" />
                                  </button>
                                )}

                              {(user?.role === "PROJECT_LEAD" ||
                                user?.role === "ENGAGEMENT_MANAGER" ||
                                user?.role === "ADMIN") &&
                                (doc.processing_status === "UPLOADED" ||
                                  doc.processing_status === "FAILED") && (
                                  <button
                                    onClick={() => handleDeleteDocument(doc.id)}
                                    title="Delete document"
                                    className="p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-text-primary rounded-lg transition-all"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                )}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-bg-panel border border-border-strong/80 rounded-2xl p-6 md:p-8 w-full max-w-lg shadow-2xl relative my-auto">
            <button
              onClick={() => setShowCustomModal(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-text-primary mb-1">
              Add Custom Document Type
            </h3>
            <p className="text-xs text-text-muted mb-6">
              Define a custom document category for recurring progress
              ingestion.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Document Type Name *
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Technical Spec, Architecture Overview..."
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] transition-all"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Description
                </label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What is this document used for?"
                  rows={3}
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] resize-none transition-all"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-border-subtle">
              <button
                type="button"
                onClick={() => setShowCustomModal(false)}
                disabled={addingCustomType}
                className="flex-1 py-2.5 bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#333333] border border-[#D8D8D8] dark:border-[#444444] text-[#666666] dark:text-gray-200 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddCustomType}
                disabled={addingCustomType || !customName.trim()}
                className="flex-1 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#FF5A14]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
              >
                {addingCustomType ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Adding...
                  </>
                ) : (
                  "Add Type"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingDocId !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-border-strong rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-text-primary">
              Delete Document
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Are you sure you want to delete this document? This action is
              permanent and will remove all extracted scope details and related
              data.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-text-secondary text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Why are you deleting this uploaded document?
                </label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Provide a reason for deletion (required)..."
                  rows={3}
                  className="w-full bg-bg-card border border-border-strong rounded-xl p-3.5 text-text-primary focus:outline-none focus:ring-2 focus:ring-[#00e5ff] resize-none text-sm placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingDocId(null);
                  setDeleteReason("");
                }}
                className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:bg-bg-hover transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocument}
                disabled={!deleteReason.trim()}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  !deleteReason.trim()
                    ? "bg-red-900/40 text-red-700 cursor-not-allowed border border-red-950/20"
                    : "bg-red-600 text-text-primary hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {processingDocId !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-border-strong rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4 text-amber-500 dark:text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h2 className="text-xl font-bold mb-2 text-text-primary text-center">
              Confirm Document Processing
            </h2>
            <p className="text-sm text-text-muted mb-6 text-center leading-relaxed font-medium">
              This document{" "}
              <span className="text-text-primary font-bold">
                cannot be deleted
              </span>{" "}
              once processed. Are you sure you want to add this and start the
              analysis?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setProcessingDocId(null)}
                className="flex-1 py-2.5 bg-bg-hover hover:bg-bg-hover text-text-secondary rounded-xl text-xs font-semibold transition-all border border-border-strong cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmProcessDocument}
                className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-text-primary rounded-xl text-xs font-semibold transition-all shadow-md shadow-amber-600/20 cursor-pointer"
              >
                Yes, Start Process
              </button>
            </div>
          </div>
        </div>
      )}

      {/* showRelevancePopup && relevanceCheckResult && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-border-strong rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-text-primary">
              AI Relevance Check
            </h2>
            <p className="text-sm text-text-muted mb-4">
              Analyzing file{" "}
              <span className="text-text-primary font-medium">
                {relevanceCheckResult.original_name}
              </span>{" "}
              against document type{" "}
              <span className="text-text-primary font-medium">{uploadTarget === "BASELINE" ? baselineDocType : monitoringDocType}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-bg-card border border-border-subtle rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs text-text-muted font-semibold uppercase tracking-wide">
                  Relevance Score
                </span>
                <span
                  className={`text-4xl font-extrabold my-2 ${
                    relevanceCheckResult.score >= 60
                      ? "text-green-400"
                      : "text-red-400"
                  }`}
                >
                  {relevanceCheckResult.score}%
                </span>
                {relevanceCheckResult.reasoning && (
                  <p className="text-xs text-text-muted text-center italic mt-1">
                    "{relevanceCheckResult.reasoning}"
                  </p>
                )}
              </div>

              {relevanceCheckResult.score < 60 ? (
                <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-red-400 font-medium">
                    Relevance score is below the 60% requirement. Upload is
                    blocked.
                  </p>
                </div>
              ) : (
                <div className="bg-green-950/20 border border-green-900/50 rounded-xl p-3 text-center">
                  <p className="text-xs text-green-400 font-medium">
                    Relevance check passed. You can finalize the upload.
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowRelevancePopup(false);
                  setRelevanceCheckResult(null);
                }}
                disabled={confirmingUpload}
                className="px-4 py-2 rounded-lg font-medium text-text-secondary hover:bg-bg-hover transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={relevanceCheckResult.score < 60 || confirmingUpload}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-1.5 \${
                  relevanceCheckResult.score < 60 || confirmingUpload
                    ? "bg-blue-900/40 text-blue-700 cursor-not-allowed border border-blue-950/20"
                    : "bg-blue-600 text-text-primary hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                {confirmingUpload ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-text-primary" />
                    Finalizing...
                  </>
                ) : (
                  "Confirm Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      ) */}

      {/* TOAST NOTIFICATION */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#111827] border border-border-strong rounded-2xl p-4 shadow-2xl flex gap-3 animate-slideIn select-none">
          <div className="flex-1">
            <p
              className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
                notification.type === "success"
                  ? "text-emerald-700 dark:text-emerald-400"
                  : notification.type === "error"
                    ? "text-rose-500 dark:text-rose-700 dark:text-rose-400"
                    : "text-cyan-600 dark:text-cyan-700 dark:text-cyan-400"
              }`}
            >
              {notification.type === "success"
                ? "Success"
                : notification.type === "error"
                  ? "Error"
                  : "Notice"}
            </p>
            <p className="text-sm text-text-primary">{notification.message}</p>
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
  );
};
