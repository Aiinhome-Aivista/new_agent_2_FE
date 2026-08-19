import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import apiClient from "../api/apiClient";
import { API_ENDPOINTS } from "../api/endpoints";
import { Eye, EyeOff, ArrowLeft, UserCheck } from "lucide-react";

const personas = [
  {
    role: "Engagement Manager / Partner",
    email: "manager@example.com",
    password: "password123",
    initial: "EM",
    bg: "hover:bg-teal-500/5 hover:border-teal-500/30",
    badgeBg:
      "bg-teal-500/10 text-teal-600 dark:text-teal-300 border-teal-500/20",
  },
  {
    role: "Project Lead / Delivery Manager",
    email: "lead@example.com",
    password: "password123",
    initial: "PL",
    bg: "hover:bg-blue-500/5 hover:border-blue-500/30",
    badgeBg: "bg-blue-500/10 text-blue-300 border-blue-500/20",
  },
  {
    role: "PMO / Quality Reviewer",
    email: "reviewer@example.com",
    password: "password123",
    initial: "QR",
    bg: "hover:bg-purple-500/5 hover:border-purple-500/30",
    badgeBg:
      "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20",
  },
  {
    role: "Finance / Commercial",
    email: "finance@example.com",
    password: "password123",
    initial: "FC",
    bg: "hover:bg-amber-500/5 hover:border-amber-500/30",
    badgeBg: "bg-amber-500/10 text-amber-300 border-amber-500/20",
  },
  // {
  //   role: 'Admin',
  //   email: 'admin@example.com',
  //   password: 'admin123',
  //   initial: 'AD',
  //   bg: 'hover:bg-rose-500/5 hover:border-rose-500/30',
  //   badgeBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-300 border-rose-500/20',
  // },
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
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
    <div className="min-h-screen flex items-center justify-center bg-bg-base text-text-primary px-4 py-12 relative overflow-hidden">
      {/* Decorative Glow Bubbles */}
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#FF5A14]/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] rounded-full bg-[#FF7A45]/10 blur-[120px] pointer-events-none" />

      {/* Back Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-text-muted hover:text-text-primary bg-bg-hover hover:bg-white/10 px-4 py-2 border border-[#D8D8D8] hover:border-[#FF8A55] rounded-xl transition-all duration-300 font-medium text-sm group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        Back to Home
      </Link>

      <div className="max-w-md w-full bg-bg-card p-8 rounded-2xl shadow-2xl border border-[#D8D8D8] backdrop-blur-md relative z-10 flex flex-col">
        <div>
          <h2 className="font-display text-3xl font-extrabold text-center mb-6 bg-clip-text text-transparent bg-gradient-to-r from-[#FF5A14] via-[#FF7A45] to-[#4A4A4A]">
            ACSE Portal
          </h2>

          {error && (
            <div className="mb-4 p-3 bg-rose-900/30 border border-rose-500/30 rounded-xl text-rose-200 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] text-[#666666] placeholder-[#B0B0B0] transition-all duration-300"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-muted mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full px-4 py-3 bg-[#FFF7F2] border border-[#D8D8D8] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#FF8A55]/50 focus:border-[#FF8A55] text-[#666666] pr-12 transition-all duration-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-text-muted hover:text-text-primary transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 bg-[#FF7A45] hover:bg-[#F56B2F] disabled:opacity-50 text-white font-bold rounded-xl transition-all duration-300 shadow-lg shadow-[#FF5A14]/20 active:scale-[0.98] cursor-pointer"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>

        {/* Compact Persona Selector Section */}
        <div className="mt-8 pt-6 border-t border-border-strong">
          <div className="flex items-center gap-2 mb-3">
            <UserCheck className="w-4 h-4 text-[#fd5108]" />
            <span className="text-xs font-semibold text-text-secondary">
              Quick Login Personas
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
                  className={`text-left p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 group cursor-pointer ${
                    isSelected
                      ? "bg-white/[0.06] border-[#fd5108]/50 shadow-md shadow-[#fd5108]/10 scale-[1.01]"
                      : "bg-bg-base border-border-subtle " + p.bg
                  } ${p.email === "admin@example.com" ? "col-span-2" : ""}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-[10px] border transition-all duration-300 shrink-0 ${
                      isSelected
                        ? "bg-[#fd5108]/20 text-[#fd5108] border-[#fd5108]/40 scale-105"
                        : p.badgeBg + " group-hover:scale-105"
                    }`}
                  >
                    {p.initial}
                  </div>
                  <div className="overflow-hidden">
                    <div className="font-semibold text-[11px] text-text-primary group-hover:text-text-primary transition-colors truncate">
                      {p.role.split(" / ")[0]}
                    </div>
                    <div className="text-[9px] text-text-muted group-hover:text-text-muted transition-colors truncate mt-0.5">
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
