import React, { useEffect, useState } from 'react';
import {
  Users,
  AlertTriangle,
  CreditCard,
  Wrench,
  RefreshCw,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { Equipment, Member, Payment } from '../types/database';

export const AdminDashboard: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [renewMember, setRenewMember] = useState<Member | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE Birr' | 'Card' | 'Cash'>(
    'Telebirr'
  );
  const [processingRenewal, setProcessingRenewal] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    const [mRes, pRes, eRes] = await Promise.all([
      supabase.from('members').select('*').order('expiry_date', { ascending: true }),
      supabase.from('payments').select('*').order('payment_date', { ascending: false }),
      supabase.from('equipment').select('*'),
    ]);
    if (mRes.data) setMembers(mRes.data as Member[]);
    if (pRes.data) setPayments(pRes.data as Payment[]);
    if (eRes.data) setEquipment(eRes.data as Equipment[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const activeCount = members.filter((m) => m.status === 'Active').length;
  const atRiskMembers = members.filter((m) => m.status !== 'Active');
  const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const avgHealth =
    equipment.length > 0
      ? Math.round(equipment.reduce((s, e) => s + e.health_score, 0) / equipment.length)
      : 95;

  const revenueByMethod = ['Telebirr', 'CBE Birr', 'Cash', 'Card'].map((method) => ({
    name: method,
    amount: payments
      .filter((p) => p.payment_method === method)
      .reduce((sum, p) => sum + Number(p.amount || 0), 0),
  }));

  const occupancyTrend = [
    { day: 'Mon', checkins: 48 },
    { day: 'Tue', checkins: 56 },
    { day: 'Wed', checkins: 64 },
    { day: 'Thu', checkins: 52 },
    { day: 'Fri', checkins: 71 },
    { day: 'Sat', checkins: 84 },
    { day: 'Sun', checkins: 39 },
  ];

  const handleQuickRenew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewMember) return;
    setProcessingRenewal(true);

    const tierPrices: Record<string, number> = { VIP: 3500, Pro: 2200, Basic: 1200 };
    const amount = tierPrices[renewMember.plan_tier] || 1500;
    const newExpiry = new Date();
    newExpiry.setDate(newExpiry.getDate() + 30);
    const formattedExpiry = newExpiry.toISOString().split('T')[0];

    await supabase
      .from('members')
      .update({ status: 'Active', expiry_date: formattedExpiry })
      .eq('id', renewMember.id);

    await supabase.from('payments').insert({
      member_id: renewMember.id,
      invoice_no: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      amount,
      plan_tier: renewMember.plan_tier,
      payment_method: paymentMethod,
      payment_status: 'Completed',
    });

    await supabase.from('notifications').insert({
      target_role: 'admin',
      title: 'Membership Renewed',
      message: `${renewMember.full_name} renewed (${renewMember.plan_tier}) via ${paymentMethod} (${amount} ETB).`,
      type: 'payment',
    });

    setProcessingRenewal(false);
    setRenewMember(null);
    fetchDashboardData();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Executive Command Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time PostgreSQL telemetry across memberships, Telebirr/CBE Birr revenue, and floor operations.
          </p>
        </div>
        <button
          onClick={fetchDashboardData}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-2 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
          Sync Live Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Active Members</span>
            <Users className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{activeCount}</p>
          <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
            Out of {members.length} registered
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Expiring / Expired</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{atRiskMembers.length}</p>
          <span className="text-xs text-amber-400 font-medium mt-1 inline-block">
            Action required below
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Logged Revenue</span>
            <CreditCard className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">
            {totalRevenue.toLocaleString()} ETB
          </p>
          <span className="text-xs text-emerald-400 font-medium mt-1 inline-block">
            Telebirr, CBE Birr & Cash
          </span>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Equipment Readiness</span>
            <Wrench className="w-5 h-5 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white mt-3">{avgHealth}%</p>
          <span className="text-xs text-sky-400 font-medium mt-1 inline-block">
            Across {equipment.length} gym stations
          </span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Revenue by Payment Channel (ETB)</h3>
              <p className="text-xs text-slate-400">Live aggregation from Supabase payments table</p>
            </div>
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueByMethod}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="amount" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Weekly Gym Floor Occupancy</h3>
              <p className="text-xs text-slate-400">Daily member check-in volume</p>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={occupancyTrend}>
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="checkins"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Actionable Renewal Watchlist */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-white">Subscription Renewal Watchlist</h3>
            <p className="text-xs text-slate-400">
              Members marked Expiring Soon or Expired — click Renew to process instant Telebirr/CBE Birr extension.
            </p>
          </div>
        </div>

        {atRiskMembers.length === 0 ? (
          <div className="p-6 text-center text-sm text-emerald-400 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
            All gym members have active subscriptions!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400">
                  <th className="py-3 px-4">Code</th>
                  <th className="py-3 px-4">Member</th>
                  <th className="py-3 px-4">Plan Tier</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Expiry Date</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm">
                {atRiskMembers.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-xs text-emerald-400 font-bold">
                      {m.member_code}
                    </td>
                    <td className="py-3 px-4 font-semibold text-white">{m.full_name}</td>
                    <td className="py-3 px-4 text-xs text-slate-300">{m.plan_tier}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          m.status === 'Expired'
                            ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-400">{m.expiry_date}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setRenewMember(m)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition"
                      >
                        1-Click Renew
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 1-Click Renewal Modal */}
      {renewMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Renew Membership</h3>
            <p className="text-xs text-slate-400 mt-1">
              Extending <strong className="text-white">{renewMember.full_name}</strong> (
              {renewMember.member_code}) for +30 days.
            </p>
            <form onSubmit={handleQuickRenew} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1.5">
                  Payment Channel
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                >
                  <option value="Telebirr">Telebirr Mobile Money</option>
                  <option value="CBE Birr">CBE Birr Transfer</option>
                  <option value="Cash">Cash at Front Desk</option>
                  <option value="Card">POS Card</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewMember(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingRenewal}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {processingRenewal ? 'Processing...' : 'Confirm & Log Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};