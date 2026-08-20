import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import type { ProjectMember, User } from '../types';
import apiClient from '../api/apiClient';
import { API_ENDPOINTS } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import {
  Users,
  UserPlus,
  UserCheck,
  Pencil,
  Trash2,
  Search,
  Mail,
  Briefcase,
  Crown,
  Loader2,
  X,
  Plus,
  Check,
  ShieldAlert,
  User as UserIcon,
} from 'lucide-react';

interface ProjectMembersSectionProps {
  projectId: number;
  isClosed?: boolean;
}

export const ProjectMembersSection: React.FC<ProjectMembersSectionProps> = ({ projectId, isClosed }) => {
  const { user } = useAuth();
  const isManagerOrAdmin = (user?.role === 'ENGAGEMENT_MANAGER' || user?.role === 'ADMIN') && !isClosed;

  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');

  // Registered system users list (for pre-filling when creating/editing)
  const [systemUsers, setSystemUsers] = useState<User[]>([]);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ProjectMember | null>(null);

  // Form States
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [roleCategory, setRoleCategory] = useState<'Stakeholder' | 'Team Lead' | 'Custom'>('Stakeholder');
  const [customRole, setCustomRole] = useState('');
  const [responsibility, setResponsibility] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [saving, setSaving] = useState(false);

  // Delete Modal State
  const [deletingMember, setDeletingMember] = useState<ProjectMember | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast Notification
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(API_ENDPOINTS.PROJECTS.STAKEHOLDERS(projectId));
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch project members', err);
      showNotification('Failed to load project members', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemUsers = async () => {
    if (!isManagerOrAdmin) return;
    try {
      const res = await apiClient.get('/users/');
      if (res.data.success) {
        setSystemUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch system users', err);
    }
  };

  useEffect(() => {
    fetchMembers();
    fetchSystemUsers();
  }, [projectId]);

  const openAddModal = () => {
    setEditingMember(null);
    setName('');
    setEmail('');
    setRoleCategory('Stakeholder');
    setCustomRole('');
    setResponsibility('');
    setSelectedUserId('');
    setIsModalOpen(true);
  };

  const openEditModal = (member: ProjectMember) => {
    setEditingMember(member);
    setName(member.name);
    setEmail(member.email || '');
    if (member.role === 'Stakeholder' || member.role === 'Team Lead') {
      setRoleCategory(member.role);
      setCustomRole('');
    } else {
      setRoleCategory('Custom');
      setCustomRole(member.role);
    }
    setResponsibility(member.responsibility || '');
    setSelectedUserId(member.user_id ? member.user_id.toString() : '');
    setIsModalOpen(true);
  };

  const handleSystemUserSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const uId = e.target.value;
    setSelectedUserId(uId);
    if (uId) {
      const found = systemUsers.find((u) => u.id === parseInt(uId));
      if (found) {
        setName(found.name);
        setEmail(found.email);
        if (found.role === 'PROJECT_LEAD') {
          setRoleCategory('Team Lead');
        }
      }
    }
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const finalRole = roleCategory === 'Custom' ? (customRole.trim() || 'Member') : roleCategory;
    setSaving(true);

    const payload = {
      name: name.trim(),
      email: email.trim() || null,
      role: finalRole,
      responsibility: responsibility.trim() || null,
      user_id: selectedUserId ? parseInt(selectedUserId) : null,
    };

    try {
      if (editingMember) {
        // Edit mode
        const res = await apiClient.put(API_ENDPOINTS.PROJECTS.STAKEHOLDER_DETAIL(projectId, editingMember.id), payload);
        if (res.data.success) {
          showNotification('Project member updated successfully!');
          setIsModalOpen(false);
          fetchMembers();
        }
      } else {
        // Add mode
        const res = await apiClient.post(API_ENDPOINTS.PROJECTS.STAKEHOLDERS(projectId), payload);
        if (res.data.success) {
          showNotification('Project member added successfully!');
          setIsModalOpen(false);
          fetchMembers();
        }
      }
    } catch (err: any) {
      console.error('Failed to save project member', err);
      const errMsg = err.response?.data?.detail || 'Failed to save project member';
      showNotification(errMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setDeleting(true);
    try {
      const res = await apiClient.delete(API_ENDPOINTS.PROJECTS.STAKEHOLDER_DETAIL(projectId, deletingMember.id));
      if (res.data.success) {
        showNotification('Project member removed successfully!');
        setDeletingMember(null);
        fetchMembers();
      }
    } catch (err: any) {
      console.error('Failed to remove project member', err);
      const errMsg = err.response?.data?.detail || 'Failed to remove member';
      showNotification(errMsg, 'error');
    } finally {
      setDeleting(false);
    }
  };

  // Filtered members list
  const filteredMembers = members.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.email && m.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      m.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (m.responsibility && m.responsibility.toLowerCase().includes(searchQuery.toLowerCase()));

    if (selectedRoleFilter === 'ALL') return matchesSearch;
    if (selectedRoleFilter === 'STAKEHOLDER') return matchesSearch && m.role === 'Stakeholder';
    if (selectedRoleFilter === 'TEAM_LEAD') return matchesSearch && m.role === 'Team Lead';
    if (selectedRoleFilter === 'OTHER') return matchesSearch && m.role !== 'Stakeholder' && m.role !== 'Team Lead';

    return matchesSearch;
  });

  const getRoleBadgeStyle = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('team lead') || lower.includes('lead') || lower.includes('project lead')) {
      return {
        bg: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
        icon: <Crown className="w-3.5 h-3.5 text-indigo-400" />,
        gradient: 'from-indigo-600 to-blue-600',
      };
    }
    if (lower.includes('stakeholder') || lower.includes('sponsor')) {
      return {
        bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
        icon: <Briefcase className="w-3.5 h-3.5 text-emerald-400" />,
        gradient: 'from-emerald-600 to-teal-600',
      };
    }
    return {
      bg: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30',
      icon: <UserCheck className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />,
      gradient: 'from-purple-600 to-pink-600',
    };
  };

  return (
    <div className="bg-bg-hover/90 border border-border-strong/80 rounded-2xl p-6 md:p-8 shadow-xl relative backdrop-blur-md">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed top-6 right-6 z-50 max-w-sm w-full p-4 rounded-xl shadow-2xl border flex items-center justify-between animate-slideIn ${
            notification.type === 'success'
              ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-200'
              : 'bg-rose-950/90 border-rose-500/30 text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <Check className="w-5 h-5 text-emerald-400" />
            ) : (
              <ShieldAlert className="w-5 h-5 text-rose-500 dark:text-rose-400" />
            )}
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="p-1 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-border-strong/60 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#FF5A14]/10 border border-[#FF8A55]/30 rounded-xl text-[#FF5A14]">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-text-primary tracking-tight flex items-center gap-2">
                Project Members
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FF5A14]/10 border border-[#FF8A55]/30 text-[#FF5A14] font-semibold">
                  {members.length}
                </span>
              </h2>
              <p className="text-xs text-text-muted mt-0.5">
                Assigned Stakeholders, Team Leads, and Project Contacts
              </p>
            </div>
          </div>
        </div>

        {isManagerOrAdmin && (
          <button
            onClick={openAddModal}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-[#FF5A14]/20 active:scale-[0.98] cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        )}
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[#B0B0B0] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search member by name, role, email, or responsibilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl pl-10 pr-4 py-2 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-text-muted hover:text-text-primary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex gap-1.5 bg-[#FFF7F2] dark:bg-[#2a2a2a] p-1 border border-[#D8D8D8] dark:border-[#444444] rounded-xl">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'STAKEHOLDER', label: 'Stakeholders' },
            { id: 'TEAM_LEAD', label: 'Team Leads' },
            { id: 'OTHER', label: 'Other' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedRoleFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${
                selectedRoleFilter === tab.id
                  ? 'bg-[#FF7A45] text-white font-bold shadow-sm'
                  : 'text-[#666666] dark:text-[#cccccc] hover:text-[#FF5A14]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Member Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF5A14] mb-2" />
          <p className="text-xs">Loading project members...</p>
        </div>
      ) : filteredMembers.length === 0 ? (
        <div className="text-center py-12 bg-bg-card/40 rounded-xl border border-dashed border-[#D8D8D8]">
          <Users className="w-10 h-10 text-[#FF7A45] mx-auto mb-3" />
          <p className="text-sm font-semibold text-text-primary mb-1">
            {searchQuery || selectedRoleFilter !== 'ALL'
              ? 'No matching members found'
              : 'No project members assigned yet'}
          </p>
          <p className="text-xs text-text-muted max-w-sm mx-auto mb-4">
            {searchQuery || selectedRoleFilter !== 'ALL'
              ? 'Try adjusting your search query or role filter.'
              : 'Engagement Managers can add Stakeholders, Team Leads, and other project personnel here.'}
          </p>
          {isManagerOrAdmin && !searchQuery && selectedRoleFilter === 'ALL' && (
            <button
              onClick={openAddModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all duration-300 shadow-md shadow-[#FF5A14]/20 active:scale-[0.98] cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add First Member
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const badgeStyle = getRoleBadgeStyle(member.role);
            const initials = member.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .substring(0, 2);

            return (
              <div
                key={member.id}
                className="group relative bg-bg-card/60 border border-border-strong/70 hover:border-[#FF8A55]/50 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-[#FF5A14]/5 flex flex-col justify-between"
              >
                <div>
                  {/* Top row: Avatar & Action Buttons */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${badgeStyle.gradient} flex items-center justify-center font-bold text-white text-xs shadow-md`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-sm text-text-primary group-hover:text-[#FF5A14] transition-colors truncate">
                          {member.name}
                        </h3>
                        <div
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-semibold border mt-1 ${badgeStyle.bg}`}
                        >
                          {badgeStyle.icon}
                          <span className="truncate">{member.role}</span>
                        </div>
                      </div>
                    </div>

                    {isManagerOrAdmin && (
                      <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEditModal(member)}
                          title="Edit Member"
                          className="p-1.5 text-text-muted hover:text-text-primary bg-bg-hover hover:bg-bg-hover rounded-lg border border-border-strong transition-all"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeletingMember(member)}
                          title="Remove Member"
                          className="p-1.5 text-rose-500 dark:text-rose-400 hover:text-white bg-rose-950/20 hover:bg-rose-900/40 border border-rose-500/20 rounded-lg transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email row */}
                  {member.email && (
                    <div className="flex items-center gap-2 text-xs text-text-muted mb-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                      <a
                        href={`mailto:${member.email}`}
                        className="hover:text-[#FF5A14] transition-colors truncate"
                      >
                        {member.email}
                      </a>
                    </div>
                  )}

                  {/* Responsibility section */}
                  {member.responsibility && (
                    <div className="mt-3 pt-2.5 border-t border-border-subtle text-xs text-text-muted line-clamp-3 leading-relaxed bg-bg-base p-2.5 rounded-lg border border-border-subtle/50">
                      <span className="font-medium text-text-secondary block mb-0.5">Responsibility:</span>
                      {member.responsibility}
                    </div>
                  )}
                </div>

                {/* Footer badge if linked to system user */}
                {member.user_id && (
                  <div className="mt-3 pt-2 border-t border-border-subtle/80 flex items-center justify-between text-[10px] text-text-muted">
                    <span className="flex items-center gap-1 text-[#FF5A14] font-medium">
                      <UserIcon className="w-3 h-3 text-[#FF5A14]" /> Linked User Account
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT MEMBER MODAL */}
      {isModalOpen && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-bg-panel border border-border-strong/80 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 shadow-2xl relative my-auto">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-text-muted hover:text-text-primary p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-text-primary mb-1">
              {editingMember ? 'Edit Project Member' : 'Add Project Member'}
            </h3>
            <p className="text-xs text-text-muted mb-6">
              Assign Stakeholders, Team Leads, or custom project roles.
            </p>

            <form onSubmit={handleSaveMember} className="space-y-4">
              {/* Optional: Pick Registered System User */}
              {systemUsers.length > 0 && !editingMember && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">
                    Quick Selection: Pick Registered User (Optional)
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={handleSystemUserSelect}
                    className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-3.5 py-2.5 text-xs text-[#666666] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55]"
                  >
                    <option value="">-- Manual Entry / Custom Member --</option>
                    {systemUsers.map((u) => (
                      <option key={u.id} value={u.id} className="bg-bg-panel text-text-primary">
                        {u.name} ({u.email}) - {u.role}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role Category Selector */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Member Category</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'Stakeholder', label: 'Stakeholder', icon: <Briefcase className="w-3.5 h-3.5" /> },
                    { id: 'Team Lead', label: 'Team Lead', icon: <Crown className="w-3.5 h-3.5" /> },
                    { id: 'Custom', label: 'Custom Role', icon: <UserCheck className="w-3.5 h-3.5" /> },
                  ].map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setRoleCategory(cat.id as any)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-medium transition-all ${
                        roleCategory === cat.id
                          ? 'bg-[#FF5A14]/15 border-[#FF8A55] text-[#FF5A14] font-bold shadow-sm'
                          : 'bg-[#FFF7F2] dark:bg-[#2a2a2a] border-[#D8D8D8] dark:border-[#444444] text-[#666666] dark:text-[#cccccc] hover:text-[#FF5A14]'
                      }`}
                    >
                      {cat.icon}
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Role Input if selected */}
              {roleCategory === 'Custom' && (
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-1.5">Custom Role Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Technical Director, Finance Reviewer..."
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55]"
                  />
                </div>
              )}

              {/* Name Input */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sarah Jenkins"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55]"
                />
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g. sarah.jenkins@pwc.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55]"
                />
              </div>

              {/* Responsibility Textarea */}
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">
                  Responsibilities & Scope Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Oversees delivery milestones, approves technical baseline deliverables..."
                  value={responsibility}
                  onChange={(e) => setResponsibility(e.target.value)}
                  className="w-full bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl px-4 py-2.5 text-xs text-[#666666] placeholder-[#B0B0B0] focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex gap-3 pt-4 border-t border-border-subtle">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={saving}
                  className="flex-1 py-2.5 bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] dark:hover:bg-[#333333] border border-[#D8D8D8] dark:border-[#444444] text-[#666666] dark:text-gray-200 rounded-xl text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 py-2.5 bg-[#FF7A45] hover:bg-[#F56B2F] text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-[#FF5A14]/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : editingMember ? (
                    'Update Member'
                  ) : (
                    'Save Member'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingMember && createPortal(
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center z-[9999] p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-bg-panel border border-border-strong/80 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl text-center my-auto">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-4 text-rose-500 dark:text-rose-400">
              <Trash2 className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-text-primary mb-2">Remove Project Member</h3>
            <p className="text-xs text-text-muted mb-6">
              Are you sure you want to remove <strong className="text-text-primary">{deletingMember.name}</strong> ({deletingMember.role}) from this project?
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setDeletingMember(null)}
                disabled={deleting}
                className="flex-1 py-2.5 bg-[#FFF7F2] hover:bg-white dark:bg-[#2a2a2a] border border-[#D8D8D8] text-[#666666] rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={deleting}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-rose-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
