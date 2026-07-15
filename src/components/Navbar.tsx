import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (!user || location.pathname === '/' || location.pathname === '/login') return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/projects" className="text-xl font-bold text-white hover:text-blue-400 transition-colors">ACSE</Link>
          {location.pathname !== '/projects' && location.pathname !== '/dashboard' && (
            <button onClick={() => navigate('/projects')} className="text-sm text-gray-300 hover:text-white bg-gray-700 px-3 py-1 rounded">
              ← Back to Projects List
            </button>
          )}
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-300 hidden md:inline">
            {user.name} <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-1 rounded ml-2">{user.role}</span>
          </span>
          <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 bg-red-900/20 px-3 py-1 rounded">Logout</button>
        </div>
      </div>
    </nav>
  );
};
