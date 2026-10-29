import React, { useEffect, useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { ClassBooking, GymClass, Member } from '../types/database';
import { useAuth } from '../context/AuthContext';

export const ClassesPage: React.FC = () => {
  const { activeRole } = useAuth();
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [bookings, setBookings] = useState<ClassBooking[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [busyClassId, setBusyClassId] = useState<string | null>(null);

  const fetchClassesAndBookings = async () => {
    const [cRes, mRes, bRes] = await Promise.all([
      supabase.from('classes').select('*').order('title'),
      supabase.from('members').select('*').order('member_code'),
      supabase.from('class_bookings').select('*'),
    ]);
    if (cRes.data) setClasses(cRes.data as GymClass[]);
    if (mRes.data) {
      const mList = mRes.data as Member[];
      setMembers(mList);
      if (mList[0] && !selectedMemberId) setSelectedMemberId(mList[0].id);
    }
    if (bRes.data) setBookings(bRes.data as ClassBooking[]);
  };

  useEffect(() => {
    fetchClassesAndBookings();
  }, []);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const showBanner = (type: 'success' | 'error', text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 4500);
  };

  const handleToggleBooking = async (gymClass: GymClass) => {
    if (!selectedMember) return;

    const existingBooking = bookings.find(
      (b) => b.class_id === gymClass.id && b.member_id === selectedMember.id
    );

    setBusyClassId(gymClass.id);

    // 1. If already booked -> Cancel reservation & free up 1 spot
    if (existingBooking) {
      await supabase.from('class_bookings').delete().eq('id', existingBooking.id);
      const nextCount = Math.max(0, gymClass.enrolled_count - 1);
      await supabase
        .from('classes')
        .update({ enrolled_count: nextCount })
        .eq('id', gymClass.id);

      showBanner(
        'success',
        `Canceled ${selectedMember.full_name}'s reservation in "${gymClass.title}". Spot freed!`
      );
      setBusyClassId(null);
      fetchClassesAndBookings();
      return;
    }

    // 2. Guardrail: Block Expired members from booking classes
    if (selectedMember.status === 'Expired') {
      showBanner(
        'error',
        `Booking Denied: ${selectedMember.full_name}'s membership is Expired (${selectedMember.expiry_date}). Please renew first.`
      );
      setBusyClassId(null);
      return;
    }

    // 3. Guardrail: Capacity check
    if (gymClass.enrolled_count >= gymClass.capacity) {
      showBanner('error', `"${gymClass.title}" has reached maximum capacity.`);
      setBusyClassId(null);
      return;
    }

    // 4. Create unique booking
    const { error } = await supabase.from('class_bookings').insert({
      class_id: gymClass.id,
      member_id: selectedMember.id,
      booking_status: 'Confirmed',
    });

    if (error) {
      showBanner('error', 'Member is already enrolled in this class.');
      setBusyClassId(null);
      return;
    }

    await supabase
      .from('classes')
      .update({ enrolled_count: gymClass.enrolled_count + 1 })
      .eq('id', gymClass.id);

    showBanner(
      'success',
      `Spot reserved for ${selectedMember.full_name} in "${gymClass.title}"!`
    );
    setBusyClassId(null);
    fetchClassesAndBookings();
  };

  const handleResetCapacities = async () => {
    await supabase.from('class_bookings').delete().neq('booking_status', 'NONE');
    for (const c of classes) {
      const realisticCount = Math.max(1, Math.floor(c.capacity * 0.65));
      await supabase
        .from('classes')
        .update({ enrolled_count: realisticCount })
        .eq('id', c.id);
    }
    showBanner('success', 'All duplicate bookings cleared and class capacities reset!');
    fetchClassesAndBookings();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Group Class Timetable & Booking</h1>
          <p className="text-sm text-slate-400">
            1-spot-per-member validation, active subscription guardrails, and instant cancellation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {(activeRole === 'admin' || activeRole === 'reception') && (
            <button
              onClick={handleResetCapacities}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400 flex items-center gap-1.5 transition"
              title="Reset maxed-out class counts"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Class Capacities
            </button>
          )}

          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5">
            <span className="text-xs text-slate-400 font-bold">Book as:</span>
            <select
              value={selectedMemberId}
              onChange={(e) => setSelectedMemberId(e.target.value)}
              className="bg-transparent text-xs font-bold text-white focus:outline-none"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.full_name} ({m.member_code} • {m.status})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {selectedMember?.status === 'Expired' && (
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          Note: {selectedMember.full_name} ({selectedMember.member_code}) currently has an{' '}
          <strong>Expired</strong> membership and will be blocked from booking new classes until renewed.
        </div>
      )}

      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === 'success'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-500/15 border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          {feedback.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((c) => {
          const pct = Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100));
          const isFull = c.enrolled_count >= c.capacity;
          const isAlreadyBooked = bookings.some(
            (b) => b.class_id === c.id && b.member_id === selectedMemberId
          );

          return (
            <div
              key={c.id}
              className={`p-6 rounded-2xl bg-slate-900 border flex flex-col justify-between space-y-5 shadow-xl transition ${
                isAlreadyBooked ? 'border-emerald-500/60' : 'border-slate-800'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400">
                    {c.category}
                  </span>
                  {isAlreadyBooked && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-slate-950">
                      ✓ Enrolled
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-extrabold text-white mt-3">{c.title}</h3>

                <div className="mt-4 space-y-2 text-xs text-slate-400">
                  <p className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-emerald-400" /> {c.schedule_day}
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-400" /> {c.schedule_time} (
                    {c.duration_min} mins)
                  </p>
                  <p className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-emerald-400" /> {c.room}
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> Capacity
                  </span>
                  <span className="font-bold text-white">
                    {c.enrolled_count} / {c.capacity} Enrolled
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      isFull ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <button
                  onClick={() => handleToggleBooking(c)}
                  disabled={busyClassId === c.id || (isFull && !isAlreadyBooked)}
                  className={`w-full py-2.5 rounded-xl font-extrabold text-xs transition ${
                    isAlreadyBooked
                      ? 'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30'
                      : isFull
                      ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                      : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                  }`}
                >
                  {busyClassId === c.id
                    ? 'Updating...'
                    : isAlreadyBooked
                    ? 'Cancel My Reservation (Free Spot)'
                    : isFull
                    ? 'Class Full'
                    : 'Book Class Spot (1 Per Member)'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};