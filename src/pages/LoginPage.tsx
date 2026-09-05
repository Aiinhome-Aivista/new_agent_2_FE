import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { useTheme } from "../context/ThemeContext";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  UserCheck, 
  ShieldCheck, 
  Mail, 
  Lock, 
  Sun, 
  Moon,
  AlertCircle
} from "lucide-react";

const personas = [
  {
    role: "Engagement Manager",
    subrole: "Partner",
    email: "manager@example.com",
    password: "password123",
    initial: "EM",
    badgeBg: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  {
    role: "Project Lead",
    subrole: "Delivery Manager",
    email: "lead@example.com",
    password: "password123",
    initial: "PL",
    badgeBg: "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  {
    role: "PMO",
    subrole: "Quality Reviewer",
    email: "reviewer@example.com",
    password: "password123",
    initial: "QR",
    badgeBg: "bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30",
  },
  {
    role: "Finance",
    subrole: "Commercial",
    email: "finance@example.com",
    password: "password123",
    initial: "FC",
    badgeBg: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || "/dashboard";

  const handlePersonaSelect = (pEmail: string, pPass: string) => {
    setEmail(pEmail);
    setPassword(pPass);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.AUTH.LOGIN, {
        email,
        password,
      });
      if (res.data.success) {
        login(res.data.data.access_token, res.data.data.user);
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      setError(
        err.response?.data?.detail ||
          "Login failed. Please check your credentials.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg-base text-text-primary px-4 py-12 relative overflow-hidden transition-colors duration-300">
      {/* Decorative Glow Bubbles */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF5A14]/15 dark:bg-[#FF5A14]/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF7A45]/15 dark:bg-[#FF7A45]/10 blur-[130px] pointer-events-none" />

      {/* Decorative Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-6 left-6 right-6 md:left-8 md:right-8 lg:left-12 lg:right-12 flex items-center justify-between z-20 pointer-events-auto">
        <Link
          to="/"
          className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300 hover:text-[#FF5A14] dark:hover:text-white bg-[#FFF7F2] hover:bg-[#ffefe5] dark:bg-zinc-900/90 dark:hover:bg-zinc-800 px-4 py-2 border border-[#E5E5E5] dark:border-zinc-800 hover:border-[#FF8A55] rounded-xl transition-all duration-200 font-medium text-xs shadow-sm backdrop-blur-md group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Theme Switch Toggle */}
        <button
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          className="px-3.5 py-2 rounded-xl bg-[#FFF7F2] hover:bg-[#ffefe5] dark:bg-zinc-900/90 dark:hover:bg-zinc-800 border border-[#E5E5E5] dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[#FF5A14] transition-all duration-200 shadow-sm active:scale-95 cursor-pointer flex items-center gap-2 text-xs font-semibold backdrop-blur-md"
          title={`Switch to ${resolvedTheme === "dark" ? "Light" : "Dark"} mode`}
        >
          {resolvedTheme === "dark" ? (
            <>
              <Sun className="w-4 h-4 text-amber-400" />
              <span>Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#FF5A14]" />
              <span>Dark</span>
            </>
          )}
        </button>
      </div>

      {/* Card Container */}
      <div className="max-w-[480px] w-full bg-white/95 dark:bg-[#18181b]/95 p-7 sm:p-8 rounded-2xl shadow-2xl dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)] border border-zinc-200/80 dark:border-zinc-800/90 backdrop-blur-xl relative z-10 flex flex-col">
        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 bg-gradient-to-tr from-[#FF5A14] to-[#FF7A45] rounded-2xl flex items-center justify-center shadow-lg shadow-[#FF5A14]/30 ring-4 ring-[#FF5A14]/10">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-[#FF5A14] via-[#FF7A45] to-[#FFA366]">
            ACSE Portal
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Sign in to access your contract deliverables & audits
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-600 dark:text-rose-400 text-sm flex items-start gap-2.5 animate-fade-in-up">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 focus:border-[#FF5A14] dark:focus:border-[#FF7A45] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm transition-all duration-200"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <input
                type={showPassword ? "text" : "password"}
                required
                className="w-full pl-10 pr-11 py-2.5 bg-zinc-50/80 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF5A14]/30 focus:border-[#FF5A14] dark:focus:border-[#FF7A45] text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-600 text-sm transition-all duration-200"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-[#FF5A14] to-[#FF7A45] hover:from-[#F56B2F] hover:to-[#FF5A14] disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-[#FF5A14]/25 hover:shadow-orange-500/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] cursor-pointer flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Signing in...</span>
              </div>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        {/* Compact Persona Selector Section */}
        <div className="mt-7 pt-5 border-t border-zinc-200 dark:border-zinc-800/80">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#FF5A14]" />
              <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                Quick Login Personas
              </span>
            </div>
            <span className="text-[10px] text-zinc-400 dark:text-zinc-500">
              Click to autofill
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {personas.map((p) => {
              const isSelected = email === p.email;
              return (
                <button
                  key={p.email}
                  type="button"
                  onClick={() => handlePersonaSelect(p.email, p.password)}
                  className={`text-left p-2.5 rounded-xl border transition-all duration-200 flex items-center gap-2.5 group cursor-pointer ${
                    isSelected
                      ? "bg-[#FF5A14]/10 dark:bg-[#FF5A14]/15 border-[#FF5A14] ring-1 ring-[#FF5A14]/50 shadow-md shadow-[#FF5A14]/10 scale-[1.01]"
                      : "bg-zinc-50/70 dark:bg-zinc-900/60 hover:bg-zinc-100/90 dark:hover:bg-zinc-800/80 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700"
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border transition-all duration-200 shrink-0 ${
                      isSelected
                        ? "bg-[#FF5A14] text-white border-[#FF5A14] shadow-sm shadow-[#FF5A14]/30"
                        : p.badgeBg + " group-hover:scale-105"
                    }`}
                  >
                    {p.initial}
                  </div>
                  <div className="overflow-hidden min-w-0">
                    <div className="font-semibold text-xs text-zinc-900 dark:text-zinc-100 group-hover:text-[#FF5A14] dark:group-hover:text-[#FFA366] transition-colors truncate">
                      {p.role}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors truncate font-mono mt-0.5">
                      {p.email}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
