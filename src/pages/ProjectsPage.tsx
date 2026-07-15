import React, { useEffect, useState } from 'react';
import type { Project } from '../types';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Link } from 'react-router-dom';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const res = await apiClient.get('/projects/');
      if (res.data.success) {
        setProjects(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch projects");
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

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Projects</h1>
          {(user?.role === 'ADMIN' || user?.role === 'ENGAGEMENT_MANAGER') && (
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-blue-600 rounded-md">Create Project</button>
          )}
        </div>
        
        {projects.length === 0 ? (
          <p className="text-gray-400">No data found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => (
              <div key={p.id} className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-blue-500 transition-colors">
                <h3 className="text-xl font-bold mb-2">{p.project_name}</h3>
                <p className="text-gray-400 mb-4">{p.client_name}</p>
                <div className="flex justify-between items-center">
                  <span className="px-2 py-1 bg-gray-700 rounded text-sm">{p.monitoring_status}</span>
                  <Link to={`/projects/${p.id}`} className="text-blue-400 hover:text-blue-300">View &rarr;</Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl font-bold">&times;</button>
            <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Project Name</label>
                <input required type="text" value={projectName} onChange={e => setProjectName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Client Name</label>
                <input type="text" value={clientName} onChange={e => setClientName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Description</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2" rows={4}></textarea>
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 bg-gray-600 hover:bg-gray-500 rounded-md">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
