import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../api/apiClient';
import { Loader } from '../components/Loader';
import { Loader2, Send, MessageSquare, Plus, Trash2, Calendar, FileText, Download, User, Bot, CornerDownLeft } from 'lucide-react';

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

export const AIAssistantPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
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
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);
  
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingSessionId, setSendingSessionId] = useState<number | null>(null);
  const [creatingSession, setCreatingSession] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSessions();
    const fetchProjectDetails = async () => {
      try {
        const res = await apiClient.get(`/projects/${id}`);
        if (res.data.success) {
          setProject(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch project details:", err);
      }
    };
    
    const fetchSuggestions = async () => {
      setLoadingSuggestions(true);
      try {
        const res = await apiClient.get(`/projects/${id}/rag/suggestions`);
        if (res.data.success) {
          setSuggestions(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch project suggestions:", err);
        setSuggestions([
          "What is in scope for data migration?",
          "List all out of scope items in the contract",
          "What are the key upcoming deliverables and deadlines?",
          "Summarize the main project assumptions and dependencies"
        ]);
      } finally {
        setLoadingSuggestions(false);
      }
    };
    
    fetchProjectDetails();
    fetchSuggestions();
  }, [id]);

  useEffect(() => {
    currentSessionIdRef.current = currentSessionId;
    if (currentSessionId !== null) {
      if (lastFetchedSessionIdRef.current !== currentSessionId) {
        fetchMessages(currentSessionId);
      }
    } else {
      setMessages([]);
      lastFetchedSessionIdRef.current = null;
    }
  }, [currentSessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await apiClient.get(`/projects/${id}/rag/sessions`);
      if (res.data.success) {
        setSessions(res.data.data);
        if (res.data.data.length > 0 && currentSessionIdRef.current === null) {
          setCurrentSessionId(res.data.data[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch chat sessions:", error);
    } finally {
      setLoadingSessions(false);
    }
  };

  const fetchMessages = async (sessionId: number) => {
    setLoadingMessages(true);
    try {
      const res = await apiClient.get(`/projects/${id}/rag/sessions/${sessionId}/messages`);
      if (res.data.success) {
        setMessages(res.data.data);
        lastFetchedSessionIdRef.current = sessionId;
      }
    } catch (error) {
      console.error("Failed to fetch session messages:", error);
      lastFetchedSessionIdRef.current = null;
    } finally {
      setLoadingMessages(false);
    }
  };

  const handleCreateSession = async (): Promise<number | null> => {
    setCreatingSession(true);
    try {
      const name = 'New Chat';
      const res = await apiClient.post(`/projects/${id}/rag/sessions`, {
        session_name: name
      });
      if (res.data.success) {
        const newSession = res.data.data;
        setSessions(prev => [newSession, ...prev]);
        lastFetchedSessionIdRef.current = newSession.id;
        setMessages([]);
        setCurrentSessionId(newSession.id);
        return newSession.id;
      }
      return null;
    } catch (error) {
      console.error("Failed to create chat session:", error);
      return null;
    } finally {
      setCreatingSession(false);
    }
  };

  const handleDeleteSession = async (sessionId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this chat session and all its messages?")) return;
    try {
      const res = await apiClient.delete(`/projects/${id}/rag/sessions/${sessionId}`);
      if (res.data.success) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionIdRef.current === sessionId) {
          const remaining = sessions.filter(s => s.id !== sessionId);
          setCurrentSessionId(remaining.length > 0 ? remaining[0].id : null);
        }
      }
    } catch (error) {
      console.error("Failed to delete session:", error);
    }
  };

  const handleSendMessage = async (textToSend?: string, overrideSessionId?: number) => {
    const text = textToSend || query;
    const sessionIdToUse = overrideSessionId !== undefined ? overrideSessionId : currentSessionIdRef.current;
    if (!text.trim() || sessionIdToUse === null || sendingSessionId !== null) return;
    
    setSendingSessionId(sessionIdToUse);
    if (!textToSend) setQuery('');
    
    // Optimistic user message update if we are on the active session
    const tempUserMsg: ChatMessage = {
      id: Date.now(),
      role: 'USER',
      content: text,
      citations: [],
      created_at: new Date().toISOString()
    };
    if (currentSessionIdRef.current === sessionIdToUse) {
      setMessages(prev => [...prev, tempUserMsg]);
    }

    try {
      const res = await apiClient.post(`/projects/${id}/rag/sessions/${sessionIdToUse}/messages`, {
        query: text
      });
      if (res.data.success) {
        // Replace temp messages with official list or append assistant message
        const assistantMsg = res.data.data;
        if (currentSessionIdRef.current === sessionIdToUse) {
          setMessages(prev => {
            // Remove the temporary message and set official messages from server
            return prev.filter(m => m.id !== tempUserMsg.id).concat([
              { ...tempUserMsg, id: assistantMsg.id - 1 }, // Give it a matching sorted ID
              assistantMsg
            ]);
          });
        }
        
        // Refresh sessions to show updated updated_at timestamps
        fetchSessionsWithoutReset();
      }
    } catch (error: any) {
      console.error("Failed to send message:", error);
      const errorMsg = error.response?.data?.detail || error.message || "Unknown error";
      const errorAssistantMsg: ChatMessage = {
        id: Date.now() + 1,
        role: 'ASSISTANT',
        content: `Error: Failed to retrieve answer from AI Assistant. (Details: ${errorMsg}). Please check your connection or try again later.`,
        citations: [],
        created_at: new Date().toISOString()
      };
      if (currentSessionIdRef.current === sessionIdToUse) {
        setMessages(prev => [...prev, errorAssistantMsg]);
      }
    } finally {
      setSendingSessionId(null);
    }
  };

  const fetchSessionsWithoutReset = async () => {
    try {
      const res = await apiClient.get(`/projects/${id}/rag/sessions`);
      if (res.data.success) {
        setSessions(res.data.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadDoc = async (docId: number, docName: string) => {
    try {
      const response = await apiClient.get(`/projects/${id}/documents/${docId}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: (response.headers['content-type'] as string) || 'application/octet-stream' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', docName);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to download document:", error);
      alert("Failed to download document");
    }
  };

  const formatMessageContent = (content: string) => {
    // 1. Clean up any raw #, * or - characters (bullet list markers/dividers) at the beginning of lines
    const cleaned = content.split('\n').map(line => {
      let l = line.trim();
      // Strip leading hashes (e.g. "### Title" -> "Title")
      l = l.replace(/^#+\s*/, '');
      // Strip leading bullet stars (e.g. "* Item" -> "Item")
      if (l.startsWith('*') && !l.startsWith('**')) {
        l = l.replace(/^\*\s*/, '');
      }
      // Strip leading bullet dashes (e.g. "- Item" -> "Item")
      l = l.replace(/^-\s*/, '');
      // If the line consists only of hyphens or underscores (e.g. "---"), replace with empty
      if (/^[-_\s]+$/.test(l)) {
        l = '';
      }
      return l;
    }).join('\n');

    // 2. Parse **bold** syntax to <strong> tags
    const parts = cleaned.split('**');
    return parts.map((part, index) => {
      if (index % 2 === 1) {
        return <strong key={index} className="font-extrabold text-cyan-200">{part}</strong>;
      }
      return part;
    });
  };

  if (loadingSessions && sessions.length === 0) {
    return <Loader message="Initializing AI Assistant..." />;
  }

  return (
    <div className="flex-1 flex flex-col md:flex-row bg-[#080b14] h-[calc(100vh-4rem)] md:h-screen max-h-[calc(100vh-4rem)] md:max-h-screen overflow-hidden">
      
      {/* LEFT PANEL: Session Directory */}
      <div className="w-full md:w-80 bg-gray-900/30 border-r border-white/5 flex flex-col h-1/3 md:h-full flex-shrink-0">
        
        {/* Sidebar Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display font-bold text-white text-base">Chat History</h2>
          </div>
          <button
            onClick={handleCreateSession}
            disabled={creatingSession}
            title="Start New Chat"
            className="p-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-xl transition-all cursor-pointer disabled:opacity-50"
          >
            {creatingSession ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {/* Sessions list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {sessions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-gray-500">No chat sessions available.</p>
              <button 
                onClick={handleCreateSession} 
                className="mt-3 text-xs text-cyan-400 hover:underline font-semibold"
              >
                Create one now
              </button>
            </div>
          ) : (
            sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => setCurrentSessionId(session.id)}
                className={`group p-3 rounded-xl border transition-all duration-200 cursor-pointer flex items-center justify-between ${
                  currentSessionId === session.id
                    ? "bg-cyan-950/30 border-cyan-500/30 shadow-lg shadow-cyan-500/5"
                    : "bg-gray-800/20 border-white/5 hover:bg-gray-800/40 hover:border-white/10"
                }`}
              >
                <div className="min-w-0 pr-2">
                  <p className={`text-xs font-semibold truncate ${
                    currentSessionId === session.id ? "text-cyan-200" : "text-gray-300"
                  }`}>
                    {session.session_name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500">
                    <Calendar className="w-3 h-3" />
                    <span>{new Date(session.created_at).toLocaleDateString(undefined, { dateStyle: 'short' })}</span>
                    <span>•</span>
                    <span className="truncate max-w-[80px]" title={session.creator_name}>{session.creator_name}</span>
                  </div>
                </div>
                
                <button
                  onClick={(e) => handleDeleteSession(session.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 hover:text-red-400 rounded-lg text-gray-500 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Chat Area */}
      <div className="flex-1 flex flex-col h-2/3 md:h-full bg-transparent overflow-hidden">
        
        {currentSessionId === null ? (
          /* Empty Chat State */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center animate-bounce-slow">
              <Bot className="w-8 h-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-extrabold text-white">Project AI Assistant</h1>
              <p className="text-gray-400 text-sm mt-2 leading-relaxed">
                Ask any question about the project's contracts, baseline scope items, deliverable timelines, MOMs, or status updates. The AI retrieves context from both ChromaDB and MySQL for highly precise, source-cited responses.
              </p>
            </div>

            {/* Suggested prompts list */}
            <div className="w-full space-y-2 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Try asking:</p>
              <div className="grid grid-cols-1 gap-2">
                {suggestions.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={async () => {
                      const newId = await handleCreateSession();
                      if (newId) {
                        handleSendMessage(p, newId);
                      }
                    }}
                    className="text-left px-4 py-2.5 bg-gray-800/30 hover:bg-gray-800/60 border border-white/5 hover:border-cyan-500/20 text-gray-300 hover:text-cyan-200 text-xs rounded-xl transition-all cursor-pointer active:scale-[0.99]"
                  >
                    {p} &rarr;
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Workspace */
          <>
            {/* Chat header */}
            <div className="p-4 border-b border-white/5 bg-gray-900/10 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-sm font-bold text-white">
                  {sessions.find(s => s.id === currentSessionId)?.session_name}
                </h3>
                <p className="text-[10px] text-cyan-400 font-semibold uppercase tracking-widest mt-0.5">
                  {project?.project_name || 'Project RAG Intelligence'}
                </p>
              </div>
            </div>

            {/* Messages Log */}
            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center justify-center space-y-4">
                  <Bot className="w-10 h-10 text-gray-600" />
                  <p className="text-xs text-gray-500">Ask your first question about the project deliverables or scope contracts.</p>
                  
                  <div className="flex flex-wrap justify-center gap-2 max-w-lg mt-4">
                    {suggestions.map((p, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(p)}
                        className="px-3 py-1.5 bg-gray-900/50 hover:bg-gray-800 border border-white/5 hover:border-cyan-500/20 text-gray-300 hover:text-cyan-300 rounded-lg text-xs transition-all cursor-pointer"
                      >
                        {p}
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
                      className={`flex gap-3 max-w-3xl ${
                        isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'
                      }`}
                    >
                      {/* Avatar */}
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isUser ? 'bg-cyan-500/15 text-cyan-400' : 'bg-indigo-500/15 text-indigo-400'
                      }`}>
                        {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                      </div>

                      {/* Bubble */}
                      <div className="space-y-2">
                        <div className={`p-4 rounded-2xl text-sm leading-relaxed ${
                          isUser
                            ? 'bg-gradient-to-r from-cyan-600/90 to-blue-600/90 text-white rounded-tr-none shadow-lg shadow-cyan-500/10'
                            : 'bg-gray-800/60 border border-white/5 text-gray-200 rounded-tl-none'
                        }`}>
                          <div className="whitespace-pre-wrap">{formatMessageContent(msg.content)}</div>
                        </div>

                        {/* Citations Footer */}
                        {!isUser && msg.citations && msg.citations.length > 0 && (
                          <div className="pl-2 pt-3 border-t border-white/5 mt-3 space-y-2">
                            <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-400/80 block">
                              References & Citations:
                            </span>
                            <div className="flex flex-wrap gap-2.5">
                              {Array.from(new Map(msg.citations.map(c => [c.document_name, c])).values()).map((cit, cidx) => (
                                <div 
                                  key={cidx}
                                  className="inline-flex items-center gap-3 bg-white/[0.03] border border-white/10 hover:border-cyan-500/30 rounded-xl px-3.5 py-2 transition-all duration-200 shadow-sm"
                                >
                                  <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-cyan-400" />
                                    <span className="text-xs font-bold text-gray-200">
                                      {cit.document_name}
                                    </span>
                                  </div>
                                  {cit.document_id && (
                                    <button
                                      onClick={() => handleDownloadDoc(cit.document_id, cit.document_name)}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-gray-800/80 hover:bg-cyan-500 hover:text-black border border-white/5 rounded-lg text-[10px] text-gray-400 font-semibold transition-all cursor-pointer ml-1"
                                    >
                                      <Download className="w-3 h-3" />
                                      <span>Download</span>
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              
              {/* Sending / Thinking state */}
              {sendingSessionId === currentSessionId && (
                <div className="flex gap-3 max-w-3xl mr-auto">
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center flex-shrink-0 animate-pulse">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-gray-800/40 border border-white/5 px-5 py-3.5 rounded-2xl rounded-tl-none flex items-center gap-1.5 min-w-[70px] justify-center">
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-bounce" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-white/5 bg-gray-900/10 flex-shrink-0">
              <form
                onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
                className="w-full flex gap-2 relative bg-gray-800/30 border border-white/10 rounded-2xl focus-within:border-cyan-500/50 focus-within:ring-2 focus-within:ring-cyan-500/10 transition-all p-1"
              >
                <input
                  type="text"
                  value={query}
                  disabled={sendingSessionId !== null}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about project scope or status documents..."
                  className="flex-1 bg-transparent border-0 outline-none text-sm text-white placeholder-gray-500 px-4 py-3 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!query.trim() || sendingSessionId !== null}
                  className="px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-cyan-500/15 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer self-center mr-1"
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
  );
};
