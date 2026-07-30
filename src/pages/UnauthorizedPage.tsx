import React from 'react';
import { Link } from 'react-router-dom';

export const UnauthorizedPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-card text-text-primary px-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-red-500 mb-4">403</h1>
        <h2 className="text-2xl font-semibold mb-6">Access Denied</h2>
        <p className="text-text-muted mb-8 max-w-md">
          You do not have the required permissions to access this page. Please contact your system administrator if you believe this is an error.
        </p>
        <Link to="/dashboard" className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-text-primary rounded-md transition-colors">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
