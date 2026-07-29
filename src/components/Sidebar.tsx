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
  Users,
  LayoutGrid,
  MessageSquare,
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

  const projectLinks = projectId
    ? [
        {
          to: `/projects/${projectId}`,
          label: "Overview",
          icon: <LayoutGrid className="w-5 h-5" />,
          match: () => isActive(`/projects/${projectId}`),
        },
        {
          to: `/projects/${projectId}/members`,
          label: "Project Members",
          icon: <Users className="w-5 h-5" />,
          match: () => isProjectActive("members"),
        },
        {
          to: `/projects/${projectId}/cockpit`,
          label: "Document Cockpit",
          icon: <Briefcase className="w-5 h-5" />,
          match: () => isProjectActive("cockpit"),
        },
        {
          to: `/projects/${projectId}/baseline`,
          label: "Baseline Review",
          icon: <ScrollText className="w-5 h-5" />,
          match: () => isProjectActive("baseline"),
        },
        {
          to: `/projects/${projectId}/tracker`,
          label: "Risk Tracker",
          icon: <Activity className="w-5 h-5" />,
          match: () => isProjectActive("tracker"),
        },
        {
          to: `/projects/${projectId}/assistant`,
          label: "AI Assistant",
          icon: <MessageSquare className="w-5 h-5" />,
          match: () => isProjectActive("assistant"),
        },
      ]
    : [];

  const activeLinkClasses =
    "bg-gradient-to-r from-teal-500/10 to-blue-600/10 border border-teal-500/20 text-teal-400 font-semibold shadow-[inset_3px_0_0_0_rgb(20_184_166)]";
  const inactiveLinkClasses =
    "hover:bg-white/[0.04] text-gray-400 hover:text-white border border-transparent";

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#070a12] text-gray-200">
      {/* Brand Logo Header */}
      <div className="px-6 py-5 border-b border-transparent flex items-center gap-3">
        <div className="p-2 bg-gradient-to-tr from-teal-500 to-blue-600 rounded-xl shadow-lg shadow-teal-500/20 ring-1 ring-transparent">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-gray-100 to-teal-300">
          ACSE Portal
        </span>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-5 space-y-6 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          <span className="px-3 text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] block mb-2.5">
            General
          </span>
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                isActive(link.to) ? activeLinkClasses : inactiveLinkClasses
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* Project Specific Actions (Contextual Submenu) */}
        {projectId && (
          <div className="space-y-1 border-t border-transparent pt-5">
            <div className="flex items-center justify-between px-3 mb-2.5">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em]">
                Project Panel
              </span>
              <Link
                to="/projects"
                className="text-[10px] text-teal-400 hover:text-teal-300 flex items-center gap-1 font-semibold cursor-pointer transition-colors duration-200"
              >
                <ArrowLeft className="w-3 h-3" /> List
              </Link>
            </div>

            {projectLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  link.match() ? activeLinkClasses : inactiveLinkClasses
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* User Section / Bottom Profile */}
      <div className="p-3 border-t border-transparent bg-[#060911]">
        <div className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-transparent mb-2.5">
          <div className="p-2 bg-teal-500/10 rounded-lg ring-1 ring-teal-500/20">
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
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-950/20 hover:bg-rose-900/30 border border-rose-500/10 hover:border-rose-500/20 text-rose-300 hover:text-rose-200 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] cursor-pointer"
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
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#070a12]/95 backdrop-blur-md border-b border-transparent flex items-center justify-between px-6 z-30">
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
          className="p-2 text-gray-400 hover:text-white rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/50 cursor-pointer transition-colors"
        >
          {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden md:block fixed top-0 left-0 bottom-0 w-64 border-r border-transparent z-20 bg-[#070a12]">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer Sidebar */}
      <div
        className={`md:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
      >
        {/* Backdrop overlay */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />

        {/* Drawer container */}
        <aside
          className={`fixed top-0 left-0 bottom-0 w-64 bg-[#070a12] z-50 transform transition-transform duration-300 ease-out ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          {sidebarContent}
        </aside>
      </div>
    </>
  );
};
