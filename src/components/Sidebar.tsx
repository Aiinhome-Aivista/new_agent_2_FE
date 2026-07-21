import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
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
} from "lucide-react";

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
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

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b0e17] text-gray-200">
      {/* Brand Logo Header */}
      <div className="px-6 py-6 border-b border-white/5 flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl shadow-lg shadow-teal-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-teal-300">
          ACSE Portal
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-4 py-6 space-y-7 overflow-y-auto">
        <div className="space-y-1.5">
          <span className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
            General
          </span>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(link.to)
                  ? "bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-500/20 text-teal-400 font-semibold"
                  : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Project Specific Actions (Contextual Submenu) */}
        {projectId && (
          <div className="space-y-1.5 border-t border-white/5 pt-6 animate-fadeIn">
            <div className="flex items-center justify-between px-3 mb-2">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Project Panel
              </span>
              <Link
                to="/projects"
                className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> List
              </Link>
            </div>

            <Link
              to={`/projects/${projectId}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive(`/projects/${projectId}`)
                  ? "bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-500/20 text-teal-400 font-semibold"
                  : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <Briefcase className="w-5 h-5" />
              Cockpit
            </Link>

            <Link
              to={`/projects/${projectId}/baseline`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("baseline")
                  ? "bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-500/20 text-teal-400 font-semibold"
                  : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <ScrollText className="w-5 h-5" />
              Baseline Review
            </Link>

            <Link
              to={`/projects/${projectId}/tracker`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                isProjectActive("tracker")
                  ? "bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-500/20 text-teal-400 font-semibold"
                  : "hover:bg-white/[0.03] text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <Activity className="w-5 h-5" />
              Risk Tracker
            </Link>
          </div>
        )}
      </div>

      {/* User Section / Bottom Profile */}
      <div className="p-4 border-t border-white/5 bg-[#080b13]">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.02] border border-white/5 mb-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <User className="w-4 h-4 text-teal-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">
              {user.name}
            </p>
            <p className="text-[10px] text-gray-500 truncate">{user.role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/10 hover:border-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98]"
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0b0e17] border-b border-white/5 flex items-center justify-between px-6 z-30">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-lg">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-lg font-bold text-white">
            ACSE
          </span>
        </div>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus:bg-white/5"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-64 border-r border-white/5 z-20">
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
          className={`fixed top-0 left-0 bottom-0 w-64 bg-[#0b0e17] z-50 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
