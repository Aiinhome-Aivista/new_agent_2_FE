import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { CreateProjectPage } from './pages/CreateProjectPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDashboardPage } from './pages/ProjectDashboardPage';
import { BaselineReviewPage } from './pages/BaselineReviewPage';
import { TrackerPage } from './pages/TrackerPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { RoleProtectedRoute } from './routes/RoleProtectedRoute';
import { Navbar } from './components/Navbar';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/unauthorized" element={<UnauthorizedPage />} />
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} 
          />
          <Route 
            path="/projects" 
            element={<ProtectedRoute><ProjectsPage /></ProtectedRoute>} 
          />
          <Route 
            path="/projects/:id" 
            element={<ProtectedRoute><ProjectDashboardPage /></ProtectedRoute>} 
          />
          <Route 
            path="/projects/:id/baseline" 
            element={<ProtectedRoute><BaselineReviewPage /></ProtectedRoute>} 
          />
          <Route 
            path="/projects/:id/tracker" 
            element={<ProtectedRoute><TrackerPage /></ProtectedRoute>} 
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
