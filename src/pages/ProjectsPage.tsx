import React, { useEffect, useState } from "react";
import type { Project, HealthRagStatus } from "../types";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { useAuth } from "../auth/AuthContext";
import { Link } from "react-router-dom";
import { Loader } from "../components/Loader";
import { Sparkles, Loader2, Activity } from "lucide-react";
import { getHealthConfig } from "../utils/health";

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "Not Specified";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Not Specified";
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch (e) {
    return "Not Specified";
  }
};

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [description, setDescription] = useState("");
  const [projectLeads, setProjectLeads] = useState<any[]>([]);
  const [assignedLeadId, setAssignedLeadId] = useState("");

  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isDescriptionManuallyEdited, setIsDescriptionManuallyEdited] =
    useState(false);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [formError, setFormError] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const [editingProjectId, setEditingProjectId] = useState<number | null>(null);
  const [editingEndDate, setEditingEndDate] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [healthFilter, setHealthFilter] = useState<string>("ALL");

  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [projectToClose, setProjectToClose] = useState<number | null>(null);

  const handleSaveEndDate = async (projectId: number) => {
    const proj = projects.find((p) => p.id === projectId);
    if (proj && proj.start_date && editingEndDate) {
      const startStr = proj.start_date.split("T")[0];
      const endStr = editingEndDate.split("T")[0];
      if (startStr > endStr) {
        alert("Validation Error: End date cannot be before start date.");
        return;
      }
    }
    try {
      const res = await apiClient.put(API_ENDPOINTS.PROJECTS.DETAIL(projectId), {
        end_date: editingEndDate || null,
      });
      if (res.data.success) {
        setEditingProjectId(null);
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to update end date", error);
    }
  };

  const handleCloseProject = (projectId: number) => {
    setProjectToClose(projectId);
    setIsCloseModalOpen(true);
  };

  const confirmCloseProject = async () => {
    if (!projectToClose) return;
    try {
      const res = await apiClient.put(API_ENDPOINTS.PROJECTS.DETAIL(projectToClose), {
        monitoring_status: "CLOSED",
      });
      if (res.data.success) {
        setIsCloseModalOpen(false);
        setProjectToClose(null);
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to close project", error);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS.LIST);
      if (res.data.success) {
        const sorted = (res.data.data || []).sort((a: Project, b: Project) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        setProjects(sorted);
      }
    } catch (error) {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.USERS.LIST_BY_ROLE('PROJECT_LEAD'));
      if (res.data.success) {
        setProjectLeads(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch project leads", err);
    }
  };

  useEffect(() => {
    fetchProjects();
    if (user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") {
      fetchLeads();
    }
  }, [user]);

  const handleGenerateDescription = async () => {
    if (!(projectName || "").trim() || !(clientName || "").trim()) {
      setFormError(
        "Please enter Project Name and Client Name first to generate a description.",
      );
      return;
    }
    setFormError("");
    setIsGeneratingDesc(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.PROJECTS.GENERATE_DESC, {
        project_name: projectName,
        client_name: clientName,
      });
      if (res.data.success) {
        const desc = res.data.data?.description || res.data.description || "";
        setDescription(desc);
        setIsDescriptionManuallyEdited(false);
      }
    } catch (error) {
      console.error("Failed to generate description", error);
      setFormError("Failed to generate description with AI. Please try again.");
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreating) return;
    if (startDate && endDate && startDate > endDate) {
      setFormError("Start Date cannot be after End Date");
      return;
    }
    setFormError("");
    setIsCreating(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.PROJECTS.CREATE, {
        project_name: projectName,
        client_name: clientName,
        description,
        assigned_lead_id: assignedLeadId ? parseInt(assignedLeadId) : null,
        start_date: startDate || null,
        end_date: endDate || null,
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setProjectName("");
        setClientName("");
        setDescription("");
        setAssignedLeadId("");
        setStartDate("");
        setEndDate("");
        setFormError("");
        setIsDescriptionManuallyEdited(false);
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to create project");
    } finally {
      setIsCreating(false);
    }
  };

  if (loading) {
    return <Loader message="Fetching projects directory..." />;
  }

  const filteredProjects = projects.filter((p) => {
    const matchesSearch = (p.project_name || "")
      .toLowerCase()
      .includes((searchQuery || "").toLowerCase());
    const matchesStatus =
      statusFilter === "ALL"
        ? true
        : statusFilter === "ACTIVE"
          ? p.monitoring_status === "ACTIVE"
          : statusFilter === "CLOSED"
            ? p.monitoring_status === "CLOSED"
            : true;

    const currentHealthConfig = getHealthConfig(p.health_score ?? 100, p.rag_status);
    const matchesHealth =
      healthFilter === "ALL"
        ? true
        : currentHealthConfig.status === healthFilter;

    return matchesSearch && matchesStatus && matchesHealth;
  });

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-text-primary">
              Projects Directory
            </h1>
            <p className="text-text-muted text-sm">
              Select a project to audit deliverables or view contract scope
              baselines.
            </p>
          </div>
          {(user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-5 py-2.5 bg-primary-button hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-primary-border/20 active:scale-[0.98] cursor-pointer"
            >
              Create Project
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full lg:flex-1 bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary placeholder-text-muted text-sm transition-all"
            />

            {/* Health Filter Pills (Red, Green, Amber) */}
            <div className="flex items-center gap-1.5 bg-bg-input border border-border-subtle rounded-xl p-1 w-full lg:w-auto shrink-0 overflow-x-auto">
              <button
                onClick={() => setHealthFilter("ALL")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  healthFilter === "ALL"
                    ? "bg-primary/20 text-primary border border-primary-border/30"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                All Health
              </button>
              <button
                onClick={() => setHealthFilter("GREEN")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  healthFilter === "GREEN"
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "text-text-muted hover:text-emerald-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                Healthy
              </button>
              <button
                onClick={() => setHealthFilter("AMBER")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  healthFilter === "AMBER"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "text-text-muted hover:text-amber-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" />
                At Risk
              </button>
              <button
                onClick={() => setHealthFilter("RED")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  healthFilter === "RED"
                    ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                    : "text-text-muted hover:text-rose-400"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
                Critical
              </button>
            </div>

            {/* Monitoring Status Filter */}
            <div className="flex bg-bg-input border border-border-subtle rounded-xl p-1 w-full lg:w-[320px] shrink-0 h-[46px]">
              <div className="relative flex w-full">
                <div
                  className="absolute top-0 bottom-0 w-1/3 bg-primary/20 border border-primary-border/30 rounded-lg transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_0_10px_rgba(255,90,20,0.1)]"
                  style={{
                    transform: `translateX(${
                      statusFilter === "ALL"
                        ? "0%"
                        : statusFilter === "ACTIVE"
                          ? "100%"
                          : "200%"
                    })`,
                  }}
                />
                {[
                  { id: "ALL", label: "All Status" },
                  { id: "ACTIVE", label: "Active" },
                  { id: "CLOSED", label: "Closed" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setStatusFilter(tab.id)}
                    className={`relative z-10 flex-1 px-3 py-1.5 text-xs font-semibold transition-colors duration-300 rounded-lg cursor-pointer flex items-center justify-center ${
                      statusFilter === tab.id
                        ? "text-primary"
                        : "text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {!filteredProjects || filteredProjects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <p className="text-gray-500 text-sm">No projects found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredProjects || []).map((p) => {
              const health = getHealthConfig(p.health_score ?? 100, p.rag_status);
              const scoreVal = p.health_score ?? 100;

              return (
                <div
                  key={p.id}
                  className="group p-6 rounded-2xl bg-bg-card border border-border-subtle hover:border-primary-border/30 hover:bg-bg-hover transition-all duration-300 hover:shadow-2xl hover:shadow-primary-border/5 hover:-translate-y-1 flex flex-col justify-between"
                >
                  <div>
                    {/* Header with Project Info & Red/Amber/Green Health Score Indicator */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-display text-lg font-bold text-text-primary group-hover:text-primary transition-colors duration-300 truncate">
                          {p.project_name}
                        </h3>
                        <p className="text-text-muted text-xs truncate">
                          {p.client_name || "No Client Name"}
                        </p>
                      </div>

                      {/* Red / Green / Amber Health Score Indicator Badge */}
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${health.badgeBg} shrink-0 shadow-sm transition-all`}
                        title={`Health Score: ${scoreVal}% (${health.label})`}
                      >
                        <span className="relative flex h-2 w-2">
                          <span
                            className={`animate-ping absolute inline-flex h-full w-full rounded-full ${health.pingBg} opacity-75`}
                          />
                          <span
                            className={`relative inline-flex rounded-full h-2 w-2 ${health.dotBg}`}
                          />
                        </span>
                        <span>{health.label}</span>
                        <span className="font-mono text-[11px] opacity-90 font-black">
                          {scoreVal}%
                        </span>
                      </div>
                    </div>

                    {/* Health Score Mini Progress Bar */}
                    <div className="my-3 py-2 px-3 rounded-xl bg-bg-input/40 border border-border-subtle/40">
                      <div className="flex justify-between items-center text-[11px] mb-1.5 font-medium">
                        <span className="text-text-muted flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-primary/80" />
                          Project Health Score
                        </span>
                        <span className={`font-black font-mono ${health.text}`}>
                          {scoreVal}/100
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-card rounded-full overflow-hidden border border-border-subtle/50">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ease-out ${health.barBg}`}
                          style={{ width: `${Math.min(100, Math.max(0, scoreVal))}%` }}
                        />
                      </div>
                    </div>

                    {/* Project Dates */}
                    <div className="text-text-muted text-xs mt-3 mb-4 space-y-1.5 border-t border-border-subtle pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">
                        Start Date:
                      </span>
                      <span>
                        {p.start_date ? p.start_date.split("T")[0] : "Not set"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-text-muted font-medium">
                        End Date:
                      </span>
                      {editingProjectId === p.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="date"
                            value={editingEndDate}
                            onChange={(e) => setEditingEndDate(e.target.value)}
                            className="bg-bg-hover border border-border-strong rounded px-1.5 py-0.5 text-[11px] text-text-primary focus:outline-none focus:border-primary-border"
                          />
                          <button
                            onClick={() => handleSaveEndDate(p.id)}
                            className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-text-primary rounded text-[10px] font-bold cursor-pointer"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingProjectId(null)}
                            className="text-[10px] text-text-muted hover:text-text-primary cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span>
                            {p.end_date ? p.end_date.split("T")[0] : "Not set"}
                          </span>
                          {(user?.role === "ADMIN" ||
                            user?.role === "ENGAGEMENT_MANAGER") && (
                              <button
                                onClick={() => {
                                  setEditingProjectId(p.id);
                                  setEditingEndDate(
                                    p.end_date ? p.end_date.split("T")[0] : "",
                                  );
                                }}
                                className="text-[10px] text-primary hover:opacity-80 underline font-medium cursor-pointer"
                              >
                                Edit
                              </button>
                            )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center border-t border-border-subtle pt-4 mt-2">
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${p.monitoring_status === "ACTIVE"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                        : p.monitoring_status === "CLOSED"
                          ? "bg-rose-500/15 text-rose-400 border border-rose-500/20"
                          : p.monitoring_status === "DRAFT"
                            ? "bg-gray-500/15 text-gray-400 border border-gray-500/20"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/20"
                      }`}
                  >
                    {p.monitoring_status}
                  </span>
                  <div className="flex items-center gap-3">
                    {(user?.role === "ADMIN" ||
                      user?.role === "ENGAGEMENT_MANAGER") &&
                      p.monitoring_status !== "CLOSED" && (
                        <button
                          onClick={() => handleCloseProject(p.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors uppercase tracking-wider"
                        >
                          Close
                        </button>
                      )}
                    <Link
                      to={`/projects/${p.id}`}
                      className="text-xs font-semibold text-primary hover:text-primary-hover flex items-center gap-1 group/btn transition-colors"
                    >
                      Open Dashboard
                      <span className="group-hover/btn:translate-x-1 transition-transform">
                        &rarr;
                      </span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-bg-panel p-8 rounded-2xl border border-border-subtle shadow-2xl relative">
            <button
              onClick={() => {
                setIsModalOpen(false);
                setProjectName("");
                setClientName("");
                setDescription("");
                setAssignedLeadId("");
                setStartDate("");
                setEndDate("");
                setFormError("");
                setIsDescriptionManuallyEdited(false);
                setIsCreating(false);
              }}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary text-xl transition-colors"
            >
              &times;
            </button>
            <h2 className="font-display text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary-button">
              Create New Project
            </h2>
            {formError && (
              <div className="mb-4 p-3 bg-rose-950/40 border border-rose-800/30 text-rose-500 dark:text-rose-400 rounded-xl text-xs font-semibold">
                {formError}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Project Name
                </label>
                <input
                  required
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary placeholder-text-muted text-sm transition-all"
                  placeholder="e.g. Acme Audit 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Client Name
                </label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary placeholder-text-muted text-sm transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary text-xs transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary text-xs transition-all"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Assign Project Lead
                </label>
                <select
                  value={assignedLeadId}
                  onChange={(e) => setAssignedLeadId(e.target.value)}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary text-sm transition-all"
                >
                  <option value="" className="bg-bg-panel text-text-muted">
                    -- Select Project Lead --
                  </option>
                  {(projectLeads || []).map((lead) => (
                    <option
                      key={lead.id}
                      value={lead.id}
                      className="bg-bg-panel text-text-primary"
                    >
                      {lead.name} ({lead.email})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-medium text-text-muted">
                    Description
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateDescription}
                    disabled={isGeneratingDesc}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary-border/40 text-primary font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    title="Generate description with AI"
                  >
                    {isGeneratingDesc ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" />
                        <span>AI Suggestion</span>
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setIsDescriptionManuallyEdited(true);
                  }}
                  className="w-full bg-bg-input border border-border-subtle rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-primary-border/50 focus:border-primary-border text-text-primary placeholder-text-muted text-sm transition-all"
                  placeholder="Summarize project requirements..."
                  rows={4}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setProjectName("");
                    setClientName("");
                    setDescription("");
                    setAssignedLeadId("");
                    setStartDate("");
                    setEndDate("");
                    setFormError("");
                    setIsDescriptionManuallyEdited(false);
                    setIsCreating(false);
                  }}
                  className="flex-1 py-2.5 bg-bg-hover hover:bg-white/10 border border-border-subtle hover:border-border-strong rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={
                    !(projectName || "").trim() ||
                    !(clientName || "").trim() ||
                    !assignedLeadId ||
                    !(description || "").trim() ||
                    isGeneratingDesc ||
                    isCreating
                  }
                  className="flex-1 py-2.5 bg-primary-button hover:bg-primary-hover text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-primary-border/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCloseModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-bg-panel p-8 rounded-2xl border border-border-subtle shadow-2xl relative">
            <h2 className="font-display text-2xl font-bold mb-4 text-text-primary">
              Close Project
            </h2>
            <p className="text-text-muted text-sm mb-6">
              Are you sure you want to close this project?
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsCloseModalOpen(false);
                  setProjectToClose(null);
                }}
                className="flex-1 py-2.5 bg-bg-hover hover:bg-bg-hover border border-border-subtle text-text-secondary hover:text-text-primary rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={confirmCloseProject}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-rose-500/10 flex items-center justify-center gap-2 cursor-pointer"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
