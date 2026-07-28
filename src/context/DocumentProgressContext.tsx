import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import apiClient from '../api/apiClient';

interface EvaluationProgress {
  currentStage: string;
  progress: number;
  status: 'running' | 'completed' | 'failed' | 'pending';
  document_name?: string;
  document_id?: number;
  document_type?: string;
  error?: string;
}

interface DocumentProgressContextType {
  isEvaluating: boolean;
  evaluationProgress: EvaluationProgress | null;
  elapsedTime: number;
  activeDocId: number | null;
  activeProjectId: number | null;
  startSSEStream: (projectId: number, docId: number, documentName: string) => void;
  startPolling: (projectId: number, docId: number, documentName: string, initialElapsedSeconds?: number, documentType?: string) => void;
  checkActiveProgress: (projectId: number) => Promise<void>;
  resetProgress: () => void;
}

const DocumentProgressContext = createContext<DocumentProgressContextType | undefined>(undefined);

export const useDocumentProgress = () => {
  const context = useContext(DocumentProgressContext);
  if (!context) {
    throw new Error('useDocumentProgress must be used within a DocumentProgressProvider');
  }
  return context;
};

export const DocumentProgressProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationProgress, setEvaluationProgress] = useState<EvaluationProgress | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [activeDocId, setActiveDocId] = useState<number | null>(null);
  const [activeProjectId, setActiveProjectId] = useState<number | null>(null);

  const eventSourceRef = useRef<EventSource | null>(null);
  const pollingIntervalRef = useRef<any>(null);
  const timerRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSSEStream();
      stopPolling();
      stopTimer();
    };
  }, []);

  const stopSSEStream = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
  };

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startTimer = (initialElapsedSeconds = 0) => {
    stopTimer();
    startTimeRef.current = Date.now() - (initialElapsedSeconds * 1000);
    setElapsedTime(initialElapsedSeconds);
    timerRef.current = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
  };

  const resetProgress = () => {
    stopSSEStream();
    stopPolling();
    stopTimer();
    setIsEvaluating(false);
    setEvaluationProgress(null);
    setElapsedTime(0);
    setActiveDocId(null);
    setActiveProjectId(null);
  };

  // Start polling progress from DB status
  const startPolling = (projectId: number, docId: number, documentName: string, initialElapsedSeconds = 0, documentType?: string) => {
    stopPolling();
    stopSSEStream();
    setIsEvaluating(true);
    setActiveDocId(docId);
    setActiveProjectId(projectId);
    startTimer(initialElapsedSeconds);

    setEvaluationProgress({
      currentStage: 'Initializing...',
      progress: 5,
      status: 'running',
      document_name: documentName,
      document_id: docId,
      document_type: documentType
    });

    const fetchProgress = async () => {
      try {
        const response = await apiClient.get(`/projects/${projectId}/monitoring/progress?document_id=${docId}`);
        if (response.data.success && response.data.data) {
          const { status, progress, step, error, elapsed_seconds, document_type: dbDocType } = response.data.data;
          const currentDocType = dbDocType || documentType;
          
          // Calibrate elapsed time to match backend's real duration
          if (elapsed_seconds !== undefined && elapsed_seconds !== null) {
            const currentFrontElapsed = Math.floor((Date.now() - startTimeRef.current) / 1000);
            if (Math.abs(currentFrontElapsed - elapsed_seconds) > 2) {
              startTimeRef.current = Date.now() - (elapsed_seconds * 1000);
              setElapsedTime(elapsed_seconds);
            }
          }

          if (status === 'completed') {
            setEvaluationProgress({
              currentStage: 'Completed',
              progress: 100,
              status: 'completed',
              document_name: documentName,
              document_id: docId,
              document_type: currentDocType
            });
            stopPolling();
            stopTimer();
          } else if (status === 'failed') {
            setEvaluationProgress({
              currentStage: 'Failed',
              progress: 0,
              status: 'failed',
              document_name: documentName,
              document_id: docId,
              document_type: currentDocType,
              error: error || 'Unknown error'
            });
            stopPolling();
            stopTimer();
          } else {
            setEvaluationProgress({
              currentStage: step || 'Processing',
              progress: progress || 0,
              status: 'running',
              document_name: documentName,
              document_id: docId,
              document_type: currentDocType
            });
          }
        }
      } catch (err) {
        console.error('Error polling document progress:', err);
      }
    };

    // Initial fetch and then interval
    fetchProgress();
    pollingIntervalRef.current = setInterval(fetchProgress, 2500);
  };

  // Connect to SSE Stream (used when starting fresh)
  const startSSEStream = (projectId: number, docId: number, documentName: string) => {
    resetProgress();
    setIsEvaluating(true);
    setActiveDocId(docId);
    setActiveProjectId(projectId);
    startTimer();

    setEvaluationProgress({
      currentStage: 'Loading Project Baseline',
      progress: 5,
      status: 'running',
      document_name: documentName,
      document_id: docId,
      document_type: 'STATUS_REPORT'
    });

    const token = localStorage.getItem('token');
    if (!token) {
      setIsEvaluating(false);
      return;
    }

    const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8080/api';
    const url = `${apiBaseUrl}/projects/${projectId}/monitoring/stream?document_id=${docId}&token=${encodeURIComponent(token)}`;
    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        const { step, progress, status, error } = data;

        if (status === 'completed') {
          setEvaluationProgress({
            currentStage: 'Completed',
            progress: 100,
            status: 'completed',
            document_name: documentName,
            document_id: docId,
            document_type: 'STATUS_REPORT'
          });
          stopSSEStream();
          stopTimer();
        } else if (status === 'failed') {
          setEvaluationProgress({
            currentStage: 'Failed',
            progress: 0,
            status: 'failed',
            document_name: documentName,
            document_id: docId,
            document_type: 'STATUS_REPORT',
            error: error || 'Unknown error'
          });
          stopSSEStream();
          stopTimer();
        } else {
          setEvaluationProgress({
            currentStage: step,
            progress: progress,
            status: 'running',
            document_name: documentName,
            document_id: docId,
            document_type: 'STATUS_REPORT'
          });
        }
      } catch (e) {
        console.error('SSE parse error:', e);
      }
    };

    es.onerror = () => {
      console.error('SSE connection lost. Switching to polling...');
      stopSSEStream();
      // Switch to polling as a fallback
      startPolling(projectId, docId, documentName, 0, evaluationProgress?.document_type || 'STATUS_REPORT');
    };
  };

  // Check if any document is currently processing for a project (on mount/reload)
  const checkActiveProgress = useCallback(async (projectId: number) => {
    // If we are already actively evaluating a document in this project, keep the current state/timer
    if (isEvaluating && activeProjectId === projectId) {
      return;
    }
    // If we already have a completed or failed evaluation result displayed, do not overwrite it!
    if (evaluationProgress && (evaluationProgress.status === 'completed' || evaluationProgress.status === 'failed')) {
      return;
    }
    try {
      const response = await apiClient.get(`/projects/${projectId}/monitoring/progress`);
      if (response.data.success && response.data.data) {
        const { document_id, document_name, status, progress, step, elapsed_seconds, document_type } = response.data.data;
        if (status === 'running') {
          // Document is processing, start polling it with the elapsed time from backend
          startPolling(projectId, document_id, document_name, elapsed_seconds || 0, document_type);
        }
      }
    } catch (err) {
      console.error('Error checking active progress:', err);
    }
  }, [isEvaluating, activeProjectId, evaluationProgress, startPolling]);

  return (
    <DocumentProgressContext.Provider value={{
      isEvaluating,
      evaluationProgress,
      elapsedTime,
      activeDocId,
      activeProjectId,
      startSSEStream,
      startPolling,
      checkActiveProgress,
      resetProgress
    }}>
      {children}
    </DocumentProgressContext.Provider>
  );
};
