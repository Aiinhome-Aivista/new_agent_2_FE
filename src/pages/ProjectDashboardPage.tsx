import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import type { Project } from "../types";
import { Loader } from "../components/Loader";
import { useAuth } from "../auth/AuthContext";
import { UploadCloud, X, FileText, Play, Trash2, Loader2, Lock } from "lucide-react";

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const isProjectLead = user?.role === "PROJECT_LEAD";
  const [docType, setDocType] = useState<string>(isProjectLead ? "MOM" : "EL");
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
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
      }, 15000); // 15 seconds
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

      // Refresh types
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

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === "ADD_CUSTOM") {
      setShowCustomModal(true);
    } else {
      setDocType(e.target.value);
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

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">{project.project_name}</h1>
          <div className="flex gap-4">
            <Link
              to={`/projects/${id}/baseline`}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md"
            >
              Baseline Review
            </Link>
            <Link
              to={`/projects/${id}/tracker`}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md"
            >
              Risk Tracker
            </Link>
          </div>
        </div>
        <p className="text-gray-400 mb-8">{project.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {isProjectLead && project.monitoring_status !== 'ACTIVE' ? (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-bold mb-3">Upload Locked</h2>
              <p className="text-gray-400 text-sm leading-relaxed max-w-sm">
                The Engagement Manager must extract and approve the <strong>Scope Baseline</strong> for this project before you can upload execution documents (like MOMs or Status Reports).
              </p>
            </div>
          ) : (
            <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
              <h2 className="text-xl font-bold mb-4">Upload Document</h2>
              <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">
                  Document Type
                </label>
                <select
                  disabled={uploading}
                  value={docType}
                  onChange={handleDocTypeChange}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {documentTypes
                    .filter((type) => {
                      // Project Lead cannot upload EL or IFA
                      if (isProjectLead && (type.name === "EL" || type.name === "IFA")) return false;
                      return true;
                    })
                    .map((type, idx) => (
                    <option
                      key={idx}
                      value={type.name}
                      title={type.description}
                    >
                      {type.label}
                    </option>
                  ))}
                  <option
                    value="ADD_CUSTOM"
                    className="text-blue-400 font-bold"
                  >
                    + Add Custom Type...
                  </option>
                </select>
                {documentTypes.find((t) => t.name === docType)?.description && (
                  <p className="text-xs text-gray-400 mt-1.5 italic bg-gray-900/30 border border-gray-700/50 p-2 rounded-lg">
                    <span className="font-semibold text-gray-300">
                      Description:{" "}
                    </span>
                    {documentTypes.find((t) => t.name === docType)?.description}
                  </p>
                )}
              </div>
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={uploading ? undefined : triggerFileSelect}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-all duration-200 ${
                    uploading
                      ? "border-gray-700 bg-gray-900/10 cursor-not-allowed opacity-50"
                      : isDragging
                        ? "border-[#00e5ff] bg-cyan-950/20 cursor-pointer"
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
                          <span className="text-sm truncate text-gray-200">
                            {file.name}
                          </span>
                        </div>
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      {!uploading && (
                        <span className="text-xs text-gray-500 mt-2">
                          Click or drag new file to replace
                        </span>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <UploadCloud
                        className={`h-10 w-10 mb-3 transition-colors ${isDragging ? "text-[#00e5ff]" : "text-gray-400"}`}
                      />
                      <p className="text-sm text-gray-300 font-medium">
                        Drag & drop your file here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse files
                      </p>
                    </div>
                  )}
                </div>
                <label className="block text-gray-400 mt-2 text-xs font-medium text-center">
                  Upload File (.pdf, .docx, .txt)
                </label>
              </div>
              <button
                type="submit"
                disabled={!file || uploading}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
            </form>
          </div>
          )}

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-400">No data found</p>
            ) : (
              <ul className="space-y-2">
                {documents.map((doc) => (
                  <li
                    key={doc.id}
                    className="flex justify-between items-center p-3 bg-gray-700 rounded-md"
                  >
                    <div className="flex flex-col min-w-0">
                      <span className="truncate font-medium text-sm text-gray-200">
                        {doc.document_name}
                      </span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-600 text-gray-300 rounded font-semibold uppercase">
                          {doc.document_type}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                          doc.processing_status === "COMPLETED"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : doc.processing_status === "PROCESSING" ||
                                doc.processing_status === "PARSING"
                              ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 animate-pulse"
                              : doc.processing_status === "FAILED"
                                ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                        }`}
                      >
                        {doc.processing_status}
                      </span>

                      {/* Process button (shows when status is UPLOADED or FAILED) */}
                      {(doc.processing_status === "UPLOADED" ||
                        doc.processing_status === "FAILED") && (
                        <button
                          onClick={() => handleProcessDocument(doc.id)}
                          title="Process document (chunk and embed into AI)"
                          className="p-1.5 bg-green-600/20 hover:bg-green-600 border border-green-500/30 hover:border-green-500 text-green-400 hover:text-white rounded-md transition-all duration-150"
                        >
                          <Play className="h-3 w-3" />
                        </button>
                      )}

                      {/* Delete button (shows only for UPLOADED or FAILED documents) */}
                      {(doc.processing_status === "UPLOADED" ||
                        doc.processing_status === "FAILED") && (
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          title="Delete document"
                          className="p-1.5 bg-red-600/20 hover:bg-red-600 border border-red-500/30 hover:border-red-500 text-red-400 hover:text-white rounded-md transition-all duration-150"
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

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
                  setDocType("EL"); // Reset to default
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

      {deletingDocId !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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

      {showRelevancePopup && relevanceCheckResult && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
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
