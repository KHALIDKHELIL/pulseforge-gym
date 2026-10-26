import React, { useEffect, useState } from 'react';
import { Calendar, Clock, MapPin, Users, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { GymClass, Member } from '../types/database';

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<GymClass[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [bookingMsg, setBookingMsg] = useState<string | null>(null);

  const fetchClasses = async () => {
    const [cRes, mRes] = await Promise.all([
      supabase.from('classes').select('*').order('title'),
      supabase.from('members').select('*').order('full_name'),
    ]);
    if (cRes.data) setClasses(cRes.data as GymClass[]);
    if (mRes.data) {
      setMembers(mRes.data as Member[]);
      if (mRes.data[0] && !selectedMemberId) setSelectedMemberId(mRes.data[0].id);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleBookSpot = async (gymClass: GymClass) => {
    if (gymClass.enrolled_count >= gymClass.capacity) return;

    await supabase.from('class_bookings').insert({
      class_id: gymClass.id,
      member_id: selectedMemberId || null,
      booking_status: 'Confirmed',
    });

    await supabase
      .from('classes')
      .update({ enrolled_count: gymClass.enrolled_count + 1 })
      .eq('id', gymClass.id);

    setBookingMsg(`Spot reserved in "${gymClass.title}"!`);
    fetchClasses();
    setTimeout(() => setBookingMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Group Class Timetable & Booking</h1>
          <p className="text-sm text-slate-400">
            Reserve studio spots with live PostgreSQL capacity enforcement.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">Book as:</span>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white"
          >
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.member_code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {bookingMsg && (
        <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {bookingMsg}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {classes.map((c) => {
          const pct = Math.min(100, Math.round((c.enrolled_count / c.capacity) * 100));
          const isFull = c.enrolled_count >= c.capacity;
          return (
            <div
              key={c.id}
              className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-5 shadow-xl"
            >
              <div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-500/15 text-emerald-400">
                  {c.category}
                </span>
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
                    className={`h-full rounded-full ${
                      isFull ? 'bg-rose-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <button
                  onClick={() => handleBookSpot(c)}
                  disabled={isFull}
                  className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-extrabold text-xs transition"
                >
                  {isFull ? 'Class Full' : '1-Click Book Class Spot'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};