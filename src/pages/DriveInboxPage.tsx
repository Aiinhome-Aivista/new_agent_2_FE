import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import apiClient from "../api/apiClient";
import { CloudDownload, Plus, Trash2, RefreshCw, X, FileText, Check, AlertTriangle, ShieldCheck } from "lucide-react";

export const DriveInboxPage: React.FC = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [inboxItems, setInboxItems] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add account modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [label, setLabel] = useState("");
  const [serviceEmail, setServiceEmail] = useState("");
  const [folderId, setFolderId] = useState("");
  const [credentialsJson, setCredentialsJson] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const fetchData = async () => {
    try {
      const [accRes, projRes, inboxRes] = await Promise.all([
        apiClient.get("/drive/accounts"),
        apiClient.get("/projects/"),
        apiClient.get("/drive/inbox"),
      ]);
      setAccounts(accRes.data?.data || []);
      setProjects(projRes.data?.data || []);
      setInboxItems(inboxRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    setError("");
    try {
      await apiClient.post("/drive/accounts", {
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
      fetchData();
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to add account");
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!confirm("Are you sure you want to remove this Drive account?")) return;
    try {
      await apiClient.delete(`/drive/accounts/${id}`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSyncAll = async () => {
    try {
      await apiClient.post("/drive/sync");
      fetchData();
      alert("Sync completed.");
    } catch (err) {
      alert("Sync failed.");
    }
  };

  const handleAssignProject = async (inboxId: number, projectId: string) => {
    if (!projectId) return;
    try {
      await apiClient.patch(`/drive/inbox/${inboxId}/assign`, {
        project_id: parseInt(projectId),
        doc_type: "MOM",
      });
      fetchData();
    } catch (err) {
      alert("Failed to assign project.");
    }
  };

  if (user?.role !== "ADMIN" && user?.role !== "ENGAGEMENT_MANAGER") {
    return (
      <div className="p-8 text-center text-text-muted">
        Only Engagement Managers and Admins can configure Google Drive integration.
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
            <CloudDownload className="w-6 h-6 text-blue-500" />
            Google Drive Accounts
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Configure service accounts to automatically fetch project documents.
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
            Add Account
          </button>
        </div>
      </div>

      <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-sm">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center mb-4">
              <CloudDownload className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">No Drive Accounts Configured</h3>
            <p className="text-sm text-text-muted max-w-md">
              Add a Google Service Account credentials JSON and a Folder ID to start automatically fetching project documents.
            </p>
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

      <div className="mt-12 mb-8">
        <h2 className="text-xl font-bold text-text-primary flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#FF5A14]" />
          Global Drive Inbox
        </h2>
        <p className="text-sm text-text-muted mt-1">
          Review all files fetched from Drive. Files that couldn't be auto-matched to a project must be assigned manually.
        </p>
      </div>

      <div className="bg-bg-card border border-border-strong rounded-2xl overflow-hidden shadow-sm mb-12">
        {loading ? (
          <div className="p-8 text-center text-text-muted text-sm">Loading inbox...</div>
        ) : inboxItems.length === 0 ? (
          <div className="p-8 text-center text-text-muted text-sm">No files in the global inbox yet.</div>
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
                    placeholder='Paste the entire content of your service account JSON file here...'
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
    </div>
  );
};
