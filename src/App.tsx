import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { DocumentProgressProvider } from './context/DocumentProgressContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { ProjectProvider } from './context/ProjectContext';
import { GlobalProgressWidget } from './components/GlobalProgressWidget';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { Sidebar } from './components/Sidebar';
import { LoadingFallback } from './components/LoadingFallback';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Lazy-loaded page components for fast initial bundle delivery and optimal code-splitting
const LandingPage = React.lazy(() => import('./pages/LandingPage').then(m => ({ default: m.LandingPage })));
const LoginPage = React.lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const UnauthorizedPage = React.lazy(() => import('./pages/UnauthorizedPage').then(m => ({ default: m.UnauthorizedPage })));
const DashboardPage = React.lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ProjectsPage = React.lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const ProjectOverviewPage = React.lazy(() => import('./pages/ProjectOverviewPage').then(m => ({ default: m.ProjectOverviewPage })));
const ProjectDashboardPage = React.lazy(() => import('./pages/ProjectDashboardPage').then(m => ({ default: m.ProjectDashboardPage })));
const BaselineReviewPage = React.lazy(() => import('./pages/BaselineReviewPage').then(m => ({ default: m.BaselineReviewPage })));
const TrackerPage = React.lazy(() => import('./pages/TrackerPage').then(m => ({ default: m.TrackerPage })));
const AIAssistantPage = React.lazy(() => import('./pages/AIAssistantPage').then(m => ({ default: m.AIAssistantPage })));
const ProjectMembersPage = React.lazy(() => import('./pages/ProjectMembersPage').then(m => ({ default: m.ProjectMembersPage })));
const DriveInboxPage = React.lazy(() => import('./pages/DriveInboxPage').then(m => ({ default: m.DriveInboxPage })));

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

// Layout wrapper for project-scoped pages to provide ProjectContext without prop-drilling
const ProjectLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ProjectProvider>
      <ProtectedLayout>
        {children}
      </ProtectedLayout>
    </ProjectProvider>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <ToastProvider>
            <DocumentProgressProvider>
              <Router>
                <Suspense fallback={<LoadingFallback />}>
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
                      element={<ProtectedRoute><ProjectLayout><ProjectOverviewPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/projects/:id/cockpit" 
                      element={<ProtectedRoute><ProjectLayout><ProjectDashboardPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/projects/:id/baseline" 
                      element={<ProtectedRoute><ProjectLayout><BaselineReviewPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/projects/:id/tracker" 
                      element={<ProtectedRoute><ProjectLayout><TrackerPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/projects/:id/assistant" 
                      element={<ProtectedRoute><ProjectLayout><AIAssistantPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/projects/:id/members" 
                      element={<ProtectedRoute><ProjectLayout><ProjectMembersPage /></ProjectLayout></ProtectedRoute>} 
                    />
                    <Route 
                      path="/drive" 
                      element={<ProtectedRoute><ProtectedLayout><DriveInboxPage /></ProtectedLayout></ProtectedRoute>} 
                    />
                  </Routes>
                </Suspense>
              </Router>
            </DocumentProgressProvider>
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;
