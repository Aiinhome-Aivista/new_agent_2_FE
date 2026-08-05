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
    { label: 'Active Projects', value: data.active_projects.toString(), change: 'Total tracked', icon: <Briefcase className="w-5 h-5 text-[#FF5A14]" />, bg: 'from-[#FF5A14]/15 to-[#FF5A14]/5', trendColor: 'text-[#FF5A14]' },
    { label: 'Contract Baselines', value: data.contract_baselines.total.toString(), change: `${data.contract_baselines.approved} Approved`, icon: <ScrollText className="w-5 h-5 text-[#FF5A14]" />, bg: 'from-[#FF5A14]/10 to-[#FF5A14]/5', trendColor: 'text-[#FF5A14]' },
    { label: 'Scope Creep Risks', value: data.scope_creep_risks.total.toString(), change: `${data.scope_creep_risks.high_severity} High severity`, icon: <AlertTriangle className="w-5 h-5 text-amber-500 dark:text-amber-400" />, bg: 'from-amber-500/10 to-amber-400/5', trendColor: 'text-amber-500 dark:text-amber-400' },
    { label: 'System Alerts Sent', value: data.system_alerts.toString(), change: 'All delivered', icon: <Bell className="w-5 h-5 text-rose-500 dark:text-rose-400" />, bg: 'from-rose-500/10 to-rose-400/5', trendColor: 'text-rose-500 dark:text-rose-400' },
  ];

  const getLogIcon = (type: string) => {
    if (type.includes('FAIL') || type.includes('ERROR')) return <AlertTriangle className="w-4 h-4 text-rose-500 dark:text-rose-400" />;
    if (type.includes('SUCCESS') || type.includes('APPROVE')) return <CheckCircle className="w-4 h-4 text-[#FF5A14]" />;
    return <Info className="w-4 h-4 text-[#666666] dark:text-[#9ca3af]" />;
  };

  return (
    <div className="flex-1 bg-bg-base text-text-primary p-6 md:p-10 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-[-30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF5A14]/10 blur-[120px] pointer-events-none" />
      
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header Block */}
        <div>
          <h1 className="font-display text-3xl font-black tracking-tight mb-1 text-text-primary">
            Workspace Cockpit
          </h1>
          <p className="text-text-muted text-sm">
            Overview of project scope compliance, tracking statistics, and alerts.
          </p>
        </div>

        {/* Welcome Banner Hero */}
        <div className="p-8 rounded-2xl bg-[#FFF7F2] dark:bg-[#2a221d] border border-[#FF8A55]/40 dark:border-[#FF8A55]/30 relative overflow-hidden shadow-md">
          <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-[#FF5A14]/10 blur-[80px] pointer-events-none" />
          <div className="max-w-2xl relative z-10">
            <h2 className="text-2xl font-bold mb-3 text-text-primary">
              Welcome back, <span className="text-[#FF5A14] dark:text-[#FF8A55] font-extrabold">{user?.name}</span>!
            </h2>
            <p className="text-[#666666] dark:text-[#d1d5db] text-sm leading-relaxed mb-6">
              The AI autonomous systems are currently monitoring contract scope parameters across all active pipelines. There are currently <span className="text-[#FF5A14] dark:text-[#FF7A45] font-bold">{loading ? '...' : data.unresolved_risks} unresolved risk warnings</span> that require evaluation review.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/projects" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white rounded-xl text-xs font-bold transition-all duration-300 shadow-md shadow-[#FF5A14]/20 cursor-pointer"
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
              className={`p-6 rounded-2xl bg-gradient-to-br ${stat.bg} border border-border-subtle backdrop-blur-sm flex flex-col justify-between hover:border-[#FF8A55]/50 transition-all`}
            >
              <div className="flex justify-between items-start mb-4">
                <span className="text-text-muted text-xs font-semibold tracking-wider uppercase">{stat.label}</span>
                <div className="p-2 bg-bg-hover rounded-lg">
                  {stat.icon}
                </div>
              </div>
              <div>
                <p className="text-3xl font-black tracking-tight text-text-primary mb-1">
                  {loading ? '...' : stat.value}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-text-muted font-medium">
                  <TrendingUp className={`w-3 h-3 ${stat.trendColor}`} />
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lower Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Audits & Activity Feed */}
          <div className="lg:col-span-2 p-6 rounded-2xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-teal-500 dark:text-teal-400" />
                Pipeline Event Logs
              </h3>
              <div className="space-y-4">
                {loading ? (
                  <p className="text-text-muted text-sm">Loading logs...</p>
                ) : data.recent_activities.length === 0 ? (
                  <p className="text-text-muted text-sm">No recent activity found.</p>
                ) : (
                  data.recent_activities.map((log, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-xl hover:bg-bg-hover transition-colors group">
                      <div className="mt-1">
                        {getLogIcon(log.action)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm font-semibold text-text-primary group-hover:text-teal-600 dark:text-teal-300 transition-colors">
                            {log.project_name || 'System Action'}
                          </p>
                          <span className="text-[10px] text-text-muted font-mono">
                            {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          <span className="text-text-secondary font-medium">[{log.agent_name}]</span> {log.action}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <Link 
              to="/projects" 
              className="text-xs text-teal-500 dark:text-teal-400 hover:text-teal-600 dark:text-teal-300 font-semibold inline-flex items-center gap-1 mt-6"
            >
              Audit Detailed Project Lifecycles
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Quick Access Settings / Info panel */}
          <div className="p-6 rounded-2xl bg-bg-card border border-border-subtle flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold mb-4 text-text-primary flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-teal-500 dark:text-teal-400" />
                Audit Status
              </h3>
              <div className="p-4 rounded-xl bg-bg-base border border-border-subtle space-y-4">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">RAG Vector Index Status</span>
                    <span className="text-teal-500 dark:text-teal-400 font-semibold">Ready</span>
                  </div>
                  <div className="w-full bg-bg-hover h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">LLM Endpoint Timeout</span>
                    <span className="text-text-secondary">300s (OK)</span>
                  </div>
                  <div className="w-full bg-bg-hover h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-500 h-full w-[100%]" />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-text-muted">SMTP Server Delivery</span>
                    <span className="text-teal-500 dark:text-teal-400 font-semibold">Active</span>
                  </div>
                  <div className="w-full bg-bg-hover h-1.5 rounded-full overflow-hidden">
                    <div className="bg-teal-400 h-full w-[100%]" />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-xs text-text-muted leading-relaxed bg-bg-base p-3.5 rounded-xl border border-border-subtle">
              <span className="font-semibold text-text-muted block mb-1">Assigned Role: {user?.role}</span>
              You have access to verify project deliverables, ingest report summaries, and execute baseline RAG matching checks.
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

