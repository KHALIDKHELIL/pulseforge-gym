import React, { useState } from 'react';
import { Sparkles, ShieldAlert, Send, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isMedicalRefusal?: boolean;
}

const MEDICAL_KEYWORDS = [
  'pain',
  'injury',
  'torn',
  'tear',
  'fracture',
  'dizzy',
  'chest pain',
  'Faint',
  'surgery',
  'doctor',
  'prescription',
  'medication',
  'hernia',
  'sprain',
];

export const AiAssistantPage: React.FC = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: 'Hello! I am the PulseForge Safe AI Fitness Coach. Ask me about hypertrophy splits, warm-up mobility, protein timing, or exercise form. Note: I operate under strict medical safety guardrails and cannot diagnose injuries.',
    },
  ]);

  const handleSend = (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query) return;

    const lower = query.toLowerCase();
    const triggersMedicalGuardrail = MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));

    let reply: ChatMessage;
    if (triggersMedicalGuardrail) {
      reply = {
        role: 'assistant',
        isMedicalRefusal: true,
        text: '⚠️ MEDICAL SAFETY GUARDRAIL TRIGGERED: I cannot evaluate physical pain, acute injuries, or medical symptoms, nor prescribe clinical rehabilitation. Please stop exercising immediately and consult a licensed physician or physical therapist before resuming training.',
      };
    } else if (lower.includes('hypertrophy') || lower.includes('muscle')) {
      reply = {
        role: 'assistant',
        text: 'For optimal hypertrophy: train each muscle group 2x per week with 10–16 working sets, focusing on controlled eccentric tempo (2–3 seconds down) and taking sets within 1–2 reps of failure (RPE 8–9). Pair with 1.6g–2.2g of protein per kg of bodyweight.',
      };
    } else if (lower.includes('warm') || lower.includes('mobility')) {
      reply = {
        role: 'assistant',
        text: 'Recommended 8-minute dynamic warm-up: 3 mins light rowing or incline walk, 10 thoracic spine rotations per side, 12 bodyweight deep goblet squats with a 2-second pause, and 2 progressive ramp-up sets on your primary compound lift.',
      };
    } else {
      reply = {
        role: 'assistant',
        text: 'Great training question! Focus on progressive overload across compound movements (squats, presses, rows, hinges), prioritize 7.5+ hours of sleep, hydrate with electrolytes, and log your working weights in the Member Portal every session.',
      };
    }

    setMessages((prev) => [...prev, { role: 'user', text: query }, reply]);
    setInput('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" /> Safe AI Fitness Coach
          </h1>
          <p className="text-sm text-slate-400">
            Interactive workout & nutrition guidance protected by automated clinical safety guardrails.
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5 self-start">
          <ShieldAlert className="w-4 h-4" /> Medical Guardrails Active
        </span>
      </div>

      {/* Quick Test Prompts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSend('Give me a 4-day hypertrophy muscle building split')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300"
        >
          💪 Ask Hypertrophy Split
        </button>
        <button
          onClick={() => handleSend('What is the best dynamic warm-up before heavy squats?')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300"
        >
          🔥 Ask Dynamic Warm-Up
        </button>
        <button
          onClick={() =>
            handleSend('I have sharp lower back pain and a possible rotator cuff tear, what should I do?')
          }
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs text-rose-300 font-bold"
        >
          🛡️ Test Medical Injury Guardrail
        </button>
      </div>

      {/* Chat Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[460px]">
        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-bold'
                    : m.isMedicalRefusal
                    ? 'bg-rose-500/15 border border-rose-500/40 text-rose-200 font-semibold'
                    : 'bg-slate-950 border border-slate-800 text-slate-200'
                }`}
              >
                {m.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 text-[10px] uppercase font-extrabold text-emerald-400 mb-1">
                    <Bot className="w-3.5 h-3.5" /> PulseForge AI
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="mt-4 pt-4 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about workout splits, reps, mobility, or test the medical guardrail..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          />
          <button
            type="submit"
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};