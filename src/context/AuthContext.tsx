import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, UserRole } from '../types/database';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  activeRole: UserRole;
  isDemoMode: boolean;
  loading: boolean;
  setActiveRole: (role: UserRole) => void;
  loginAsDemoRole: (role: UserRole) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_PROFILES: Record<UserRole, Profile> = {
  admin: {
    id: 'demo-admin-id',
    full_name: 'Yohannes Tadesse (Admin)',
    email: 'admin@pulseforge.gym',
    phone: '+251911000001',
    role: 'admin',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  reception: {
    id: 'demo-reception-id',
    full_name: 'Meron Alemu (Front Desk)',
    email: 'reception@pulseforge.gym',
    phone: '+251911000002',
    role: 'reception',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  trainer: {
    id: 'demo-trainer-id',
    full_name: 'Coach Abebe Bekele',
    email: 'abebe@pulseforge.gym',
    phone: '+251911223344',
    role: 'trainer',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
  member: {
    id: 'demo-member-id',
    full_name: 'Dawit Lemma (PF-1001)',
    email: 'dawit@gmail.com',
    phone: '+251912345678',
    role: 'member',
    avatar_url: null,
    created_at: new Date().toISOString(),
  },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeRole, setActiveRole] = useState<UserRole>('admin');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchProfile = async (userId: string, userEmail?: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setProfile(data as Profile);
      setActiveRole((data.role as UserRole) || 'member');
    } else {
      const fallbackRole: UserRole = 'admin';
      setProfile({
        id: userId,
        full_name: userEmail?.split('@')[0] || 'Gym User',
        email: userEmail || null,
        phone: null,
        role: fallbackRole,
        avatar_url: null,
        created_at: new Date().toISOString(),
      });
      setActiveRole(fallbackRole);
    }
  };

  useEffect(() => {
    const savedDemoRole = localStorage.getItem('pf_demo_role') as UserRole | null;
    if (savedDemoRole && DEMO_PROFILES[savedDemoRole]) {
      setIsDemoMode(true);
      setActiveRole(savedDemoRole);
      setProfile(DEMO_PROFILES[savedDemoRole]);
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsDemoMode(false);
        localStorage.removeItem('pf_demo_role');
        fetchProfile(session.user.id, session.user.email);
      } else if (!localStorage.getItem('pf_demo_role')) {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    if (isDemoMode) {
      setProfile(DEMO_PROFILES[role]);
      localStorage.setItem('pf_demo_role', role);
    }
  };

  const loginAsDemoRole = (role: UserRole) => {
    setIsDemoMode(true);
    setActiveRole(role);
    setProfile(DEMO_PROFILES[role]);
    localStorage.setItem('pf_demo_role', role);
  };

  const signOut = async () => {
    localStorage.removeItem('pf_demo_role');
    setIsDemoMode(false);
    setProfile(null);
    setUser(null);
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        activeRole,
        isDemoMode,
        loading,
        setActiveRole: handleRoleSwitch,
        loginAsDemoRole,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};