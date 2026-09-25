import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import apiClient, { extractErrorMessage } from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';

export interface ProjectDetails {
  id: number;
  project_name: string;
  client_name?: string;
  description?: string;
  monitoring_status?: string;
  start_date?: string;
  end_date?: string;
  created_by?: number;
  highestActionPriority?: {
    id?: number;
    activity?: string;
    reason?: string;
    recommendedAction?: string;
  } | null;
  [key: string]: any;
}

interface ProjectContextType {
  projectId: string | null;
  project: ProjectDetails | null;
  loading: boolean;
  error: string | null;
  refreshProject: () => Promise<void>;
  updateProjectOptimistic: (updates: Partial<ProjectDetails>) => void;
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined);

export const ProjectProvider: React.FC<{ 
  projectId?: string; 
  children: React.ReactNode 
}> = ({ projectId: explicitId, children }) => {
  const params = useParams<{ id: string }>();
  const activeProjectId = explicitId || params.id || null;

  const [project, setProject] = useState<ProjectDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProject = useCallback(async () => {
    if (!activeProjectId) {
      setProject(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(activeProjectId));
      if (res.data?.success && res.data?.data) {
        setProject(res.data.data);
      } else {
        setProject(res.data || null);
      }
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Failed to fetch project details');
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [activeProjectId]);

  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  const updateProjectOptimistic = useCallback((updates: Partial<ProjectDetails>) => {
    setProject((prev) => (prev ? { ...prev, ...updates } : null));
  }, []);

  return (
    <ProjectContext.Provider
      value={{
        projectId: activeProjectId,
        project,
        loading,
        error,
        refreshProject: fetchProject,
        updateProjectOptimistic,
      }}
    >
      {children}
    </ProjectContext.Provider>
  );
};

export const useProject = (): ProjectContextType => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

export default ProjectProvider;
