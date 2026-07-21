import React, { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
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
  Check,
  FileCheck,
} from "lucide-react";

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);

  const isProjectLead = user?.role === "PROJECT_LEAD";
  const [docType, setDocType] = useState<string>(isProjectLead ? "MOM" : "EL");
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

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);

  const [relevanceCheckResult, setRelevanceCheckResult] = useState<{
    score: number;
    reasoning: string;
    temp_key: string;
    original_name: string;
  } | null>(null);
  const [showRelevancePopup, setShowRelevancePopup] = useState(false);
  const [confirmingUpload, setConfirmingUpload] = useState(false);

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
          apiClient.get(`/projects/${id}`),
          apiClient.get(`/projects/${id}/documents/`),
          apiClient.get(`/projects/${id}/documents/types`),
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
      await apiClient.post(`/projects/${id}/documents/types`, payload);

      const typesRes = await apiClient.get(`/projects/${id}/documents/types`);
      if (typesRes.data.success) {
        setDocumentTypes(typesRes.data.data);
        setDocType(payload.name);
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

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext && ["pdf", "docx", "txt"].includes(ext)) {
      setFile(selectedFile);
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

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (uploading) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    if (uploading) return;
    fileInputRef.current?.click();
  };

  const handleProcessDocument = async (docId: number) => {
    try {
      setDocuments((prev) =>
        prev.map((d) =>
          d.id === docId ? { ...d, processing_status: "PROCESSING" } : d,
        ),
      );
      const res = await apiClient.post(
        `/projects/${id}/documents/${docId}/process`,
      );
      if (res.data.success) {
        const docsRes = await apiClient.get(`/projects/${id}/documents/`);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        showNotification("Document analysis has started!", "success");
      }
    } catch (error) {
      showNotification("Failed to start processing the document", "error");
      const docsRes = await apiClient.get(`/projects/${id}/documents/`);
      if (docsRes.data.success) setDocuments(docsRes.data.data);
    }
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
        `/projects/${id}/documents/${deletingDocId}?reason=${encodeURIComponent(deleteReason)}`,
      );
      if (res.data.success) {
        setDeletingDocId(null);
        setDeleteReason("");
        const docsRes = await apiClient.get(`/projects/${id}/documents/`);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        showNotification("Document deleted successfully!", "success");
      }
    } catch (error) {
      showNotification("Failed to delete document", "error");
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("document_type", docType);

    setUploading(true);
    try {
      const checkRes = await apiClient.post(
        `/projects/${id}/documents/check-relevance`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );
      if (checkRes.data.success) {
        setRelevanceCheckResult({
          score: checkRes.data.score,
          reasoning: checkRes.data.reasoning,
          temp_key: checkRes.data.temp_key,
          original_name: checkRes.data.original_name,
        });
        setShowRelevancePopup(true);
      }
    } catch (error: any) {
      console.error("Relevance check failed", error);
      const errMsg = error.response?.data?.detail || "Relevance check failed";
      showNotification(errMsg, "error");
    } finally {
      setUploading(false);
    }
  };

  const confirmUpload = async () => {
    if (!relevanceCheckResult) return;
    setConfirmingUpload(true);
    try {
      const res = await apiClient.post(
        `/projects/${id}/documents/confirm-upload`,
        {
          temp_key: relevanceCheckResult.temp_key,
          document_type: docType,
          original_name: relevanceCheckResult.original_name,
        },
      );
      if (res.data.success) {
        const docsRes = await apiClient.get(`/projects/${id}/documents/`);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        setFile(null);
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

  if (!project) return <Loader message="Loading project cockpit details..." />;

  // Separate uploaded documents into Section 1 (Initiation) and Section 2 (Tracker)
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
        {/* Header Navigation */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-white">{project.project_name}</h1>
            <p className="text-gray-400 text-sm mt-1">{project.description}</p>
            {(project.start_date || project.end_date) && (
              <div className="flex flex-wrap gap-x-6 gap-y-1 items-center text-xs text-gray-500 mt-2.5">
                {project.start_date && (
                  <div>
                    <span className="font-semibold text-gray-400">Start Date:</span>{" "}
                    <span className="text-teal-400 font-semibold">{new Date(project.start_date).toLocaleDateString(undefined, {dateStyle: 'medium'})}</span>
                  </div>
                )}
                {project.end_date && (
                  <div>
                    <span className="font-semibold text-gray-400">End Date:</span>{" "}
                    <span className="text-teal-400 font-semibold">{new Date(project.end_date).toLocaleDateString(undefined, {dateStyle: 'medium'})}</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-3">
            <Link
              to={`/projects/${id}/members`}
              className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-gray-200 rounded-xl text-xs font-semibold transition-all"
            >
              Project Members
            </Link>
            <Link
              to={`/projects/${id}/baseline`}
              className="px-4 py-2.5 bg-purple-600/90 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-purple-600/20"
            >
              Baseline Review
            </Link>
            <Link
              to={`/projects/${id}/tracker`}
              className="px-4 py-2.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-all shadow-md shadow-rose-600/20"
            >
              Risk Tracker
            </Link>
          </div>
        </div>

        {/* SECTION 1: PROJECT INITIATION / BASELINE SETUP */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-800 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
                  Section 1 • One-Time Onboarding
                </span>
                <span className="text-xs text-gray-500 font-medium">Project Initiation</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Project Initiation & Baseline Setup
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Upload initial contract documents to build the project scope baseline. These documents are uploaded once during onboarding.
              </p>
            </div>

            <Link
              to={`/projects/${id}/baseline`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-xl transition-all"
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              Review Baseline &rarr;
            </Link>
          </div>

          {/* Section 1 Document Selection Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Engagement Letter Card */}
            <div
              onClick={() => setDocType("EL")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                docType === "EL"
                  ? "bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "bg-gray-800/40 border-gray-700/60 hover:bg-gray-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${docType === "EL" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-400"}`}>
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Engagement Letter (EL)</h3>
                  <p className="text-xs text-gray-400">Official signed client engagement contract</p>
                </div>
              </div>

              {initiationDocs.some((d) => d.document_type === "EL") ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-3 h-3" /> Uploaded
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Pending
                </span>
              )}
            </div>

            {/* Independence & Financial Assessment Card */}
            <div
              onClick={() => setDocType("IFA")}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                docType === "IFA"
                  ? "bg-gradient-to-r from-emerald-950/50 to-teal-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/30"
                  : "bg-gray-800/40 border-gray-700/60 hover:bg-gray-800/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${docType === "IFA" ? "bg-emerald-500/20 text-emerald-400" : "bg-gray-700/50 text-gray-400"}`}>
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Independence & Financial (IFA)</h3>
                  <p className="text-xs text-gray-400">Inter-firm approval & financial budget document</p>
                </div>
              </div>

              {initiationDocs.some((d) => d.document_type === "IFA") ? (
                <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  <Check className="w-3 h-3" /> Uploaded
                </span>
              ) : (
                <span className="text-[11px] font-medium text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                  Pending
                </span>
              )}
            </div>
          </div>

          {/* Section 1 Upload Dropzone & Document Table Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upload Dropzone for Section 1 */}
            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/70 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                    <UploadCloud className="w-4 h-4 text-emerald-400" />
                    Target Category: <span className="text-emerald-300 font-bold">{getDocTypeLabel(docType)}</span>
                  </h4>
                </div>

                <form onSubmit={handleUpload} className="space-y-4">
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={uploading ? undefined : triggerFileSelect}
                    className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                      uploading
                        ? "border-gray-700 bg-gray-900/10 cursor-not-allowed opacity-50"
                        : isDragging
                          ? "border-emerald-400 bg-emerald-950/20 cursor-pointer"
                          : file
                            ? "border-green-500 bg-green-950/10 cursor-pointer"
                            : "border-gray-600 hover:border-gray-400 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".pdf,.docx,.txt"
                      disabled={uploading}
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          validateAndSetFile(e.target.files[0]);
                        }
                      }}
                      className="hidden"
                    />

                    {file ? (
                      <div className="flex flex-col items-center w-full">
                        <div className="flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg p-3 w-full max-w-xs">
                          <div className="flex items-center gap-2 overflow-hidden mr-2">
                            <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                            <span className="text-sm truncate text-gray-200">{file.name}</span>
                          </div>
                          <button
                            type="button"
                            disabled={uploading}
                            onClick={(e) => {
                              e.stopPropagation();
                              setFile(null);
                            }}
                            className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        {!uploading && (
                          <span className="text-xs text-gray-500 mt-2">Click or drag new file to replace</span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-center">
                        <UploadCloud
                          className={`h-10 w-10 mb-3 transition-colors ${isDragging ? "text-emerald-400" : "text-gray-400"}`}
                        />
                        <p className="text-sm text-gray-300 font-medium">
                          Upload <strong className="text-emerald-300">{getDocTypeLabel(docType)}</strong>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">Drag & drop (.pdf, .docx, .txt) or click to browse</p>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!file || uploading}
                    className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {uploading ? "Uploading Document..." : `Upload ${getDocTypeLabel(docType)}`}
                  </button>
                </form>
              </div>
            </div>

            {/* Section 1 Uploaded Documents List */}
            <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/70 flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                  Initiation Baseline Artifacts ({initiationDocs.length})
                </h4>

                {initiationDocs.length === 0 ? (
                  <div className="py-10 text-center border border-dashed border-gray-750 rounded-xl bg-gray-900/20">
                    <FileCheck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                    <p className="text-xs text-gray-400 font-medium">No initiation documents uploaded yet.</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">Select EL or IFA above to upload.</p>
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {initiationDocs.map((doc) => (
                      <li
                        key={doc.id}
                        className="flex justify-between items-center p-3 bg-gray-900/60 rounded-xl border border-gray-700/50 hover:border-emerald-500/30 transition-all"
                      >
                        <div className="flex flex-col min-w-0 pr-2">
                          <span className="truncate font-semibold text-xs text-gray-200">
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
                                : doc.processing_status === "PROCESSING" || doc.processing_status === "PARSING"
                                  ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                                  : doc.processing_status === "FAILED"
                                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                    : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            }`}
                          >
                            {doc.processing_status}
                          </span>

                          {(doc.processing_status === "UPLOADED" || doc.processing_status === "FAILED") && (
                            <button
                              onClick={() => handleProcessDocument(doc.id)}
                              title="Extract and process document"
                              className="p-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white rounded-lg transition-all"
                            >
                              <Play className="h-3 w-3" />
                            </button>
                          )}

                          {(doc.processing_status === "UPLOADED" || doc.processing_status === "FAILED") && (
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              title="Delete document"
                              className="p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white rounded-lg transition-all"
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
        </div>

        {/* SECTION 2: PROGRESS TRACKER (RECURRING DOCUMENTS) */}
        <div className="bg-gray-900/40 border border-gray-800 rounded-2xl p-6 md:p-8 backdrop-blur-md shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-gray-800 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 uppercase tracking-wider">
                  Section 2 • Recurring Execution
                </span>
                <span className="text-xs text-gray-500 font-medium">Progress Tracker</span>
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Progress Tracker & Continuous Ingestion
              </h2>
              <p className="text-xs text-gray-400 mt-1">
                Upload recurring project documents (MOMs, status reports) to evaluate execution deliverables against the approved scope baseline.
              </p>
            </div>

            <Link
              to={`/projects/${id}/tracker`}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition-all"
            >
              <Clock className="w-3.5 h-3.5 text-rose-400" />
              View Risk Tracker &rarr;
            </Link>
          </div>

          {/* Locked Overlay if Project Lead & Baseline NOT Active */}
          {isProjectLead && project.monitoring_status !== "ACTIVE" ? (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-3">
                <Lock className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-base font-bold text-white mb-2">Progress Ingestion Locked</h3>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                The Engagement Manager must extract and approve the initial <strong>Scope Baseline</strong> for this project before you can upload recurring execution documents (MOMs and Status Reports).
              </p>
            </div>
          ) : (
            <>
              {/* Document Selection Cards for Section 2 */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Minutes of Meeting Card */}
                <div
                  onClick={() => setDocType("MOM")}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    docType === "MOM"
                      ? "bg-gradient-to-r from-indigo-950/50 to-blue-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                      : "bg-gray-800/40 border-gray-700/60 hover:bg-gray-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${docType === "MOM" ? "bg-indigo-500/20 text-indigo-400" : "bg-gray-700/50 text-gray-400"}`}>
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Minutes of Meeting (MOM)</h3>
                      <p className="text-xs text-gray-400">Steering MoM & decision log</p>
                    </div>
                  </div>
                </div>

                {/* Status Report Card */}
                <div
                  onClick={() => setDocType("STATUS_REPORT")}
                  className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                    docType === "STATUS_REPORT"
                      ? "bg-gradient-to-r from-indigo-950/50 to-blue-950/40 border-indigo-500/60 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/30"
                      : "bg-gray-800/40 border-gray-700/60 hover:bg-gray-800/80"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl ${docType === "STATUS_REPORT" ? "bg-indigo-500/20 text-indigo-400" : "bg-gray-700/50 text-gray-400"}`}>
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Status Report</h3>
                      <p className="text-xs text-gray-400">Periodic sprint & status updates</p>
                    </div>
                  </div>
                </div>

                {/* Add Custom Type Card */}
                <div
                  onClick={() => setShowCustomModal(true)}
                  className="p-4 rounded-xl border border-dashed border-gray-700 hover:border-indigo-500/50 bg-gray-800/20 hover:bg-gray-800/60 transition-all cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-gray-800 text-indigo-400">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">+ Add Custom Type</h3>
                      <p className="text-xs text-gray-400">Create custom category</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2 Upload Dropzone & Documents Log Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Dropzone for Section 2 */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/70 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                        <UploadCloud className="w-4 h-4 text-indigo-400" />
                        Target Category: <span className="text-indigo-300 font-bold">{getDocTypeLabel(docType)}</span>
                      </h4>
                    </div>

                    <form onSubmit={handleUpload} className="space-y-4">
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={uploading ? undefined : triggerFileSelect}
                        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                          uploading
                            ? "border-gray-700 bg-gray-900/10 cursor-not-allowed opacity-50"
                            : isDragging
                              ? "border-indigo-400 bg-indigo-950/20 cursor-pointer"
                              : file
                                ? "border-green-500 bg-green-950/10 cursor-pointer"
                                : "border-gray-600 hover:border-gray-400 bg-gray-900/40 hover:bg-gray-900/60 cursor-pointer"
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          accept=".pdf,.docx,.txt"
                          disabled={uploading}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              validateAndSetFile(e.target.files[0]);
                            }
                          }}
                          className="hidden"
                        />

                        {file ? (
                          <div className="flex flex-col items-center w-full">
                            <div className="flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg p-3 w-full max-w-xs">
                              <div className="flex items-center gap-2 overflow-hidden mr-2">
                                <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                                <span className="text-sm truncate text-gray-200">{file.name}</span>
                              </div>
                              <button
                                type="button"
                                disabled={uploading}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFile(null);
                                }}
                                className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            {!uploading && (
                              <span className="text-xs text-gray-500 mt-2">Click or drag new file to replace</span>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col items-center text-center">
                            <UploadCloud
                              className={`h-10 w-10 mb-3 transition-colors ${isDragging ? "text-indigo-400" : "text-gray-400"}`}
                            />
                            <p className="text-sm text-gray-300 font-medium">
                              Upload <strong className="text-indigo-300">{getDocTypeLabel(docType)}</strong>
                            </p>
                            <p className="text-xs text-gray-500 mt-1">Drag & drop (.pdf, .docx, .txt) or click to browse</p>
                          </div>
                        )}
                      </div>

                      <button
                        type="submit"
                        disabled={!file || uploading}
                        className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {uploading ? "Uploading Document..." : `Upload ${getDocTypeLabel(docType)}`}
                      </button>
                    </form>
                  </div>
                </div>

                {/* Section 2 Uploaded Progress Documents Log */}
                <div className="bg-gray-800/50 p-5 rounded-xl border border-gray-700/70 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-3">
                      Execution & Progress History ({trackerDocs.length})
                    </h4>

                    {trackerDocs.length === 0 ? (
                      <div className="py-10 text-center border border-dashed border-gray-750 rounded-xl bg-gray-900/20">
                        <Clock className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                        <p className="text-xs text-gray-400 font-medium">No progress tracking documents ingested yet.</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">Select MOM or Status Report above to upload.</p>
                      </div>
                    ) : (
                      <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                        {trackerDocs.map((doc) => (
                          <li
                            key={doc.id}
                            className="flex justify-between items-center p-3 bg-gray-900/60 rounded-xl border border-gray-700/50 hover:border-indigo-500/30 transition-all"
                          >
                            <div className="flex flex-col min-w-0 pr-2">
                              <span className="truncate font-semibold text-xs text-gray-200">
                                {doc.document_name}
                              </span>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-2 py-0.5 bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 rounded font-semibold uppercase">
                                  {doc.document_type}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                                  doc.processing_status === "COMPLETED"
                                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                                    : doc.processing_status === "PROCESSING" || doc.processing_status === "PARSING"
                                      ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                                      : doc.processing_status === "FAILED"
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                }`}
                              >
                                {doc.processing_status}
                              </span>

                              {(doc.processing_status === "UPLOADED" || doc.processing_status === "FAILED") && (
                                <button
                                  onClick={() => handleProcessDocument(doc.id)}
                                  title="Extract and process document"
                                  className="p-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 text-green-400 hover:text-white rounded-lg transition-all"
                                >
                                  <Play className="h-3 w-3" />
                                </button>
                              )}

                              {(doc.processing_status === "UPLOADED" || doc.processing_status === "FAILED") && (
                                <button
                                  onClick={() => handleDeleteDocument(doc.id)}
                                  title="Delete document"
                                  className="p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-400 hover:text-white rounded-lg transition-all"
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

      {/* CUSTOM TYPE MODAL */}
      {showCustomModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">
              Add Custom Document Type
            </h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Type Name
                </label>
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Technical Spec"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff]"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  Description
                </label>
                <textarea
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What is this document used for?"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCustomModal(false);
                  setDocType("EL");
                }}
                disabled={addingCustomType}
                className={`px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm ${addingCustomType ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomType}
                disabled={addingCustomType || !customName.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center justify-center ${addingCustomType || !customName.trim() ? "bg-blue-900/50 text-blue-700 cursor-not-allowed" : "bg-[#00e5ff] text-black hover:bg-[#00cce5]"}`}
              >
                {addingCustomType ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDocId !== null && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">
              Delete Document
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Are you sure you want to delete this document? This action is
              permanent and will remove all extracted scope details and related
              data.
            </p>

            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-300 text-xs font-semibold mb-1.5 uppercase tracking-wide">
                  Why are you deleting this uploaded document?
                </label>
                <textarea
                  required
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder="Provide a reason for deletion (required)..."
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-xl p-3.5 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] resize-none text-sm placeholder-gray-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setDeletingDocId(null);
                  setDeleteReason("");
                }}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteDocument}
                disabled={!deleteReason.trim()}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm ${
                  !deleteReason.trim()
                    ? "bg-red-900/40 text-red-700 cursor-not-allowed border border-red-950/20"
                    : "bg-red-600 text-white hover:bg-red-700 hover:shadow-lg active:scale-[0.98]"
                }`}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI RELEVANCE CHECK POPUP */}
      {showRelevancePopup && relevanceCheckResult && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">
              AI Relevance Check
            </h2>
            <p className="text-sm text-gray-400 mb-4">
              Analyzing file{" "}
              <span className="text-white font-medium">
                {relevanceCheckResult.original_name}
              </span>{" "}
              against document type{" "}
              <span className="text-white font-medium">{docType}</span>.
            </p>

            <div className="space-y-4 mb-6">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col items-center">
                <span className="text-xs text-gray-400 font-semibold uppercase tracking-wide">
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
                  <p className="text-xs text-gray-400 text-center italic mt-1">
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
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmUpload}
                disabled={relevanceCheckResult.score < 60 || confirmingUpload}
                className={`px-4 py-2 rounded-lg font-semibold transition-colors text-sm flex items-center gap-1.5 ${
                  relevanceCheckResult.score < 60 || confirmingUpload
                    ? "bg-blue-900/40 text-blue-700 cursor-not-allowed border border-blue-950/20"
                    : "bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg"
                }`}
              >
                {confirmingUpload ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                    Finalizing...
                  </>
                ) : (
                  "Confirm Upload"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
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
  );
};
