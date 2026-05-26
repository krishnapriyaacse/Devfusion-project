import React, { useState } from "react";
import { X, Mail, Lock, User, Sparkles, LogIn, ChevronRight, Briefcase, Globe } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User as UserType } from "../types";

interface AuthModalProps {
  onAuthSuccess: (user: UserType) => void;
  onClose?: () => void;
  isOpen: boolean;
}

const INTERESTS_PRESETS = [
  "Tech & AI",
  "Music & Arts",
  "Green Tech",
  "Marketing & Sales",
  "Crypto & Web3",
  "Health & Wellness"
];

export default function AuthModal({ onAuthSuccess, onClose, isOpen }: AuthModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<'organizer' | 'attendee'>('attendee');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(["Tech & AI"]);
  const [linkedin, setLinkedin] = useState("");
  const [github, setGithub] = useState("");
  const [portfolio, setPortfolio] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Interest toggler
  const handleInterestToggle = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(prev => prev.filter(i => i !== interest));
    } else {
      setSelectedInterests(prev => [...prev, interest]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill out all mandatory fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/api/auth/login" : "/api/auth/register";
      const payload = isLogin
        ? { email, password }
        : {
            name,
            email,
            password,
            role,
            interests: selectedInterests,
            linkedin,
            github,
            portfolio
          };

      const resp = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await resp.json();

      if (!resp.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      onAuthSuccess(data.user);
      if (onClose) onClose();
    } catch (err: any) {
      setError(err.message || "An unexpected issue occurred.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: "spring", damping: 25 }}
        className="relative w-full max-w-lg bg-slate-900 border border-slate-850 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[90vh]"
      >
        <div className="p-6 overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-400" />
              <h2 className="text-xl font-display font-bold text-white">
                {isLogin ? "Welcome to EventSphere" : "Create Special Account"}
              </h2>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-950/30 border border-rose-800/40 rounded-xl text-rose-300 text-xs">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name - Register only */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    id="inp-auth-name"
                    type="text"
                    required
                    placeholder="E.g. Emma Watson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-violet-500 hover:border-slate-700"
                  />
                </div>
              </div>
            )}

            {/* Email */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="inp-auth-email"
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-violet-500 hover:border-slate-700"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  id="inp-auth-pass"
                  type="password"
                  required
                  placeholder={isLogin ? "Any password accepted in dev sandbox" : "Choose password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl text-xs pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-violet-500 hover:border-slate-700"
                />
              </div>
            </div>

            {/* Select Role & Networking (Register only) */}
            {!isLogin && (
              <>
                <div className="space-y-2.5">
                  <label className="text-xs font-medium text-slate-300">Account Role</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      id="btn-role-attendee"
                      type="button"
                      onClick={() => setRole("attendee")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        role === "attendee"
                          ? "bg-violet-950/20 border-violet-500 text-violet-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <User className="w-5 h-5 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">Attendee</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Discover, book, Q&A, earn points</div>
                      </div>
                    </button>
                    <button
                      id="btn-role-org"
                      type="button"
                      onClick={() => setRole("organizer")}
                      className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                        role === "organizer"
                          ? "bg-violet-950/20 border-violet-500 text-violet-300"
                          : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                      }`}
                    >
                      <Briefcase className="w-5 h-5 mb-2" />
                      <div>
                        <div className="text-xs font-bold text-slate-200">Organizer</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Host events, view stats, scan & checkin</div>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Interests selection */}
                {role === "attendee" && (
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-300">I am interested in</label>
                    <div className="flex flex-wrap gap-1.5">
                      {INTERESTS_PRESETS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest);
                        return (
                          <button
                            key={interest}
                            type="button"
                            onClick={() => handleInterestToggle(interest)}
                            className={`px-3 py-1.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer ${
                              isSelected
                                ? "bg-violet-500 border-violet-400 text-white"
                                : "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700"
                            }`}
                          >
                            {interest}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Professional Networking Cards info */}
                <div className="space-y-2 border-t border-slate-850 pt-3">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Globe className="w-4 h-4 text-violet-400" />
                    <span className="text-xs font-bold text-slate-300">Professional Networking Card (Smart Matchmaking)</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="space-y-1">
                      <label className="text-slate-400">LinkedIn URL</label>
                      <input
                        id="inp-net-linkedin"
                        type="url"
                        placeholder="https://linkedin.com/in/..."
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-[10px]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-slate-400">GitHub Profile</label>
                      <input
                        id="inp-net-github"
                        type="url"
                        placeholder="https://github.com/..."
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-white text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-medium rounded-xl text-xs hover:from-violet-500 hover:to-indigo-500 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-violet-950/20"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  {isLogin ? "Sign In to EventSphere" : "Complete Registration"}
                </>
              )}
            </button>
          </form>

          {/* Switch link */}
          <div className="mt-5 text-center text-xs">
            <span className="text-slate-400">
              {isLogin ? "New to our platform?" : "Already registered?"}
            </span>{" "}
            <button
              id="btn-auth-toggle-mode"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
              className="text-violet-400 hover:underline font-semibold ml-1 cursor-pointer"
            >
              {isLogin ? "Sign up now" : "Sign in instead"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
