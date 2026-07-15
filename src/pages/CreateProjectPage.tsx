import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

export const CreateProjectPage: React.FC = () => {
  const [projectName, setProjectName] = useState('');
  const [clientName, setClientName] = useState('');
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiClient.post('/projects/', {
        project_name: projectName,
        client_name: clientName,
        description
      });
      if (res.data.success) {
        navigate('/projects');
      }
    } catch (error) {
      console.error("Failed to create project");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8 flex items-center justify-center">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-xl border border-gray-700">
        <h2 className="text-2xl font-bold mb-6">Create New Project</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
          <button type="submit" className="w-full py-2 bg-blue-600 rounded-md">Create</button>
        </form>
      </div>
    </div>
  );
};
