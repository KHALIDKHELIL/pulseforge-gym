import React, { useState } from 'react';
import {
  ShieldCheck,
  QrCode,
  UserCheck,
  Users,
  ArrowRight,
  Sparkles,
  Lock,
  KeyRound,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/database';

interface RealTestAccount {
  label: string;
  role: UserRole;
  email: string;
  password: string;
  fullName: string;
  phone: string;
}

const REAL_AUTH_ACCOUNTS: RealTestAccount[] = [
  {
    label: 'Real Admin Auth',
    role: 'admin',
    email: 'admin.auth@pulseforge.gym',
    password: 'Password123!',
    fullName: 'Yohannes Tadesse (Admin)',
    phone: '+251911000001',
  },
  {
    label: 'Real Reception Auth',
    role: 'reception',
    email: 'reception.auth@pulseforge.gym',
    password: 'Password123!',
    fullName: 'Meron Alemu (Reception)',
    phone: '+251911000002',
  },
  {
    label: 'Real Trainer Auth',
    role: 'trainer',
    email: 'abebe@pulseforge.gym',
    password: 'Password123!',
    fullName: 'Coach Abebe Bekele',
    phone: '+251911223344',
  },
  {
    label: 'Real Member (Dawit)',
    role: 'member',
    email: 'dawit@gmail.com',
    password: 'Password123!',
    fullName: 'Dawit Lemma',
    phone: '+251912345678',
  },
];

export const LoginPage: React.FC = () => {
  const { loginAsDemoRole } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('+2519');
  const [selectedRole, setSelectedRole] = useState<UserRole>('member');
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const ensureMemberRecordExists = async (
    userId: string,
    userEmail: string,
    name: string,
    userPhone: string
  ) => {
    const { data: existing } = await supabase
      .from('members')
      .select('id, user_id')
      .ilike('email', userEmail)
      .maybeSingle();

    if (existing) {
      if (!existing.user_id) {
        await supabase.from('members').update({ user_id: userId }).eq('id', existing.id);
      }
      return;
    }

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);
    const randomCode = `PF-${Math.floor(1010 + Math.random() * 8900)}`;

    await supabase.from('members').insert({
      user_id: userId,
      member_code: randomCode,
      full_name: name || userEmail.split('@')[0],
      email: userEmail,
      phone: userPhone,
      plan_tier: 'Pro',
      status: 'Active',
      expiry_date: expiry.toISOString().split('T')[0],
      fitness_goal: 'General Fitness & Strength',
      streak_days: 1,
    });
  };

  // One-click real Supabase JWT login (auto-provisions the account if not created yet)
  const handleRealAccountLogin = async (acct: RealTestAccount) => {
    setError(null);
    setMessage(`Authenticating ${acct.email} (${acct.role.toUpperCase()}) via Supabase Auth...`);
    setEmail(acct.email);
    setPassword(acct.password);
    setLoading(true);

    try {
      // 1. Try signing in first
      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email: acct.email,
          password: acct.password,
        });

      if (!signInError && signInData.user) {
        await supabase.from('profiles').upsert({
          id: signInData.user.id,
          full_name: acct.fullName,
          email: acct.email,
          phone: acct.phone,
          role: acct.role,
        });
        if (acct.role === 'member') {
          await ensureMemberRecordExists(
            signInData.user.id,
            acct.email,
            acct.fullName,
            acct.phone
          );
        }
        return;
      }

      // 2. If account doesn't exist yet in auth.users, register it and sign in
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: acct.email,
        password: acct.password,
        options: {
          data: {
            full_name: acct.fullName,
            phone: acct.phone,
            role: acct.role,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (signUpData.user) {
        await supabase.from('profiles').upsert({
          id: signUpData.user.id,
          full_name: acct.fullName,
          email: acct.email,
          phone: acct.phone,
          role: acct.role,
        });
        if (acct.role === 'member') {
          await ensureMemberRecordExists(
            signUpData.user.id,
            acct.email,
            acct.fullName,
            acct.phone
          );
        }
      }

      // Ensure session is active
      if (!signUpData.session) {
        const { error: retryErr } = await supabase.auth.signInWithPassword({
          email: acct.email,
          password: acct.password,
        });
        if (retryErr) throw retryErr;
      }
    } catch (err: any) {
      setError(
        err.message ||
          'Authentication failed. Make sure you ran the auto-confirm SQL script in Supabase.'
      );
      setMessage(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setLoading(true);

    try {
      if (isSignUp) {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || 'PulseForge User',
              phone: phone.trim(),
              role: selectedRole,
            },
          },
        });
        if (signUpError) throw signUpError;

        if (signUpData.user) {
          await supabase.from('profiles').upsert({
            id: signUpData.user.id,
            full_name: fullName.trim() || email.split('@')[0],
            email: email.trim(),
            phone: phone.trim(),
            role: selectedRole,
          });

          if (selectedRole === 'member') {
            await ensureMemberRecordExists(
              signUpData.user.id,
              email.trim(),
              fullName.trim(),
              phone.trim()
            );
          }
        }

        if (!signUpData.session) {
          await supabase.auth.signInWithPassword({
            email: email.trim(),
            password,
          });
        }

        setMessage('Account created and locked to your assigned role!');
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
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
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.svg"
              alt="PulseForge Logo"
              className="w-12 h-12 rounded-2xl shadow-lg shadow-emerald-500/20"
            />
            <div>
              <span className="text-xl font-black tracking-tight text-white">PULSEFORGE</span>
              <span className="block text-[10px] uppercase tracking-widest text-emerald-400 font-semibold">
                Gym Management OS
              </span>
            </div>
          </div>

          <div className="mt-12 lg:mt-16 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              Brolf Tech Internship Challenge 2026
            </div>
            <h1 className="text-3xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Next-Gen Gym Operations & Member Intelligence.
            </h1>
            <p className="mt-4 text-slate-400 text-base leading-relaxed">
              Full-stack PostgreSQL system powering QR check-ins, Telebirr & CBE Birr billing, custom JSONB workout builders, equipment health telemetry, and Gemini AI fitness coaching.
            </p>
          </div>
        </div>

        {/* 1-Click Evaluator Sandbox Bar */}
        <div className="mt-10 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Evaluator Sandbox Mode (Unlocked Role Switcher)
            </span>
            <span className="text-[11px] text-slate-400">Demo Session</span>
          </div>
          <p className="text-xs text-slate-400 mb-4">
            Use Sandbox Mode to freely switch between roles in the top bar, or use the <strong>Real Supabase Auth</strong> login on the right to test strict single-role isolation:
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => loginAsDemoRole('admin')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Gym Admin</span>
              <span className="text-[10px] text-slate-400">Sandbox</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('reception')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <QrCode className="w-5 h-5 text-amber-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Reception</span>
              <span className="text-[10px] text-slate-400">Sandbox</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('trainer')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <UserCheck className="w-5 h-5 text-sky-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Trainer</span>
              <span className="text-[10px] text-slate-400">Sandbox</span>
            </button>
            <button
              type="button"
              onClick={() => loginAsDemoRole('member')}
              className="flex flex-col items-center p-3 rounded-xl bg-slate-800/80 hover:bg-emerald-500/20 border border-slate-700 hover:border-emerald-500/50 transition group"
            >
              <Users className="w-5 h-5 text-purple-400 mb-1 group-hover:scale-110 transition" />
              <span className="text-xs font-bold text-white">Member</span>
              <span className="text-[10px] text-slate-400">Sandbox</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Supabase Auth Form */}
      <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
        <div className="w-full max-w-md bg-slate-900/70 border border-slate-800 rounded-2xl p-8 shadow-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              {isSignUp ? 'Register Role Account' : 'Authenticated Sign In'}
            </h2>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold flex items-center gap-1">
              <Lock className="w-3 h-3" /> Strict RBAC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real Supabase JWT sessions strictly lock navigation and data to the user's assigned role.
          </p>

          {/* Instant Real Supabase Auth Role Verification Buttons */}
          <div className="mt-5 p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5" /> Test Real Locked Auth Sessions:
              </span>
              <span className="text-[10px] text-slate-500 font-mono">Pass: Password123!</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {REAL_AUTH_ACCOUNTS.map((acct) => (
                <button
                  key={acct.role}
                  type="button"
                  disabled={loading}
                  onClick={() => handleRealAccountLogin(acct)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-emerald-500/15 border border-slate-800 hover:border-emerald-500/40 text-left transition disabled:opacity-50"
                >
                  <span className="text-xs font-bold text-white block">{acct.label}</span>
                  <span className="text-[10px] text-slate-400 font-mono truncate block">
                    {acct.email}
                  </span>
                </button>
              ))}
            </div>
          </div>

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

          <form onSubmit={handleAuth} className="mt-5 space-y-3.5">
            {isSignUp && (
              <>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Abebe Bikila"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                      Assigned Role
                    </label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
                    >
                      <option value="member">Gym Member</option>
                      <option value="trainer">Fitness Trainer</option>
                      <option value="reception">Reception Staff</option>
                      <option value="admin">Gym Administrator</option>
                    </select>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@pulseforge.gym"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Password
              </label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : isSignUp ? 'Create Locked Account' : 'Sign In'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="mt-5 pt-4 border-t border-slate-800 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-xs text-emerald-400 hover:underline font-medium"
            >
              {isSignUp
                ? 'Already have an account? Sign In'
                : 'Want to register a custom email & role? Click here'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};