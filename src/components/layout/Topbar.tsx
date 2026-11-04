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
  Lock,
  ArrowUpRight,
  Wrench,
  CreditCard,
  Calendar,
  AlertTriangle,
  Dumbbell,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { AppNotification, UserRole } from '../../types/database';

interface TopbarProps {
  onOpenMobileMenu: () => void;
  onRoleChangeNavigate: (role: UserRole) => void;
  onNavigateTab: (tab: string) => void;
}

const DEFAULT_ROLE_NOTIFICATIONS: Record<
  Exclude<UserRole, 'admin'>,
  Array<{ title: string; message: string; type: AppNotification['type'] }>
> = {
  member: [
    {
      title: 'Workout Split Ready',
      message:
        'Coach Abebe updated your assigned JSONB training routine. Tap to view and check off your sets.',
      type: 'booking',
    },
    {
      title: 'Class Spot Open',
      message:
        'Morning HIIT Blast (Studio A) has open spots this week. Reserve your mat in 1 click.',
      type: 'booking',
    },
  ],
  trainer: [
    {
      title: 'Client PR Logged',
      message:
        'Dawit Lemma (PF-1001) logged new Bench Press & Squat PRs. Review or adjust his workout split.',
      type: 'booking',
    },
    {
      title: 'Floor Equipment Notice',
      message:
        'Check mechanical health score on Cable Crossover Station (EQ-204) before afternoon sessions.',
      type: 'maintenance',
    },
  ],
  reception: [
    {
      title: 'Front Desk Renewal Watch',
      message:
        'Members with Expiring Soon status may request Telebirr or CBE Birr renewal at check-in.',
      type: 'expiry',
    },
    {
      title: 'QR Check-In Terminal Ready',
      message:
        'Verify active membership passes and prevent duplicate same-day scans at the front desk.',
      type: 'booking',
    },
  ],
};

