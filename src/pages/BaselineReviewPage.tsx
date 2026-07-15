import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';

export const BaselineReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [baseline, setBaseline] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBaseline = async () => {
      try {
        const res = await apiClient.get(`/projects/${id}/baseline/`);
        if (res.data.success) {
          setBaseline(res.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch baseline");
      } finally {
        setLoading(false);
      }
    };
    fetchBaseline();
  }, [id]);

  const handleApprove = async () => {
    try {
      const res = await apiClient.post(`/projects/${id}/baseline/approve`);
      if (res.data.success) {
        alert("Baseline Approved!");
        navigate(`/projects/${id}`);
      }
    } catch (error: any) {
      alert("Failed to approve baseline: " + error.response?.data?.detail);
    }
  };

  const handleExtract = async () => {
    const docId = prompt("Enter the Document ID of the Engagement Letter to extract baseline from:");
    if (!docId) return;
    try {
      const res = await apiClient.post(`/projects/${id}/baseline/extract?document_id=${docId}`);
      if (res.data.success) {
        alert("Draft Baseline Extracted!");
        window.location.reload();
      }
    } catch (error: any) {
      alert("Extraction failed: " + error.response?.data?.detail);
    }
  };

  if (loading) return <div className="p-8 text-white">Loading...</div>;

  return (
    <div className="min-h-[calc(100vh-73px)] bg-gray-900 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4 items-center">
            <h1 className="text-3xl font-bold">Baseline Review</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate(`/projects/${id}`)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md">Back to Dashboard</button>
            {(!baseline || baseline.status !== 'APPROVED') && (
              <button onClick={handleExtract} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Extract Baseline</button>
            )}
            {baseline && baseline.status === 'DRAFT' && (user?.role === 'ENGAGEMENT_MANAGER' || user?.role === 'ADMIN') && (
              <button onClick={handleApprove} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md">Approve Baseline</button>
            )}
          </div>
        </div>

        {!baseline ? (
          <p className="text-gray-400">No baseline exists yet.</p>
        ) : (
          <div>
            <div className="mb-6">
              <span className={`px-3 py-1 rounded text-sm ${baseline.status === 'APPROVED' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                Status: {baseline.status}
              </span>
            </div>
            
            <h2 className="text-2xl font-bold mb-4">Scope Items</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {baseline.scope_items?.map((item: any) => (
                <div key={item.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                  <p className="text-gray-400 mb-2">{item.description}</p>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-400">{item.scope_type}</span>
                    <span className="text-gray-500">Conf: {(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
