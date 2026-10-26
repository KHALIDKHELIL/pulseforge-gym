import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { UserRole } from '../../types/database';

interface AppLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  activeTab,
  setActiveTab,
  children,
}) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleRoleChangeNavigate = (role: UserRole) => {
    if (role === 'admin') setActiveTab('dashboard');
    if (role === 'reception') setActiveTab('checkin');
    if (role === 'trainer') setActiveTab('workouts');
    if (role === 'member') setActiveTab('portal');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Topbar
          onOpenMobileMenu={() => setMobileOpen(true)}
          onRoleChangeNavigate={handleRoleChangeNavigate}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
};