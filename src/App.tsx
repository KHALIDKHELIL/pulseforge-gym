import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { MembersPage } from './pages/MembersPage';
import { CheckInPage } from './pages/CheckInPage';
import { TrainersWorkoutPage } from './pages/TrainersWorkoutPage';
import { ClassesPage } from './pages/ClassesPage';
import { EquipmentPage } from './pages/EquipmentPage';
import { MemberPortalPage } from './pages/MemberPortalPage';
import { AiAssistantPage } from './pages/AiAssistantPage';
import { UserRole } from './types/database';

const ROLE_DEFAULT_TAB: Record<UserRole, string> = {
  admin: 'dashboard',
  reception: 'checkin',
  trainer: 'workouts',
  member: 'portal',
};

const ROLE_ALLOWED_TABS: Record<UserRole, string[]> = {
  admin: ['dashboard', 'checkin', 'members', 'workouts', 'classes', 'equipment', 'portal', 'ai'],
  reception: ['dashboard', 'checkin', 'members', 'classes'],
  trainer: ['members', 'workouts', 'classes', 'equipment', 'ai'],
  member: ['portal', 'classes', 'ai'],
};

const MainApp: React.FC = () => {
  const { user, activeRole, isDemoMode, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Whenever role changes or user logs in, enforce allowed tabs for that role
  useEffect(() => {
    const allowed = ROLE_ALLOWED_TABS[activeRole] || ['portal'];
    if (!allowed.includes(activeTab)) {
      setActiveTab(ROLE_DEFAULT_TAB[activeRole]);
    }
  }, [activeRole, user, isDemoMode]);

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

  const allowedTabs = ROLE_ALLOWED_TABS[activeRole];
  const safeTab = allowedTabs.includes(activeTab) ? activeTab : ROLE_DEFAULT_TAB[activeRole];

  return (
    <AppLayout activeTab={safeTab} setActiveTab={setActiveTab}>
      {safeTab === 'dashboard' && <AdminDashboard />}
      {safeTab === 'members' && <MembersPage />}
      {safeTab === 'checkin' && <CheckInPage />}
      {safeTab === 'workouts' && <TrainersWorkoutPage />}
      {safeTab === 'classes' && <ClassesPage />}
      {safeTab === 'equipment' && <EquipmentPage />}
      {safeTab === 'portal' && <MemberPortalPage />}
      {safeTab === 'ai' && <AiAssistantPage />}
    </AppLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}

export default App;