import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { 
  Briefcase, 
  ScrollText, 
  AlertTriangle, 
  Bell, 
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    unresolved_risks: 0,
    active_projects: 0,
    contract_baselines: { total: 0, approved: 0 },
    scope_creep_risks: { total: 0, high_severity: 0 },
    system_alerts: 0,
    recent_activities: [] as any[]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/dashboard/stats');
        if (response.data.success) {
          setData(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const stats = [
    { label: 'Active Projects', value: data.active_projects.toString(), change: 'Total tracked', icon: <Briefcase className="w-5 h-5 text-teal-400" />, accentColor: 'from-teal-500/60 to-teal-400/20', bg: 'from-teal-500/10 to-teal-400/5', iconBg: 'bg-teal-500/10 ring-teal-500/20' },
    { label: 'Contract Baselines', value: data.contract_baselines.total.toString(), change: `${data.contract_baselines.approved} Approved`, icon: <ScrollText className="w-5 h-5 text-blue-400" />, accentColor: 'from-blue-500/60 to-blue-400/20', bg: 'from-blue-500/10 to-blue-400/5', iconBg: 'bg-blue-500/10 ring-blue-500/20' },
    { label: 'Scope Creep Risks', value: data.scope_creep_risks.total.toString(), change: `${data.scope_creep_risks.high_severity} High severity`, icon: <AlertTriangle className="w-5 h-5 text-amber-400" />, accentColor: 'from-amber-500/60 to-amber-400/20', bg: 'from-amber-500/10 to-amber-400/5', iconBg: 'bg-amber-500/10 ring-amber-500/20' },
    { label: 'System Alerts Sent', value: data.system_alerts.toString(), change: 'All delivered', icon: <Bell className="w-5 h-5 text-rose-400" />, accentColor: 'from-rose-500/60 to-rose-400/20', bg: 'from-rose-500/10 to-rose-400/5', iconBg: 'bg-rose-500/10 ring-rose-500/20' },
  ];

  const getLogIcon = (type: string) => {
    if (type.includes('FAIL') || type.includes('ERROR')) return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    if (type.includes('SUCCESS') || type.includes('APPROVE')) return <CheckCircle className="w-4 h-4 text-teal-400" />;
    return <Info className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="flex-1 bg-[#020617] text-white p-6 md:p-10 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-teal-500/5 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full bg-blue-500/4 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Block */}
        <div className="animate-fade-in-up">
          <h1 className="font-display text-3xl font-black tracking-tight mb-1 text-white">
            Workspace Cockpit
          </h1>
          <p className="text-gray-400 text-sm">
            Overview of project scope compliance, tracking statistics, and alerts.
          </p>
        </div>

        {/* Welcome Banner Hero */}
        <div className="glass-card p-8 relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '60ms' }}>
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-teal-500/40 via-blue-500/20 to-transparent" />
          <div className="absolute top-0 right-0 w-[250px] h-[250px] rounded-full bg-teal-500/8 blur-[80px] pointer-events-none" />
          <div className="max-w-2xl relative">
            <h2 className="text-2xl font-bold mb-3 text-white">
              Welcome back, <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-400">{user?.name}</span>!
            </h2>
            <p className="text-gray-300 text-sm leading-relaxed mb-6">
              The AI autonomous systems are currently monitoring contract scope parameters across all active pipelines. There are currently <span className="text-teal-300 font-semibold">{loading ? '...' : data.unresolved_risks} unresolved risk warnings</span> that require evaluation review.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 rounded-xl text-xs font-semibold transition-all duration-300 shadow-md shadow-teal-500/10 cursor-pointer"
              >
                Launch Projects List
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Grid with stagger */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stats.map((stat, i) => (
            <div 
              key={i} 
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border border-transparent backdrop-blur-sm flex flex-col justify-between overflow-hidden group hover:border-transparent transition-all duration-300 hover:shadow-lg animate-card-entrance`}
              style={{ animationDelay: `${140 + i * 80}ms` }}
            >
              {/* Accent top bar */}
              <div className={`absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r ${stat.accentColor}`} />
              
              <div className="flex justify-between items-start mb-4">
                <span className="text-gray-400 text-[10px] font-bold tracking-[0.1em] uppercase">{stat.label}</span>
                <div className={`p-2 rounded-lg ring-1 ${stat.iconBg}`}>
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight text-white mb-1">
                  {loading ? (
                    <span className="inline-block w-10 h-8 bg-white/5 rounded animate-pulse" />
                  ) : stat.value}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-gray-500 font-medium">
                  <TrendingUp className="w-3 h-3 text-teal-400" />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Audits & Activity Feed */}
          <div className="lg:col-span-2 glass-card p-6 flex flex-col justify-between animate-card-entrance" style={{ animationDelay: '500ms' }}>
            <div>
              <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-400" />
                Pipeline Event Logs
              </h3>
              <div className="space-y-1">
                {loading ? (
                  <div className="space-y-3">
                    {[1,2,3].map(i => (
                      <div key={i} className="flex gap-4 p-3 rounded-xl">
                        <div className="w-4 h-4 bg-white/5 rounded animate-pulse mt-1" />
                        <div className="flex-1 space-y-2">
                          <div className="w-1/3 h-3 bg-white/5 rounded animate-pulse" />
                          <div className="w-2/3 h-2.5 bg-white/5 rounded animate-pulse" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : data.recent_activities.length === 0 ? (
                  <p className="text-gray-500 text-sm py-4">No recent activity found.</p>
                ) : (
                  data.recent_activities.map((log, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-white/[0.025] transition-colors duration-200 group cursor-default">
                      <div className="mt-0.5 shrink-0">
                        {getLogIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-0.5 gap-3">
                          <p className="text-sm font-semibold text-white group-hover:text-teal-300 transition-colors duration-200 truncate">
                            {log.project_name || 'System Action'}
                          </p>
                          <span className="text-[10px] text-gray-500 font-mono whitespace-nowrap shrink-0">
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-gray-400 leading-relaxed">
                          <span className="text-gray-300 font-medium">[{log.agent_name}]</span> {log.action}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Link 
              to="/projects" 
              className="text-xs text-teal-400 hover:text-teal-300 font-semibold inline-flex items-center gap-1 mt-6 cursor-pointer transition-colors duration-200 group"
            >
              Audit Detailed Project Lifecycles
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
          </div>

          {/* Quick Access Settings / Info panel */}
          <div className="glass-card p-6 flex flex-col justify-between animate-card-entrance" style={{ animationDelay: '580ms' }}>
            <div>
              <h3 className="text-lg font-bold mb-4 text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-400" />
                Audit Status
              </h3>
              <div className="p-4 rounded-xl bg-white/[0.02] border border-transparent space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">RAG Vector Index Status</span>
                    <span className="text-teal-400 font-semibold">Ready</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-400 h-full w-[100%] rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">LLM Endpoint Timeout</span>
                    <span className="text-gray-300">300s (OK)</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-400 h-full w-[100%] rounded-full" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-gray-400">SMTP Server Delivery</span>
                    <span className="text-teal-400 font-semibold">Active</span>
                  </div>
                  <div className="w-full bg-white/[0.04] h-1.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-teal-500 to-teal-400 h-full w-[100%] rounded-full" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-gray-500 leading-relaxed bg-white/[0.015] p-3.5 rounded-xl border border-transparent">
              <span className="font-semibold text-gray-400 block mb-1">Assigned Role: {user?.role}</span>
              You have access to verify project deliverables, ingest report summaries, and execute baseline RAG matching checks.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
