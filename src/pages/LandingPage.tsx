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

  return (
    <div className="min-h-screen bg-[#080b14] text-white flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-indigo-500/5 blur-[100px] pointer-events-none" />

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl shadow-lg shadow-teal-500/20">
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
              className="group flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl font-medium transition-all duration-300 shadow-lg shadow-teal-500/15 hover:shadow-teal-400/25"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-medium transition-all duration-300 hover:border-white/20"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-500/10 border border-teal-500/25 text-teal-300 text-sm font-semibold mb-8 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
          Enterprise AI & Hybrid RAG System
        </div>

        {/* Title */}
        <h2 className="font-display text-5xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1] max-w-5xl">
          Autonomous Contract <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-300 via-emerald-200 to-blue-400">
            Scope Evaluator
          </span>
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-gray-400 max-w-3xl mb-12 font-light leading-relaxed">
          Unlock complete control over your contract deliverables. ACSE parses baseline constraints, tracks status reports in real-time, and flags hidden scope creep with evidence-backed audits.
        </p>

        {/* Action Button */}
        <div className="mb-20">
          {user ? (
            <Link 
              to="/dashboard" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:-translate-y-0.5"
            >
              Manage Projects
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-2xl transition-all duration-300 shadow-xl shadow-teal-500/20 hover:shadow-teal-400/30 hover:-translate-y-0.5"
            >
              Get Started
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full text-left relative z-20">
          {[
            { 
              icon: <FileText className="w-6 h-6 text-teal-400" />,
              title: "Contract Understanding", 
              desc: "Extract precise baseline deliverable matrices, out-of-scope constraints, and stakeholders from raw Engagement Letters (EL) or IFA documents." 
            },
            { 
              icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
              title: "Continuous Tracking", 
              desc: "Continuously ingest weekly Status Reports, project update sheets, and meeting minutes to maintain accurate activity logs." 
            },
            { 
              icon: <Database className="w-6 h-6 text-indigo-400" />,
              title: "Hybrid RAG Engine", 
              desc: "Combines dense vector search (ChromaDB) with keyword sparse indexing (BM25) fused via Reciprocal Rank Fusion and Cross-Encoder reranking." 
            },
            { 
              icon: <AlertTriangle className="w-6 h-6 text-amber-400" />,
              title: "Scope Creep Detection", 
              desc: "Intelligently flags potential scope drift, missing deliverables, or off-track tasks, categorizing severity levels instantly." 
            },
            { 
              icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
              title: "Reflexion Verification", 
              desc: "Multi-turn AI evaluation loops that draft assessments and then cross-verify them against baseline clauses, ensuring evidence-backed audits." 
            },
            { 
              icon: <Mail className="w-6 h-6 text-rose-400" />,
              title: "SMTP Alert Routing", 
              desc: "Automatically drafts and schedules email alerts to Engagement Managers or Project Leads when critical scope violations are identified." 
            },
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-8 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.05] transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Subtle hover accent light */}
              <div className="absolute top-0 right-0 w-[80px] h-[80px] rounded-full bg-teal-500/0 group-hover:bg-teal-500/5 blur-2xl transition-all duration-500" />
              
              <div className="p-3 bg-white/5 group-hover:bg-teal-500/10 rounded-xl w-fit mb-5 transition-colors duration-300">
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
      <footer className="relative z-10 w-full border-t border-white/5 py-8 text-center text-gray-500 text-sm backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} ACSE — Autonomous Contract Scope Evaluator. All rights reserved.</p>
      </footer>
    </div>
  );
};

