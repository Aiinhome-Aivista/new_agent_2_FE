import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { useAuth } from '../auth/AuthContext';
import { Loader } from '../components/Loader';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

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
  const [notification, setNotification] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setNotification({ message, type });
  };

  const [eligibleDocs, setEligibleDocs] = useState<any[]>([]);
  const [showExtractModal, setShowExtractModal] = useState(false);
  const [extractingDocId, setExtractingDocId] = useState<number | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [completedDocIds, setCompletedDocIds] = useState<number[]>([]);

  const handleApprove = async () => {
    try {
      const res = await apiClient.post(`/projects/${id}/baseline/approve`);
      if (res.data.success) {
        showNotification("Baseline Approved!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      showNotification("Approval failed: " + (error.response?.data?.detail || "Server error"), "error");
    }
  };

  const handleExtractClick = async () => {
    try {
      const res = await apiClient.get(`/projects/${id}/documents/`);
      if (res.data.success) {
        // Filter documents that are COMPLETED and are EL or IFA
        const contracts = res.data.data.filter((doc: any) => 
          doc.processing_status === 'COMPLETED' && (doc.document_type === 'EL' || doc.document_type === 'IFA')
        );
        
        if (contracts.length === 0) {
          showNotification("Please upload and process an Engagement Letter (EL) or Inter-Firm Approval (IFA) first.", "info");
          return;
        }
        
        setEligibleDocs(contracts);
        setShowExtractModal(true);
      }
    } catch (error) {
      showNotification("Failed to fetch project documents", "error");
    }
  };

  const confirmExtractAll = async () => {
    setExtracting(true);
    setCompletedDocIds([]);
    try {
      for (const doc of eligibleDocs) {
        setExtractingDocId(doc.id);
        await apiClient.post(`/projects/${id}/baseline/extract?document_id=${doc.id}`);
        setCompletedDocIds(prev => [...prev, doc.id]);
      }
      
      // Fetch baseline data in the background to update page
      const baselineRes = await apiClient.get(`/projects/${id}/baseline/`);
      if (baselineRes.data.success) {
        setBaseline(baselineRes.data.data);
      }
      setShowExtractModal(false);
      showNotification("Baseline extraction completed successfully!", "success");
    } catch (error: any) {
      showNotification("Extraction failed: " + (error.response?.data?.detail || "Server error"), "error");
    } finally {
      setExtractingDocId(null);
      setExtracting(false);
    }
  };

  if (loading) return <Loader message="Loading contract scope baseline..." />;

  return (
    <div className="flex-1 bg-transparent p-6 md:p-10 relative overflow-hidden">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4 items-center">
            <h1 className="text-3xl font-bold">Baseline Review</h1>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate(`/projects/${id}`)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md">Back to Dashboard</button>
            {(!baseline || baseline.status !== 'APPROVED') && (
              <button onClick={handleExtractClick} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md">Extract Baseline</button>
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

            <h2 className="text-2xl font-bold mb-4">Deliverables & IFA Allocations</h2>
            {baseline.deliverables?.length === 0 ? (
              <p className="text-gray-400 mb-8">No deliverables or budget allocations found.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                {baseline.deliverables?.map((item: any) => (
                  <div key={item.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <h3 className="font-bold text-lg mb-2">{item.name}</h3>
                    <p className="text-gray-400 mb-2">{item.description}</p>
                    <div className="flex justify-between text-sm mt-3 pt-2 border-t border-gray-700/50">
                      <span className="text-purple-400 font-medium">Owner: {item.owner || "Unassigned"}</span>
                      <span className="text-gray-500">Deadline: {item.deadline || "None"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      {showExtractModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">Select Contract for Baseline</h2>
            <p className="text-gray-400 text-sm mb-6">Choose a processed contract to extract scope items or budget details into your baseline.</p>
            
            <div className="space-y-3 mb-6 max-h-60 overflow-y-auto">
              {eligibleDocs.map((doc) => {
                const isExtractingThis = extractingDocId === doc.id;
                const isCompletedThis = completedDocIds.includes(doc.id);
                return (
                  <div key={doc.id} className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 gap-4">
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-gray-200 truncate">{doc.document_name}</span>
                      <span className="text-[10px] text-cyan-400 font-semibold uppercase">{doc.document_type}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {isExtractingThis ? (
                        <div className="flex items-center gap-1 text-cyan-400 text-xs font-semibold">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Extracting...</span>
                        </div>
                      ) : isCompletedThis ? (
                        <div className="flex items-center gap-1 text-green-400 text-xs font-semibold">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-gray-500 text-xs font-semibold">
                          <Clock className="h-4 w-4" />
                          <span>Pending</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setShowExtractModal(false)}
                className="px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                disabled={extracting}
              >
                Cancel
              </button>
              <button 
                onClick={confirmExtractAll}
                disabled={extracting}
                className="flex items-center gap-2 px-4 py-2 bg-[#00e5ff] hover:bg-[#00cce5] disabled:bg-cyan-900/50 text-black disabled:text-cyan-700 font-semibold rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed"
              >
                {extracting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-black" />
                    Extracting...
                  </>
                ) : (
                  "Extract Baseline"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {notification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-[#111827] border border-white/10 rounded-2xl p-4 shadow-2xl flex gap-3 animate-slideIn select-none">
          <div className="flex-1">
            <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${
              notification.type === 'success' ? 'text-emerald-400' : notification.type === 'error' ? 'text-rose-400' : 'text-cyan-400'
            }`}>
              {notification.type === 'success' ? 'Success' : notification.type === 'error' ? 'Error' : 'Notice'}
            </p>
            <p className="text-sm text-gray-200">{notification.message}</p>
          </div>
          <button 
            onClick={() => setNotification(null)}
            className="text-gray-400 hover:text-white transition-colors text-lg font-bold self-start leading-none"
          >
            &times;
          </button>
        </div>
      )}
    </div>
    </div>
  );
};
