import React, { useEffect, useState } from 'react';
import { QrCode, CheckCircle2, XCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Member } from '../types/database';

export const CheckInPage: React.FC = () => {
  const [code, setCode] = useState('PF-1001');
  const [members, setMembers] = useState<Member[]>([]);
  const [scanResult, setScanResult] = useState<{
    member: Member;
    statusType: 'granted' | 'already_checked_in' | 'denied';
    message: string;
  } | null>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  const fetchInitial = async () => {
    const { data: mData } = await supabase.from('members').select('*').order('member_code');
    if (mData) setMembers(mData as Member[]);

    const { data: lData } = await supabase
      .from('attendance_logs')
      .select('*, members(full_name, member_code, plan_tier)')
      .order('check_in_time', { ascending: false })
      .limit(10);
    if (lData) setRecentLogs(lData);
  };

  useEffect(() => {
    fetchInitial();
  }, []);

  const handleVerifyCode = async (targetCode: string) => {
    setCode(targetCode);
    const found = members.find(
      (m) => m.member_code.toLowerCase() === targetCode.trim().toLowerCase()
    );

    if (!found) {
      setScanResult({
        member: {
          id: '0',
          member_code: targetCode.toUpperCase(),
          full_name: 'Unregistered QR Pass',
          email: '',
          phone: '',
          plan_tier: 'Basic',
          status: 'Expired',
          join_date: '',
          expiry_date: '-',
          fitness_goal: '',
          streak_days: 0,
        },
        statusType: 'denied',
        message: 'INVALID PASS — No member found matching this QR code.',
      });
      return;
    }

    if (found.status === 'Expired') {
      setScanResult({
        member: found,
        statusType: 'denied',
        message: `ACCESS DENIED — Membership expired on ${found.expiry_date}. Please renew at Reception.`,
      });
      return;
    }

    // Check if member already checked in today (prevents duplicate logs & streak farming)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data: todayLogs } = await supabase
      .from('attendance_logs')
      .select('id, check_in_time')
      .eq('member_id', found.id)
      .gte('check_in_time', startOfToday.toISOString());

    if (todayLogs && todayLogs.length > 0) {
      const firstTime = new Date(todayLogs[0].check_in_time).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      setScanResult({
        member: found,
        statusType: 'already_checked_in',
        message: `ALREADY CHECKED IN TODAY (at ${firstTime}) — Re-entry permitted. Daily streak (${found.streak_days} days) already counted for today.`,
      });
      return;
    }

    // First check-in of the day -> Log attendance & increment streak by +1
    await supabase.from('attendance_logs').insert({
      member_id: found.id,
      check_in_method: 'QR Terminal',
      verified_by: 'Reception Desk',
    });

    const newStreak = (found.streak_days || 0) + 1;
    await supabase
      .from('members')
      .update({ streak_days: newStreak })
      .eq('id', found.id);

    setScanResult({
      member: { ...found, streak_days: newStreak },
      statusType: 'granted',
      message: `ACCESS GRANTED — Welcome back, ${found.full_name}! Daily streak increased to ${newStreak} days.`,
    });

    fetchInitial();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Reception QR Check-In Terminal</h1>
        <p className="text-sm text-slate-400">
          Validates active subscriptions, prevents duplicate same-day streak farming, and logs floor entry.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Scanner Box */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Pass Verification Input</h3>
              <p className="text-xs text-slate-400">Enter Member ID or click a quick preset</p>
            </div>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. PF-1001"
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-white font-mono text-sm uppercase"
            />
            <button
              onClick={() => handleVerifyCode(code)}
              className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs transition shadow-lg shadow-emerald-500/20"
            >
              Scan / Verify
            </button>
          </div>

          {/* Quick Demo Presets */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
              Quick Test Presets (Click to Simulate Scan):
            </p>
            <div className="flex flex-wrap gap-2">
              {members.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleVerifyCode(m.member_code)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                    m.status === 'Expired'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-emerald-500/50'
                  }`}
                >
                  {m.member_code} ({m.full_name.split(' ')[0]} - {m.status})
                </button>
              ))}
            </div>
          </div>

          {/* Scan Result Banner */}
          {scanResult && (
            <div
              className={`p-5 rounded-2xl border flex items-start gap-4 ${
                scanResult.statusType === 'granted'
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                  : scanResult.statusType === 'already_checked_in'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-rose-500/10 border-rose-500/40 text-rose-300'
              }`}
            >
              {scanResult.statusType === 'granted' ? (
                <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0 mt-0.5" />
              ) : scanResult.statusType === 'already_checked_in' ? (
                <Info className="w-7 h-7 text-amber-400 shrink-0 mt-0.5" />
              ) : (
                <XCircle className="w-7 h-7 text-rose-400 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-white">{scanResult.message}</p>
                <p className="text-xs">
                  Tier: <strong>{scanResult.member.plan_tier}</strong> | Streak:{' '}
                  <strong>🔥 {scanResult.member.streak_days} days</strong> | Expiry:{' '}
                  <strong>{scanResult.member.expiry_date}</strong>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Live Attendance Feed */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <h3 className="text-base font-bold text-white mb-4">Today & Recent Verified Check-Ins</h3>
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No check-ins recorded yet. Click a preset button on the left to test!
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                >
                  <div>
                    <p className="text-sm font-bold text-white">
                      {log.members?.full_name || 'Verified Member'}
                    </p>
                    <p className="text-xs text-emerald-400 font-mono">
                      {log.members?.member_code} • {log.check_in_method}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(log.check_in_time).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};