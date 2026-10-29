import React, { useEffect, useState } from 'react';
import { Wrench, CheckCircle2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Equipment } from '../types/database';

export const EquipmentPage: React.FC = () => {
  const [items, setItems] = useState<Equipment[]>([]);

  const fetchEquipment = async () => {
    const { data } = await supabase.from('equipment').select('*').order('name');
    if (data) setItems(data as Equipment[]);
  };

  useEffect(() => {
    fetchEquipment();
  }, []);

  const updateMachineStatus = async (
    machine: Equipment,
    newStatus: 'Operational' | 'Maintenance Due' | 'Out of Order'
  ) => {
    if (machine.status === newStatus) return;

    const newScore =
      newStatus === 'Operational' ? 98 : newStatus === 'Maintenance Due' ? 72 : 35;

    const defaultNotes: Record<string, string> = {
      Operational: 'Full mechanical inspection completed; cables, bearings, and frame verified safe.',
      'Maintenance Due': 'Scheduled preventive servicing required within 7 days.',
      'Out of Order': 'Safety lock-out active; awaiting technician part replacement.',
    };

    await supabase
      .from('equipment')
      .update({
        status: newStatus,
        health_score: newScore,
        last_serviced: new Date().toISOString().split('T')[0],
        notes: defaultNotes[newStatus],
      })
      .eq('id', machine.id);

    if (newStatus === 'Out of Order') {
      await supabase.from('notifications').insert({
        target_role: 'admin',
        title: 'Equipment Fault Alert',
        message: `${machine.name} (${machine.serial_code}) marked Out of Order.`,
        type: 'maintenance',
      });
    }

    fetchEquipment();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Equipment Telemetry & Maintenance</h1>
        <p className="text-sm text-slate-400">
          Monitor machine health scores, service logs, and trigger maintenance tickets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map((eq) => (
          <div
            key={eq.id}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[11px] font-mono text-emerald-400 font-bold">
                  {eq.serial_code} • {eq.zone}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">{eq.name}</h3>
              </div>
              <span
                className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  eq.status === 'Operational'
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : eq.status === 'Maintenance Due'
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                    : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                }`}
              >
                {eq.status}
              </span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Mechanical Health Score</span>
                <span className="font-bold text-white">{eq.health_score}%</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-950 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    eq.health_score >= 85
                      ? 'bg-emerald-500'
                      : eq.health_score >= 60
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${eq.health_score}%` }}
                />
              </div>
            </div>

            <p className="text-xs text-slate-400">
              Last serviced: <strong className="text-slate-200">{eq.last_serviced}</strong> —{' '}
              {eq.notes}
            </p>

            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => updateMachineStatus(eq, 'Operational')}
                disabled={eq.status === 'Operational'}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-emerald-400 text-xs font-bold flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" /> Mark Serviced (98%)
              </button>
              <button
                onClick={() => updateMachineStatus(eq, 'Maintenance Due')}
                disabled={eq.status === 'Maintenance Due'}
                className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-amber-400 text-xs font-bold flex items-center gap-1"
              >
                <Wrench className="w-3.5 h-3.5" /> Flag Maintenance
              </button>
              <button
                onClick={() => updateMachineStatus(eq, 'Out of Order')}
                disabled={eq.status === 'Out of Order'}
                className="px-3 py-1.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 disabled:opacity-40 disabled:cursor-not-allowed text-rose-400 text-xs font-bold flex items-center gap-1"
              >
                <AlertTriangle className="w-3.5 h-3.5" /> Report Fault
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};