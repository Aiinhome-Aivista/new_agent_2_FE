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
            <div className="flex items-center gap-2 text-xs text-[#FF5A14] mb-1">
              <Link to="/projects" className="hover:underline flex items-center gap-1">
                <ArrowLeft className="w-3 h-3" /> Projects Directory
              </Link>
              <span>/</span>
              <Link to={`/projects/${id}`} className="hover:underline font-semibold">
                {project?.project_name || 'Cockpit'}
              </Link>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-text-primary">
              {project?.project_name} - Project Members
            </h1>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/projects/${id}`}
              className="px-5 py-2.5 bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#333333] border border-[#D8D8D8] dark:border-[#444444] text-[#4A4A4A] dark:text-white rounded-xl text-xs font-bold shadow-sm hover:border-[#FF8A55] transition-all flex items-center gap-2"
            >
              Cockpit
            </Link>
          </div>
        </div>

        {/* Project Members Component */}
        {id && <ProjectMembersSection projectId={Number(id)} isClosed={project?.monitoring_status === "CLOSED"} />}
      </div>
    </div>
  );
};
