import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Briefcase, 
  ScrollText, 
  AlertTriangle, 
  Bell, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Mock statistics for presentation
  const stats = [
    { label: 'Active Projects', value: '4', change: '+1 this week', icon: <Briefcase className="w-5 h-5 text-teal-400" />, bg: 'from-teal-500/10 to-teal-400/5' },
    { label: 'Contract Baselines', value: '12', change: '8 Approved', icon: <ScrollText className="w-5 h-5 text-blue-400" />, bg: 'from-blue-500/10 to-blue-400/5' },
    { label: 'Scope Creep Risks', value: '3', change: '2 High severity', icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, bg: 'from-amber-500/10 to-amber-400/5' },
    { label: 'System Alerts Sent', value: '15', change: 'All delivered', icon: <Bell className="w-5 h-5 text-rose-400" />, bg: 'from-rose-500/10 to-rose-400/5' },
  ];

  const recentActivities = [
    { project: 'Acme Corp Engagement', action: 'Baseline scope finalized and approved', time: '2 hours ago', type: 'success' },
    { project: 'Global Tech IFA', action: 'Weekly Status Report ingested & analyzed', time: '5 hours ago', type: 'info' },
    { project: 'Stark Industries Lease', action: 'Out-of-scope tasks detected in MoM details', time: '1 day ago', type: 'warning' },
  ];

  return (
    <div className="flex-1 bg-[#080b14] text-white p-6 md:p-10 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Block */}
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight mb-1 text-white">
            Workspace Cockpit
          </h1>
          <p className="text-gray-400 text-sm">
            Overview of project scope compliance, tracking statistics, and alerts.
          </p>
        </div>

        {/* Welcome Banner Hero */}
        <div className="p-8 rounded-2xl bg-gradient-to-r from-teal-900/30 via-blue-900/10 to-white/[0.02] border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-teal-500/10 blur-[80px] pointer-events-none" />
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-3 text-white">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-400">{user?.name}</span>!
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              The AI autonomous systems are currently monitoring contract scope parameters across all active pipelines. There are currently <span className="text-teal-300 font-semibold">3 unresolved risk warnings</span> that require evaluation review.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl text-xs font-semibold transition-all duration-300 shadow-md shadow-teal-500/10"
              >
                Launch Projects List
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border border-white/5 backdrop-blur-sm flex flex-col justify-between`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-xs font-semibold tracking-wider uppercase">{stat.label}</span>
                <div className="p-2 bg-white/5 rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight text-white mb-1">{stat.value}</p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                  <TrendingUp className="w-3 h-3 text-teal-400" />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Audits & Activity Feed */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-400" />
                Pipeline Event Logs
              </h3>
              <div className="space-y-4">
                {recentActivities.map((act, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-4 p-4 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 transition-colors"
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${
                      act.type === 'success' ? 'bg-emerald-400' : act.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white mb-0.5 truncate">{act.project}</p>
                      <p className="text-xs text-gray-400 leading-normal">{act.action}</p>
                    </div>
                    <span className="text-[10px] text-gray-500 shrink-0 self-start">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link 
              to="/projects" 
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 mt-6"
            >
              Audit Detailed Project Lifecycles
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Access Settings / Info panel */}
          <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                Audit Status
              </h3>
              <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5 space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">RAG Vector Index Status</span>
                    <span className="text-teal-400 font-semibold">Ready</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">LLM Endpoint Timeout</span>
                    <span className="text-gray-300">300s (OK)</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">SMTP Server Delivery</span>
                    <span className="text-teal-400 font-semibold">Active</span>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-500 leading-relaxed bg-[#0c101d] p-3.5 rounded-xl border border-white/5">
              <span className="font-semibold text-gray-400 block mb-1">Assigned Role: {user?.role}</span>
              You have access to verify project deliverables, ingest report summaries, and execute baseline RAG matching checks.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

