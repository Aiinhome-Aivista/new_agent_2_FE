import React, { useState, useEffect } from 'react';
import { useDocumentProgress } from '../context/DocumentProgressContext';
import { Loader2, X, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, ExternalLink, Square } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

export const GlobalProgressWidget: React.FC = () => {
  const { isEvaluating, evaluationProgress, elapsedTime, resetProgress, cancelProgress, activeProjectId } = useDocumentProgress();
  const [isMinimized, setIsMinimized] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Only render if evaluating OR we have a completed/failed status that we want to show temporarily
  useEffect(() => {
    if (isEvaluating || evaluationProgress) {
      setShouldRender(true);
    } else {
      // Small delay before unmounting to allow fade out animations
      const timer = setTimeout(() => setShouldRender(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isEvaluating, evaluationProgress]);

  // Auto-dismiss completed widget after 20 seconds so user can view and click
  useEffect(() => {
    if (evaluationProgress && (evaluationProgress.status === 'completed' || evaluationProgress.status === 'failed')) {
      const timer = setTimeout(() => {
        resetProgress();
      }, 20000);
      return () => clearTimeout(timer);
    }
  }, [evaluationProgress, resetProgress]);

  if (!shouldRender || !evaluationProgress) return null;

  const progress = evaluationProgress.progress || 0;
  const status = evaluationProgress.status;
  const isFailed = status === 'failed';
  const isCompleted = status === 'completed';
  const docName = evaluationProgress.document_name || 'Document';
  const isBaseline = 
    evaluationProgress.document_type === 'EL' || 
    evaluationProgress.document_type === 'IFA' || 
    evaluationProgress.document_type?.toUpperCase() === 'EL' ||
    evaluationProgress.document_type?.toUpperCase() === 'IFA' ||
    ["Detect Sections", "Extract Candidates", "Classify Items", "Deduplicate", "Enrich Dates", "Save Draft", "Detecting Scope Sections", "Extracting Scope Candidates", "Classifying Scope Items", "Deduplicating Candidates", "Extracting Milestones & Deadlines", "Saving Baseline Draft"].includes(evaluationProgress.currentStage || "");

  const handleViewTracker = () => {
    if (activeProjectId) {
      const targetPath = isBaseline
        ? `/projects/${activeProjectId}/baseline`
        : `/projects/${activeProjectId}/tracker`;
      navigate(targetPath);
      // If we are already on that page, trigger page reload or state refresh
      if (location.pathname === targetPath) {
        window.location.reload();
      }
    }
  };

  const handleStopProcess = async () => {
    await cancelProgress(activeProjectId || undefined, evaluationProgress?.document_id);
  };

  // If minimized, show a compact floating pill
  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-6 right-6 z-[9999] flex items-center gap-3 px-4 py-3 bg-[#0b0e17]/95 border border-border-subtle rounded-full shadow-2xl backdrop-blur-md cursor-pointer hover:border-border-strong transition-all duration-300 animate-fade-in-up"
        onClick={() => setIsMinimized(false)}
      >
        <div className="relative flex items-center justify-center">
          {!isFailed && !isCompleted && (
            <Loader2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400 animate-spin" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          )}
          {isFailed && (
            <AlertCircle className="w-5 h-5 text-rose-500" />
          )}
        </div>
        <div className="flex flex-col text-left">
          <span className="text-[10px] text-text-muted font-bold uppercase tracking-wider">
            {isFailed ? 'Failed' : isCompleted ? 'Completed' : 'Running'}
          </span>
          <span className="text-xs text-text-primary font-semibold truncate max-w-[120px]">
            {docName}
          </span>
        </div>
        <div className="flex items-center gap-1.5 pl-2 border-l border-border-subtle">
          <span className="text-xs font-black text-cyan-600 dark:text-cyan-400">{progress}%</span>
          <ChevronUp className="w-4 h-4 text-text-muted hover:text-text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-[9999] w-80 md:w-96 bg-[#0b0e17]/95 border border-border-subtle rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-left transition-all duration-300 animate-fade-in-up">
      {/* Glow effects */}
      <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full bg-cyan-500/5 blur-[40px] pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-blue-500/5 blur-[40px] pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle/60 bg-bg-base">
        <div className="flex items-center gap-2">
          {!isFailed && !isCompleted && (
            <Loader2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400 animate-spin" />
          )}
          {isCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-400" />
          )}
          {isFailed && (
            <AlertCircle className="w-4 h-4 text-rose-500" />
          )}
          <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
            {isFailed 
              ? 'Error Details' 
              : isCompleted 
                ? 'Analysis Done' 
                : isBaseline 
                  ? 'Baseline Extraction' 
                  : 'AI Risk Analysis'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!isCompleted && !isFailed && (
            <button 
              onClick={handleStopProcess}
              className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded transition-all cursor-pointer flex items-center gap-1 text-[10px] font-semibold px-2 border border-rose-500/30"
              title="Stop process & clean up"
            >
              <Square className="w-3 h-3 fill-rose-500/30" />
              <span>Stop</span>
            </button>
          )}
          <button 
            onClick={() => setIsMinimized(true)}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-hover/40 rounded transition-all cursor-pointer"
            title="Minimize"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button 
            onClick={isFailed || isCompleted ? resetProgress : handleStopProcess}
            className="p-1 text-text-muted hover:text-text-primary hover:bg-bg-hover/40 rounded transition-all cursor-pointer"
            title={isFailed || isCompleted ? "Dismiss" : "Cancel & Dismiss"}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4">
        <div className="mb-3">
          <h4 className="text-sm font-bold text-text-primary truncate" title={docName}>
            {docName}
          </h4>
          <p className="text-[11px] text-text-muted mt-0.5">
            {isFailed 
              ? 'An error occurred during risk analysis.' 
              : isCompleted 
                ? 'Evaluation finished successfully.' 
                : evaluationProgress.currentStage || 'Processing document...'}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full h-2 bg-bg-base border border-border-subtle rounded-full overflow-hidden p-0.5">
            <div 
              className={`h-full rounded-full bg-gradient-to-r ${isFailed ? 'from-rose-600 to-red-500' : 'from-blue-600 to-cyan-500'} transition-all duration-500 ease-out`}
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between items-center mt-2 text-[10px] text-text-muted font-bold uppercase tracking-wider">
            <span>Elapsed: {elapsedTime}s</span>
            <span className={isFailed ? 'text-rose-500' : 'text-cyan-600 dark:text-cyan-400'}>{progress}%</span>
          </div>
        </div>

        {/* Error message block */}
        {isFailed && evaluationProgress.error && (
          <div className="mb-4 p-2.5 bg-rose-950/20 border border-rose-500/20 rounded-xl text-rose-200 text-[10px] font-mono leading-normal max-h-20 overflow-y-auto">
            {evaluationProgress.error}
          </div>
        )}

        {/* Action Button */}
        {!isFailed && (
          <button
            onClick={handleViewTracker}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-xs font-bold text-text-primary rounded-lg shadow-lg hover:shadow-cyan-500/10 transition-all duration-200 cursor-pointer"
          >
            <span>{isCompleted ? (isBaseline ? 'View Baseline Review' : 'View Risk Tracker') : (isBaseline ? 'View Baseline Tracker' : 'View Live Tracker')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
