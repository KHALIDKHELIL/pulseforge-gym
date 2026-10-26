import React, { useEffect, useState } from 'react';
import { Dumbbell, Plus, Trash2, CheckCircle2, Star } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ExerciseItem, Member, Trainer, WorkoutPlan } from '../types/database';

export const TrainersWorkoutPage: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [plans, setPlans] = useState<WorkoutPlan[]>([]);

  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [selectedTrainerId, setSelectedTrainerId] = useState('');
  const [planTitle, setPlanTitle] = useState('Upper Body Hypertrophy Block');
  const [goalFocus, setGoalFocus] = useState('Strength & Muscle Mass');
  const [exercises, setExercises] = useState<ExerciseItem[]>([
    { name: 'Barbell Incline Bench Press', sets: 4, reps: '8-10', rest: '90s' },
    { name: 'Weighted Pull-Ups', sets: 4, reps: '8', rest: '90s' },
    { name: 'Seated Dumbbell Shoulder Press', sets: 3, reps: '10-12', rest: '60s' },
  ]);
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    const [tRes, mRes, wRes] = await Promise.all([
      supabase.from('trainers').select('*'),
      supabase.from('members').select('*'),
      supabase.from('workout_plans').select('*').order('created_at', { ascending: false }),
    ]);
    if (tRes.data) {
      setTrainers(tRes.data as Trainer[]);
      if (tRes.data[0] && !selectedTrainerId) setSelectedTrainerId(tRes.data[0].id);
    }
    if (mRes.data) {
      setMembers(mRes.data as Member[]);
      if (mRes.data[0] && !selectedMemberId) setSelectedMemberId(mRes.data[0].id);
    }
    if (wRes.data) setPlans(wRes.data as WorkoutPlan[]);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const addExerciseRow = () => {
    setExercises([...exercises, { name: '', sets: 3, reps: '10', rest: '60s' }]);
  };

  const updateExercise = (index: number, field: keyof ExerciseItem, value: any) => {
    const copy = [...exercises];
    copy[index] = { ...copy[index], [field]: value };
    setExercises(copy);
  };

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleSaveWorkout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMemberId) return;
    setSaving(true);

    await supabase.from('workout_plans').insert({
      member_id: selectedMemberId,
      trainer_id: selectedTrainerId || null,
      title: planTitle,
      goal_focus: goalFocus,
      exercises,
    });

    setSaving(false);
    fetchAll();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Trainer Roster & JSONB Workout Builder</h1>
        <p className="text-sm text-slate-400">
          Assign custom training splits stored as PostgreSQL JSONB arrays directly to member portals.
        </p>
      </div>

      {/* Trainer Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {trainers.map((t) => (
          <div key={t.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400">
                {t.specialty}
              </span>
              <span className="text-xs font-bold text-amber-400 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" /> {t.rating}
              </span>
            </div>
            <h3 className="text-base font-bold text-white mt-3">{t.full_name}</h3>
            <p className="text-xs text-slate-400 mt-1 line-clamp-2">{t.bio}</p>
            <p className="text-[11px] text-slate-500 mt-3">{t.experience_years} yrs experience</p>
          </div>
        ))}
      </div>

      {/* Workout Builder Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form
          onSubmit={handleSaveWorkout}
          className="lg:col-span-2 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white">Author New Member Routine</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Assign to Member
              </label>
              <select
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.member_code})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Lead Coach
              </label>
              <select
                value={selectedTrainerId}
                onChange={(e) => setSelectedTrainerId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              >
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Program Title
              </label>
              <input
                type="text"
                required
                value={planTitle}
                onChange={(e) => setPlanTitle(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Goal Focus
              </label>
              <input
                type="text"
                required
                value={goalFocus}
                onChange={(e) => setGoalFocus(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
              />
            </div>
          </div>

          {/* Dynamic Exercises List */}
          <div className="space-y-2.5 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-slate-400">Exercises (JSONB)</span>
              <button
                type="button"
                onClick={addExerciseRow}
                className="text-xs font-bold text-emerald-400 flex items-center gap-1 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" /> Add Exercise
              </button>
            </div>

            {exercises.map((ex, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  required
                  placeholder="Exercise name"
                  value={ex.name}
                  onChange={(e) => updateExercise(i, 'name', e.target.value)}
                  className="col-span-5 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="number"
                  placeholder="Sets"
                  value={ex.sets}
                  onChange={(e) => updateExercise(i, 'sets', Number(e.target.value))}
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Reps"
                  value={ex.reps}
                  onChange={(e) => updateExercise(i, 'reps', e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <input
                  type="text"
                  placeholder="Rest"
                  value={ex.rest}
                  onChange={(e) => updateExercise(i, 'rest', e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={() => removeExercise(i)}
                  className="col-span-1 p-2 text-rose-400 hover:bg-rose-500/10 rounded-lg flex justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-2 transition"
          >
            <CheckCircle2 className="w-4 h-4" />
            {saving ? 'Saving to Supabase...' : 'Publish Workout Plan to Member Portal'}
          </button>
        </form>

        {/* Published Workout Plans */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Published Member Programs</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {plans.length === 0 ? (
              <p className="text-xs text-slate-500">
                No custom plans saved yet. Click Publish on the left to add one!
              </p>
            ) : (
              plans.map((p) => {
                const mem = members.find((m) => m.id === p.member_id);
                return (
                  <div
                    key={p.id}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-emerald-400">
                        {mem?.full_name || 'Assigned Member'}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {p.goal_focus}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white">{p.title}</p>
                    <ul className="text-xs text-slate-400 space-y-1">
                      {(p.exercises || []).map((ex, idx) => (
                        <li key={idx}>
                          • {ex.name} — {ex.sets}x{ex.reps} ({ex.rest} rest)
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};