export const Topbar: React.FC<TopbarProps> = ({
  onOpenMobileMenu,
  onRoleChangeNavigate,
  onNavigateTab,
}) => {
  const { profile, activeRole, setActiveRole, isDemoMode, signOut } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchRoleNotifications = async (role: UserRole) => {
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('target_role', role)
      .order('created_at', { ascending: false })
      .limit(10);

    // If a non-admin role has 0 notifications in Supabase yet, seed 2 role-specific alerts once
    if ((!data || data.length === 0) && role !== 'admin') {
      const seedKey = `pf_seeded_notif_${role}`;
      if (!localStorage.getItem(seedKey)) {
        localStorage.setItem(seedKey, 'true');
        const templates = DEFAULT_ROLE_NOTIFICATIONS[role];
        const rowsToInsert = templates.map((t) => ({
          target_role: role,
          title: t.title,
          message: t.message,
          type: t.type,
          is_read: false,
        }));
        const { data: inserted } = await supabase
          .from('notifications')
          .insert(rowsToInsert)
          .select('*');
        if (inserted) {
          setNotifications(inserted as AppNotification[]);
          return;
        }
      }
    }

    setNotifications((data as AppNotification[]) || []);
  };

  useEffect(() => {
    setShowNotifDropdown(false);
    fetchRoleNotifications(activeRole);
  }, [activeRole]);

  // Only marks the current role's notifications as read
  const markAllRead = async () => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('target_role', activeRole)
      .eq('is_read', false);

    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // Maps each notification to the exact page for that specific role
  const getNotificationDestination = (
    n: AppNotification,
    role: UserRole
  ): { tab: string; label: string } => {
    const titleLower = n.title.toLowerCase();

    if (titleLower.includes('workout') || titleLower.includes('client pr')) {
      return role === 'member'
        ? { tab: 'portal', label: 'Member Digital Pass' }
        : { tab: 'workouts', label: 'Trainers & Workouts' };
    }

    if (titleLower.includes('qr') || titleLower.includes('check-in')) {
      return { tab: 'checkin', label: 'QR Check-In Desk' };
    }

    if (n.type === 'maintenance') {
      if (role === 'admin' || role === 'trainer') {
        return { tab: 'equipment', label: 'Equipment Health' };
      }
      return { tab: role === 'reception' ? 'dashboard' : 'portal', label: 'Workspace' };
    }

    if (n.type === 'booking') {
      return { tab: 'classes', label: 'Class Timetable' };
    }

    if (n.type === 'expiry') {
      if (role === 'member') {
        return { tab: 'portal', label: 'Member Digital Pass' };
      }
      return { tab: 'members', label: 'Members & Billing' };
    }

    if (n.type === 'payment') {
      if (role === 'admin' || role === 'reception') {
        return { tab: 'dashboard', label: 'Command Center' };
      }
      return { tab: 'portal', label: 'Member Portal' };
    }

    return {
      tab: role === 'member' ? 'portal' : role === 'trainer' ? 'workouts' : 'dashboard',
      label: 'Workspace',
    };
  };

  const handleNotificationClick = async (n: AppNotification) => {
    const destination = getNotificationDestination(n, activeRole);

    if (!n.is_read) {
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, is_read: true } : item))
      );
      await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
    }

    setShowNotifDropdown(false);
    onNavigateTab(destination.tab);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleSwitchRole = (role: UserRole) => {
    if (!isDemoMode) return;
    setActiveRole(role);
    onRoleChangeNavigate(role);
  };

  const getTypeIcon = (n: AppNotification) => {
    const titleLower = n.title.toLowerCase();
    if (titleLower.includes('workout') || titleLower.includes('client pr')) {
      return <Dumbbell className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
    }
    switch (n.type) {
      case 'maintenance':
        return <Wrench className="w-3.5 h-3.5 text-rose-400 shrink-0" />;
      case 'payment':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case 'booking':
        return <Calendar className="w-3.5 h-3.5 text-sky-400 shrink-0" />;
      case 'expiry':
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />;
    }
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
            Workspace:{' '}
          </span>
          <span className="text-xs font-extrabold uppercase text-emerald-400">
            {activeRole} {isDemoMode ? '(Evaluator Sandbox)' : '(Authenticated Session)'}
          </span>
        </div>
      </div>

      {/* Show Role Switcher ONLY in Evaluator Demo Mode; show RBAC Lock for real users */}
      {isDemoMode ? (
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
      ) : (
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-950 border border-emerald-500/30 text-xs font-bold text-emerald-400">
          <Lock className="w-3.5 h-3.5" />
          <span className="capitalize">{activeRole} Access Only</span>
        </div>
      )}

      {/* Right Notifications & Profile */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => {
              if (!showNotifDropdown) fetchRoleNotifications(activeRole);
              setShowNotifDropdown(!showNotifDropdown);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 relative transition"
            title={`${activeRole.toUpperCase()} Notifications`}
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifDropdown && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-white block">
                    {activeRole} Alerts
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold capitalize">
                    Filtered for {activeRole} role only
                  </span>
                </div>
                <button
                  onClick={markAllRead}
                  className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <CheckCircle2 className="w-3 h-3" /> Mark all read
                </button>
              </div>
              <div className="mt-3 space-y-2 max-h-80 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    No {activeRole} notifications
                  </p>
                ) : (
                  notifications.map((n) => {
                    const dest = getNotificationDestination(n, activeRole);
                    return (
                      <button
                        key={n.id}
                        type="button"
                        onClick={() => handleNotificationClick(n)}
                        className={`w-full text-left p-3 rounded-xl border text-xs transition group hover:border-emerald-500/50 hover:bg-slate-800/80 ${
                          n.is_read
                            ? 'bg-slate-950/60 border-slate-800/70 text-slate-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            {getTypeIcon(n)}
                            <p className="font-bold text-white group-hover:text-emerald-400 transition">
                              {n.title}
                            </p>
                          </div>
                          {!n.is_read && (
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] font-bold text-emerald-400 opacity-80 group-hover:opacity-100">
                          <span>Open {dest.label}</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </div>
                      </button>
                    );
                  })
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