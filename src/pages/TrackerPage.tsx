import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Loader } from '../components/Loader';
import { Loader2 } from 'lucide-react';

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');

  const activeItems = items.filter(item => item.status !== 'RESOLVED');
  const resolvedItems = items.filter(item => item.status === 'RESOLVED');
  const currentTabItems = activeTab === 'ACTIVE' ? activeItems : resolvedItems;

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

  const [resolveModalState, setResolveModalState] = useState<{ isOpen: boolean; itemId: number | null }>({ isOpen: false, itemId: null });
  const [resolutionText, setResolutionText] = useState("");

  const openResolveModal = (itemId: number) => {
    setResolveModalState({ isOpen: true, itemId });
    setResolutionText("");
  };

  const submitResolve = async () => {
    if (!resolutionText.trim() || resolveModalState.itemId === null) return;
    try {
      const res = await apiClient.post(`/projects/${id}/tracker/${resolveModalState.itemId}/resolve`, {
        resolution: resolutionText,
        status: 'RESOLVED'
      });
      if (res.data.success) {
        setItems(items.map(i => i.id === resolveModalState.itemId ? { ...i, status: 'RESOLVED', resolution: resolutionText } : i));
        setResolveModalState({ isOpen: false, itemId: null });
      }
    } catch (error) {
      alert("Failed to resolve item");
    }
  };

  // ---- Process Status Document Modal State ----
  const [processing, setProcessing] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [eligibleDocs, setEligibleDocs] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>("");
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "error" | "success";
  } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const showNotification = (
    message: string,
    type: "info" | "error" | "success" = "info",
  ) => {
    setNotification({ message, type });
  };

  const handleOpenProcessModal = async () => {
    setLoadingDocs(true);
    setShowProcessModal(true);
    try {
      const res = await apiClient.get(`/projects/${id}/documents/`);
      if (res.data.success) {
        // Filter: exclude EL and IFA, exclude already-extracted docs (only show COMPLETED ones not yet processed by tracker)
        const docs = res.data.data.filter((doc: any) =>
          doc.document_type !== 'EL' &&
          doc.document_type !== 'IFA' &&
          doc.processing_status === 'COMPLETED'
        );
        setEligibleDocs(docs);
        if (docs.length > 0) {
          setSelectedDocId(String(docs[0].id));
        } else {
          setSelectedDocId("");
        }
      }
    } catch (error) {
      showNotification("Failed to load documents", "error");
      setShowProcessModal(false);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleConfirmProcess = async () => {
    if (!selectedDocId) return;
    setProcessing(true);
    try {
      const res = await apiClient.post(`/projects/${id}/monitoring/process?document_id=${selectedDocId}`);
      if (res.data.success) {
        setShowProcessModal(false);
        showNotification("Document processed successfully! Refreshing tracker...", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      }
    } catch (error: any) {
      showNotification("Failed: " + (error.response?.data?.detail || "Server error"), "error");
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
            <button onClick={handleOpenProcessModal} disabled={processing} className={`px-4 py-2 rounded-md ${processing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {processing ? 'Processing AI...' : 'Process Status Document'}
            </button>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16 bg-gray-900/30 border border-gray-800 rounded-2xl animate-fade-in-up">
            <p className="text-gray-400 text-lg">No tracker items found.</p>
            <p className="text-gray-500 text-sm mt-1">Select a processed document to analyze for risk and audit items.</p>
          </div>
        ) : (
          <>
            {/* Animated Capsule Tab Control */}
            <div className="relative flex p-1 bg-gray-950/80 border border-gray-850 rounded-xl max-w-md mb-8 shadow-inner backdrop-blur-md">
              {/* Sliding Background Indicator */}
              <div
                className="absolute top-1 bottom-1 rounded-lg bg-gradient-to-r from-blue-600/20 to-cyan-500/20 border border-blue-500/30 shadow-lg shadow-blue-500/5 transition-all duration-300 ease-out"
                style={{
                  width: 'calc(50% - 4px)',
                  left: activeTab === 'ACTIVE' ? '4px' : 'calc(50%)',
                }}
              />

              {/* Active Risks Tab */}
              <button
                onClick={() => setActiveTab('ACTIVE')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${activeTab === 'ACTIVE' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                <span>Active Risks</span>
                <span className={`px-2 py-0.5 text-xs rounded-full border transition-all duration-300 font-bold ${activeTab === 'ACTIVE'
                  ? 'bg-red-550/20 text-red-300 border-red-500/30 shadow-md'
                  : 'bg-gray-900 text-gray-400 border-gray-805'
                  }`}>
                  {activeItems.length}
                </span>
              </button>

              {/* Resolved Risks Tab */}
              <button
                onClick={() => setActiveTab('RESOLVED')}
                className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2 text-sm font-semibold tracking-wide transition-all duration-300 cursor-pointer ${activeTab === 'RESOLVED' ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                  }`}
              >
                <span>Resolved</span>
                <span className={`px-2 py-0.5 text-xs rounded-full border transition-all duration-300 font-bold ${activeTab === 'RESOLVED'
                  ? 'bg-green-550/20 text-green-300 border-green-500/30 shadow-md'
                  : 'bg-gray-900 text-gray-400 border-gray-805'
                  }`}>
                  {resolvedItems.length}
                </span>
              </button>
            </div>

            {/* Filtered items list */}
            {currentTabItems.length === 0 ? (
              <div className="text-center py-16 bg-gray-900/30 border border-gray-800 rounded-2xl animate-fade-in-up">
                <p className="text-gray-400 text-lg">No {activeTab === 'ACTIVE' ? 'active' : 'resolved'} risks found.</p>
                <p className="text-gray-500 text-sm mt-1">
                  {activeTab === 'ACTIVE'
                    ? 'All items are resolved! You have a clean board.'
                    : 'Resolved items will appear here.'}
                </p>
              </div>
            ) : (
              <div key={activeTab} className="space-y-4">
                {currentTabItems.map((item, index) => {
                  // Risk level color mapping
                  const riskLevelConfig: Record<string, { bg: string; text: string; border: string }> = {
                    LOW: { bg: 'bg-green-900/50', text: 'text-green-300', border: 'border-green-500/30' },
                    MEDIUM: { bg: 'bg-yellow-900/50', text: 'text-yellow-300', border: 'border-yellow-500/30' },
                    HIGH: { bg: 'bg-orange-900/50', text: 'text-orange-300', border: 'border-orange-500/30' },
                    CRITICAL: { bg: 'bg-red-900/50', text: 'text-red-300', border: 'border-red-500/30' },
                  };
                  const level = item.risk_level || 'LOW';
                  const levelStyle = riskLevelConfig[level] || riskLevelConfig.LOW;

                  // Risk category display
                  const categoryLabels: Record<string, string> = {
                    SCOPE_CREEP: '🔄 Scope Creep',
                    DELAY: '⏰ Delay Risk',
                    MISSING_DELIVERABLE: '📋 Missing Deliverable',
                    DEPENDENCY: '🔗 Dependency Risk',
                    STAKEHOLDER: '👥 Stakeholder Risk',
                    GENERAL: '📌 General',
                  };
                  const categoryLabel = categoryLabels[item.risk_category] || categoryLabels.GENERAL;

                  // Item type labels
                  const typeLabels: Record<string, string> = {
                    ACTIVITY: 'Activity',
                    NEW_REQUEST: 'New Request',
                    BLOCKER: 'Blocker',
                    ACTION_ITEM: 'Action Item',
                    DECISION: 'Decision',
                    RISK_MENTIONED: 'Risk Mentioned',
                  };

                  // Border color based on risk level
                  const borderColor = item.status === 'RESOLVED'
                    ? 'border-gray-705'
                    : level === 'CRITICAL' ? 'border-red-500/50'
                      : level === 'HIGH' ? 'border-orange-500/50'
                        : level === 'MEDIUM' ? 'border-yellow-500/50'
                          : 'border-gray-700';

                  // Split reasoning into description and detailed reasoning
                  const reasoningParts = (item.reasoning || '').split('\n\n');
                  const description = reasoningParts[0] || '';
                  const detailedReasoning = reasoningParts.slice(1).join('\n\n') || '';

                  return (
                    <div
                      key={item.id}
                      className={`p-6 rounded-xl border bg-gray-800 ${borderColor} animate-fade-in-up hover:shadow-xl hover:shadow-black/20 hover:border-gray-700 transition-all duration-300`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      {/* Header Row */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-xl truncate">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
                              {typeLabels[item.item_type] || item.item_type}
                            </span>
                            <span className="text-xs text-gray-500">Doc: {item.document_name}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-4 flex-wrap justify-end">
                          {/* Risk Level Badge */}
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${levelStyle.bg} ${levelStyle.text} ${levelStyle.border}`}>
                            {level}
                          </span>
                          {/* Risk Score */}
                          <span className={`px-2 py-1 rounded text-xs font-mono font-bold ${item.risk_score >= 71 ? 'bg-red-900/60 text-red-200' :
                            item.risk_score >= 41 ? 'bg-orange-900/60 text-orange-200' :
                              item.risk_score >= 21 ? 'bg-yellow-900/60 text-yellow-200' :
                                'bg-green-900/60 text-green-200'
                            }`}>
                            {item.risk_score}/100
                          </span>
                          {item.is_out_of_scope ? <span className="px-2 py-1 bg-red-900/50 text-red-300 rounded text-xs border border-red-500/30">OOS</span> : null}
                          {item.requires_escalation ? <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs border border-orange-500/30">⚠ Escalated</span> : null}
                        </div>
                      </div>

                      {/* Risk Category */}
                      <div className="mb-3">
                        <span className="text-xs text-gray-400 font-medium">{categoryLabel}</span>
                      </div>

                      {/* Description (WHY this risk score) */}
                      {description && (
                        <div className="mb-3 p-3 bg-gray-900/80 border border-gray-700/50 rounded-lg">
                          <h4 className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Risk Description</h4>
                          <p className="text-gray-200 text-sm leading-relaxed">{description}</p>
                        </div>
                      )}

                      {/* Detailed AI Reasoning (collapsible) */}
                      {detailedReasoning && (
                        <details className="mb-4 group">
                          <summary className="text-xs font-semibold text-gray-500 cursor-pointer hover:text-gray-300 transition-colors">
                            ▸ View Detailed AI Reasoning
                          </summary>
                          <p className="text-gray-400 text-xs bg-gray-900/50 p-3 rounded mt-2 leading-relaxed">{detailedReasoning}</p>
                        </details>
                      )}

                      {/* If no split (legacy data), show full reasoning */}
                      {!description && !detailedReasoning && item.reasoning && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-400 mb-1">AI Reasoning:</h4>
                          <p className="text-gray-300 text-sm bg-gray-900 p-3 rounded">{item.reasoning}</p>
                        </div>
                      )}

                      {item.status === 'RESOLVED' ? (
                        <div className="mt-4 p-3 bg-green-950/30 border border-green-500/20 rounded-lg">
                          <p className="text-sm text-green-300"><span className="font-bold">Resolution:</span> {item.resolution}</p>
                        </div>
                      ) : (
                        <button onClick={() => openResolveModal(item.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg active:scale-[0.98]">
                          Mark as Resolved
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Resolve Modal */}
      {resolveModalState.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-2xl font-bold mb-4 text-white">Resolve Risk Item</h2>
            <p className="text-gray-400 text-sm mb-4">Please provide official notes detailing how this scope deviation is being handled.</p>
            <textarea
              className="w-full bg-gray-900 border border-gray-700 rounded-xl p-4 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] transition-all resize-none mb-6"
              rows={4}
              placeholder="e.g. Discussed with client. Added as Change Request #102..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setResolveModalState({ isOpen: false, itemId: null })}
                className="px-5 py-2.5 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={submitResolve}
                disabled={!resolutionText.trim()}
                className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${!resolutionText.trim() ? 'bg-green-900/50 text-green-700 cursor-not-allowed' : 'bg-[#00e5ff] text-black hover:bg-[#00cce5]'}`}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process Status Document Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-2 text-white">Process Status Document</h2>
            <p className="text-gray-400 text-sm mb-6">
              Select a processed document (excluding EL & IFA) to analyze for risk and audit items.
            </p>

            {loadingDocs ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-[#00e5ff]" />
                <span className="ml-3 text-gray-400">Loading documents...</span>
              </div>
            ) : eligibleDocs.length === 0 ? (
              <div className="py-6 text-center">
                <p className="text-gray-400 mb-2">No eligible documents found.</p>
                <p className="text-gray-500 text-sm">
                  Please upload and process a Status Report, MOM, or other document first from the dashboard.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-gray-400 mb-2 text-sm font-medium">Select Document</label>
                  <select
                    value={selectedDocId}
                    onChange={(e) => setSelectedDocId(e.target.value)}
                    disabled={processing}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg p-3 text-white focus:outline-none focus:ring-2 focus:ring-[#00e5ff] disabled:opacity-50"
                  >
                    {eligibleDocs.map((doc) => (
                      <option key={doc.id} value={String(doc.id)}>
                        {doc.document_name} ({doc.document_type})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedDocId("");
                }}
                disabled={processing}
                className={`px-4 py-2 rounded-lg font-medium text-gray-300 hover:bg-gray-800 transition-colors text-sm ${processing ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmProcess}
                disabled={processing || !selectedDocId || eligibleDocs.length === 0}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-sm flex items-center ${processing || !selectedDocId || eligibleDocs.length === 0
                  ? "bg-blue-900/50 text-blue-700 cursor-not-allowed"
                  : "bg-[#00e5ff] text-black hover:bg-[#00cce5]"
                  }`}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Process Document"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Popup */}
      {notification && (
        <div className="fixed top-6 right-6 z-50 animate-in fade-in slide-in-from-right duration-300">
          <div
            className={`px-5 py-4 rounded-xl shadow-2xl border backdrop-blur-sm max-w-sm ${notification.type === "success"
              ? "bg-green-900/80 border-green-500/50 text-green-200"
              : notification.type === "error"
                ? "bg-red-900/80 border-red-500/50 text-red-200"
                : "bg-blue-900/80 border-blue-500/50 text-blue-200"
              }`}
          >
            <div className="flex items-start gap-3">
              <p className="text-sm font-medium flex-1">{notification.message}</p>
              <button
                onClick={() => setNotification(null)}
                className="text-white/60 hover:text-white"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
