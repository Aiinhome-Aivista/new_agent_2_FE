import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import {
  CloudDownload,
  Plus,
  Trash2,
  RefreshCw,
  X,
  FileText,
  Check,
  AlertTriangle,
  ShieldCheck,
  FolderOpen,
  ExternalLink,
  Layers,
} from "lucide-react";

export const DriveInboxPage: React.FC = () => {
  const { user } = useAuth();

  // Active Tab: "gdrive" | "onedrive"
  const [activeTab, setActiveTab] = useState<"gdrive" | "onedrive">("gdrive");

  // Shared state
  const [projects, setProjects] = useState<any[]>([]);

  // ── Google Drive State ─────────────────────────────────────────────────────
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Google Drive account modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState("");
  const [serviceEmail, setServiceEmail] = useState("");
  const [folderId, setFolderId] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  // ── Microsoft OneDrive State ───────────────────────────────────────────────
  const [onedriveAccounts, setOnedriveAccounts] = useState<any[]>([]);
  const [onedriveInboxItems, setOnedriveInboxItems] = useState<any[]>([]);
  const [onedriveLoading, setOnedriveLoading] = useState(true);
  const [syncingOneDrive, setSyncingOneDrive] = useState(false);

  // Add OneDrive account modal state
  const [showAddOneDriveModal, setShowAddOneDriveModal] = useState(false);
  const [odLabel, setOdLabel] = useState("");
  const [odTenantId, setOdTenantId] = useState("");
  const [odClientId, setOdClientId] = useState("");
  const [odClientSecret, setOdClientSecret] = useState("");
  const [odDriveType, setOdDriveType] = useState<"USER_DRIVE" | "SHAREPOINT_DRIVE">("USER_DRIVE");
  const [odTargetUserEmail, setOdTargetUserEmail] = useState("");
  const [odTargetDriveId, setOdTargetDriveId] = useState("");
  const [odFolderId, setOdFolderId] = useState("root");
  const [odAdding, setOdAdding] = useState(false);
  const [odError, setOdError] = useState("");

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchGDriveData = async () => {
    try {
      const [accRes, projRes, inboxRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.DRIVE.ACCOUNTS),
        apiClient.get(API_ENDPOINTS.PROJECTS.LIST),
        apiClient.get(API_ENDPOINTS.DRIVE.INBOX),
      ]);
      setAccounts(accRes.data?.data || []);
      setProjects(projRes.data?.data || []);
      setInboxItems(inboxRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch Google Drive data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOneDriveData = async () => {
    try {
      const [accRes, projRes, inboxRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.ONEDRIVE.ACCOUNTS),
        apiClient.get(API_ENDPOINTS.PROJECTS.LIST),
        apiClient.get(API_ENDPOINTS.ONEDRIVE.INBOX),
      ]);
      setOnedriveAccounts(accRes.data?.data || []);
      setProjects(projRes.data?.data || []);
      setOnedriveInboxItems(inboxRes.data?.data || []);
    } catch (err) {
      console.error("Failed to fetch OneDrive data:", err);
    } finally {
      setOnedriveLoading(false);
    }
  };

  useEffect(() => {
    fetchGDriveData();
    fetchOneDriveData();
  }, []);

  // ── Google Drive Handlers ──────────────────────────────────────────────────

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      await apiClient.post(API_ENDPOINTS.DRIVE.ACCOUNTS, {
        label,
        service_email: serviceEmail,
        folder_id: folderId,
        credentials_json: credentialsJson,
      });
      setShowAddModal(false);
      setLabel("");
      setServiceEmail("");
      setFolderId("");
      setCredentialsJson("");
      fetchGDriveData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add account");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Are you sure you want to remove this Drive account?")) return;
    try {
      await apiClient.delete(API_ENDPOINTS.DRIVE.ACCOUNT_DETAIL(id));
      fetchGDriveData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncAll = async () => {
    try {
      await apiClient.post(API_ENDPOINTS.DRIVE.SYNC);
      fetchGDriveData();
      alert("Google Drive sync completed.");
    } catch (err) {
      alert("Google Drive sync failed.");
    }
  };

  const handleAssignProject = async (inboxId: number, projectId: string) => {
    if (!projectId) return;
    try {
      await apiClient.patch(API_ENDPOINTS.DRIVE.ASSIGN_INBOX(inboxId), {
        project_id: parseInt(projectId),
        doc_type: "MOM",
      });
      fetchGDriveData();
    } catch (err) {
      alert("Failed to assign project.");
    }
  };

  // ── Microsoft OneDrive Handlers ────────────────────────────────────────────

  const handleAddOneDriveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setOdAdding(true);
    setOdError("");
    try {
      await apiClient.post(API_ENDPOINTS.ONEDRIVE.ACCOUNTS, {
        label: odLabel,
        tenant_id: odTenantId,
        client_id: odClientId,
        client_secret: odClientSecret,
        drive_type: odDriveType,
        target_user_email: odDriveType === "USER_DRIVE" ? odTargetUserEmail : undefined,
        target_drive_id: odDriveType === "SHAREPOINT_DRIVE" ? odTargetDriveId : undefined,
        folder_id: odFolderId || "root",
      });
      setShowAddOneDriveModal(false);
      setOdLabel("");
      setOdTenantId("");
      setOdClientId("");
      setOdClientSecret("");
      setOdTargetUserEmail("");
      setOdTargetDriveId("");
      setOdFolderId("root");
      fetchOneDriveData();
    } catch (err: any) {
      setOdError(err?.response?.data?.detail || "Failed to add OneDrive account");
    } finally {
      setOdAdding(false);
    }
  };

  const handleDeleteOneDriveAccount = async (id: number) => {
    if (!confirm("Are you sure you want to remove this OneDrive account?")) return;
    try {
      await apiClient.delete(API_ENDPOINTS.ONEDRIVE.ACCOUNT_DETAIL(id));
      fetchOneDriveData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncOneDriveAll = async () => {
    setSyncingOneDrive(true);
    try {
      await apiClient.post(API_ENDPOINTS.ONEDRIVE.SYNC);
      await fetchOneDriveData();
      alert("Microsoft OneDrive sync completed.");
    } catch (err) {
      alert("Microsoft OneDrive sync failed.");
    } finally {
      setSyncingOneDrive(false);
    }
  };

  const handleAssignOneDriveProject = async (inboxId: number, projectId: string) => {
    if (!projectId) return;
    try {
      await apiClient.patch(API_ENDPOINTS.ONEDRIVE.ASSIGN_INBOX(inboxId), {
        project_id: parseInt(projectId),
        doc_type: "MOM",
      });
      fetchOneDriveData();
    } catch (err) {
      alert("Failed to assign project.");
    }
  };

  if (user?.role !== "ADMIN" && user?.role !== "ENGAGEMENT_MANAGER") {
    return (
      <div className="p-8 text-center text-text-muted">
        Only Engagement Managers and Admins can configure cloud storage integration.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CloudDownload className="w-6 h-6 text-blue-500" />
            Cloud Storage Inboxes
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure automated cloud connectors to fetch and index project documents.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 p-1 bg-bg-card border border-border-strong rounded-2xl shadow-sm">
          <button
            onClick={() => setActiveTab("gdrive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "gdrive"
                ? "bg-blue-600 text-white shadow"
                : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-blue-300" />
            Google Drive
            {accounts.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "gdrive" ? "bg-blue-700 text-white" : "bg-bg-hover text-text-muted"}`}>
                {accounts.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("onedrive")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "onedrive"
                ? "bg-[#0078D4] text-white shadow"
                : "text-text-muted hover:text-text-primary hover:bg-bg-hover"
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-sky-300" />
            Microsoft OneDrive
            {onedriveAccounts.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeTab === "onedrive" ? "bg-[#005a9e] text-white" : "bg-bg-hover text-text-muted"}`}>
                {onedriveAccounts.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 1: GOOGLE DRIVE                                                    */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "gdrive" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-blue-500" />
                Google Drive Accounts
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Service accounts polling Google Drive folders for project deliverables.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncAll}
                className="flex items-center gap-2 px-4 py-2 bg-bg-hover text-text-primary font-bold text-xs rounded-xl border border-[#D8D8D8] dark:border-[#444444] hover:bg-bg-card transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Sync All Now
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Google Account
              </button>
            </div>
          </div>

          <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading Google Drive accounts...</div>
            ) : accounts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
                  <CloudDownload className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">No Google Drive Accounts Configured</h3>
                <p className="text-sm text-text-muted max-w-md mb-4">
                  Add a Google Service Account credentials JSON and a Folder ID to start automatically fetching project documents.
                </p>
                <button
                  onClick={() => setShowAddModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Add First Account
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-strong bg-bg-hover/50 text-xs text-text-muted uppercase tracking-wider">
                    <th className="p-4 font-bold">Label / Email</th>
                    <th className="p-4 font-bold">Folder ID</th>
                    <th className="p-4 font-bold">Last Synced</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {accounts.map((acct) => (
                    <tr key={acct.id} className="border-b border-border-strong last:border-0 hover:bg-bg-hover/20">
                      <td className="p-4">
                        <div className="font-bold text-text-primary">{acct.label}</div>
                        <div className="text-xs text-text-muted font-mono mt-0.5">{acct.service_email}</div>
                      </td>
                      <td className="p-4 font-mono text-xs text-text-muted break-all max-w-[200px]">
                        {acct.folder_id}
                      </td>
                      <td className="p-4 text-text-muted">
                        {acct.last_synced_at ? new Date(acct.last_synced_at + "Z").toLocaleString() : "Never"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteAccount(acct.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Remove Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#FF5A14]" />
              Global Google Drive Inbox
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Review all files fetched from Google Drive folders. Unmatched files can be linked manually.
            </p>
          </div>

          <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm">
            {loading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading inbox...</div>
            ) : inboxItems.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">No files in the Google Drive inbox yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-strong bg-bg-hover/50 text-xs text-text-muted uppercase tracking-wider">
                    <th className="p-4 font-bold">File Name</th>
                    <th className="p-4 font-bold">Source Account</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Matched Project</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {inboxItems.map((item) => (
                    <tr key={item.id} className="border-b border-border-strong last:border-0 hover:bg-bg-hover/20">
                      <td className="p-4">
                        <div className="font-bold text-text-primary">{item.filename}</div>
                        <div className="text-xs text-text-muted mt-0.5">{new Date(item.fetched_at + "Z").toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-text-muted">{item.account_label}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          item.status === "DONE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          item.status === "ASSIGNED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          item.status === "SKIPPED" ? "bg-gray-500/10 text-gray-400 border border-gray-500/20" :
                          "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.matched_project_id ? (
                          <span className="text-text-primary font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            {projects.find(p => p.id === item.matched_project_id)?.project_name || projects.find(p => p.id === item.matched_project_id)?.name || `Project #${item.matched_project_id}`}
                          </span>
                        ) : (
                          <select
                            className="border border-border-strong rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                            style={{ backgroundColor: "#1e293b", color: "#f8fafc", maxHeight: "200px" }}
                            onChange={(e) => handleAssignProject(item.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>Assign to project...</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id} style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>{p.project_name || p.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* TAB 2: MICROSOFT ONEDRIVE                                              */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {activeTab === "onedrive" && (
        <div className="space-y-8 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#0078D4]" />
                Microsoft OneDrive & SharePoint Accounts
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Azure AD / Microsoft Entra registered connectors for automated document ingestion.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleSyncOneDriveAll}
                disabled={syncingOneDrive}
                className="flex items-center gap-2 px-4 py-2 bg-bg-hover text-text-primary font-bold text-xs rounded-xl border border-[#D8D8D8] dark:border-[#444444] hover:bg-bg-card transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${syncingOneDrive ? "animate-spin" : ""}`} />
                {syncingOneDrive ? "Syncing..." : "Sync OneDrive Now"}
              </button>
              <button
                onClick={() => setShowAddOneDriveModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] hover:bg-[#005a9e] text-white font-bold text-xs rounded-xl shadow-md transition-all"
              >
                <Plus className="w-4 h-4" />
                Add OneDrive Account
              </button>
            </div>
          </div>

          <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm">
            {onedriveLoading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading OneDrive accounts...</div>
            ) : onedriveAccounts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-sky-500/10 flex items-center justify-center mb-4">
                  <CloudDownload className="w-8 h-8 text-[#0078D4]" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">No OneDrive Accounts Configured</h3>
                <p className="text-sm text-text-muted max-w-md mb-4">
                  Connect your Microsoft Entra ID (Azure AD) App Registration to ingest documents from OneDrive for Business or SharePoint document libraries.
                </p>
                <button
                  onClick={() => setShowAddOneDriveModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0078D4] hover:bg-[#005a9e] text-white font-bold text-xs rounded-xl shadow-md transition-all"
                >
                  <Plus className="w-4 h-4" />
                  Configure OneDrive
                </button>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-strong bg-bg-hover/50 text-xs text-text-muted uppercase tracking-wider">
                    <th className="p-4 font-bold">Account Label</th>
                    <th className="p-4 font-bold">Type / Target</th>
                    <th className="p-4 font-bold">Tenant / Client ID</th>
                    <th className="p-4 font-bold">Last Synced</th>
                    <th className="p-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {onedriveAccounts.map((acct) => (
                    <tr key={acct.id} className="border-b border-border-strong last:border-0 hover:bg-bg-hover/20">
                      <td className="p-4">
                        <div className="font-bold text-text-primary">{acct.label}</div>
                        <div className="text-xs text-text-muted font-mono mt-0.5">Folder: {acct.folder_id || "root"}</div>
                      </td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {acct.drive_type === "SHAREPOINT_DRIVE" ? "SharePoint" : "User OneDrive"}
                        </span>
                        <div className="text-xs text-text-muted mt-1 font-mono">
                          {acct.target_user_email || acct.target_drive_id || "Default Drive"}
                        </div>
                      </td>
                      <td className="p-4 font-mono text-xs text-text-muted">
                        <div>Tenant: {acct.tenant_id?.slice(0, 8)}...</div>
                        <div>Client: {acct.client_id?.slice(0, 8)}...</div>
                      </td>
                      <td className="p-4 text-text-muted">
                        {acct.last_synced_at ? new Date(acct.last_synced_at + "Z").toLocaleString() : "Never"}
                      </td>
                      <td className="p-4 text-right">
                        <button
                          onClick={() => handleDeleteOneDriveAccount(acct.id)}
                          className="p-2 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                          title="Remove OneDrive Account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="pt-4">
            <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0078D4]" />
              Global OneDrive Inbox
            </h2>
            <p className="text-sm text-text-muted mt-1">
              Review all files fetched from Microsoft OneDrive / SharePoint. Files are matched automatically or manually assigned.
            </p>
          </div>

          <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm">
            {onedriveLoading ? (
              <div className="p-8 text-center text-text-muted text-sm">Loading OneDrive inbox...</div>
            ) : onedriveInboxItems.length === 0 ? (
              <div className="p-8 text-center text-text-muted text-sm">No files in the OneDrive inbox yet.</div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border-strong bg-bg-hover/50 text-xs text-text-muted uppercase tracking-wider">
                    <th className="p-4 font-bold">File Name</th>
                    <th className="p-4 font-bold">Source Account</th>
                    <th className="p-4 font-bold">Status</th>
                    <th className="p-4 font-bold">Matched Project</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {onedriveInboxItems.map((item) => (
                    <tr key={item.id} className="border-b border-border-strong last:border-0 hover:bg-bg-hover/20">
                      <td className="p-4">
                        <div className="font-bold text-text-primary flex items-center gap-2">
                          {item.filename}
                          {item.web_url && (
                            <a
                              href={item.web_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-text-muted hover:text-sky-400"
                              title="Open in Microsoft 365"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">{new Date(item.fetched_at + "Z").toLocaleString()}</div>
                      </td>
                      <td className="p-4 text-text-muted">{item.account_label}</td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${
                          item.status === "DONE" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          item.status === "ASSIGNED" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" :
                          item.status === "SKIPPED" ? "bg-gray-500/10 text-gray-400 border border-gray-500/20" :
                          "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="p-4">
                        {item.matched_project_id ? (
                          <span className="text-text-primary font-semibold flex items-center gap-1.5">
                            <Check className="w-3.5 h-3.5 text-emerald-500" />
                            {projects.find(p => p.id === item.matched_project_id)?.project_name || projects.find(p => p.id === item.matched_project_id)?.name || `Project #${item.matched_project_id}`}
                          </span>
                        ) : (
                          <select
                            className="border border-border-strong rounded-lg px-2 py-1 text-sm focus:outline-none focus:border-blue-500"
                            style={{ backgroundColor: "#1e293b", color: "#f8fafc", maxHeight: "200px" }}
                            onChange={(e) => handleAssignOneDriveProject(item.id, e.target.value)}
                            defaultValue=""
                          >
                            <option value="" disabled style={{ backgroundColor: "#1e293b", color: "#94a3b8" }}>Assign to project...</option>
                            {projects.map(p => (
                              <option key={p.id} value={p.id} style={{ backgroundColor: "#1e293b", color: "#f8fafc" }}>{p.project_name || p.name}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD GOOGLE DRIVE ACCOUNT                                        */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-card rounded-2xl border border-border-strong shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border-strong">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <CloudDownload className="w-5 h-5 text-blue-500" />
                Add Google Drive Account
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-blue-500/5 border-b border-blue-500/20 text-xs text-blue-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                <strong>Security Guarantee:</strong> Your credentials JSON is encrypted at rest using AES (Fernet) 
                and decrypted strictly in-memory during sync. It is never logged or exposed to the client again.
              </p>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="add-account-form" onSubmit={handleAddAccount} className="space-y-5">
                {error && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{error}</p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Label</label>
                    <input
                      type="text"
                      required
                      value={label}
                      onChange={(e) => setLabel(e.target.value)}
                      placeholder="e.g. PMO Global Drive"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Service Account Email</label>
                    <input
                      type="email"
                      required
                      value={serviceEmail}
                      onChange={(e) => setServiceEmail(e.target.value)}
                      placeholder="e.g. pmo-reader@project.iam.gserviceaccount.com"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Drive Folder ID</label>
                  <input
                    type="text"
                    required
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    placeholder="e.g. 1AbCdEfGhIjKlMnOpQrStUvWxYz123456"
                    className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-text-muted">The ID from the Google Drive folder URL.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Credentials JSON</label>
                  <textarea
                    required
                    value={credentialsJson}
                    onChange={(e) => setCredentialsJson(e.target.value)}
                    placeholder="Paste the entire content of your service account JSON file here..."
                    className="w-full px-4 py-3 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-blue-500 font-mono h-40 resize-y"
                  />
                </div>
              </form>
            </div>
            <div className="p-4 border-t border-border-strong flex justify-end gap-3 bg-bg-hover/50 mt-auto">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-account-form"
                disabled={adding}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
              >
                {adding ? "Saving..." : "Save Account"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────── */}
      {/* MODAL: ADD MICROSOFT ONEDRIVE ACCOUNT                                  */}
      {/* ────────────────────────────────────────────────────────────────────── */}
      {showAddOneDriveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
          <div className="bg-bg-card rounded-2xl border border-border-strong shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-border-strong">
              <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-[#0078D4]" />
                Add Microsoft OneDrive / SharePoint Connector
              </h2>
              <button
                onClick={() => setShowAddOneDriveModal(false)}
                className="text-text-muted hover:text-text-primary transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-sky-500/5 border-b border-sky-500/20 text-xs text-sky-400 flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
              <p>
                <strong>Security Guarantee:</strong> Your Microsoft Client Secret is encrypted at rest using AES (Fernet) 
                and decrypted strictly in-memory during sync. It is never logged or returned to the browser.
              </p>
            </div>

            <div className="overflow-y-auto p-6">
              <form id="add-onedrive-form" onSubmit={handleAddOneDriveAccount} className="space-y-4">
                {odError && (
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p>{odError}</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Account Label</label>
                  <input
                    type="text"
                    required
                    value={odLabel}
                    onChange={(e) => setOdLabel(e.target.value)}
                    placeholder="e.g. PwC Engagement SharePoint or PMO OneDrive"
                    className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Directory (Tenant) ID</label>
                    <input
                      type="text"
                      required
                      value={odTenantId}
                      onChange={(e) => setOdTenantId(e.target.value)}
                      placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Application (Client) ID</label>
                    <input
                      type="text"
                      required
                      value={odClientId}
                      onChange={(e) => setOdClientId(e.target.value)}
                      placeholder="e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Client Secret Value</label>
                  <input
                    type="password"
                    required
                    value={odClientSecret}
                    onChange={(e) => setOdClientSecret(e.target.value)}
                    placeholder="Paste the Microsoft Entra client secret value here"
                    className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Storage Target Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setOdDriveType("USER_DRIVE")}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        odDriveType === "USER_DRIVE"
                          ? "border-sky-500 bg-sky-500/10 text-sky-400 font-bold"
                          : "border-border-strong text-text-muted hover:bg-bg-hover"
                      }`}
                    >
                      <div className="font-bold mb-1">OneDrive for Business</div>
                      <div className="text-[11px] opacity-80">Specific user's corporate OneDrive</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setOdDriveType("SHAREPOINT_DRIVE")}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        odDriveType === "SHAREPOINT_DRIVE"
                          ? "border-sky-500 bg-sky-500/10 text-sky-400 font-bold"
                          : "border-border-strong text-text-muted hover:bg-bg-hover"
                      }`}
                    >
                      <div className="font-bold mb-1">SharePoint Document Library</div>
                      <div className="text-[11px] opacity-80">Shared team site or drive library</div>
                    </button>
                  </div>
                </div>

                {odDriveType === "USER_DRIVE" ? (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Target User Principal Email</label>
                    <input
                      type="email"
                      value={odTargetUserEmail}
                      onChange={(e) => setOdTargetUserEmail(e.target.value)}
                      placeholder="e.g. engagement-lead@company.com"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500"
                    />
                    <p className="text-[10px] text-text-muted">The Microsoft 365 work email of the OneDrive owner.</p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider">SharePoint Drive ID</label>
                    <input
                      type="text"
                      value={odTargetDriveId}
                      onChange={(e) => setOdTargetDriveId(e.target.value)}
                      placeholder="e.g. b!xxxxxxx... (Graph Drive ID)"
                      className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                    />
                    <p className="text-[10px] text-text-muted">The Microsoft Graph Drive ID for the document library.</p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Folder Item ID (Optional)</label>
                  <input
                    type="text"
                    value={odFolderId}
                    onChange={(e) => setOdFolderId(e.target.value)}
                    placeholder="root (or specific folder item ID)"
                    className="w-full px-4 py-2.5 bg-bg-hover text-sm text-text-primary border border-[#D8D8D8] dark:border-[#444444] rounded-xl focus:outline-none focus:border-sky-500 font-mono"
                  />
                  <p className="text-[10px] text-text-muted">Leave as "root" to monitor the root folder, or specify a subfolder item ID.</p>
                </div>
              </form>
            </div>

            <div className="p-4 border-t border-border-strong flex justify-end gap-3 bg-bg-hover/50 mt-auto">
              <button
                type="button"
                onClick={() => setShowAddOneDriveModal(false)}
                className="px-5 py-2.5 text-sm font-bold text-text-muted hover:text-text-primary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="add-onedrive-form"
                disabled={odAdding}
                className="px-5 py-2.5 bg-[#0078D4] hover:bg-[#005a9e] text-white font-bold text-sm rounded-xl transition-all disabled:opacity-50"
              >
                {odAdding ? "Saving..." : "Save OneDrive Account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
