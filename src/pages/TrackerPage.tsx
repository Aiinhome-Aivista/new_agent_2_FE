import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Loader } from '../components/Loader';
import { Loader2, Info, Download } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export const TrackerPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [items, setItems] = useState<any[]>([]);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'RESOLVED'>('ACTIVE');
  const [selectedItemIds, setSelectedItemIds] = useState<number[]>([]);

  const activeItems = items.filter(item => item.status !== 'RESOLVED');
  const resolvedItems = items.filter(item => item.status === 'RESOLVED');
  const currentTabItems = activeTab === 'ACTIVE' ? activeItems : resolvedItems;

  useEffect(() => {
    const fetchTrackerAndProject = async () => {
      try {
        const [trackerRes, projectRes] = await Promise.all([
          apiClient.get(`/projects/${id}/tracker/`),
          apiClient.get(`/projects/${id}`)
        ]);
        if (trackerRes.data.success) setItems(trackerRes.data.data);
        if (projectRes.data.success) setProject(projectRes.data.data);
      } catch (error) {
        console.error("Failed to fetch tracker items or project details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrackerAndProject();
  }, [id]);

  useEffect(() => {
    setSelectedItemIds([]);
  }, [activeTab]);

  const toggleSelectItem = (itemId: number) => {
    setSelectedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const generateExportHtml = (itemsToExport: any[], title: string) => {
    const projectName = project?.project_name || 'Project Details';
    const userName = user?.name || 'System User';
    const userEmail = user?.email || '';
    const exportTime = new Date().toLocaleString();
    const startDate = project?.start_date ? new Date(project.start_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A';
    const endDate = project?.end_date ? new Date(project.end_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'N/A';

    return `
      <html>
        <head>
          <title>${projectName} - ${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 40px; color: #1f2937; line-height: 1.5; background-color: #ffffff; }
            .header { border-bottom: 2px solid #0891b2; padding-bottom: 16px; margin-bottom: 24px; }
            h1 { font-size: 24px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0; }
            .header-meta { font-size: 13px; color: #4b5563; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 16px; }
            .meta-item { display: flex; gap: 6px; }
            .meta-label { font-weight: 600; color: #374151; }
            h2 { font-size: 18px; font-weight: bold; color: #1f2937; margin-top: 30px; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
            .cards-list { display: flex; flex-direction: column; gap: 16px; }
            .card { border: 1px solid #e5e7eb; padding: 18px; border-radius: 12px; background-color: #f8fafc; page-break-inside: avoid; margin-bottom: 16px; }
            .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
            .card-title { font-weight: 700; font-size: 16px; color: #0f172a; margin: 0; }
            .badges { display: flex; gap: 8px; align-items: center; }
            .badge { font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 12px; text-transform: uppercase; }
            .badge-low { background-color: #d1fae5; color: #065f46; }
            .badge-medium { background-color: #fef3c7; color: #92400e; }
            .badge-high { background-color: #ffedd5; color: #9a3412; }
            .badge-critical { background-color: #fee2e2; color: #991b1b; }
            .badge-resolved { background-color: #e0f2fe; color: #0369a1; border: 1px solid #7dd3fc; }
            .badge-type { background-color: #f1f5f9; color: #475569; font-weight: 600; text-transform: none; }
            .card-meta-line { font-size: 12px; color: #64748b; margin-bottom: 12px; display: flex; gap: 16px; }
            .reason-box { background-color: #f1f5f9; padding: 12px; border-left: 4px solid #0891b2; font-size: 12px; border-radius: 6px; color: #334155; line-height: 1.6; }
            .reason-title { font-weight: bold; margin-bottom: 4px; color: #0f172a; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
            .resolution-box { background-color: #f0fdf4; padding: 12px; border-left: 4px solid #16a34a; font-size: 12px; border-radius: 6px; color: #14532d; line-height: 1.6; margin-top: 12px; }
            .resolution-meta { font-size: 11px; color: #166534; margin-top: 6px; padding-top: 6px; border-top: 1px dashed #bbf7d0; display: flex; gap: 16px; }
            @media print {
              body { padding: 0; }
              @page { margin: 1.5cm; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${projectName} &mdash; ${title}</h1>
            <div class="header-meta">
              <div class="meta-item"><span class="meta-label">Project Name:</span> <span>${projectName}</span></div>
              <div class="meta-item"><span class="meta-label">Exported By:</span> <span>${userName} ${userEmail ? `(${userEmail})` : ''}</span></div>
              <div class="meta-item"><span class="meta-label">Start Date:</span> <span>${startDate}</span></div>
              <div class="meta-item"><span class="meta-label">End Date:</span> <span>${endDate}</span></div>
              <div class="meta-item"><span class="meta-label">Exported At:</span> <span>${exportTime}</span></div>
              <div class="meta-item"><span class="meta-label">Total Risks:</span> <span>${itemsToExport.length}</span></div>
            </div>
          </div>
          
          <div class="cards-list">
            ${itemsToExport.length === 0 ? `
              <p style="color: #64748b; font-style: italic; text-align: center; margin-top: 40px; font-size: 14px;">No risk items found matching this filter.</p>
            ` : itemsToExport.map(item => {
              const level = item.risk_level || 'LOW';
              const levelClass = level.toLowerCase();
              const categoryLabels: Record<string, string> = {
                SCOPE_CREEP: 'Scope Creep',
                DELAY: 'Delay Risk',
                MISSING_DELIVERABLE: 'Missing Deliverable',
                DEPENDENCY: 'Dependency Risk',
                STAKEHOLDER: 'Stakeholder Risk',
                GENERAL: 'General Risk',
              };
              const categoryLabel = categoryLabels[item.risk_category] || categoryLabels.GENERAL;
              const typeLabels: Record<string, string> = {
                ACTIVITY: 'Activity',
                NEW_REQUEST: 'New Request',
                ACTION_ITEM: 'Action Item'
              };
              const typeLabel = typeLabels[item.item_type] || item.item_type;

              // Extract description & reasoning splits
              const reasoningText = item.reasoning || '';
              const hasSplit = reasoningText.includes('\nReasoning:\n') || reasoningText.includes('\nReasoning:\r\n');
              let description = reasoningText;
              let detailedReasoning = '';
              if (hasSplit) {
                const parts = reasoningText.split(/\nReasoning:\r?\n/);
                description = parts[0].replace(/Description:\r?\n/, '').trim();
                detailedReasoning = parts[1].trim();
              } else if (reasoningText.startsWith('Description:\n') || reasoningText.startsWith('Description:\r\n')) {
                description = reasoningText.replace(/Description:\r?\n/, '').trim();
              }

              return `
                <div class="card">
                  <div class="card-header">
                    <h3 class="card-title">${item.name}</h3>
                    <div class="badges">
                      <span class="badge badge-type">${typeLabel}</span>
                      <span class="badge badge-${levelClass}">${level} (${item.risk_score}/100)</span>
                      ${item.status === 'RESOLVED' ? `<span class="badge badge-resolved">Resolved</span>` : ''}
                    </div>
                  </div>
                  
                  <div class="card-meta-line">
                    <span><strong>Category:</strong> ${categoryLabel}</span>
                    <span><strong>Source Document:</strong> ${item.document_name || 'N/A'}</span>
                  </div>

                  ${description ? `
                    <div class="reason-box">
                      <div class="reason-title">Risk Description</div>
                      <div>${description}</div>
                      ${detailedReasoning ? `
                        <div class="reason-title" style="margin-top: 10px; color: #475569;">Detailed AI Reasoning</div>
                        <div style="font-size: 11.5px; color: #475569;">${detailedReasoning}</div>
                      ` : ''}
                    </div>
                  ` : ''}

                  ${item.status === 'RESOLVED' ? `
                    <div class="resolution-box">
                      <div class="reason-title" style="color: #14532d;">Resolution Details</div>
                      <div>${item.resolution}</div>
                      ${(item.resolved_by_name || item.resolved_at) ? `
                        <div class="resolution-meta">
                          ${item.resolved_by_name ? `<span><strong>Resolved By:</strong> ${item.resolved_by_name} ${item.resolved_by_email ? `(${item.resolved_by_email})` : ''}</span>` : ''}
                          ${item.resolved_at ? `<span><strong>Resolved At:</strong> ${new Date(item.resolved_at).toLocaleString()}</span>` : ''}
                        </div>
                      ` : ''}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </body>
      </html>
    `;
  };

  const handleExportSingle = (item: any, format: 'pdf' | 'docx') => {
    const title = `${item.name} Report`;
    const htmlContent = generateExportHtml([item], title);
    
    if (format === 'pdf') {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to export PDF.");
        return;
      }
      const scriptToAdd = `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      `;
      const completeHtml = htmlContent.replace('</body>', `${scriptToAdd}</body>`);
      printWindow.document.write(completeHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${item.name.replace(/\s+/g, '_')}_Risk_Report.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleExportBatch = (itemsToExport: any[], format: 'pdf' | 'docx', reportTitle: string) => {
    if (itemsToExport.length === 0) {
      alert("No items selected to export.");
      return;
    }
    const htmlContent = generateExportHtml(itemsToExport, reportTitle);
    
    if (format === 'pdf') {
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Pop-up blocked! Please allow pop-ups to export PDF.");
        return;
      }
      const scriptToAdd = `
        <script>
          window.onload = function() {
            window.print();
            setTimeout(function() { window.close(); }, 500);
          };
        </script>
      `;
      const completeHtml = htmlContent.replace('</body>', `${scriptToAdd}</body>`);
      printWindow.document.write(completeHtml);
      printWindow.document.close();
    } else {
      const blob = new Blob(["\ufeff" + htmlContent], { type: "application/msword" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${reportTitle.replace(/\s+/g, '_')}_Report.doc`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

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
        const updatedItem = res.data.data;
        setItems(items.map(i => i.id === resolveModalState.itemId ? { ...i, ...updatedItem } : i));
        setResolveModalState({ isOpen: false, itemId: null });
      }
    } catch (error) {
      alert("Failed to resolve item");
    }
  };

  const handleDownloadDocument = async (documentId: number, documentName: string) => {
    try {
      const response = await apiClient.get(`/projects/${id}/documents/${documentId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: response.headers['content-type'] || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', documentName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Failed to download document");
    }
  };

  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const [openExportCardId, setOpenExportCardId] = useState<number | null>(null);

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
          <div className="flex gap-3 items-center">
            <h1 className="text-3xl font-bold">Risk Tracker & Audit</h1>
            <div className="relative group flex items-center cursor-help text-gray-400 hover:text-cyan-400 transition-colors pt-1">
              <Info className="w-5.5 h-5.5" />
              
              {/* Tooltip Content */}
              <div className="absolute left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 top-full mt-3 w-80 p-4 bg-gray-950/98 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 z-50 text-left">
                <h4 className="font-bold text-sm text-[#00e5ff] mb-2.5 border-b border-gray-850 pb-1.5 flex items-center gap-1.5">
                  Item Risk Scoring Rules
                </h4>
                <div className="space-y-3 text-xs text-gray-300">
                  <p className="text-gray-400 leading-relaxed font-medium">Individual item scores (out of 100) are determined by these rules in the code:</p>
                  
                  <div>
                    <span className="font-semibold text-white block mb-1">Scope Creep (OutOfScope Agent)</span>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                      <li><strong className="text-white">80/100</strong> for direct baseline violations (out of scope).</li>
                      <li><strong className="text-white">50/100</strong> for warnings or borderline review items.</li>
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-white block mb-1">Timeline Delays & Risks (Timeline Agent)</span>
                    <ul className="list-disc pl-4 space-y-1 text-gray-400 font-medium">
                      <li><strong className="text-white">85/100</strong> for critical delays or active blockers.</li>
                      <li><strong className="text-white">65/100</strong> for high timeline risk deliverables.</li>
                      <li><strong className="text-white">45/100</strong> for medium timeline risk.</li>
                      <li><strong className="text-white">15/100</strong> for low timeline risk.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <button onClick={() => navigate(`/projects/${id}`)} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-md">Back to Dashboard</button>
            <button onClick={handleOpenProcessModal} disabled={processing} className={`px-4 py-2 rounded-md ${processing ? 'bg-gray-600 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}>
              {processing ? 'Processing AI...' : 'Process Status Document'}
            </button>

            {/* Global Export Dropdown */}
            <div className="relative">
              <button onClick={() => setShowExportDropdown(!showExportDropdown)} className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white font-medium rounded-md flex items-center gap-2 cursor-pointer transition-colors shadow-md hover:shadow-lg">
                <span>Export Report</span>
                <span className="text-[10px]">▼</span>
              </button>
              
              {showExportDropdown && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div className="fixed inset-0 z-40" onClick={() => setShowExportDropdown(false)} />
                  
                  <div className="absolute right-0 top-full mt-2 w-56 bg-gray-950 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md z-50 text-left p-2 space-y-1 animate-fade-in-up">
                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                      Active Risks
                    </div>
                    <button onClick={() => { handleExportBatch(activeItems, 'pdf', 'All Active Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                      <span>All Active Risks (PDF)</span>
                    </button>
                    <button onClick={() => { handleExportBatch(activeItems, 'docx', 'All Active Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2">
                      <span>All Active Risks (Word)</span>
                    </button>
                    
                    {selectedItemIds.length > 0 && (
                      <>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-cyan-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                          Selected Risks ({selectedItemIds.length})
                        </div>
                        <button onClick={() => { handleExportBatch(activeItems.filter(i => selectedItemIds.includes(i.id)), 'pdf', 'Selected Active Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                          <span>Selected Risks (PDF)</span>
                        </button>
                        <button onClick={() => { handleExportBatch(activeItems.filter(i => selectedItemIds.includes(i.id)), 'docx', 'Selected Active Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs bg-cyan-950/20 hover:bg-cyan-950/40 text-cyan-300 hover:text-cyan-200 rounded-lg flex items-center gap-2 cursor-pointer transition-colors mb-2">
                          <span>Selected Risks (Word)</span>
                        </button>
                      </>
                    )}

                    <div className="px-2.5 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-850 mb-1">
                      Resolved Risks
                    </div>
                    <button onClick={() => { handleExportBatch(resolvedItems, 'pdf', 'All Resolved Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                      <span>All Resolved Risks (PDF)</span>
                    </button>
                    <button onClick={() => { handleExportBatch(resolvedItems, 'docx', 'All Resolved Risks'); setShowExportDropdown(false); }} className="w-full text-left px-2.5 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white rounded-lg flex items-center gap-2 cursor-pointer transition-colors">
                      <span>All Resolved Risks (Word)</span>
                    </button>
                  </div>
                </>
              )}
            </div>
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
                    SCOPE_CREEP: 'Scope Creep',
                    DELAY: 'Delay Risk',
                    MISSING_DELIVERABLE: 'Missing Deliverable',
                    DEPENDENCY: 'Dependency Risk',
                    STAKEHOLDER: 'Stakeholder Risk',
                    GENERAL: 'General',
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
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {activeTab === 'ACTIVE' && (
                            <div className="pt-1.5 flex-shrink-0">
                              <input
                                type="checkbox"
                                checked={selectedItemIds.includes(item.id)}
                                onChange={() => toggleSelectItem(item.id)}
                                className="w-4 h-4 rounded border-gray-700 bg-gray-900 text-cyan-600 focus:ring-cyan-500/50 cursor-pointer accent-cyan-500"
                              />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-xl truncate">{item.name}</h3>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-xs text-gray-400 bg-gray-700/50 px-2 py-0.5 rounded">
                              {typeLabels[item.item_type] || item.item_type}
                            </span>
                            <span className="text-xs text-gray-300 font-medium flex items-center gap-1.5 bg-gray-900/50 px-2 py-1 rounded border border-gray-700/40">
                              <span className="text-gray-500 font-semibold">Doc:</span>
                              <span className="text-gray-200 truncate max-w-[200px]" title={item.document_name}>
                                {item.document_name}
                              </span>
                              <button
                                onClick={() => handleDownloadDocument(item.source_document_id, item.document_name)}
                                title="Download Document"
                                className="p-0.5 text-gray-400 hover:text-cyan-400 hover:bg-gray-800 rounded transition-all cursor-pointer flex-shrink-0"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          </div>
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
                          {item.requires_escalation ? <span className="px-2 py-1 bg-orange-900/50 text-orange-300 rounded text-xs border border-orange-500/30">Escalated</span> : null}
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
                        <div className="mt-4 p-4 bg-green-950/20 border border-green-500/20 rounded-xl space-y-2.5 animate-fade-in-up">
                          <p className="text-sm text-green-300"><span className="font-bold">Resolution:</span> {item.resolution}</p>
                          {(item.resolved_by_name || item.resolved_at) && (
                            <div className="pt-2.5 border-t border-green-500/10 flex flex-wrap gap-x-4 gap-y-1 text-xs text-green-400/80 font-medium">
                              {item.resolved_by_name && (
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold">Resolved By:</span> {item.resolved_by_name} {item.resolved_by_email ? `(${item.resolved_by_email})` : ''}
                                </span>
                              )}
                              {item.resolved_at && (
                                <span className="flex items-center gap-1">
                                  <span className="font-semibold">Resolved At:</span> {new Date(item.resolved_at).toLocaleString()}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-3">
                          <button onClick={() => openResolveModal(item.id)} className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-md text-sm transition-colors cursor-pointer font-medium shadow-md hover:shadow-lg active:scale-[0.98]">
                            Mark as Resolved
                          </button>
                          
                          {/* Single Card Export */}
                          <div className="relative">
                            <button onClick={(e) => { e.stopPropagation(); setOpenExportCardId(openExportCardId === item.id ? null : item.id); }} className="px-3 py-2 bg-gray-700 hover:bg-gray-650 rounded-md text-sm transition-colors cursor-pointer font-medium flex items-center gap-1.5 border border-gray-600/50">
                              <span>Export</span>
                              <span className="text-[10px] text-gray-400">▼</span>
                            </button>
                            
                            {openExportCardId === item.id && (
                              <>
                                {/* Click outside handler for card export */}
                                <div className="fixed inset-0 z-20" onClick={(e) => { e.stopPropagation(); setOpenExportCardId(null); }} />
                                
                                <div className="absolute left-0 bottom-full mb-1 w-32 bg-gray-950 border border-gray-800 rounded-lg shadow-xl z-30 overflow-hidden animate-fade-in-up">
                                  <button onClick={() => { handleExportSingle(item, 'pdf'); setOpenExportCardId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-900 text-gray-300 hover:text-white flex items-center gap-1.5 cursor-pointer">
                                    <span>PDF</span>
                                  </button>
                                  <button onClick={() => { handleExportSingle(item, 'docx'); setOpenExportCardId(null); }} className="w-full text-left px-3 py-2 text-xs hover:bg-gray-900 text-gray-305 hover:text-white flex items-center gap-1.5 border-t border-gray-900 cursor-pointer">
                                    <span>Word</span>
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
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
