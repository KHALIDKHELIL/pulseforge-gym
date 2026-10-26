import React, { useEffect, useState } from 'react';
import {
  Bell,
  LogOut,
  Menu,
  ShieldCheck,
  QrCode,
  UserCheck,
  Users,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppNotification, UserRole } from '../../types/database';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onRoleChangeNavigate: (role: UserRole) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onRoleChangeNavigate,
}) => {
  const { profile, activeRole, setActiveRole, isDemoMode, signOut } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(8);
    if (data) setNotifications(data as AppNotification[]);
  };

  useEffect(() => {
    fetchNotifications();
  }, [activeRole]);

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('is_read', false);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSwitchRole = (role: UserRole) => {
    setActiveRole(role);
    onRoleChangeNavigate(role);
  };

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden sm:block">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active Role View:{' '}
          </span>
          <span className="text-xs font-extrabold uppercase text-emerald-400">
            {activeRole} {isDemoMode && '(Evaluator Demo)'}
          </span>
        </div>
      </div>

      {/* Persistent 1-Click Evaluator Role Switcher */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
        {(['admin', 'reception', 'trainer', 'member'] as const).map((r) => (
          <button
            key={r}
            onClick={() => handleSwitchRole(r)}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition flex items-center gap-1.5 ${
              activeRole === r
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {r === 'admin' && <ShieldCheck className="w-3.5 h-3.5" />}
            {r === 'reception' && <QrCode className="w-3.5 h-3.5" />}
            {r === 'trainer' && <UserCheck className="w-3.5 h-3.5" />}
            {r === 'member' && <Users className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{r}</span>
          </button>
        ))}
      </div>

      {/* Right Notifications & Profile */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown(!showNotifDropdown)}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-white">
                  System Alerts
                </span>
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark all read
                </button>
              </div>
              <div className="mt-3 space-y-2.5 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">No notifications</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl border text-xs ${
                        n.is_read
                          ? 'bg-slate-950/50 border-slate-800/60 text-slate-400'
                          : 'bg-emerald-500/5 border-emerald-500/30 text-slate-200'
                      }`}
                    >
                      <p className="font-bold text-white">{n.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="text-right hidden sm:block">
          <p className="text-xs font-bold text-white leading-tight">
            {profile?.full_name || 'Gym User'}
          </p>
          <p className="text-[10px] text-emerald-400 uppercase font-semibold">{activeRole}</p>
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
  );
};