import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  FileText, 
  RefreshCw, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight,
  Sun,
  Moon
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { user } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col relative overflow-hidden">
      {/* Background Decorative Glow Bubbles */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF5A14]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF7A45]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-[#FF5A14]/5 blur-[100px] pointer-events-none" />

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-[#D8D8D8] dark:border-white/10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] rounded-xl shadow-lg shadow-[#FF5A14]/20">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl font-black tracking-tight text-[#FF5A14]">
            ACSE
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Theme Switch Toggle */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#333333] border border-[#D8D8D8] dark:border-[#444444] text-[#666666] dark:text-[#cccccc] transition-all duration-300 shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-semibold"
            title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
          >
            {resolvedTheme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span className="hidden sm:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#FF5A14]" />
                <span className="hidden sm:inline">Dark</span>
              </>
            )}
          </button>

          {user ? (
            <Link 
              to="/dashboard" 
              className="group flex items-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#FF5A14]/20"
            >
              Go to Dashboard
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="px-5 py-2.5 bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#333333] border border-[#D8D8D8] dark:border-[#444444] text-[#666666] dark:text-[#cccccc] hover:text-[#4A4A4A] rounded-xl font-medium transition-all duration-300"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-16 md:py-24 max-w-7xl mx-auto w-full">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#FF5A14]/10 border border-[#FF8A55]/30 text-[#FF5A14] text-sm font-semibold mb-8 animate-pulse">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A14]" />
          Enterprise AI & Hybrid RAG System
        </div>

        {/* Title */}
        <h2 className="font-display text-5xl md:text-7xl font-black mb-8 tracking-tight leading-[1.1] max-w-5xl">
          Autonomous Contract <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A14] via-[#FF7A45] to-[#4A4A4A]">
            Scope Evaluator
          </span>
        </h2>

        {/* Description */}
        <p className="text-lg md:text-xl text-[#666666] max-w-3xl mb-12 font-light leading-relaxed">
          Unlock complete control over your contract deliverables. ACSE parses baseline constraints, tracks status reports in real-time, and flags hidden scope creep with evidence-backed audits.
        </p>

        {/* Action Button */}
        <div className="mb-20">
          {user ? (
            <Link 
              to="/dashboard" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-[#FF5A14]/25 hover:-translate-y-0.5"
            >
              Manage Projects
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link 
              to="/login" 
              className="group inline-flex items-center gap-3 px-8 py-4 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-2xl transition-all duration-300 shadow-xl shadow-[#FF5A14]/25 hover:-translate-y-0.5"
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
              icon: <FileText className="w-6 h-6 text-[#FF5A14]" />,
              title: "Contract Understanding", 
              desc: "Extract precise baseline deliverable matrices, out-of-scope constraints, and stakeholders from raw Engagement Letters (EL) or IFA documents." 
            },
            { 
              icon: <RefreshCw className="w-6 h-6 text-[#FF7A45]" />,
              title: "Continuous Tracking", 
              desc: "Continuously ingest weekly Status Reports, project update sheets, and meeting minutes to maintain accurate activity logs." 
            },
            { 
              icon: <Database className="w-6 h-6 text-[#FF5A14]" />,
              title: "Hybrid RAG Engine", 
              desc: "Combines dense vector search (ChromaDB) with keyword sparse indexing (BM25) fused via Reciprocal Rank Fusion and Cross-Encoder reranking." 
            },
            { 
              icon: <AlertTriangle className="w-6 h-6 text-amber-500 dark:text-amber-400" />,
              title: "Scope Creep Detection", 
              desc: "Intelligently flags potential scope drift, missing deliverables, or off-track tasks, categorizing severity levels instantly." 
            },
            { 
              icon: <CheckCircle2 className="w-6 h-6 text-emerald-400" />,
              title: "Reflexion Verification", 
              desc: "Multi-turn AI evaluation loops that draft assessments and then cross-verify them against baseline clauses, ensuring evidence-backed audits." 
            },
            { 
              icon: <Mail className="w-6 h-6 text-[#FF7A45]" />,
              title: "SMTP Alert Routing", 
              desc: "Automatically drafts and schedules email alerts to Engagement Managers or Project Leads when critical scope violations are identified." 
            },
          ].map((feature, idx) => (
            <div 
              key={idx} 
              className="group p-8 rounded-2xl bg-bg-card border border-[#D8D8D8] hover:border-[#FF8A55] hover:bg-[#FFF7F2] transition-all duration-300 hover:shadow-2xl hover:shadow-[#FF5A14]/5 hover:-translate-y-1 relative overflow-hidden"
            >
              {/* Subtle hover accent light */}
              <div className="absolute top-0 right-0 w-[80px] h-[80px] rounded-full bg-[#FF5A14]/0 group-hover:bg-[#FF5A14]/10 blur-2xl transition-all duration-500" />
              
              <div className="p-3 bg-[#FFF7F2] group-hover:bg-[#FF5A14]/10 rounded-xl w-fit mb-5 transition-colors duration-300">
                {feature.icon}
              </div>
              <h3 className="font-display text-xl font-bold mb-3 text-text-primary group-hover:text-[#FF5A14] transition-colors duration-300">
                {feature.title}
              </h3>
              <p className="text-[#666666] text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-border-subtle py-8 text-center text-text-muted text-sm backdrop-blur-sm">
        <p>&copy; {new Date().getFullYear()} ACSE — Autonomous Contract Scope Evaluator. All rights reserved.</p>
      </footer>
    </div>
  );
};

