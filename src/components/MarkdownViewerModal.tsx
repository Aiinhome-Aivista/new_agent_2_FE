import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, FileText, Code, Eye, Loader2, FileCode } from 'lucide-react';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { PulseDotLoader } from './common/PulseDotLoader';

interface MarkdownViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | number;
  documentId: number | null;
  documentName?: string;
}

export const MarkdownViewerModal: React.FC<MarkdownViewerModalProps> = ({
  isOpen,
  onClose,
  projectId,
  documentId,
  documentName = 'Document',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'formatted' | 'raw'>('formatted');
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState<{ chars: number; lines: number; filename: string }>({
    chars: 0,
    lines: 0,
    filename: '',
  });

  useEffect(() => {
    if (!isOpen || !documentId) {
      setMarkdown('');
      setError(null);
      return;
    }

    const fetchMarkdown = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await apiClient.get(API_ENDPOINTS.DOCUMENTS.MARKDOWN(projectId, documentId));
        if (res.data?.success && res.data?.data) {
          const content = res.data.data.markdown || '';
          setMarkdown(content);
          setStats({
            chars: res.data.data.char_count || content.length,
            lines: res.data.data.line_count || content.split('\n').length,
            filename: res.data.data.markdown_filename || `${documentName}.md`,
          });
        } else {
          setError('Failed to retrieve Markdown content.');
        }
      } catch (err: any) {
        console.error('Failed to load markdown', err);
        setError(err.response?.data?.detail || 'Failed to convert or load Markdown content.');
      } finally {
        setLoading(false);
      }
    };

    fetchMarkdown();
  }, [isOpen, documentId, projectId, documentName]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!markdown) return;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    if (!documentId) return;
    try {
      const response = await apiClient.get(
        API_ENDPOINTS.DOCUMENTS.DOWNLOAD_MARKDOWN(projectId, documentId),
        { responseType: 'blob' }
      );
      const blob = new Blob([response.data], { type: 'text/markdown;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', stats.filename || `${documentName}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error('Failed to download markdown file', err);
      // Fallback: create blob from current state
      const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', stats.filename || `${documentName}.md`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    }
  };

  /**
   * Simple client-side Markdown formatter for formatted view without heavy external deps
   */
  const renderFormattedMarkdown = (text: string) => {
    const lines = text.split('\n');
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];

    const flushTable = (keyPrefix: string) => {
      if (tableRows.length === 0) return null;
      const headers = tableRows[0];
      const dataRows = tableRows.slice(1);
      const tableElement = (
        <div key={`${keyPrefix}-table`} className="my-4 overflow-x-auto rounded-xl border border-border-strong/60 shadow-sm">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-bg-hover/80 text-text-primary uppercase tracking-wider text-[10px] font-bold border-b border-border-strong">
              <tr>
                {headers.map((h, hi) => (
                  <th key={hi} className="px-3 py-2.5 border-r border-border-strong/40 last:border-r-0">
                    {renderInlineText(h.trim())}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle bg-bg-card/40">
              {dataRows.map((r, ri) => (
                <tr key={ri} className="hover:bg-bg-hover/40 transition-colors">
                  {r.map((cell, ci) => (
                    <td key={ci} className="px-3 py-2 text-text-secondary border-r border-border-strong/20 last:border-r-0">
                      {renderInlineText(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
      return tableElement;
    };

    const renderInlineText = (line: string): React.ReactNode => {
      // Bold syntax **text**
      const parts = line.split('**');
      return parts.map((part, idx) => {
        if (idx % 2 === 1) {
          return (
            <strong key={idx} className="font-bold text-text-primary">
              {part}
            </strong>
          );
        }
        return part;
      });
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Detect Markdown Table row
      if (line.startsWith('|') && line.endsWith('|')) {
        const cells = line
          .slice(1, -1)
          .split('|')
          .map((c) => c.trim());

        // Ignore markdown table divider rows (| --- | --- |)
        const isDivider = cells.every((c) => /^[-:\s]+$/.test(c));
        if (!isDivider) {
          inTable = true;
          tableRows.push(cells);
        }
        continue;
      } else if (inTable) {
        elements.push(flushTable(`table-${i}`));
      }

      // Empty line
      if (!line) {
        elements.push(<div key={`empty-${i}`} className="h-2" />);
        continue;
      }

      // Headers
      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${i}`} className="text-xl font-black text-text-primary mt-6 mb-2 border-b border-border-strong/40 pb-1.5 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-[#FF5A14] rounded-full inline-block" />
            {line.replace(/^#\s+/, '')}
          </h1>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${i}`} className="text-base font-bold text-text-primary mt-5 mb-2 flex items-center gap-2">
            <span className="w-1 h-4 bg-orange-400 rounded-full inline-block" />
            {line.replace(/^##\s+/, '')}
          </h2>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${i}`} className="text-sm font-semibold text-[#FF5A14] dark:text-orange-400 mt-4 mb-1.5">
            {line.replace(/^###\s+/, '')}
          </h3>
        );
      } else if (line.startsWith('#### ')) {
        elements.push(
          <h4 key={`h4-${i}`} className="text-xs font-semibold text-text-secondary uppercase tracking-wider mt-3 mb-1">
            {line.replace(/^####\s+/, '')}
          </h4>
        );
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(
          <div key={`bullet-${i}`} className="flex items-start gap-2 text-xs text-text-secondary my-1 pl-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF5A14]/70 mt-1.5 flex-shrink-0" />
            <span>{renderInlineText(line.replace(/^[-*]\s+/, ''))}</span>
          </div>
        );
      } else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.*)$/);
        elements.push(
          <div key={`num-${i}`} className="flex items-start gap-2 text-xs text-text-secondary my-1 pl-2">
            <span className="text-[10px] font-bold text-[#FF5A14] min-w-[16px]">{match ? `${match[1]}.` : '•'}</span>
            <span>{renderInlineText(match ? match[2] : line)}</span>
          </div>
        );
      } else if (line.startsWith('> ')) {
        elements.push(
          <div key={`quote-${i}`} className="border-l-4 border-[#FF5A14] bg-bg-hover/30 px-3.5 py-2 my-2 rounded-r-lg text-xs italic text-text-muted">
            {renderInlineText(line.replace(/^>\s+/, ''))}
          </div>
        );
      } else if (line.startsWith('---') || line.startsWith('___')) {
        elements.push(<hr key={`hr-${i}`} className="border-border-subtle my-4" />);
      } else {
        elements.push(
          <p key={`p-${i}`} className="text-xs text-text-secondary leading-relaxed my-1.5">
            {renderInlineText(line)}
          </p>
        );
      }
    }

    if (inTable) {
      elements.push(flushTable('table-end'));
    }

    return elements;
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-3 md:p-6 animate-fadeIn">
      <div className="bg-bg-panel border border-border-strong/90 rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden relative">
        {/* Header */}
        <div className="p-4 md:px-6 border-b border-border-subtle bg-bg-card/40 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-[#FF5A14]/15 text-[#FF5A14] rounded-xl flex-shrink-0">
              <FileCode className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-text-primary truncate">
                  {documentName}
                </h3>
                <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 bg-emerald-500/15 text-emerald-500 border border-emerald-500/25 rounded-full flex-shrink-0">
                  Markdown (.md)
                </span>
              </div>
              <p className="text-[10px] text-text-muted mt-0.5">
                Converted via Microsoft MarkItDown • {stats.lines.toLocaleString()} lines • {stats.chars.toLocaleString()} characters
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-bg-hover/80 rounded-xl p-0.5 border border-border-strong/60">
              <button
                type="button"
                onClick={() => setActiveTab('formatted')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'formatted'
                    ? 'bg-[#FF5A14] text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Formatted
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'raw'
                    ? 'bg-[#FF5A14] text-white shadow-sm'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                Raw Source
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              disabled={loading || !markdown}
              title="Copy Markdown to Clipboard"
              className="p-2 rounded-xl bg-bg-hover border border-border-strong/60 text-text-secondary hover:text-[#FF5A14] hover:border-[#FF5A14]/40 transition-all cursor-pointer disabled:opacity-40"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </button>

            {/* Download Button */}
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !markdown}
              title="Download .md file"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-hover hover:bg-[#FF5A14] border border-border-strong/60 hover:border-[#FF5A14] text-text-secondary hover:text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-40"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .md</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-text-muted hover:text-text-primary rounded-xl hover:bg-bg-hover transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-bg-base/60">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <PulseDotLoader size={40} className="mb-4" />
              <p className="text-xs font-bold text-text-primary">Loading & Converting to Markdown...</p>
              <p className="text-[11px] text-text-muted mt-1">Generating clean Markdown with Microsoft MarkItDown</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center p-6">
              <FileText className="w-10 h-10 text-rose-500 mb-3 opacity-60" />
              <p className="text-sm font-bold text-rose-500 mb-1">Markdown View Unavailable</p>
              <p className="text-xs text-text-muted max-w-md">{error}</p>
            </div>
          ) : !markdown ? (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-center">
              <FileText className="w-8 h-8 text-text-muted mb-2 opacity-50" />
              <p className="text-xs text-text-muted">No markdown content available for this document.</p>
            </div>
          ) : activeTab === 'formatted' ? (
            <div className="max-w-4xl mx-auto bg-bg-card border border-border-subtle rounded-2xl p-6 md:p-8 shadow-sm">
              {renderFormattedMarkdown(markdown)}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <pre className="bg-[#0b0f19] text-gray-200 text-xs font-mono p-5 rounded-2xl border border-gray-800 overflow-x-auto whitespace-pre-wrap leading-relaxed select-text shadow-inner">
                {markdown}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
