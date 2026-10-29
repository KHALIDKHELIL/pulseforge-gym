import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Flame, Trophy, PlusCircle, CheckSquare, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Member, MemberProgress, WorkoutPlan } from '../types/database';
import { useAuth } from '../context/AuthContext';

export const MemberPortalPage: React.FC = () => {
  const { activeRole, user } = useAuth();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedCode, setSelectedCode] = useState<string>('PF-1001');
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [progress, setProgress] = useState<MemberProgress[]>([]);
  const [bookedClassesCount, setBookedClassesCount] = useState<number>(0);

  const [weightKg, setWeightKg] = useState('76.5');
  const [benchKg, setBenchKg] = useState('95');
  const [squatKg, setSquatKg] = useState('125');

  const fetchAllMembers = async () => {
    const { data } = await supabase.from('members').select('*').order('member_code');
    if (data) {
      const list = data as Member[];
      setMembers(list);
      // If a real authenticated member logs in, lock to their email/user_id match
      if (user?.email) {
        const matched = list.find(
          (m) => m.email?.toLowerCase() === user.email?.toLowerCase() || m.user_id === user.id
        );
        if (matched) setSelectedCode(matched.member_code);
      }
    }
  };

  const fetchMemberPortal = async (code: string) => {
    const { data: mData } = await supabase
      .from('members')
      .select('*')
      .eq('member_code', code)
      .single();

    const activeMember = mData as Member | null;
    if (activeMember) {
      setMember(activeMember);
      const [wRes, pRes, bRes] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('member_id', activeMember.id),
        supabase
          .from('member_progress')
          .select('*')
          .eq('member_id', activeMember.id)
          .order('recorded_date', { ascending: false }),
        supabase.from('class_bookings').select('id').eq('member_id', activeMember.id),
      ]);
      if (wRes.data) setPlans(wRes.data as WorkoutPlan[]);
      if (pRes.data) setProgress(pRes.data as MemberProgress[]);
      setBookedClassesCount(bRes.data?.length || 0);
    }
  };

  useEffect(() => {
    fetchAllMembers();
  }, [user]);

  useEffect(() => {
    fetchMemberPortal(selectedCode);
  }, [selectedCode]);

  const handleToggleExerciseComplete = async (plan: WorkoutPlan, exIndex: number) => {
    const updatedExercises = (plan.exercises || []).map((ex, idx) =>
      idx === exIndex ? { ...ex, completed: !ex.completed } : ex
    );

    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, exercises: updatedExercises } : p))
    );

    await supabase
      .from('workout_plans')
      .update({ exercises: updatedExercises })
      .eq('id', plan.id);
  };

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;
    const w = Number(weightKg);
    const b = Number(benchKg);
    const s = Number(squatKg);
    if (w <= 25 || b < 0 || s < 0) return;

    await supabase.from('member_progress').insert({
      member_id: member.id,
      weight_kg: w,
      body_fat_pct: 14.5,
      bench_press_kg: b,
      squat_kg: s,
      notes: 'Logged via Member Self-Service Portal',
    });

    fetchMemberPortal(selectedCode);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Member Self-Service Portal & QR Pass</h1>
          <p className="text-sm text-slate-400">
            Present your personal digital QR pass at reception, check off workouts, and log strength PRs.
          </p>
        </div>

        {/* Only Admin can switch between different members' passes; Members see only their own */}
        {activeRole === 'admin' && (
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 self-start">
            <span className="text-xs text-slate-400 font-bold">Inspect Pass:</span>
            <select
              value={selectedCode}
              onChange={(e) => setSelectedCode(e.target.value)}
              className="bg-transparent text-xs font-bold text-emerald-400 focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.member_code} className="bg-slate-900 text-white">
                  {m.full_name} ({m.member_code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Digital QR Pass Card */}
        <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-emerald-500/30 flex flex-col items-center text-center shadow-2xl">
          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500 text-slate-950">
            {member?.plan_tier || 'VIP'} Digital Access Pass
          </span>
          <h2 className="text-xl font-black text-white mt-3">
            {member?.full_name || 'Dawit Lemma'}
          </h2>
          <p className="text-xs font-mono text-emerald-400 font-bold">
            {member?.member_code || 'PF-1001'} • {member?.status || 'Active'}
          </p>

          <div className="my-6 p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG value={member?.member_code || 'PF-1001'} size={160} />
          </div>

          <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Streak</span>
              <span className="font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-3.5 h-3.5" /> {member?.streak_days || 0}d
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Classes</span>
              <span className="font-extrabold text-sky-400 flex items-center justify-center gap-1 mt-0.5">
                <Calendar className="w-3.5 h-3.5" /> {bookedClassesCount}
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-400 block text-[10px]">Valid Until</span>
              <span className="font-extrabold text-emerald-400 block mt-0.5 truncate">
                {member?.expiry_date || 'Active'}
              </span>
            </div>
          </div>
        </div>

        {/* Assigned Workout Routine & Progress Logger */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-emerald-400" /> Assigned Training Split
            </h3>
            {plans.length === 0 ? (
              <p className="text-xs text-slate-400">
                No custom routine assigned to {member?.full_name} yet.
              </p>
            ) : (
              <div className="space-y-5">
                {plans.map((p) => (
                  <div key={p.id} className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-emerald-400">{p.title}</span>
                      <span className="text-xs text-slate-400">{p.goal_focus}</span>
                    </div>
                    <div className="space-y-2">
                      {(p.exercises || []).map((ex, idx) => {
                        const done = !!ex.completed;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleToggleExerciseComplete(p, idx)}
                            className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                              done
                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 line-through'
                                : 'bg-slate-950 border-slate-800 text-slate-200 hover:border-slate-700'
                            }`}
                          >
                            <span className="text-xs font-bold">
                              {done ? '✓ ' : ''}
                              {ex.name}
                            </span>
                            <span className="text-xs font-mono">
                              {ex.sets} sets × {ex.reps} ({ex.rest})
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Biometric & Strength Logger */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" /> Log Personal Record & Biometrics
            </h3>
            <form onSubmit={handleLogProgress} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Body Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min={30}
                  max={250}
                  required
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Bench Press (kg)
                </label>
                <input
                  type="number"
                  min={10}
                  max={350}
                  required
                  value={benchKg}
                  onChange={(e) => setBenchKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                  Back Squat (kg)
                </label>
                <input
                  type="number"
                  min={10}
                  max={400}
                  required
                  value={squatKg}
                  onChange={(e) => setSquatKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Save PR
                </button>
              </div>
            </form>

            {progress.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {progress.slice(0, 4).map((pr) => (
                  <div
                    key={pr.id}
                    className="text-xs flex items-center justify-between p-2.5 rounded-xl bg-slate-950"
                  >
                    <span className="text-slate-400">{pr.recorded_date}</span>
                    <span className="font-bold text-white">
                      Weight: {pr.weight_kg}kg | Bench: {pr.bench_press_kg}kg | Squat:{' '}
                      {pr.squat_kg}kg
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};