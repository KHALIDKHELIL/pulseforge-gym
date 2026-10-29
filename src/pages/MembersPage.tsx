import React, { useEffect, useState } from 'react';
import { Search, UserPlus, CheckCircle2, RefreshCw, Trash2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Member } from '../types/database';

export const MembersPage: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [showAddModal, setShowAddModal] = useState(false);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+2519');
  const [planTier, setPlanTier] = useState<'Basic' | 'Pro' | 'VIP'>('Pro');
  const [fitnessGoal, setFitnessGoal] = useState('Hypertrophy & Strength');
  const [paymentMethod, setPaymentMethod] = useState<'Telebirr' | 'CBE Birr' | 'Cash' | 'Card'>(
    'Telebirr'
  );
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchMembers = async () => {
    const { data } = await supabase
      .from('members')
      .select('*')
      .order('member_code', { ascending: true });
    if (data) setMembers(data as Member[]);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleCreateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Prevent duplicate email or phone
    const duplicate = members.find(
      (m) =>
        m.email.toLowerCase() === email.trim().toLowerCase() ||
        m.phone.trim() === phone.trim()
    );
    if (duplicate) {
      setFormError(
        `A member with this email or phone already exists (${duplicate.full_name} - ${duplicate.member_code}).`
      );
      return;
    }

    setSaving(true);

    // Generate clean sequential member code (e.g. PF-1007)
    const maxNum = members.reduce((max, m) => {
      const num = parseInt(m.member_code.replace('PF-', ''), 10);
      return !isNaN(num) && num > max ? num : max;
    }, 1000);
    const nextCode = `PF-${maxNum + 1}`;

    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30);

    const { data: newMember } = await supabase
      .from('members')
      .insert({
        member_code: nextCode,
        full_name: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        plan_tier: planTier,
        status: 'Active',
        expiry_date: expiry.toISOString().split('T')[0],
        fitness_goal: fitnessGoal,
        streak_days: 1,
      })
      .select()
      .single();

    const tierPrices: Record<string, number> = { VIP: 3500, Pro: 2200, Basic: 1200 };
    if (newMember) {
      await supabase.from('payments').insert({
        member_id: newMember.id,
        invoice_no: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        amount: tierPrices[planTier],
        plan_tier: planTier,
        payment_method: paymentMethod,
        payment_status: 'Completed',
      });
    }

    setSaving(false);
    setShowAddModal(false);
    setFullName('');
    setEmail('');
    setPhone('+2519');
    fetchMembers();
  };

  const handleQuickRenewMember = async (member: Member) => {
    const tierPrices: Record<string, number> = { VIP: 3500, Pro: 2200, Basic: 1200 };
    const baseDate =
      member.status !== 'Expired' && member.expiry_date
        ? new Date(member.expiry_date)
        : new Date();
    baseDate.setDate(baseDate.getDate() + 30);

    await supabase
      .from('members')
      .update({
        status: 'Active',
        expiry_date: baseDate.toISOString().split('T')[0],
      })
      .eq('id', member.id);

    await supabase.from('payments').insert({
      member_id: member.id,
      invoice_no: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      amount: tierPrices[member.plan_tier] || 2200,
      plan_tier: member.plan_tier,
      payment_method: 'Telebirr',
      payment_status: 'Completed',
    });

    fetchMembers();
  };

  const handleDeleteMember = async (member: Member) => {
    if (!window.confirm(`Remove ${member.full_name} (${member.member_code}) from gym directory?`))
      return;
    await supabase.from('members').delete().eq('id', member.id);
    fetchMembers();
  };

  const filtered = members.filter((m) => {
    const matchesSearch =
      m.full_name.toLowerCase().includes(search.toLowerCase()) ||
      m.member_code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Member Directory & Billing CRM</h1>
          <p className="text-sm text-slate-400">
            Manage gym memberships, sequential QR codes, duplicate checks, and Telebirr/CBE Birr renewals.
          </p>
        </div>
        <button
          onClick={() => {
            setFormError(null);
            setShowAddModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-emerald-500/20"
        >
          <UserPlus className="w-4 h-4" />
          Register Walk-In Member
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or member QR code (e.g. PF-1001)..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          {['All', 'Active', 'Expiring Soon', 'Expired'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                statusFilter === st
                  ? 'bg-emerald-500 text-slate-950 border-emerald-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Members Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-bold uppercase text-slate-400 bg-slate-950/50">
                <th className="py-3.5 px-4">QR Code</th>
                <th className="py-3.5 px-4">Full Name</th>
                <th className="py-3.5 px-4">Tier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Fitness Goal</th>
                <th className="py-3.5 px-4">Streak</th>
                <th className="py-3.5 px-4">Expiry</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-slate-800/40">
                  <td className="py-3.5 px-4 font-mono text-xs font-bold text-emerald-400">
                    {m.member_code}
                  </td>
                  <td className="py-3.5 px-4">
                    <p className="font-bold text-white">{m.full_name}</p>
                    <p className="text-xs text-slate-400">{m.phone}</p>
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-xs font-bold text-white">
                      {m.plan_tier}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        m.status === 'Active'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          : m.status === 'Expiring Soon'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-300">{m.fitness_goal}</td>
                  <td className="py-3.5 px-4 text-xs font-bold text-amber-400">
                    🔥 {m.streak_days} days
                  </td>
                  <td className="py-3.5 px-4 text-xs text-slate-400">{m.expiry_date}</td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleQuickRenewMember(m)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-bold flex items-center gap-1"
                        title="Extend subscription by +30 days"
                      >
                        <RefreshCw className="w-3 h-3" /> +30d
                      </button>
                      <button
                        onClick={() => handleDeleteMember(m)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                        title="Delete member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Walk-In Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white">Register New Gym Member</h3>
            <p className="text-xs text-slate-400 mt-1">
              Generates the next sequential QR code and logs payment in Supabase.
            </p>

            {formError && (
              <div className="mt-3 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateMember} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Yared Mamo"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Phone
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yared@gmail.com"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Plan Tier
                  </label>
                  <select
                    value={planTier}
                    onChange={(e) => setPlanTier(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    <option value="Basic">Basic (1,200 ETB)</option>
                    <option value="Pro">Pro (2,200 ETB)</option>
                    <option value="VIP">VIP (3,500 ETB)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                  >
                    <option value="Telebirr">Telebirr</option>
                    <option value="CBE Birr">CBE Birr</option>
                    <option value="Cash">Cash</option>
                    <option value="Card">Card</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                  Primary Fitness Goal
                </label>
                <input
                  type="text"
                  value={fitnessGoal}
                  onChange={(e) => setFitnessGoal(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white"
                />
              </div>
              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Create & Log Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};