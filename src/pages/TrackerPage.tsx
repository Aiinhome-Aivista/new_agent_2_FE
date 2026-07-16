import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Loader } from '../components/Loader';

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTracker = async () => {
      try {
        const res = await apiClient.get(`/projects/${id}/tracker/`);
        if (res.data.success) setItems(res.data.data);
      } catch (error) {
        console.error("Failed to fetch tracker items");
      } finally {
        setLoading(false);
      }
    };
    fetchTracker();
  }, [id]);

  const handleResolve = async (itemId: number) => {
    const resolution = prompt("Enter resolution notes:");
    if (!resolution) return;
    try {
      const res = await apiClient.post(`/projects/${id}/tracker/${itemId}/resolve`, {
        resolution,
        status: 'RESOLVED'
      });
      if (res.data.success) {
        setItems(items.map(i => i.id === itemId ? { ...i, status: 'RESOLVED', resolution } : i));
      }
    } catch (error) {
      alert("Failed to resolve item");
    }
  };

  const [processing, setProcessing] = useState(false);

  const handleProcessMonitor = async () => {
    const docId = prompt("Enter Document ID of Status Report or MOM to process:");
    if (!docId) return;
    
    setProcessing(true);
    try {
      const res = await apiClient.post(`/projects/${id}/monitoring/process?document_id=${docId}`);
      if (res.data.success) {
        alert("Processed! Refreshing tracker...");
        window.location.reload();
      }
    } catch (error: any) {
      alert("Failed: " + error.response?.data?.detail);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Loader message="Loading risk tracker & audits..." />;

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4 items-center">
            <h1 className="text-3xl font-bold">Risk Tracker & Audit</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate(`/projects/${id}`)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md">Back to Dashboard</button>
            <button onClick={handleProcessMonitor} disabled={processing} className={`px-4 py-2 rounded-md ${processing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {processing ? 'Processing AI...' : 'Process Status Document'}
            </button>
          </div>
        </div>
        
        {items.length === 0 ? (
          <p className="text-gray-400">No tracker items found.</p>
        ) : (
          <div className="space-y-4">
            {items.map(item => (
              <div key={item.id} className={`p-6 rounded-xl border ${item.status === 'RESOLVED' ? 'bg-gray-800 border-gray-700' : 'bg-gray-800 border-red-500/50'} `}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl">{item.name}</h3>
                    <p className="text-sm text-gray-400">Type: {item.item_type} | Doc: {item.document_name}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.is_out_of_scope && <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs border border-red-500/30">OOS Risk</span>}
                    {item.requires_escalation && <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs border border-orange-500/30">Escalated</span>}
                    <span className="px-2 py-1 bg-gray-700 rounded text-xs">Risk: {(item.risk_score * 100).toFixed(0)}%</span>
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-400 mb-1">AI Reasoning:</h4>
                  <p className="text-gray-300 text-sm bg-gray-900 p-3 rounded">{item.reasoning}</p>
                </div>
                
                {item.status === 'RESOLVED' ? (
                  <div className="mt-4 p-3 bg-green-900/20 border border-green-500/30 rounded">
                    <p className="text-sm text-green-300"><span className="font-bold">Resolution:</span> {item.resolution}</p>
                  </div>
                ) : (
                  <button onClick={() => handleResolve(item.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-colors">
                    Mark as Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
