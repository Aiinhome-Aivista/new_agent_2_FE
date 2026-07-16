import React, { useEffect, useState } from 'react';
import type { Project } from '../types';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';
import { Loader } from '../components/Loader';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get('/projects/');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/projects/', {
        project_name: projectName,
        client_name: clientName,
        description
      });
      if (res.data.success) {
        setIsModalOpen(false);
        setProjectName('');
        setClientName('');
        setDescription('');
        fetchProjects(); // Refresh the list
      }
    } catch (error) {
      console.error("Failed to create project");
    }
  };

  if (loading) {
    return <Loader message="Fetching projects directory..." />;
  }

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white">Projects Directory</h1>
            <p className="text-gray-400 text-sm">Select a project to audit deliverables or view contract scope baselines.</p>
          </div>
          {(user?.role === 'ADMIN' || user?.role === 'ENGAGEMENT_MANAGER') && (
            <button 
              onClick={() => setIsModalOpen(true)} 
              className="px-5 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all duration-300 shadow-md shadow-teal-500/10 active:scale-[0.98]"
            >
              Create Project
            </button>
          )}
        </div>
        
        {projects.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/[0.01] border border-white/5 text-center">
            <p className="text-gray-500 text-sm">No projects currently initialized.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div 
                key={p.id} 
                className="group p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-teal-500/30 hover:bg-white/[0.04] transition-all duration-300 hover:shadow-2xl hover:shadow-teal-500/5 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <h3 className="font-display text-lg font-bold mb-1 text-white group-hover:text-teal-300 transition-colors duration-300">{p.project_name}</h3>
                  <p className="text-gray-400 text-xs mb-4">{p.client_name || 'No Client Name'}</p>
                </div>
                <div className="flex justify-between items-center border-t border-white/5 pt-4 mt-2">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                    p.monitoring_status === 'ACTIVE' 
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' 
                      : p.monitoring_status === 'DRAFT' 
                        ? 'bg-gray-500/15 text-gray-400 border border-gray-500/20'
                        : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {p.monitoring_status}
                  </span>
                  <Link 
                    to={`/projects/${p.id}`} 
                    className="text-xs font-semibold text-teal-400 hover:text-teal-300 flex items-center gap-1 group/btn transition-colors"
                  >
                    View Cockpit
                    <span className="group-hover/btn:translate-x-1 transition-transform">&rarr;</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="max-w-md w-full bg-[#0b0e17] p-8 rounded-2xl border border-white/5 shadow-2xl relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl transition-colors"
            >
              &times;
            </button>
            <h2 className="font-display text-2xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-teal-300 to-blue-400">
              Create New Project
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Project Name</label>
                <input 
                  required 
                  type="text" 
                  value={projectName} 
                  onChange={e => setProjectName(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 text-sm transition-all"
                  placeholder="e.g. Acme Audit 2026"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Client Name</label>
                <input 
                  type="text" 
                  value={clientName} 
                  onChange={e => setClientName(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 text-sm transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Description</label>
                <textarea 
                  value={description} 
                  onChange={e => setDescription(e.target.value)} 
                  className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500 text-white placeholder-gray-500 text-sm transition-all"
                  placeholder="Summarize project requirements..."
                  rows={4}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-400 hover:to-blue-500 text-white font-semibold rounded-xl text-xs transition-all shadow-md shadow-teal-500/10"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

