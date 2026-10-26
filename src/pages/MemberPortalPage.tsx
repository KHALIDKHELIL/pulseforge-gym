import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Flame, Trophy, PlusCircle, CheckSquare } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Member, MemberProgress, WorkoutPlan } from '../types/database';

export const MemberPortalPage: React.FC = () => {
  const [member, setMember] = useState<Member | null>(null);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);
  const [progress, setProgress] = useState<MemberProgress[]>([]);

  const [weightKg, setWeightKg] = useState('76.5');
  const [benchKg, setBenchKg] = useState('95');
  const [squatKg, setSquatKg] = useState('125');
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({});

  const fetchMemberPortal = async () => {
    const { data: mData } = await supabase
      .from('members')
      .select('*')
      .eq('member_code', 'PF-1001')
      .single();

    const activeMember = mData as Member | null;
    if (activeMember) {
      setMember(activeMember);
      const [wRes, pRes] = await Promise.all([
        supabase.from('workout_plans').select('*').eq('member_id', activeMember.id),
        supabase
          .from('member_progress')
          .select('*')
          .eq('member_id', activeMember.id)
          .order('recorded_date', { ascending: false }),
      ]);
      if (wRes.data) setPlans(wRes.data as WorkoutPlan[]);
      if (pRes.data) setProgress(pRes.data as MemberProgress[]);
    }
  };

  useEffect(() => {
    fetchMemberPortal();
  }, []);

  const handleLogProgress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    await supabase.from('member_progress').insert({
      member_id: member.id,
      weight_kg: Number(weightKg),
      body_fat_pct: 14.5,
      bench_press_kg: Number(benchKg),
      squat_kg: Number(squatKg),
      notes: 'Logged via Member Self-Service Portal',
    });

    fetchMemberPortal();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Member Self-Service Portal & QR Pass</h1>
        <p className="text-sm text-slate-400">
          Present your digital QR pass at reception, check off workouts, and log strength PRs.
        </p>
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
            {member?.member_code || 'PF-1001'}
          </p>

          <div className="my-6 p-4 bg-white rounded-2xl shadow-lg">
            <QRCodeSVG value={member?.member_code || 'PF-1001'} size={160} />
          </div>

          <div className="w-full grid grid-cols-2 gap-3 pt-4 border-t border-slate-800 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-400 block">Active Streak</span>
              <span className="font-extrabold text-amber-400 flex items-center justify-center gap-1 mt-0.5">
                <Flame className="w-4 h-4" /> {member?.streak_days || 12} Days
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950">
              <span className="text-slate-400 block">Valid Until</span>
              <span className="font-extrabold text-emerald-400 block mt-0.5">
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
                No custom routine assigned yet. Switch to the Trainer tab to publish a JSONB workout!
              </p>
            ) : (
              plans.map((p) => (
                <div key={p.id} className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-emerald-400">{p.title}</span>
                    <span className="text-xs text-slate-400">{p.goal_focus}</span>
                  </div>
                  <div className="space-y-2">
                    {(p.exercises || []).map((ex, idx) => {
                      const key = `${p.id}-${idx}`;
                      const done = !!completedExercises[key];
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setCompletedExercises((prev) => ({ ...prev, [key]: !done }))
                          }
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition ${
                            done
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 line-through'
                              : 'bg-slate-950 border-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="text-xs font-bold">{ex.name}</span>
                          <span className="text-xs font-mono">
                            {ex.sets} sets × {ex.reps} ({ex.rest})
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
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
                  value={squatKg}
                  onChange={(e) => setSquatKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-4 h-4" /> Save PR
                </button>
              </div>
            </form>

            {progress.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                {progress.slice(0, 3).map((pr) => (
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