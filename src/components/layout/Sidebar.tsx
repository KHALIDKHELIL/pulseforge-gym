import React from 'react';
import {
  LayoutDashboard,
  Users,
  QrCode,
  Dumbbell,
  Calendar,
  Wrench,
  IdCard,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/database';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  roles: UserRole[];
  badge?: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Command Center',
    icon: LayoutDashboard,
    roles: ['admin', 'reception'],
  },
  {
    id: 'checkin',
    label: 'QR Check-In Desk',
    icon: QrCode,
    roles: ['admin', 'reception'],
    badge: 'Live',
  },
  {
    id: 'members',
    label: 'Members & Billing',
    icon: Users,
    roles: ['admin', 'reception', 'trainer'],
  },
  {
    id: 'workouts',
    label: 'Trainers & Workouts',
    icon: Dumbbell,
    roles: ['admin', 'trainer'],
  },
  {
    id: 'classes',
    label: 'Class Timetable',
    icon: Calendar,
    roles: ['admin', 'reception', 'trainer', 'member'],
  },
  {
    id: 'equipment',
    label: 'Equipment Health',
    icon: Wrench,
    roles: ['admin', 'trainer'],
  },
  {
    id: 'portal',
    label: 'Member Digital Pass',
    icon: IdCard,
    roles: ['admin', 'member'],
  },
  {
    id: 'ai',
    label: 'Safe AI Coach',
    icon: Sparkles,
    roles: ['admin', 'trainer', 'member'],
    badge: 'Guardrails',
  },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  mobileOpen,
  setMobileOpen,
}) => {
  const { activeRole } = useAuth();

  const filteredItems = NAV_ITEMS.filter((item) => item.roles.includes(activeRole));

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="PulseForge Logo"
              className="w-9 h-9 rounded-xl shadow-lg shadow-emerald-500/20"
            />
            <div>
              <span className="font-extrabold tracking-tight text-white block leading-none">
                PULSEFORGE
              </span>
              <span className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold">
                {activeRole} OS
              </span>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
          <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
            {activeRole} Workspace
          </p>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                  isActive
                    ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-slate-950/20 text-slate-950'
                        : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer Info */}
        <div className="p-4 m-3 rounded-xl bg-slate-950 border border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white">Supabase Live DB</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Telebirr & CBE Birr Payment Gateway Ready
          </p>
        </div>
      </aside>
    </>
  );
};