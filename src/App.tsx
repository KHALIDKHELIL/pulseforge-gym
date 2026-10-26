import React, { useState } from 'react';
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

const MainApp: React.FC = () => {
  const { user, isDemoMode, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

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

  return (
    <AppLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <AdminDashboard />}
      {activeTab === 'members' && <MembersPage />}
      {activeTab === 'checkin' && <CheckInPage />}
      {activeTab === 'workouts' && <TrainersWorkoutPage />}
      {activeTab === 'classes' && <ClassesPage />}
      {activeTab === 'equipment' && <EquipmentPage />}
      {activeTab === 'portal' && <MemberPortalPage />}
      {activeTab === 'ai' && <AiAssistantPage />}
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