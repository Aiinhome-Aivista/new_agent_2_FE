import React from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-400">Welcome, {user?.name} ({user?.role})</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md transition-colors text-sm">Logout</button>
          </div>
        </div>
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
          <p className="text-gray-400 mb-4">Please select a module from the navigation menu.</p>
          <div className="flex gap-4">
            <a href="/projects" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors inline-block">Projects</a>
          </div>
        </div>
      </div>
    </div>
  );
};
