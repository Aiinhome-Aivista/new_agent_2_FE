import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { Project } from '../types';
import { Loader } from '../components/Loader';
import { ProjectMembersSection } from '../components/ProjectMembersSection';
import { ArrowLeft } from 'lucide-react';

export const ProjectMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await apiClient.get(`/projects/${id}`);
        if (res.data.success) {
          setProject(res.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch project details', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProject();
  }, [id]);

  if (loading) {
    return <Loader message="Loading project members..." />;
  }

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-teal-400 mb-1">
              <Link to="/projects" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Projects Directory
              </Link>
              <span>/</span>
              <Link to={`/projects/${id}`} className="hover:underline">
                {project?.project_name || 'Cockpit'}
              </Link>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white">
              {project?.project_name} - Project Members
            </h1>
            {/* <p className="text-gray-400 text-sm mt-1">
              {project?.description || 'Manage assigned Stakeholders and Team Leads for this project.'}
            </p> */}
          </div>

          <div className="flex gap-3">
            <Link
              to={`/projects/${id}`}
              className="px-4 py-3 bg-slate-500 hover:bg-slate-600 text-gray-300 rounded-xl text-xs font-semibold border border-gray-700 transition-colors"
            >
              Cockpit
            </Link>
            {/* <Link
              to={`/projects/${id}/baseline`}
              className="px-4 py-3 bg-purple-600/80 hover:bg-purple-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Baseline Review
            </Link>
            <Link
              to={`/projects/${id}/tracker`}
              className="px-4 py-3 bg-rose-600/80 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Risk Tracker
            </Link> */}
          </div>
        </div>

        {/* Project Members Component */}
        {id && <ProjectMembersSection projectId={Number(id)} />}
      </div>
    </div>
  );
};
