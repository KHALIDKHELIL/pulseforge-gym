import React, { useState } from 'react';
import { Sparkles, ShieldAlert, Send, Bot } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isMedicalRefusal?: boolean;
  source?: 'Gemini 3.8 Flash' | 'Safety Guardrail' | 'PulseForge Coach';
}

const MEDICAL_KEYWORDS = [
  'pain',
  'injury',
  'torn',
  'tear',
  'fracture',
  'dizzy',
  'chest pain',
  'faint',
  'surgery',
  'doctor',
  'prescription',
  'medication',
  'hernia',
  'sprain',
  'dislocated',
];

export const AiAssistantPage: React.FC = () => {
  const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      source: 'PulseForge Coach',
      text: 'Hello! I am the PulseForge Safe AI Fitness Coach. Ask me about hypertrophy splits, Ethiopian high-protein meal prep, warm-up mobility, or exercise form. I operate under strict medical safety guardrails and cannot diagnose injuries.',
    },
  ]);

  const generateLocalFallback = (lower: string): string => {
    if (lower.includes('hypertrophy') || lower.includes('muscle') || lower.includes('split')) {
      return 'For optimal hypertrophy (4-Day Upper/Lower Split): Train each muscle group 2x/week for 10–16 working sets. Use a controlled 2–3 second eccentric phase, rest 90–120s on compounds (squats, bench, rows), and aim for 1.6g–2.2g of protein per kg of bodyweight daily.';
    }
    if (lower.includes('warm') || lower.includes('mobility') || lower.includes('squat')) {
      return '8-Minute Squat & Lower Body Warm-Up: 3 mins light incline walk, 10 world’s greatest stretches, 12 deep bodyweight goblet squats with a 2-second bottom pause, glute bridges, and 3 progressive barbell ramp-up sets before your working weight.';
    }
    if (lower.includes('nutrition') || lower.includes('protein') || lower.includes('diet') || lower.includes('meal')) {
      return 'For lean muscle recovery: prioritize whole protein sources around your training window (eggs, lean beef/tibs, chicken breast, lentils/shiro, cottage cheese/ayib) paired with complex carbs 60–90 minutes pre-workout and 3–4L of water daily.';
    }
    return 'Focus on progressive overload across primary compound lifts (Squat, Bench, Deadlift, Overhead Press, Pull-Ups), track your working sets in the PulseForge Member Portal, sleep 7.5–8 hours nightly, and keep RPE between 8 and 9.';
  };

  const handleSend = async (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || loading) return;

    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text: query }]);

    const lower = query.toLowerCase();
    const triggersMedicalGuardrail = MEDICAL_KEYWORDS.some((kw) => lower.includes(kw));

    // 1. Pre-flight Clinical & Medical Guardrail check
    if (triggersMedicalGuardrail) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isMedicalRefusal: true,
          source: 'Safety Guardrail',
          text: '⚠️ MEDICAL SAFETY GUARDRAIL TRIGGERED: I cannot evaluate physical pain, acute injuries, or medical symptoms, nor prescribe clinical rehabilitation. Please stop exercising immediately and consult a licensed physician or physical therapist before resuming training.',
        },
      ]);
      return;
    }

    // 2. Call Live Google Gemini 3.8 Flash API via VITE_GEMINI_API_KEY
    if (geminiApiKey) {
      setLoading(true);
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [
                  {
                    text: 'You are the PulseForge Gym Safe AI Fitness Coach in Ethiopia. Give concise, actionable, evidence-based strength, hypertrophy, mobility, and sports nutrition advice (4-5 sentences max). Strictly refuse any medical diagnosis, injury treatment, or prescription advice.',
                  },
                ],
              },
              contents: [{ role: 'user', parts: [{ text: query }] }],
            }),
          }
        );

        const data = await res.json();
        const aiText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text ||
          generateLocalFallback(lower);

        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: aiText,
            source: data?.candidates ? 'Gemini 3.8 Flash' : 'PulseForge Coach',
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: generateLocalFallback(lower),
            source: 'PulseForge Coach',
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // 3. Fallback if VITE_GEMINI_API_KEY is not set
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: generateLocalFallback(lower),
        source: 'PulseForge Coach',
      },
    ]);
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
            handleSend('What high-protein post-workout meals do you recommend?')
          }
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300"
        >
          🥩 Ask High-Protein Nutrition
        </button>
        <button
          onClick={() =>
            handleSend(
              'I have sharp lower back pain and a possible rotator cuff tear, what should I do?'
            )
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
                  <div className="flex items-center justify-between gap-4 text-[10px] uppercase font-extrabold text-emerald-400 mb-1">
                    <span className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" /> PulseForge AI
                    </span>
                    {m.source && (
                      <span className="text-[9px] text-slate-400 font-mono">{m.source}</span>
                    )}
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-xs text-emerald-400 animate-pulse font-bold">
              PulseForge AI is generating response...
            </div>
          )}
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
            placeholder="Ask any fitness question or test the medical guardrail..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};