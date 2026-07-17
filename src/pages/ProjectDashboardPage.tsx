import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import apiClient from '../api/apiClient';
import type { Project } from '../types';
import { Loader } from '../components/Loader';
import { UploadCloud, X, FileText } from 'lucide-react';

export const ProjectDashboardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [docType, setDocType] = useState<string>('EL');
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const [projRes, docsRes, typesRes] = await Promise.all([
          apiClient.get(`/projects/${id}`),
          apiClient.get(`/projects/${id}/documents/`),
          apiClient.get(`/projects/${id}/documents/types`)
        ]);
        if (projRes.data.success) setProject(projRes.data.data);
        if (docsRes.data.success) setDocuments(docsRes.data.data);
        if (typesRes.data.success) setDocumentTypes(typesRes.data.data);
      } catch (error) {
        console.error("Failed to fetch project data");
      }
    };
    fetchProject();
  }, [id]);

  const handleAddCustomType = async () => {
    if (!customName.trim()) return;
    try {
      const payload = {
        name: customName.toUpperCase().replace(/\s+/g, '_'),
        label: customName,
        description: customDesc
      };
      await apiClient.post(`/projects/${id}/documents/types`, payload);
      
      // Refresh types
      const typesRes = await apiClient.get(`/projects/${id}/documents/types`);
      if (typesRes.data.success) {
        setDocumentTypes(typesRes.data.data);
        setDocType(payload.name);
      }
      
      setShowCustomModal(false);
      setCustomName("");
      setCustomDesc("");
    } catch (error) {
      alert("Failed to add custom type");
    }
  };

  const handleDocTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (e.target.value === 'ADD_CUSTOM') {
      setShowCustomModal(true);
    } else {
      setDocType(e.target.value);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    if (ext && ['pdf', 'docx', 'txt'].includes(ext)) {
      setFile(selectedFile);
    } else {
      alert("Unsupported file format. Please upload a .pdf, .docx, or .txt file.");
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

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

  if (!project) return <Loader message="Loading project cockpit details..." />;

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
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
                <select value={docType} onChange={handleDocTypeChange} className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2">
                  {documentTypes.map((type, idx) => (
                    <option key={idx} value={type.name} title={type.description}>
                      {type.label}
                    </option>
                  ))}
                  <option value="ADD_CUSTOM" className="text-blue-400 font-bold">
                    + Add Custom Type...
                  </option>
                </select>
                {documentTypes.find(t => t.name === docType)?.description && (
                  <p className="text-xs text-gray-400 mt-1.5 italic bg-gray-900/30 border border-gray-700/50 p-2 rounded-lg">
                    <span className="font-semibold text-gray-300">Description: </span>
                    {documentTypes.find(t => t.name === docType)?.description}
                  </p>
                )}
              </div>
              <div>
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
                    isDragging 
                      ? 'border-[#00e5ff] bg-cyan-950/20' 
                      : file 
                        ? 'border-green-500 bg-green-950/10' 
                        : 'border-gray-600 hover:border-gray-400 bg-gray-900/40 hover:bg-gray-900/60'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    accept=".pdf,.docx,.txt" 
                    onChange={e => {
                      if (e.target.files && e.target.files[0]) {
                        validateAndSetFile(e.target.files[0]);
                      }
                    }} 
                    className="hidden" 
                  />

                  {file ? (
                    <div className="flex flex-col items-center w-full">
                      <div className="flex items-center justify-between bg-gray-800/80 border border-gray-700 rounded-lg p-3 w-full max-w-xs">
                        <div className="flex items-center gap-2 overflow-hidden mr-2">
                          <FileText className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span className="text-sm truncate text-gray-200">{file.name}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFile(null);
                          }}
                          className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-red-400 transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <span className="text-xs text-gray-500 mt-2">Click or drag new file to replace</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center">
                      <UploadCloud className={`h-10 w-10 mb-3 transition-colors ${isDragging ? 'text-[#00e5ff]' : 'text-gray-400'}`} />
                      <p className="text-sm text-gray-300 font-medium">Drag & drop your file here</p>
                      <p className="text-xs text-gray-500 mt-1">or click to browse files</p>
                    </div>
                  )}
                </div>
                <label className="block text-gray-400 mt-2 text-xs font-medium text-center">Upload File (.pdf, .docx, .txt)</label>
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

      {showCustomModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-white">Add Custom Document Type</h2>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Type Name</label>
                <input 
                  type="text" 
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="e.g. Technical Spec"
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff]"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Description</label>
                <textarea 
                  value={customDesc}
                  onChange={(e) => setCustomDesc(e.target.value)}
                  placeholder="What is this document used for?"
                  rows={3}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => {
                  setShowCustomModal(false);
                  setDocType('EL'); // Reset to default
                }}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddCustomType}
                disabled={!customName.trim()}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${!customName.trim() ? 'bg-blue-900/50 text-blue-700 cursor-not-allowed' : 'bg-[#00e5ff] text-black hover:bg-[#00cce5]'}`}
              >
                Add Type
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
