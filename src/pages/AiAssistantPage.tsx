import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, ShieldAlert, Send, Bot, Dumbbell } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  isMedicalRefusal?: boolean;
  source?: string;
}

// Expanded clinical & injury keywords (now includes 'hurt', 'hurts', 'strained', 'pulled', etc.)
const MEDICAL_KEYWORDS = [
  'hurt',
  'hurts',
  'hurting',
  'pain',
  'painful',
  'injury',
  'injured',
  'torn',
  'tear',
  'fracture',
  'broken',
  'dizzy',
  'chest pain',
  'faint',
  'fainted',
  'surgery',
  'doctor',
  'prescription',
  'medication',
  'hernia',
  'sprain',
  'sprained',
  'strain',
  'strained',
  'pulled a muscle',
  'dislocated',
  'bleeding',
  'swollen',
  'numb',
  'tingling',
];

const PULSEFORGE_SYSTEM_PROMPT = `You are the official PulseForge Gym Safe AI Fitness Coach in Addis Ababa, Ethiopia.

YOUR STRICT DOMAIN & PERSONA:
1. You ONLY answer questions related to workouts, strength & conditioning, hypertrophy, mobility, sports nutrition (including Ethiopian foods like eggs, tibs, chicken, shiro, lentils, ayib, oats, teff/injera), and PulseForge Gym operations.
2. PulseForge Gym details:
   - Membership Tiers: Basic (1,200 ETB/mo), Pro (2,200 ETB/mo), VIP (3,500 ETB/mo) via Telebirr, CBE Birr, Cash, or Card.
   - Classes: Morning HIIT Blast (Mon/Wed/Fri 6:30 AM), Heavy Powerlifting (Tue/Thu 5:00 PM), Core & Mobility Flow (Sat 10:00 AM).
   - Trainers: Abebe Bekele (Strength), Tigist Mekonnen (HIIT), Michael Johnson (CrossFit), Hanna Tadesse (Rehab & Core).
3. MEDICAL SAFETY GUARDRAIL: If the user mentions being hurt, injured, in pain, or asks for medical/injury treatment, you MUST start your response with "⚠️ MEDICAL SAFETY GUARDRAIL:" and advise them to stop exercising immediately and see a licensed physician or physical therapist. Do NOT give exercises or warm-ups for an active injury.
4. OFF-TOPIC REFUSAL: If the user asks about anything unrelated to fitness, nutrition, or PulseForge Gym (e.g., coding, homework, politics, movies), politely refuse and redirect them to their gym training.
5. STYLE: Keep answers fast, natural, encouraging, and concise (3 to 5 sentences max). Plain text only (no markdown headings).`;

