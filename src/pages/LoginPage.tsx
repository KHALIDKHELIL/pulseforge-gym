import React, { useState } from 'react';
import { Dumbbell, ShieldCheck, QrCode, UserCheck, Users, ArrowRight, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';

export const LoginPage: React.FC = () => {
  const { loginAsDemoRole } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || 'PulseForge User',
              role: selectedRole,
            },
          },
        });
        if (signUpError) throw signUpError;
        setMessage('Account created! Signing you in...');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col lg:flex-row">
      {/* Left Hero Branding Panel */}
      <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white">PULSEFORGE</span>
              <span className="block text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
                Gym Management OS
              </span>
            </div>
          </div>

          <div className="mt-12 lg:mt-20 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Brolf Tech Internship Challenge 2026
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Next-Gen Gym Operations & Member Intelligence.
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              Full-stack PostgreSQL system powering QR check-ins, Telebirr & CBE Birr billing, custom JSONB workout builders, equipment health telemetry, and AI fitness guidance.
            </p>
          </div>
        </div>

        {/* 1-Click Evaluator Demo Bar */}
        <div className="mt-10 bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              1-Click Evaluator Demo Access (No Password Needed)
            </span>
            <span className="text-[11px] text-slate-400">Live Supabase DB Connected</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Click any role below to instantly inspect the platform with live data from Supabase:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => loginAsDemoRole('admin')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Gym Admin</span>
              <span className="text-[10px] text-slate-400">Full Control</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('reception')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <QrCode className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Reception</span>
              <span className="text-[10px] text-slate-400">QR Check-In</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('trainer')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <UserCheck className="w-5 h-5 text-sky-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Trainer</span>
              <span className="text-[10px] text-slate-400">Workouts</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('member')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <Users className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Member</span>
              <span className="text-[10px] text-slate-400">Digital Pass</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Supabase Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16">
        <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white">
            {isSignUp ? 'Create Supabase Account' : 'Sign in to PulseForge'}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {isSignUp
              ? 'Register a new staff or member account in PostgreSQL'
              : 'Enter your email and password or use the 1-Click Demo bar'}
          </p>

          {error && (
            <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}
          {message && (
            <div className="mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              {message}
            </div>
          )}

          <form onSubmit={handleAuth} className="mt-6 space-y-4">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Abebe Bikila"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Account Role
                  </label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  >
                    <option value="admin">Gym Administrator</option>
                    <option value="reception">Reception Staff</option>
                    <option value="trainer">Fitness Trainer</option>
                    <option value="member">Gym Member</option>
                  </select>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pulseforge.gym"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Processing...' : isSignUp ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : "Don't have an account? Register with Supabase Auth"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};