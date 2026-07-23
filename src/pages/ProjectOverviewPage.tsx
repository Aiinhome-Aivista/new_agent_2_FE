import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import apiClient from "../api/apiClient";
import { useAuth } from "../auth/AuthContext";
import { Loader } from "../components/Loader";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Shield,
  ArrowRight,
  UploadCloud,
  ScrollText,
  Activity,
  Briefcase,
  AlertCircle,
  CheckCheck,
  Circle,
  Minus,
  ChevronRight,
  Star,
  Zap,
  Target,
  Calendar,
  FileCheck2,
  XCircle,
  Info,
  Lock,
} from "lucide-react";

// ─── Helpers ────────────────────────────────────────────────────────────────

function getDaysRemaining(endDate?: string | null): number | null {
  if (!endDate) return null;
  const diff = new Date(endDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getRagColor(score: number, monitoringStatus?: string) {
  if (monitoringStatus === "DRAFT" || monitoringStatus === "BASELINE_PENDING_REVIEW") {
    return {
      ring: "#06b6d4",
      text: "text-cyan-400",
      bg: "bg-cyan-500/10",
      border: "border-cyan-500/30",
      label: "SETTING UP",
      labelColor: "text-cyan-400"
    };
  }
  if (score >= 70) return { ring: "#10b981", text: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/30", label: "HEALTHY", labelColor: "text-emerald-400" };
  if (score >= 40) return { ring: "#f59e0b", text: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/30", label: "AT RISK", labelColor: "text-amber-400" };
  return { ring: "#ef4444", text: "text-rose-400", bg: "bg-rose-500/10", border: "border-rose-500/30", label: "CRITICAL", labelColor: "text-rose-400" };
}

function computeHealthScore(
  monitoringStatus: string,
  hasBothDocs: boolean,
  baselineApproved: boolean,
  openRisks: number,
  totalRisks: number,
  daysRemaining: number | null
): number {
  if (monitoringStatus === "DRAFT" || monitoringStatus === "BASELINE_PENDING_REVIEW") {
    let score = 0;
    if (hasBothDocs) score += 60;
    if (baselineApproved) score += 40;
    else if (monitoringStatus === "BASELINE_PENDING_REVIEW") score += 20;
    return score;
  } else {
    let score = 100;
    if (totalRisks > 0) {
      score -= Math.min(60, Math.round((openRisks / totalRisks) * 60));
    }
    if (daysRemaining !== null) {
      if (daysRemaining < 0) score -= 40;
      else if (daysRemaining < 14) score -= 20;
    }
    return Math.max(0, score);
  }
}

// ─── Animated ring gauge ─────────────────────────────────────────────────────
const HealthRing: React.FC<{ score: number; color: string }> = ({ score, color }) => {
  const r = 52;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (score / 100) * circumference;
  return (
    <svg width="130" height="130" className="rotate-[-90deg]">
      <circle cx="65" cy="65" r={r} fill="none" stroke="#1f2937" strokeWidth="10" />
      <circle
        cx="65" cy="65" r={r} fill="none"
        stroke={color} strokeWidth="10"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 1.2s cubic-bezier(.4,0,.2,1)" }}
      />
    </svg>
  );
};

// ─── Main component ──────────────────────────────────────────────────────────
export const ProjectOverviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [baseline, setBaseline] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllScopeItems, setShowAllScopeItems] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [projRes, docsRes, baselineRes, membersRes, risksRes] = await Promise.all([
          apiClient.get(`/projects/${id}`),
          apiClient.get(`/projects/${id}/documents/`),
          apiClient.get(`/projects/${id}/baseline/`).catch(() => ({ data: { success: false } })),
          apiClient.get(`/projects/${id}/stakeholders/`).catch(() => ({ data: { success: false, data: [] } })),
          apiClient.get(`/projects/${id}/tracker/`).catch(() => ({ data: { success: false, data: [] } })),
        ]);
        if (projRes.data.success) setProject(projRes.data.data);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (baselineRes.data.success) setBaseline(baselineRes.data.data);
        if (membersRes.data.success) setMembers(membersRes.data.data ?? []);
        if (risksRes.data.success) setRisks(risksRes.data.data ?? []);
      } catch (e) {
        console.error("Failed to load project overview", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  if (loading) return <Loader message="Loading project intelligence dashboard..." />;
  if (!project) return <div className="p-10 text-gray-400">Project not found.</div>;

  // ── Derived metrics ──────────────────────────────────────────────────────
  const hasEL = documents.some((d) => d.document_type === "EL");
  const hasIFA = documents.some((d) => d.document_type === "IFA");
  const hasMOM = documents.some((d) => d.document_type === "MOM");
  const hasStatusReport = documents.some((d) => d.document_type === "STATUS_REPORT");
  const hasBothInitDocs = hasEL && hasIFA;

  const baselineApproved = baseline?.status === "APPROVED";
  const inScopeItems: any[] = baseline?.scope_items?.filter((i: any) => i.scope_type === "IN_SCOPE") ?? [];
  const outOfScopeItems: any[] = baseline?.scope_items?.filter((i: any) => i.scope_type === "OUT_OF_SCOPE") ?? [];
  const uncertainItems: any[] = baseline?.scope_items?.filter((i: any) => i.scope_type === "UNCERTAIN") ?? [];
  const totalItems = inScopeItems.length + outOfScopeItems.length + uncertainItems.length;

  const openRisks = risks.filter((r) => r.status !== "RESOLVED");
  const criticalRisks = openRisks.filter((r) => r.severity === "HIGH" || r.severity === "CRITICAL");
  const resolvedRisks = risks.filter((r) => r.status === "RESOLVED");

  const daysRemaining = getDaysRemaining(project.end_date);
  const healthScore = computeHealthScore(project.monitoring_status, hasBothInitDocs, baselineApproved, openRisks.length, risks.length, daysRemaining);
  const rag = getRagColor(healthScore, project.monitoring_status);

  const isEM = user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER";

  const docsUploaded = documents.filter((d) => d.processing_status === "COMPLETED").length;
  const processingDocs = documents.filter((d) => d.processing_status === "PROCESSING" || d.processing_status === "PARSING").length;

  // ── Risk severity breakdown ──────────────────────────────────────────────
  const riskHigh = openRisks.filter((r) => r.severity === "HIGH" || r.severity === "CRITICAL").length;
  const riskMed = openRisks.filter((r) => r.severity === "MEDIUM").length;
  const riskLow = openRisks.filter((r) => r.severity === "LOW").length;

  return (
    <div className="flex-1 bg-[#080b14] text-white p-6 md:p-8 min-h-screen overflow-auto">
      {/* Background glows */}
      <div className="fixed top-[-20%] right-[-5%] w-[600px] h-[600px] rounded-full bg-teal-500/4 blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-20%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">

        {/* ── TOP HEADER ───────────────────────────────────────────────── */}
        <div className="flex flex-col lg:flex-row justify-between items-start gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link to="/projects" className="text-[11px] text-gray-500 hover:text-teal-400 transition-colors">
                Projects Directory
              </Link>
              <ChevronRight className="w-3 h-3 text-gray-600" />
              <span className="text-[11px] text-teal-400 font-semibold">Project Overview</span>
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">{project.project_name}</h1>
            <p className="text-gray-400 text-xs mt-0.5">{project.client_name} &nbsp;·&nbsp; {project.description?.slice(0, 90)}{project.description?.length > 90 ? "…" : ""}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 flex-shrink-0">
            <Link to={`/projects/${id}/cockpit`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700 text-gray-300 text-xs font-semibold rounded-xl transition-all">
              <UploadCloud className="w-3.5 h-3.5" /> Upload Documents
            </Link>
            <Link to={`/projects/${id}/baseline`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold rounded-xl transition-all">
              <ScrollText className="w-3.5 h-3.5" /> Baseline Review
            </Link>
            <Link to={`/projects/${id}/tracker`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-600/20 hover:bg-rose-600/30 border border-rose-500/40 text-rose-300 text-xs font-semibold rounded-xl transition-all">
              <Activity className="w-3.5 h-3.5" /> Risk Tracker
            </Link>
            <Link to={`/projects/${id}/members`} className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-teal-600/20 hover:bg-teal-600/30 border border-teal-500/40 text-teal-300 text-xs font-semibold rounded-xl transition-all">
              <Users className="w-3.5 h-3.5" /> Members
            </Link>
          </div>
        </div>

        {/* ── RAG BANNER ──────────────────────────────────────────────── */}
        <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl ${rag.bg} border ${rag.border}`}>
          <span className={`text-xs font-black uppercase tracking-widest ${rag.labelColor} flex items-center gap-2`}>
            <span className={`inline-block w-2 h-2 rounded-full ${
              rag.label === "SETTING UP" ? "bg-cyan-400" :
              rag.label === "HEALTHY" ? "bg-emerald-400" : 
              rag.label === "AT RISK" ? "bg-amber-400" : 
              "bg-rose-400"
            } animate-pulse`} />
            Project Status: {rag.label}
          </span>
          <span className="text-xs text-gray-400 flex-1">
            {rag.label === "SETTING UP"
              ? "Project is in onboarding phase. Please upload contract documents and approve the scope baseline to begin monitoring."
              : rag.label === "HEALTHY"
              ? "All critical metrics are within acceptable thresholds. Project is progressing well."
              : rag.label === "AT RISK"
              ? "One or more metrics require attention. Review open items below."
              : "Critical issues detected. Immediate action required to get the project back on track."}
          </span>
          <span className={`text-lg font-black ${rag.text}`}>{healthScore}%</span>
        </div>

        {/* ── TOP ROW: Health Score + KPI Cards ────────────────────────── */}
        <div className="grid grid-cols-12 gap-5">

          {/* Health Score Gauge */}
          <div className="col-span-12 md:col-span-3 bg-gray-900/50 border border-gray-800 rounded-2xl p-5 flex flex-col items-center justify-center text-center backdrop-blur-md relative z-10 hover:z-30 transition-all">
            <div className="flex items-center gap-1.5 mb-3 text-gray-500 relative">
              <p className="text-[10px] font-bold uppercase tracking-widest">Project Health Score</p>
              <div className="relative group flex items-center cursor-help hover:text-cyan-400 transition-colors">
                <Info className="w-3.5 h-3.5" />
                
                {/* Tooltip Content */}
                <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 top-full mt-2 w-72 p-4 bg-[#0b0e17] border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 text-left">
                  <h4 className="font-bold text-xs text-[#00e5ff] mb-2 border-b border-gray-850 pb-1 flex items-center gap-1.5">
                    Health Score Logic & Weights
                  </h4>
                  <div className="space-y-3 text-[10px] text-gray-300">
                    <div>
                      <span className="font-semibold text-white block mb-0.5">Setup Phase (Onboarding)</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-400 font-medium">
                        <li><strong className="text-white">60 pts</strong>: Initial Documents (EL & IFA) processed.</li>
                        <li><strong className="text-white">40 pts</strong>: Baseline approved (20 pts if extracted but pending review).</li>
                      </ul>
                    </div>

                    <div>
                      <span className="font-semibold text-white block mb-0.5">Execution Phase (Active)</span>
                      <ul className="list-disc pl-4 space-y-0.5 text-gray-400 font-medium">
                        <li>Starts at 100 points.</li>
                        <li>Deducts up to <strong className="text-white">60 pts</strong> based on the proportion of unresolved risks.</li>
                        <li>Deducts up to <strong className="text-white">40 pts</strong> for timeline delays (40 pts if past end date, 20 pts if within 14 days of end date).</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <HealthRing score={healthScore} color={rag.ring} />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-3xl font-black ${rag.text}`}>{healthScore}</span>
                <span className="text-[10px] text-gray-500 font-semibold">/ 100</span>
              </div>
            </div>
            <span className={`mt-2 text-xs font-black tracking-widest uppercase ${rag.labelColor}`}>{rag.label}</span>
            <div className="mt-3 w-full text-left space-y-1.5">
              {(() => {
                const isSetup = project.monitoring_status === "DRAFT" || project.monitoring_status === "BASELINE_PENDING_REVIEW";
                const rows = isSetup ? [
                  { 
                    label: "Documents", 
                    status: hasBothInitDocs ? "OK" : "Pending",
                    points: hasBothInitDocs ? "+60" : "-60",
                    ok: hasBothInitDocs,
                    locked: false
                  },
                  { 
                    label: "Baseline", 
                    status: baselineApproved 
                      ? "OK" 
                      : project.monitoring_status === "BASELINE_PENDING_REVIEW" 
                        ? "Pending Review" 
                        : "Pending Extract",
                    points: baselineApproved 
                      ? "+40" 
                      : project.monitoring_status === "BASELINE_PENDING_REVIEW" 
                        ? "+20" 
                        : "-40",
                    ok: baselineApproved || project.monitoring_status === "BASELINE_PENDING_REVIEW",
                    locked: false
                  },
                  { 
                    label: "Risks Resolved", 
                    status: "LOCKED", 
                    points: "N/A", 
                    ok: false,
                    locked: true 
                  },
                  { 
                    label: "Timeline", 
                    status: "LOCKED", 
                    points: "N/A", 
                    ok: false,
                    locked: true 
                  },
                ] : [
                  { 
                    label: "Documents", 
                    status: "OK", 
                    points: "OK", 
                    ok: true,
                    locked: false 
                  },
                  { 
                    label: "Baseline", 
                    status: "OK", 
                    points: "OK", 
                    ok: true,
                    locked: false 
                  },
                  { 
                    label: "Risks Resolved", 
                    status: openRisks.length === 0 ? "OK" : `${openRisks.length} Open`,
                    points: openRisks.length === 0 ? "OK" : `-${Math.min(60, Math.round((openRisks.length / risks.length) * 60))}pts`,
                    ok: openRisks.length === 0,
                    locked: false
                  },
                  { 
                    label: "Timeline", 
                    status: daysRemaining === null || daysRemaining >= 14 ? "OK" : daysRemaining < 0 ? "Delayed" : "Due Soon",
                    points: daysRemaining === null || daysRemaining >= 14 ? "OK" : `-${daysRemaining < 0 ? 40 : 20}pts`,
                    ok: daysRemaining === null || daysRemaining >= 14,
                    locked: false
                  },
                ];

                return rows.map((item) => (
                  <div key={item.label} className="flex items-center justify-between text-[10px]">
                    <span className="text-gray-500">{item.label}</span>
                    <span className={`flex items-center gap-1 font-semibold ${
                      item.locked ? "text-gray-500" :
                      item.ok ? "text-emerald-400" : 
                      item.status.startsWith("Pending") || item.status === "Due Soon" ? "text-amber-400" : "text-rose-400"
                    }`}>
                      {item.locked ? (
                        <>
                          <Lock className="w-3 h-3" />
                          <span>{item.status}</span>
                        </>
                      ) : item.ok ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{item.status}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3" />
                          <span>{item.status} ({item.points})</span>
                        </>
                      )}
                    </span>
                  </div>
                ));
              })()}
            </div>
          </div>

          {/* KPI Cards 2×2 */}
          <div className="col-span-12 md:col-span-9 grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Documents */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Documents</span>
                <div className="p-1.5 bg-blue-500/10 rounded-lg"><FileText className="w-4 h-4 text-blue-400" /></div>
              </div>
              <div>
                <p className="text-3xl font-black text-white mb-1">{documents.length}</p>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Processed</span><span className="text-emerald-400 font-semibold">{docsUploaded}</span></div>
                  {processingDocs > 0 && <div className="flex justify-between"><span className="text-gray-500">Processing</span><span className="text-amber-400 font-semibold animate-pulse">{processingDocs}</span></div>}
                </div>
              </div>
            </div>

            {/* Open Risks */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Open Risks</span>
                <div className="p-1.5 bg-rose-500/10 rounded-lg"><AlertTriangle className="w-4 h-4 text-rose-400" /></div>
              </div>
              <div>
                <p className={`text-3xl font-black mb-1 ${openRisks.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>{openRisks.length}</p>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Critical</span><span className={`font-semibold ${criticalRisks.length > 0 ? "text-rose-400" : "text-gray-500"}`}>{criticalRisks.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span className="text-emerald-400 font-semibold">{resolvedRisks.length}</span></div>
                </div>
              </div>
            </div>

            {/* Baseline */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Baseline</span>
                <div className="p-1.5 bg-purple-500/10 rounded-lg"><Shield className="w-4 h-4 text-purple-400" /></div>
              </div>
              <div>
                <p className={`text-3xl font-black mb-1 ${baselineApproved ? "text-emerald-400" : "text-amber-400"}`}>{totalItems}</p>
                <div className="space-y-0.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">In Scope</span><span className="text-emerald-400 font-semibold">{inScopeItems.length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Status</span>
                    <span className={`font-semibold ${baselineApproved ? "text-emerald-400" : "text-amber-400"}`}>{baselineApproved ? "Approved" : baseline ? "Draft" : "None"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Timeline</span>
                <div className="p-1.5 bg-teal-500/10 rounded-lg"><Calendar className="w-4 h-4 text-teal-400" /></div>
              </div>
              <div>
                {daysRemaining !== null ? (
                  <>
                    <p className={`text-3xl font-black mb-1 ${daysRemaining < 0 ? "text-rose-400" : daysRemaining < 14 ? "text-amber-400" : "text-teal-400"}`}>
                      {Math.abs(daysRemaining)}
                    </p>
                    <p className="text-[11px] text-gray-500">{daysRemaining < 0 ? "days overdue" : "days remaining"}</p>
                  </>
                ) : (
                  <>
                    <p className="text-3xl font-black mb-1 text-gray-600">—</p>
                    <p className="text-[11px] text-gray-500">No end date set</p>
                  </>
                )}
                {project.start_date && (
                  <p className="text-[10px] text-gray-600 mt-1">
                    Started {new Date(project.start_date).toLocaleDateString(undefined, { dateStyle: "medium" })}
                  </p>
                )}
              </div>
            </div>

            {/* Members */}
            <div className="col-span-2 lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Team Size</span>
                <div className="p-1.5 bg-indigo-500/10 rounded-lg"><Users className="w-4 h-4 text-indigo-400" /></div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-3xl font-black text-white mb-1">{members.length}</p>
                  <p className="text-[11px] text-gray-500">Assigned members</p>
                </div>
                <div className="flex-1 space-y-0.5 text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Stakeholders</span><span className="text-indigo-400 font-semibold">{members.filter(m => m.role === "STAKEHOLDER").length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Team Leads</span><span className="text-teal-400 font-semibold">{members.filter(m => m.role === "TEAM_LEAD").length}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Custom</span><span className="text-gray-400 font-semibold">{members.filter(m => m.role !== "STAKEHOLDER" && m.role !== "TEAM_LEAD").length}</span></div>
                </div>
              </div>
            </div>

            {/* Project Status */}
            <div className="col-span-2 lg:col-span-2 bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Project Status</span>
                <div className="p-1.5 bg-emerald-500/10 rounded-lg"><Zap className="w-4 h-4 text-emerald-400" /></div>
              </div>
              <div className="flex items-end gap-4">
                <div>
                  <span className={`inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider ${
                    project.monitoring_status === "ACTIVE"
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                      : project.monitoring_status === "DRAFT"
                      ? "bg-gray-500/15 text-gray-400 border border-gray-500/30"
                      : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full inline-block ${
                      project.monitoring_status === "ACTIVE" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                    }`} />
                    {project.monitoring_status}
                  </span>
                  <p className="text-[11px] text-gray-500 mt-2">
                    {project.monitoring_status === "ACTIVE"
                      ? "Project is live and being monitored"
                      : project.monitoring_status === "DRAFT"
                      ? "Awaiting baseline approval"
                      : "Pending review action"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── SECOND ROW: 3-column grid ─────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* DOCUMENT CHECKLIST */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-blue-400" />
                  Document Checklist
                </h3>
                <Link to={`/projects/${id}/cockpit`} className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold">
                  Upload <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="space-y-2">
                {[
                  { label: "Engagement Letter (EL)", type: "EL", present: hasEL, section: "Initiation" },
                  { label: "Independence & Financial (IFA)", type: "IFA", present: hasIFA, section: "Initiation" },
                  { label: "Minutes of Meeting (MOM)", type: "MOM", present: hasMOM, section: "Execution" },
                  { label: "Status Report", type: "STATUS_REPORT", present: hasStatusReport, section: "Execution" },
                ].map((item) => (
                  <div key={item.type} className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                    item.present ? "bg-emerald-950/20 border-emerald-500/20" : "bg-gray-800/50 border-gray-700/50"
                  }`}>
                    {item.present
                      ? <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      : <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-semibold truncate ${item.present ? "text-gray-200" : "text-gray-500"}`}>{item.label}</p>
                      <p className="text-[10px] text-gray-600">{item.section}</p>
                    </div>
                    {item.present ? (
                      <span className="text-[10px] text-emerald-400 font-bold">✓</span>
                    ) : (
                      <span className="text-[10px] text-amber-400 font-bold px-1.5 py-0.5 bg-amber-500/10 rounded border border-amber-500/20">Missing</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {documents.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-850">
                <p className="text-[10px] text-gray-500 font-medium mb-2">All Uploaded Files ({documents.length})</p>
                <div className="space-y-1 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
                  {documents.slice(0, 6).map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between text-[10px]">
                      <span className="text-gray-400 truncate max-w-[150px]">{doc.document_name}</span>
                      <span className={`font-semibold px-1 rounded ${
                        doc.processing_status === "COMPLETED" ? "text-emerald-400" :
                        doc.processing_status === "PROCESSING" ? "text-amber-400 animate-pulse" :
                        "text-gray-500"
                      }`}>{doc.processing_status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SCOPE BASELINE */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Scope Baseline
                </h3>
                <Link to={`/projects/${id}/baseline`} className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold">
                  Review <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {!baseline ? (
                <div className="py-8 text-center">
                  <ScrollText className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No baseline extracted yet.</p>
                  {isEM && (
                    <Link to={`/projects/${id}/baseline`} className="text-[11px] text-purple-400 hover:text-purple-300 font-semibold mt-2 inline-flex items-center gap-1">
                      Extract Baseline <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                      baselineApproved
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                    }`}>
                      {baseline.status}
                    </span>
                    <span className="text-[10px] text-gray-500">{totalItems} scope items</span>
                  </div>

                  {/* Stacked bar */}
                  {totalItems > 0 && (
                    <div className="mb-4">
                      <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-2">
                        {inScopeItems.length > 0 && (
                          <div className="bg-emerald-500 transition-all" style={{ width: `${(inScopeItems.length / totalItems) * 100}%` }} />
                        )}
                        {outOfScopeItems.length > 0 && (
                          <div className="bg-rose-500 transition-all" style={{ width: `${(outOfScopeItems.length / totalItems) * 100}%` }} />
                        )}
                        {uncertainItems.length > 0 && (
                          <div className="bg-amber-500 transition-all" style={{ width: `${(uncertainItems.length / totalItems) * 100}%` }} />
                        )}
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-emerald-400 font-semibold">In Scope: {inScopeItems.length}</span>
                        <span className="text-rose-400 font-semibold">Out: {outOfScopeItems.length}</span>
                        <span className="text-amber-400 font-semibold">Uncertain: {uncertainItems.length}</span>
                      </div>
                    </div>
                  )}

                  {/* Top scope items preview */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {(showAllScopeItems ? inScopeItems : inScopeItems.slice(0, 3)).map((item: any) => (
                      <div key={item.id} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                        <CheckCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[11px] font-semibold text-gray-200 leading-tight">{item.name}</p>
                          {item.description && <p className="text-[10px] text-gray-500 truncate">{item.description?.slice(0, 55)}…</p>}
                        </div>
                      </div>
                    ))}
                    {inScopeItems.length > 3 && (
                      <button
                        onClick={() => setShowAllScopeItems(!showAllScopeItems)}
                        className="w-full text-[10px] text-purple-400 text-center font-semibold mt-1 hover:text-purple-300 transition-colors cursor-pointer focus:outline-none block"
                      >
                        {showAllScopeItems ? "Show less" : `+${inScopeItems.length - 3} more in scope items`}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* RISK SUMMARY */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  Risk Summary
                </h3>
                <Link to={`/projects/${id}/tracker`} className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 font-semibold">
                  Tracker <ArrowRight className="w-3 h-3" />
                </Link>
              </div>

              {risks.length === 0 ? (
                <div className="py-8 text-center">
                  <Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                  <p className="text-xs text-gray-500">No risk findings recorded yet.</p>
                </div>
              ) : (
                <>
                  {/* Severity breakdown bars */}
                  <div className="space-y-2.5 mb-4">
                    {[
                      { label: "Critical / High", count: riskHigh, color: "bg-rose-500", textColor: "text-rose-400" },
                      { label: "Medium", count: riskMed, color: "bg-amber-500", textColor: "text-amber-400" },
                      { label: "Low", count: riskLow, color: "bg-blue-500", textColor: "text-blue-400" },
                      { label: "Resolved", count: resolvedRisks.length, color: "bg-emerald-500", textColor: "text-emerald-400" },
                    ].map((bar) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-[10px] mb-1">
                          <span className="text-gray-500">{bar.label}</span>
                          <span className={`font-bold ${bar.textColor}`}>{bar.count}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${bar.color} rounded-full transition-all duration-700`}
                            style={{ width: risks.length > 0 ? `${(bar.count / risks.length) * 100}%` : "0%" }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Recent risks */}
                  <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                    {openRisks.slice(0, 4).map((risk) => (
                      <div key={risk.id} className="flex items-start gap-2 p-2 bg-gray-800/50 rounded-lg border border-gray-700/30">
                        <span className={`inline-block mt-0.5 w-2 h-2 rounded-full flex-shrink-0 ${
                          risk.severity === "HIGH" || risk.severity === "CRITICAL" ? "bg-rose-400" :
                          risk.severity === "MEDIUM" ? "bg-amber-400" : "bg-blue-400"
                        }`} />
                        <div className="min-w-0">
                          <p className="text-[11px] font-semibold text-gray-200 leading-tight truncate">{risk.title || risk.finding}</p>
                          <p className="text-[10px] text-gray-500">{risk.severity}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── THIRD ROW: Members + Activity ────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

          {/* TEAM MEMBERS */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Project Team
              </h3>
              <Link to={`/projects/${id}/members`} className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold">
                Manage <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {members.length === 0 ? (
              <div className="py-6 text-center">
                <Users className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">No team members assigned.</p>
                {isEM && (
                  <Link to={`/projects/${id}/members`} className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold mt-2 inline-flex items-center gap-1">
                    Add Members <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[280px] overflow-y-auto pr-1">
                {members.map((member) => (
                  <div key={member.id} className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/30 hover:border-teal-500/30 transition-all">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                      member.role === "STAKEHOLDER" ? "bg-indigo-500/20 text-indigo-300" :
                      member.role === "TEAM_LEAD" ? "bg-teal-500/20 text-teal-300" :
                      "bg-gray-700 text-gray-300"
                    }`}>
                      {member.name?.charAt(0)?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{member.name}</p>
                      <p className="text-[10px] text-gray-500">{member.role?.replace("_", " ")}</p>
                      {member.responsibility && (
                        <p className="text-[10px] text-gray-600 truncate">{member.responsibility}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* WHAT NEEDS ATTENTION */}
          <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-5 backdrop-blur-md">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                What Needs Attention
              </h3>
            </div>

            <div className="space-y-2">
              {[
                {
                  show: !hasEL,
                  level: "critical",
                  title: "Missing Engagement Letter",
                  desc: "Upload the EL document to begin initiation.",
                  action: { label: "Upload Now", to: `/projects/${id}/cockpit` },
                },
                {
                  show: !hasIFA,
                  level: "critical",
                  title: "Missing IFA Document",
                  desc: "Independence & Financial Assessment not uploaded.",
                  action: { label: "Upload Now", to: `/projects/${id}/cockpit` },
                },
                {
                  show: !baseline,
                  level: "high",
                  title: "No Scope Baseline",
                  desc: "Extract baseline from uploaded contract documents.",
                  action: { label: "Extract", to: `/projects/${id}/baseline` },
                },
                {
                  show: baseline && !baselineApproved,
                  level: "high",
                  title: "Baseline Pending Approval",
                  desc: "Approve the draft baseline to activate monitoring.",
                  action: { label: "Review", to: `/projects/${id}/baseline` },
                },
                {
                  show: criticalRisks.length > 0,
                  level: "critical",
                  title: `${criticalRisks.length} Critical Risk${criticalRisks.length > 1 ? "s" : ""} Open`,
                  desc: "Critical risks require immediate resolution.",
                  action: { label: "View Risks", to: `/projects/${id}/tracker` },
                },
                {
                  show: daysRemaining !== null && daysRemaining < 0,
                  level: "critical",
                  title: "Project Is Overdue",
                  desc: `End date was ${Math.abs(daysRemaining ?? 0)} days ago.`,
                  action: { label: "View", to: `/projects/${id}` },
                },
                {
                  show: daysRemaining !== null && daysRemaining !== null && daysRemaining >= 0 && daysRemaining < 14,
                  level: "warning",
                  title: `${daysRemaining} Days Until Deadline`,
                  desc: "Project is approaching its end date.",
                  action: { label: "Review", to: `/projects/${id}` },
                },
                {
                  show: members.length === 0,
                  level: "warning",
                  title: "No Team Members Assigned",
                  desc: "Assign stakeholders and team leads to this project.",
                  action: { label: "Add Members", to: `/projects/${id}/members` },
                },
              ]
                .filter((item) => item.show)
                .map((item, i) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-xl border ${
                    item.level === "critical"
                      ? "bg-rose-950/20 border-rose-500/20"
                      : "bg-amber-950/20 border-amber-500/20"
                  }`}>
                    {item.level === "critical"
                      ? <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-bold ${item.level === "critical" ? "text-rose-300" : "text-amber-300"}`}>{item.title}</p>
                      <p className="text-[11px] text-gray-500">{item.desc}</p>
                    </div>
                    <Link to={item.action.to} className={`text-[10px] font-bold px-2.5 py-1 rounded-lg flex-shrink-0 transition-all ${
                      item.level === "critical"
                        ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30 border border-rose-500/30"
                        : "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-500/30"
                    }`}>
                      {item.action.label}
                    </Link>
                  </div>
                ))
              }

              {/* All clear */}
              {[
                !hasEL, !hasIFA, !baseline, baseline && !baselineApproved,
                criticalRisks.length > 0,
                daysRemaining !== null && daysRemaining < 0,
                daysRemaining !== null && daysRemaining >= 0 && daysRemaining < 14,
                members.length === 0
              ].every(v => !v) && (
                <div className="py-8 text-center">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
                  <p className="text-sm font-bold text-emerald-400">All Clear!</p>
                  <p className="text-xs text-gray-500 mt-1">No immediate actions required. Project is healthy.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── QUICK NAVIGATION FOOTER ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Document Cockpit", desc: "Upload & manage project documents", to: `/projects/${id}/cockpit`, icon: <UploadCloud className="w-5 h-5" />, color: "from-blue-600/20 to-blue-500/5 border-blue-500/20 text-blue-300" },
            { label: "Baseline Review", desc: "Scope items & approval workflow", to: `/projects/${id}/baseline`, icon: <ScrollText className="w-5 h-5" />, color: "from-purple-600/20 to-purple-500/5 border-purple-500/20 text-purple-300" },
            { label: "Risk Tracker", desc: "Monitor & resolve scope risks", to: `/projects/${id}/tracker`, icon: <Activity className="w-5 h-5" />, color: "from-rose-600/20 to-rose-500/5 border-rose-500/20 text-rose-300" },
            { label: "Team Members", desc: "Stakeholders & team leads", to: `/projects/${id}/members`, icon: <Users className="w-5 h-5" />, color: "from-teal-600/20 to-teal-500/5 border-teal-500/20 text-teal-300" },
          ].map((item) => (
            <Link key={item.to} to={item.to} className={`bg-gradient-to-br ${item.color} border rounded-2xl p-4 hover:scale-[1.02] transition-all duration-200 group`}>
              <div className="mb-2 opacity-80 group-hover:opacity-100">{item.icon}</div>
              <p className="text-xs font-bold text-white mb-0.5">{item.label}</p>
              <p className="text-[10px] text-gray-500">{item.desc}</p>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
};
