import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { DocumentProgressProvider } from './context/DocumentProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { GlobalProgressWidget } from './components/GlobalProgressWidget';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { UnauthorizedPage } from './pages/UnauthorizedPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDashboardPage } from './pages/ProjectDashboardPage';
import { ProjectOverviewPage } from './pages/ProjectOverviewPage';
import { BaselineReviewPage } from './pages/BaselineReviewPage';
import { TrackerPage } from './pages/TrackerPage';
import { ProjectMembersPage } from './pages/ProjectMembersPage';
import { AIAssistantPage } from './pages/AIAssistantPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Sidebar } from './components/Sidebar';

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen bg-bg-base flex flex-col md:flex-row text-text-primary transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 md:pl-64 min-h-screen pt-16 md:pt-0 flex flex-col">
        {children}
      </div>
      <GlobalProgressWidget />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DocumentProgressProvider>
          <Router>
            <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            <Route 
              path="/dashboard" 
              element={<ProtectedRoute><ProtectedLayout><DashboardPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects" 
              element={<ProtectedRoute><ProtectedLayout><ProjectsPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id" 
              element={<ProtectedRoute><ProtectedLayout><ProjectOverviewPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id/cockpit" 
              element={<ProtectedRoute><ProtectedLayout><ProjectDashboardPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id/baseline" 
              element={<ProtectedRoute><ProtectedLayout><BaselineReviewPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id/tracker" 
              element={<ProtectedRoute><ProtectedLayout><TrackerPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id/assistant" 
              element={<ProtectedRoute><ProtectedLayout><AIAssistantPage /></ProtectedLayout></ProtectedRoute>} 
            />
            <Route 
              path="/projects/:id/members" 
              element={<ProtectedRoute><ProtectedLayout><ProjectMembersPage /></ProtectedLayout></ProtectedRoute>} 
            />
          </Routes>
        </Router>
      </DocumentProgressProvider>
    </AuthProvider>
    </ThemeProvider>
  );
};

export default App;


