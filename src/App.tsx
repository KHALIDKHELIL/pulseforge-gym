import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { LogOut, Dumbbell, ShieldCheck, QrCode, UserCheck, Users } from 'lucide-react';

const MainDashboard: React.FC = () => {
  const { profile, activeRole, setActiveRole, isDemoMode, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation & Evaluator Role Switcher Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-emerald-500/20">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-white">PULSEFORGE</span>
            <span className="text-[10px] uppercase tracking-widest text-emerald-400 block font-semibold">
              {activeRole} Portal {isDemoMode && '(Evaluator Demo)'}
            </span>
          </div>
        </div>

        {/* Persistent 1-Click Role Switcher */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['admin', 'reception', 'trainer', 'member'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setActiveRole(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition flex items-center gap-1.5 ${
                activeRole === r
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {r === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
              {r === 'reception' && <QrCode className="w-3.5 h-3.5" />}
              {r === 'trainer' && <UserCheck className="w-3.5 h-3.5" />}
              {r === 'member' && <Users className="w-3.5 h-3.5" />}
              {r}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{profile?.full_name || 'Gym User'}</p>
            <p className="text-[10px] text-emerald-400 uppercase font-medium">{activeRole}</p>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-slate-300 hover:text-rose-400 border border-slate-700 transition"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-white capitalize tracking-tight">
            {activeRole} Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Connected to Supabase PostgreSQL database. Live operational telemetry ready.
          </p>
        </div>

        {/* Quick KPI Overview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Active Members</p>
            <p className="text-3xl font-black text-white mt-2">248</p>
            <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">+12% this month</span>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Today's Check-Ins</p>
            <p className="text-3xl font-black text-white mt-2">64</p>
            <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">QR Terminal Active</span>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Monthly Revenue</p>
            <p className="text-3xl font-black text-white mt-2">142,500 ETB</p>
            <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">Telebirr & CBE Birr</span>
          </div>
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
            <p className="text-xs font-bold uppercase text-slate-400 tracking-wider">Equipment Health</p>
            <p className="text-3xl font-black text-white mt-2">94.2%</p>
            <span className="text-xs text-amber-400 font-medium mt-1 inline-block">1 Maintenance Due</span>
          </div>
        </div>

        {/* System Status Banner */}
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div>
            <h3 className="text-lg font-bold text-white">PulseForge OS Architecture Active</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              You are currently viewing as <strong className="text-emerald-400 uppercase">{activeRole}</strong>. Use the top navbar role switcher to test Admin, Reception, Trainer, and Member views instantly without re-authenticating.
            </p>
          </div>
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-bold whitespace-nowrap">
              Supabase Connected
            </span>
          </div>
        </div>
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user, isDemoMode, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-400 font-bold">
        Loading PulseForge OS...
      </div>
    );
  }

  if (!user && !isDemoMode) {
    return <LoginPage />;
  }

  return <MainDashboard />;
};

export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;