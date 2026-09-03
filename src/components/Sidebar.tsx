import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import {
  LayoutDashboard,
  FolderKanban,
  LogOut,
  ShieldCheck,
  Menu,
  X,
  ArrowLeft,
  Briefcase,
  ScrollText,
  Activity,
  User,
  Users,
  LayoutGrid,
  MessageSquare,
  ShieldAlert,
  Sun,
  Moon,
  CloudDownload,
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  // Close sidebar on path change (useful on mobile)
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  if (!user || location.pathname === "/" || location.pathname === "/login")
    return null;

  const handleLogout = () => {
    // navigate("/");
    logout();
  };

  // Parse project ID if we are inside a project-specific route
  const projectMatch = location.pathname.match(/\/projects\/(\d+)/);
  const projectId = projectMatch ? projectMatch[1] : null;

  const isActive = (path: string) => location.pathname === path;
  const isProjectActive = (path: string) => location.pathname.endsWith(path);

  const navLinks = [
    {
      to: "/dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      to: "/projects",
      label: "Projects",
      icon: <FolderKanban className="w-5 h-5" />,
    },
  ];

  // Only show Cloud Inboxes if user is ADMIN or ENGAGEMENT_MANAGER
  if (user?.role === "ADMIN" || user?.role === "ENGAGEMENT_MANAGER") {
    navLinks.push({
      to: "/drive",
      label: "Cloud Inboxes",
      icon: <CloudDownload className="w-5 h-5" />,
    });
  }

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#4A4A4A] text-white">
      {/* Brand Logo Header */}
      <div className="px-6 py-6 border-b border-white/10 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] rounded-xl shadow-lg shadow-[#FF5A14]/30">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-[#FF7A45]">
          ACSE Portal
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto custom-scrollbar">
        <div className="space-y-1.5">
          <span className="px-3 text-xs font-semibold text-gray-300 uppercase tracking-wider block mb-2">
            General
          </span>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(link.to)
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Project Specific Actions (Contextual Submenu) */}
        {projectId && (
          <div className="space-y-1.5 border-t border-white/10 pt-6 animate-fadeIn">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
                Project Panel
              </span>
              <Link
                to="/projects"
                className="text-xs text-[#FF7A45] hover:text-[#FF8A55] flex items-center gap-1 font-semibold"
              >
                <ArrowLeft className="w-3 h-3" /> List
              </Link>
            </div>

            <Link
              to={`/projects/${projectId}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(`/projects/${projectId}`)
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <LayoutGrid className="w-5 h-5" />
              Overview
            </Link>

            <Link
              to={`/projects/${projectId}/members`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("members")
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <Users className="w-5 h-5" />
              Project Members
            </Link>

            <Link
              to={`/projects/${projectId}/cockpit`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("cockpit")
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Document Cockpit
            </Link>

            <Link
              to={`/projects/${projectId}/baseline`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("baseline")
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <ScrollText className="w-5 h-5" />
              Baseline Review
            </Link>

            <Link
              to={`/projects/${projectId}/tracker`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("tracker")
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <Activity className="w-5 h-5" />
              Risk Tracker
            </Link>

            <Link
              to={`/projects/${projectId}/assistant`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("assistant")
                  ? "bg-[#FF7A45] border border-[#FF8A55] text-white font-bold shadow-md shadow-[#FF5A14]/20"
                  : "hover:bg-white/10 text-gray-200 hover:text-white border border-transparent"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              AI Assistant
            </Link>
          </div>
        )}
      </div>

      {/* User Section / Bottom Profile */}
      <div className="p-4 border-t border-white/10 bg-[#3d3d3d]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-[#4A4A4A] border border-white/10 mb-3">
          <div className="p-2 bg-[#FF5A14]/20 rounded-lg">
            <User className="w-4 h-4 text-[#FF7A45]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-gray-300 truncate">{user.role}</p>
          </div>
        </div>
        <div className="flex gap-2 mb-3">
          <button
            onClick={() =>
              setTheme(resolvedTheme === "dark" ? "light" : "dark")
            }
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#4A4A4A] hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] text-gray-200 hover:text-white"
          >
            {resolvedTheme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
            {resolvedTheme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 text-rose-300 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#4A4A4A] text-white border-b border-white/10 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">
            ACSE
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-text-secondary hover:text-text-primary rounded-lg focus:outline-none focus:bg-bg-hover"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-64 border-r border-border-subtle z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div
        className={`md:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer container */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 bg-bg-panel z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