export const AiAssistantPage: React.FC = () => {
  const geminiApiKey = (import.meta.env.VITE_GEMINI_API_KEY || '').trim();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      source: 'PulseForge AI',
      text: 'Hello! I am the live PulseForge Safe AI Fitness Coach. Ask me anything about workouts, exercise form, nutrition, or PulseForge classes—or test my medical and off-topic guardrails!',
    },
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const callLiveGemini = async (
    conversationHistory: ChatMessage[],
    latestQuery: string
  ): Promise<{ text: string; modelUsed: string }> => {
    if (!geminiApiKey) {
      throw new Error(
        'Missing VITE_GEMINI_API_KEY in .env.local. Please add your key and restart npm run dev.'
      );
    }

    // Try fastest low-latency 3.5 Flash-Lite first, then 3.8 Flash, then 3.6 Flash
    const models = ['gemini-3.5-flash-lite', 'gemini-3.8-flash', 'gemini-3.6-flash'];

    // Format conversation history so the AI has full multi-turn memory
    const contents = conversationHistory
      .slice(-6)
      .map((m) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }],
      }));

    contents.push({
      role: 'user',
      parts: [{ text: latestQuery }],
    });

    let lastError = 'API request failed';

    for (const model of models) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              systemInstruction: {
                parts: [{ text: PULSEFORGE_SYSTEM_PROMPT }],
              },
              contents,
              generationConfig: {
                temperature: 0.7,
              },
            }),
          }
        );

        const data = await res.json();

        if (!res.ok) {
          lastError = data?.error?.message || `HTTP ${res.status} on ${model}`;
          continue;
        }

        const replyText = data?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text || '')
          .join('')
          .trim();

        if (replyText) {
          return { text: replyText, modelUsed: model };
        }
      } catch (err: any) {
        lastError = err?.message || 'Network error';
      }
    }

    throw new Error(lastError);
  };

  const handleSend = async (promptText?: string) => {
    const query = (promptText ?? input).trim();
    if (!query || loading) return;

    setInput('');
    const currentHistory = [...messages];
    setMessages((prev) => [...prev, { role: 'user', text: query }]);

    const lower = query.toLowerCase();

    // 1. Instant Pre-flight Clinical & Medical Guardrail check (catches "hurt", "pain", "injury", etc.)
    const matchedMedicalWord = MEDICAL_KEYWORDS.find((kw) => {
      const regex = new RegExp(`\\b${kw}\\b`, 'i');
      return regex.test(lower);
    });

    if (matchedMedicalWord) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isMedicalRefusal: true,
          source: 'Safety Guardrail',
          text: `⚠️ MEDICAL SAFETY GUARDRAIL TRIGGERED (Detected: "${matchedMedicalWord}"): I cannot evaluate physical pain, acute injuries, or medical symptoms, nor prescribe workouts when you are hurt. Please rack the weight, stop exercising immediately, and consult a licensed physician or physical therapist before resuming training.`,
        },
      ]);
      return;
    }

    // 2. Call Live Gemini API (No pre-ordered answers!)
    setLoading(true);
    try {
      const { text, modelUsed } = await callLiveGemini(currentHistory, query);
      const isAiMedicalRefusal = text.includes('MEDICAL SAFETY GUARDRAIL');

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text,
          isMedicalRefusal: isAiMedicalRefusal,
          source: modelUsed.toUpperCase(),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          isMedicalRefusal: true,
          source: 'API Connection Error',
          text: `⚠️ Could not reach Gemini API: ${err.message}. Make sure VITE_GEMINI_API_KEY is saved in .env.local and restart your terminal (Ctrl+C then npm run dev).`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-400" /> Safe AI Fitness Coach
          </h1>
          <p className="text-sm text-slate-400">
            100% live Gemini AI trained on PulseForge Gym operations with clinical injury guardrails.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <Dumbbell className="w-3.5 h-3.5" /> Live Gemini AI
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" /> Medical Guardrails Active
          </span>
        </div>
      </div>

      {/* Quick Test Prompts */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => handleSend('Give me a 4-day hypertrophy muscle building split')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 transition"
        >
          💪 Ask Hypertrophy Split
        </button>
        <button
          onClick={() => handleSend('What is the best dynamic warm-up before heavy squats?')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 transition"
        >
          🔥 Ask Dynamic Warm-Up
        </button>
        <button
          onClick={() =>
            handleSend('What high-protein post-workout meals do you recommend in Ethiopia?')
          }
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-emerald-500/50 text-xs text-slate-300 transition"
        >
          🥩 Ask High-Protein Nutrition
        </button>
        <button
          onClick={() => handleSend('Write a Python script for my homework')}
          className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-sky-500/50 text-xs text-sky-300 transition"
        >
          🚫 Test Off-Topic Refusal
        </button>
        <button
          onClick={() => handleSend('I am hurt doing squats what should I do?')}
          className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs text-rose-300 font-bold transition"
        >
          🛡️ Test "I Am Hurt Doing Squats"
        </button>
      </div>

      {/* Chat Box */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col h-[460px]">
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 scroll-smooth">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xl p-4 rounded-2xl text-xs leading-relaxed whitespace-pre-line ${
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
            <div className="text-xs text-emerald-400 animate-pulse font-bold pl-1">
              Gemini AI is generating response...
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
            placeholder="Ask any fitness question or test the injury guardrail..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 transition"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </form>
      </div>
    </div>
  );
};