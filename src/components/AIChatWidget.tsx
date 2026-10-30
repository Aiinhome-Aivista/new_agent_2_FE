import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { PulseDotLoader } from './common/PulseDotLoader';
import {
  Loader2,
  Send,
  MessageSquare,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Download,
  User,
  Bot,
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../hooks';

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface ChatSession {
  id: number;
  session_name: string;
  created_by: number;
  creator_name: string;
  created_at: string;
  updated_at: string;
}

interface Citation {
  document_id: number;
  document_name: string;
  page: number;
  text: string;
}

interface ChatMessage {
  id: number;
  role: 'USER' | 'ASSISTANT';
  content: string;
  citations: Citation[];
  created_at: string;
}

export const AIChatWidget: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme === 'dark';
  const toast = useToast();

  // Extract projectId from URL if present (/projects/:id/...)
  const projectMatch = location.pathname.match(/\/projects\/(\d+)/);
  const projectIdFromUrl = projectMatch ? projectMatch[1] : null;

  // Track project ID and fallback to last active project in localStorage
  const [activeProjectId, setActiveProjectId] = useState<string | null>(projectIdFromUrl);

  useEffect(() => {
    if (projectIdFromUrl) {
      setActiveProjectId(projectIdFromUrl);
      try {
        localStorage.setItem('acse_last_project_id', projectIdFromUrl);
      } catch {
        // ignore
      }
    } else {
      const stored = localStorage.getItem('acse_last_project_id');
      if (stored) {
        setActiveProjectId(stored);
      }
    }
  }, [projectIdFromUrl, location.pathname]);

  // Widget state
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  // Chat state
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionIdState, setCurrentSessionIdState] = useState<number | null>(null);
  const currentSessionIdRef = useRef<number | null>(null);
  const lastFetchedSessionIdRef = useRef<number | null>(null);

  const currentSessionId = currentSessionIdState;
  const setCurrentSessionId = (sessionId: number | null) => {
    currentSessionIdRef.current = sessionId;
    setCurrentSessionIdState(sessionId);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState('');

  const [project, setProject] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingSessionId, setSendingSessionId] = useState<number | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevProjectIdRef = useRef<string | null>(null);

  // Auto-open if query param has ?chat=open or ?assistant=open
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get('chat') === 'open' || searchParams.get('assistant') === 'open') {
      setIsOpen(true);
    }
  }, [location.search]);

  // Global event listeners for external triggers
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    const handleToggle = () => setIsOpen((prev) => !prev);
    window.addEventListener('open-ai-chat', handleOpen);
    window.addEventListener('toggle-ai-chat', handleToggle);
    return () => {
      window.removeEventListener('open-ai-chat', handleOpen);
      window.removeEventListener('toggle-ai-chat', handleToggle);
    };
  }, []);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Focus input on dialog open
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen, currentSessionId]);

  // Fetch project data when activeProjectId changes
  useEffect(() => {
    if (!activeProjectId) return;

    if (prevProjectIdRef.current !== activeProjectId) {
      setSessions([]);
      setMessages([]);
      setCurrentSessionId(null);
      lastFetchedSessionIdRef.current = null;
      prevProjectIdRef.current = activeProjectId;
    }

    fetchSessions(activeProjectId);
    fetchProjectDetails(activeProjectId);
    fetchSuggestions(activeProjectId);
  }, [activeProjectId]);

  // Fetch messages when current session changes
  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
    if (currentSessionId !== null && activeProjectId) {
      if (lastFetchedSessionIdRef.current !== currentSessionId) {
        fetchMessages(activeProjectId, currentSessionId);
      }
    } else {
      setMessages([]);
      lastFetchedSessionIdRef.current = null;
    }
  }, [currentSessionId, activeProjectId]);

  // Auto scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendingSessionId]);

  const fetchProjectDetails = async (projId: string) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS.DETAIL(projId));
      if (res.data?.success) {
        setProject(res.data.data);
      }
    } catch {
      // ignore
    }
  };

  const fetchSuggestions = async (projId: string) => {
    setLoadingSuggestions(true);
    try {
      const res = await apiClient.get(`/projects/${projId}/rag/suggestions`);
      if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        setSuggestions(res.data.data);
      } else {
        setSuggestions([
          'What is defined regarding Engagement Duration?',
          'Are automated reminder emails for trainings included in the baseline scope?',
          'How does the contract address Contract Validity conditions?',
          'What specific features are required for internal processes?',
        ]);
      }
    } catch {
      setSuggestions([
        'What is in scope for the project deliverables?',
        'List key milestones and contractual deadlines',
        'Summarize main assumptions and dependencies',
        'What are the agreed SLA and support terms?',
      ]);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const fetchSessions = async (projId: string) => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.RAG.SESSIONS(projId));
      if (res.data?.success) {
        const list = res.data.data || [];
        setSessions(list);
        if (list.length > 0 && currentSessionIdRef.current === null) {
          setCurrentSessionId(list[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (projId: string, sessionId: number) => {
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.RAG.MESSAGES(projId, sessionId));
      if (res.data?.success) {
        setMessages(res.data.data || []);
        lastFetchedSessionIdRef.current = sessionId;
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      lastFetchedSessionIdRef.current = null;
    } finally {
      setLoadingMessages(false);
    }
  };

  const fetchSessionsWithoutReset = async (projId: string) => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.RAG.SESSIONS(projId));
      if (res.data?.success) {
        setSessions(res.data.data || []);
      }
    } catch {
      // ignore
    }
  };

  const handleCreateSession = async (): Promise<number | null> => {
    if (!activeProjectId) return null;
    setCreatingSession(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.RAG.SESSIONS(activeProjectId), {
        session_name: 'New Chat',
      });
      if (res.data?.success) {
        const newSession = res.data.data;
        setSessions((prev) => [newSession, ...prev]);
        lastFetchedSessionIdRef.current = newSession.id;
        setMessages([]);
        setCurrentSessionId(newSession.id);
        return newSession.id;
      }
      return null;
    } catch (error) {
      console.error('Failed to create chat session:', error);
      toast.error('Failed to create new session');
      return null;
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeProjectId) return;
    if (!confirm('Are you sure you want to delete this chat session?')) return;
    try {
      const res = await apiClient.delete(API_ENDPOINTS.RAG.SESSION_DETAIL(activeProjectId, sessionId));
      if (res.data?.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId));
        if (currentSessionIdRef.current === sessionId) {
          const remaining = sessions.filter((s) => s.id !== sessionId);
          setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
        toast.success('Session deleted');
      }
    } catch {
      toast.error('Failed to delete session');
    }
  };

  const handleSendMessage = async (textToSend?: string, overrideSessionId?: number) => {
    if (!activeProjectId) return;
    const text = (textToSend || query).trim();
    if (!text || sendingSessionId !== null) return;

    let targetSessionId = overrideSessionId !== undefined ? overrideSessionId : currentSessionIdRef.current;

    // Auto-create session if none active
    if (targetSessionId === null) {
      const createdId = await handleCreateSession();
      if (!createdId) return;
      targetSessionId = createdId;
    }

    setSendingSessionId(targetSessionId);
    if (!textToSend) setQuery('');

    // Optimistic user message
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'USER',
      content: text,
      citations: [],
      created_at: new Date().toISOString(),
    };

    if (currentSessionIdRef.current === targetSessionId) {
      setMessages((prev) => [...prev, tempUserMsg]);
    }

    try {
      const res = await apiClient.post(API_ENDPOINTS.RAG.MESSAGES(activeProjectId, targetSessionId), {
        query: text,
      });

      if (res.data?.success) {
        const assistantMsg = res.data.data;
        if (currentSessionIdRef.current === targetSessionId) {
          setMessages((prev) =>
            prev
              .filter((m) => m.id !== tempUserMsg.id)
              .concat([{ ...tempUserMsg, id: assistantMsg.id - 1 }, assistantMsg])
          );
        }
        fetchSessionsWithoutReset(activeProjectId);
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to retrieve answer';
      const errorAssistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        content: `Sorry, an error occurred while retrieving the answer: ${errorMsg}`,
        citations: [],
        created_at: new Date().toISOString(),
      };
      if (currentSessionIdRef.current === targetSessionId) {
        setMessages((prev) => [...prev, errorAssistantMsg]);
      }
    } finally {
      setSendingSessionId(null);
    }
  };

  const handleDownloadDoc = async (docId: number, docName: string) => {
    if (!activeProjectId) return;
    try {
      const response = await apiClient.get(API_ENDPOINTS.DOCUMENTS.DOWNLOAD(activeProjectId, docId), {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], {
        type: (response.headers['content-type'] as string) || 'application/octet-stream',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error('Failed to download document');
    }
  };

  const formatMessageContent = (content: string) => {
    const cleaned = content
      .split('\n')
      .map((line) => {
        let l = line.trim();
        l = l.replace(/^#+\s*/, '');
        if (l.startsWith('*') && !l.startsWith('**')) l = l.replace(/^\*\s*/, '');
        l = l.replace(/^-\s*/, '');
        if (/^[-_\s]+$/.test(l)) l = '';
        return l;
      })
      .join('\n');

    const parts = cleaned.split('**');
    return parts.map((part, index) =>
      index % 2 === 1 ? (
        <strong
          key={index}
          className={`font-bold ${isDark ? 'text-teal-300' : 'text-[#0F766E]'}`}
        >
          {part}
        </strong>
      ) : (
        part
      )
    );
  };

  // Only render widget when a project ID is available
  if (!activeProjectId) {
    return null;
  }

  // ─── Floating Action Button ─────────────────────────────────────────────────

  const fabButton = (
    <button
      onClick={() => setIsOpen(!isOpen)}
      className={`
        group fixed bottom-6 right-6 z-50
        w-14 h-14 rounded-full
        flex items-center justify-center
        transition-all duration-300 ease-out
        hover:scale-110 active:scale-95
        cursor-pointer
        shadow-xl
        ${
          isOpen
            ? isDark
              ? 'bg-[#2A2A2A] text-gray-200 border border-white/20 shadow-black/40'
              : 'bg-slate-700 text-white shadow-slate-900/30'
            : 'bg-gradient-to-tr from-[#0F766E] to-[#06B6D4] text-white shadow-teal-500/30 hover:shadow-cyan-400/50'
        }
      `}
      title={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
      aria-label={isOpen ? 'Close AI Assistant' : 'Open AI Assistant'}
    >
      {isOpen ? (
        <X className="w-6 h-6 transition-transform duration-200" />
      ) : (
        <div className="relative flex items-center justify-center">
          <Bot className="w-6 h-6 transition-transform duration-200 group-hover:scale-105" />
          <span className="absolute -bottom-2 -right-2 text-[9px] font-black px-1 rounded-full bg-[#FF5A14] text-white shadow-sm border border-white/30 tracking-tight">
            AI
          </span>
        </div>
      )}

      {/* Gentle attention ping when closed */}
      {!isOpen && (
        <span className="absolute inset-0 rounded-full bg-teal-400/30 animate-ping pointer-events-none" />
      )}
    </button>
  );

  // ─── Chat Dialog Window ─────────────────────────────────────────────────────

  const dialogClasses = isExpanded
    ? 'fixed inset-4 md:inset-8 z-50'
    : 'fixed bottom-24 right-6 z-50 w-[92vw] sm:w-[440px] md:w-[460px] h-[620px] max-h-[calc(100vh-120px)]';

  const dialogPanel = isOpen ? (
    <div
      className={`
        ${dialogClasses}
        flex flex-col
        rounded-2xl overflow-hidden
        border
        ${
          isDark
            ? 'bg-[#18181b] border-white/10 text-white shadow-2xl shadow-black/60'
            : 'bg-white border-slate-200 text-slate-900 shadow-2xl shadow-slate-900/20'
        }
        transition-all duration-300 ease-out
      `}
      style={{
        animation: 'chatDialogIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* ── Dialog Header ── */}
      <div
        className={`
          flex items-center justify-between px-4 py-3.5 flex-shrink-0 border-b select-none
          ${
            isDark
              ? 'bg-[#202025] border-white/10'
              : 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white border-teal-700/30'
          }
        `}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className={`
              w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
              ${isDark ? 'bg-teal-500/20 text-teal-300' : 'bg-white/20 text-white'}
            `}
          >
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-white'}`}>
                Project AI Assistant
              </h3>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="Ready" />
            </div>
            <p className={`text-[10px] truncate ${isDark ? 'text-gray-400' : 'text-white/80'}`}>
              {project?.project_name || 'Contracts & Scope Intelligence'}
            </p>
          </div>
        </div>

        {/* Header Control Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className={`
              p-1.5 rounded-lg transition-colors cursor-pointer
              ${
                showSidebar
                  ? isDark
                    ? 'bg-teal-500/20 text-teal-300'
                    : 'bg-white/30 text-white'
                  : isDark
                  ? 'hover:bg-white/10 text-gray-400 hover:text-white'
                  : 'hover:bg-white/20 text-white/80 hover:text-white'
              }
            `}
            title={showSidebar ? 'Hide chat history' : 'Show chat history'}
            aria-label="Toggle sessions"
          >
            {showSidebar ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`
              p-1.5 rounded-lg transition-colors cursor-pointer hidden sm:block
              ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/20 text-white/80 hover:text-white'}
            `}
            title={isExpanded ? 'Restore size' : 'Expand window'}
            aria-label="Toggle expand"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setIsOpen(false)}
            className={`
              p-1.5 rounded-lg transition-colors cursor-pointer
              ${isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-white/20 text-white/80 hover:text-white'}
            `}
            title="Close dialog (Esc)"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Dialog Body ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sessions Drawer (collapsible) */}
        {showSidebar && (
          <div
            className={`
              w-56 flex-shrink-0 flex flex-col border-r overflow-hidden
              ${isDark ? 'bg-[#151518] border-white/10' : 'bg-slate-50 border-slate-200'}
            `}
          >
            <div className="p-3 border-b flex items-center justify-between flex-shrink-0 border-inherit">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                Chat History
              </span>
              <button
                onClick={handleCreateSession}
                disabled={creatingSession}
                className={`
                  p-1 rounded-lg transition-all cursor-pointer disabled:opacity-50
                  ${isDark ? 'bg-teal-500/20 hover:bg-teal-500/30 text-teal-300' : 'bg-teal-100 hover:bg-teal-200 text-teal-700'}
                `}
                title="Start new chat"
              >
                {creatingSession ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {loadingSessions && sessions.length === 0 ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="w-4 h-4 animate-spin text-teal-500" />
                </div>
              ) : sessions.length === 0 ? (
                <div className="text-center py-8 px-2">
                  <p className="text-[11px] text-gray-400">No chat sessions.</p>
                  <button
                    onClick={handleCreateSession}
                    className="mt-2 text-[11px] text-teal-500 hover:underline font-semibold cursor-pointer"
                  >
                    Create one now
                  </button>
                </div>
              ) : (
                sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setCurrentSessionId(session.id)}
                    className={`
                      group flex items-center justify-between gap-1 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-all
                      ${
                        currentSessionId === session.id
                          ? isDark
                            ? 'bg-teal-500/20 text-teal-200 font-bold border border-teal-500/30'
                            : 'bg-teal-50 text-teal-800 font-bold border border-teal-200 shadow-sm'
                          : isDark
                          ? 'text-gray-300 hover:bg-white/5 hover:text-white border border-transparent'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent'
                      }
                    `}
                  >
                    <span className="truncate flex-1">{session.session_name}</span>
                    <button
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-rose-400 transition-all cursor-pointer"
                      title="Delete session"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Main Chat Workspace */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {currentSessionId === null ? (
            /* Welcome / Zero State */
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center overflow-y-auto">
              <div
                className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center mb-4
                  ${isDark ? 'bg-teal-500/15 border border-teal-500/30 text-teal-400' : 'bg-teal-50 border border-teal-200 text-teal-600'}
                `}
              >
                <Bot className="w-7 h-7" />
              </div>
              <h4 className={`text-lg font-extrabold mb-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Project AI Assistant
              </h4>
              <p className={`text-xs leading-relaxed max-w-[320px] mb-6 ${isDark ? 'text-gray-400' : 'text-slate-600'}`}>
                Ask any question about contracts, baseline scope items, deliverable timelines, MOMs, or status updates.
              </p>

              <div className="w-full max-w-[340px] space-y-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider text-left ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                  Try asking:
                </p>
                {suggestions.slice(0, 4).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      const newId = await handleCreateSession();
                      if (newId) handleSendMessage(item, newId);
                    }}
                    className={`
                      w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer
                      flex items-center justify-between gap-2 group
                      ${
                        isDark
                          ? 'bg-[#202025] hover:bg-[#272730] border border-white/5 hover:border-teal-500/40 text-teal-200'
                          : 'bg-teal-50/70 hover:bg-teal-100 border border-teal-200 text-teal-800 shadow-sm'
                      }
                    `}
                  >
                    <span className="line-clamp-2">{item}</span>
                    <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 text-teal-500 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Messages Scroll Area */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {loadingMessages ? (
                  <div className="flex justify-center items-center h-40">
                    <PulseDotLoader size={30} color="var(--color-primary, #0F766E)" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-10 flex flex-col items-center space-y-3">
                    <Bot className="w-8 h-8 text-gray-500" />
                    <p className="text-xs text-gray-400">Ask your first question about the project scope or documents.</p>
                    <div className="flex flex-col gap-1.5 w-full max-w-xs mt-2">
                      {suggestions.slice(0, 3).map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSendMessage(item)}
                          className={`
                            px-3 py-2 rounded-xl text-[11px] text-left font-medium transition-all cursor-pointer
                            ${
                              isDark
                                ? 'bg-white/5 hover:bg-white/10 border border-white/5 text-teal-300'
                                : 'bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800'
                            }
                          `}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'USER';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        {!isUser && (
                          <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                        )}

                        <div className="max-w-[85%] space-y-1.5">
                          <div
                            className={`
                              p-3.5 rounded-2xl text-[12px] leading-relaxed
                              ${
                                isUser
                                  ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-medium rounded-tr-sm shadow-md'
                                  : isDark
                                  ? 'bg-[#222228] border border-white/10 text-gray-200 rounded-tl-sm'
                                  : 'bg-slate-100 border border-slate-200 text-slate-800 rounded-tl-sm'
                              }
                            `}
                          >
                            <div className="whitespace-pre-wrap">
                              {formatMessageContent(msg.content)}
                            </div>
                          </div>

                          {/* Citations & Source Documents */}
                          {!isUser && msg.citations && msg.citations.length > 0 && (
                            <div className="pl-1 pt-1 space-y-1">
                              <span className={`text-[9px] uppercase font-bold tracking-wider ${isDark ? 'text-cyan-400/80' : 'text-teal-700'}`}>
                                References:
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {Array.from(
                                  new Map(msg.citations.map((c) => [c.document_name, c])).values()
                                ).map((cit, cidx) => (
                                  <div
                                    key={cidx}
                                    className={`
                                      inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium border
                                      ${
                                        isDark
                                          ? 'bg-white/5 border-white/10 text-gray-300'
                                          : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                                      }
                                    `}
                                  >
                                    <FileText className="w-3 h-3 text-cyan-500" />
                                    <span className="truncate max-w-[130px]">{cit.document_name}</span>
                                    {cit.document_id && (
                                      <button
                                        onClick={() => handleDownloadDoc(cit.document_id, cit.document_name)}
                                        className="ml-1 text-teal-500 hover:text-teal-400 transition-colors cursor-pointer"
                                        title="Download document"
                                      >
                                        <Download className="w-3 h-3" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {isUser && (
                          <div className="w-7 h-7 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <User className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Thinking / Streaming Indicator */}
                {sendingSessionId === currentSessionId && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                    <div
                      className={`
                        px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5
                        ${isDark ? 'bg-[#222228] border border-white/10' : 'bg-slate-100 border border-slate-200'}
                      `}
                    >
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div
                className={`
                  p-3 border-t flex-shrink-0
                  ${isDark ? 'border-white/10 bg-[#16161a]' : 'border-slate-200 bg-slate-50'}
                `}
              >
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendMessage();
                  }}
                  className={`
                    flex items-center gap-2 rounded-xl px-3 py-1 border transition-all
                    ${
                      isDark
                        ? 'bg-[#222228] border-white/10 focus-within:border-teal-500/50'
                        : 'bg-white border-slate-200 focus-within:border-teal-500'
                    }
                  `}
                >
                  <input
                    ref={inputRef}
                    type="text"
                    value={query}
                    disabled={sendingSessionId !== null}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask about contracts, baseline items, MOMs..."
                    className={`
                      flex-1 bg-transparent border-0 outline-none text-xs py-2 disabled:opacity-50
                      ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-800 placeholder-slate-400'}
                    `}
                  />
                  <button
                    type="submit"
                    disabled={!query.trim() || sendingSessionId !== null}
                    className={`
                      px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all
                      disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer
                      ${
                        isDark
                          ? 'bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-black'
                          : 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white'
                      }
                    `}
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Send</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {dialogPanel}
      {fabButton}

      <style>{`
        @keyframes chatDialogIn {
          from {
            opacity: 0;
            transform: translateY(18px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </>
  );
};
