import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { 
  FileText, 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight 
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();

  const features = [
    { 
      icon: <FileText className="w-6 h-6 text-teal-400" />,
      title: "Contract Understanding", 
      desc: "Extract precise baseline deliverable matrices, out-of-scope constraints, and stakeholders from raw Engagement Letters (EL) or IFA documents.",
      accentColor: "from-teal-500/60 to-teal-400/30",
    },
    { 
      icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
      title: "Continuous Tracking", 
      desc: "Continuously ingest weekly Status Reports, project update sheets, and meeting minutes to maintain accurate activity logs.",
      accentColor: "from-blue-500/60 to-blue-400/30",
    },
    { 
      icon: <Database className="w-6 h-6 text-indigo-400" />,
      title: "Hybrid RAG Engine", 
      desc: "Combines dense vector search (ChromaDB) with keyword sparse indexing (BM25) fused via Reciprocal Rank Fusion and Cross-Encoder reranking.",
      accentColor: "from-indigo-500/60 to-indigo-400/30",
    },
    { 
      icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
      title: "Scope Creep Detection", 
      desc: "Intelligently flags potential scope drift, missing deliverables, or off-track tasks, categorizing severity levels instantly.",
      accentColor: "from-amber-500/60 to-amber-400/30",
    },
    { 
      icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
      title: "Reflexion Verification", 
      desc: "Multi-turn AI evaluation loops that draft assessments and then cross-verify them against baseline clauses, ensuring evidence-backed audits.",
      accentColor: "from-emerald-500/60 to-emerald-400/30",
    },
    { 
      icon: <Mail className="w-6 h-6 text-rose-400" />,
      title: "SMTP Alert Routing", 
      desc: "Automatically drafts and schedules email alerts to Engagement Managers or Project Leads when critical scope violations are identified.",
      accentColor: "from-rose-500/60 to-rose-400/30",
    },
  ];

  return (
    <div className="min-h-screen bg-[#020617] text-white flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/8 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/8 blur-[160px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-transparent backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl shadow-lg shadow-teal-500/20 ring-1 ring-transparent">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-teal-200 to-blue-400">
            ACSE
          </span>
        </div>
        
        <div>
          {user ? (
            <Link 
              to="/dashboard" 
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-teal-500/15 hover:shadow-teal-400/25 cursor-pointer"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-transparent hover:border-transparent rounded-xl font-medium transition-all duration-300 cursor-pointer"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        {/* Badge — NO animate-pulse (anti-pattern for non-critical elements) */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-teal-500/8 border border-teal-500/20 text-teal-300 text-sm font-semibold mb-8 animate-fade-in-up">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse-ring" />
          Enterprise AI & Hybrid RAG System
        </div>

        {/* Title */}
        <h2 className="font-display text-5xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1] max-w-5xl animate-fade-in-up" style={{ animationDelay: '80ms' }}>
          Autonomous Contract <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-blue-400">
            Scope Evaluator
          </span>
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mb-12 font-light leading-relaxed animate-fade-in-up" style={{ animationDelay: '160ms' }}>
          Unlock complete control over your contract deliverables. ACSE parses baseline constraints, tracks status reports in real-time, and flags hidden scope creep with evidence-backed audits.
        </p>

        {/* Action Button */}
        <div className="mb-20 animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          {user ? (
            <Link 
              to="/dashboard" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:-translate-y-0.5 cursor-pointer"
            >
              Manage Projects
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:-translate-y-0.5 cursor-pointer"
            >
              Get Started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          )}
        </div>

        {/* Features Grid with staggered entrance */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left relative z-20">
          {features.map((feature, idx) => (
            <div 
              key={idx} 
              className="group glass-card card-accent-top p-8 hover:-translate-y-1.5 relative overflow-hidden"
              style={{ animationDelay: `${320 + idx * 80}ms` }}
            >
              {/* Accent top bar with per-card color */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${feature.accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

              {/* Subtle hover accent light */}
              <div className="absolute top-0 right-0 w-[100px] h-[100px] rounded-full bg-teal-500/0 group-hover:bg-teal-500/5 blur-3xl transition-all duration-500" />
              
              <div className="p-3 bg-white/[0.04] group-hover:bg-teal-500/10 rounded-xl w-fit mb-5 transition-all duration-300 ring-1 ring-transparent group-hover:ring-teal-500/20">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-white group-hover:text-teal-300 transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-transparent py-8 text-center text-gray-500 text-sm backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} ACSE — Autonomous Contract Scope Evaluator. All rights reserved.</p>
      </footer>
    </div>
  );
};
