import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { Project } from '../types';

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('EL');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projRes, docsRes] = await Promise.all([
          apiClient.get(`/projects/${id}`),
          apiClient.get(`/projects/${id}/documents/`)
        ]);
        if (projRes.data.success) setProject(projRes.data.data);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
      } catch (error) {
        console.error("Failed to fetch project data");
      }
    };
    fetchProject();
  }, [id]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', docType);

    setUploading(true);
    try {
      await apiClient.post(`/projects/${id}/documents/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      // Refresh docs
      const docsRes = await apiClient.get(`/projects/${id}/documents/`);
      if (docsRes.data.success) setDocuments(docsRes.data.data);
      setFile(null);
    } catch (error) {
      console.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!project) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <h1 className="text-3xl font-bold">{project.project_name}</h1>
          <div className="flex gap-4">
            <Link to={`/projects/${id}/baseline`} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md">Baseline Review</Link>
            <Link to={`/projects/${id}/tracker`} className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-md">Risk Tracker</Link>
          </div>
        </div>
        <p className="text-gray-400 mb-8">{project.description}</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Upload Document</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-1">Document Type</label>
                <select value={docType} onChange={e => setDocType(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  <option value="EL">Engagement Letter (EL)</option>
                  <option value="IFA">Inter-Firm Approval (IFA)</option>
                  <option value="STATUS_REPORT">Status Report</option>
                  <option value="MOM">Minutes of Meeting (MOM)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">File (.pdf, .docx, .txt)</label>
                <input type="file" accept=".pdf,.docx,.txt" onChange={e => setFile(e.target.files?.[0] || null)} className="w-full text-gray-400" />
              </div>
              <button type="submit" disabled={!file || uploading} className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-md">
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </form>
          </div>

          <div className="bg-gray-800 p-6 rounded-xl border border-gray-700">
            <h2 className="text-xl font-bold mb-4">Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-400">No data found</p>
            ) : (
              <ul className="space-y-2">
                {documents.map(doc => (
                  <li key={doc.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
                    <span><span className="text-gray-400 text-sm mr-2">ID: {doc.id}</span> {doc.document_name}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-xs px-2 py-1 bg-gray-600 rounded">{doc.document_type}</span>
                      <span className={`text-xs px-2 py-1 rounded ${doc.processing_status === 'COMPLETED' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                        {doc.processing_status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
