'use client';

import { useState, useEffect } from 'react';
import { Calendar, Check, Volume2, Mic, Clock } from 'lucide-react';
import { Orb } from '@/components/ui/Orb';
import { Waveform } from '@/components/ui/Waveform';
import { CalbyLogo } from '@/components/brand/CalbyLogo';

export function DesktopMockup() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [selectedIntentIndex, setSelectedIntentIndex] = useState(0);

  const sampleIntents = [
    {
      speech: '“Schedule a sync with Rahul tomorrow at 10am”',
      title: 'Event: Sync with Rahul',
      time: 'Tomorrow, 10:00 AM – 10:30 AM · Google Calendar',
      category: 'Calendar',
    },
    {
      speech: '“Remind me to review design tokens today at 5pm”',
      title: 'Reminder: Review design tokens',
      time: 'Today, 5:00 PM · Local Desktop Alarm',
      category: 'Reminder',
    },
    {
      speech: '“Remember: Rahul handles the payment module”',
      title: 'Memory: Rahul → payment module',
      time: 'Saved to local device memory · No alarm',
      category: 'Memory',
    },
  ];

  const currentIntent = sampleIntents[selectedIntentIndex];

  return (
    <div
      id="desktop-showcase"
      className="w-full max-w-4xl relative rounded-2xl p-2 bg-[#0C101A] border border-[#1E293B] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden group transition-all duration-300 hover:border-[#38BDF8]/40"
    >
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1E293B]/70 bg-[#070A11] rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] hover:bg-rose-500/80 transition-colors" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] hover:bg-amber-500/80 transition-colors" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B] hover:bg-emerald-500/80 transition-colors" />
          </div>
          <div className="flex items-center gap-1.5 ml-2.5">
            <CalbyLogo variant="glyph" className="w-3.5 h-3.5" />
            <span className="text-xs text-[#94A3B8] font-medium tracking-tight">Calby Desktop</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1 bg-[#121826] px-2 py-0.5 rounded text-[10px] text-[#94A3B8]">
            <kbd className="font-mono text-[#38BDF8]">Alt</kbd>
            <span>+</span>
            <kbd className="font-mono text-[#38BDF8]">Space</kbd>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">Windows 10 / 11</span>
        </div>
      </div>

      <div className="relative rounded-b-xl overflow-hidden bg-[#070A11] p-5 sm:p-10 min-h-[380px] sm:min-h-[440px] flex flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-950/20 via-[#070A11] to-[#070A11] pointer-events-none" />
        <div className="absolute -top-10 left-1/4 w-72 h-72 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-4 right-1/4 w-60 h-60 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 w-full max-w-lg bg-[#0C1220]/95 backdrop-blur-2xl border border-[#38BDF8]/30 rounded-2xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
          <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]/70">
            <div className="flex items-center gap-2.5">
              <Orb size="md" />
              <div>
                <h4 className="text-xs font-bold text-[#F8FAFC] tracking-tight">Calby Assistant</h4>
                <p className="text-[10px] text-[#38BDF8] font-medium">Ready &amp; Active</p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#38BDF8]/10 border border-[#38BDF8]/30">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-ping" />
              <span className="text-[10px] font-semibold text-[#38BDF8]">Listening...</span>
            </div>
          </div>

          <div className="py-4">
            <Waveform active={!isConfirmed} barCount={9} />
          </div>

          <div className="bg-[#121929] border border-[#1E293B] rounded-xl p-3.5 mb-4 text-left">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] font-medium">
                <Mic className="w-3 h-3 text-[#38BDF8]" />
                <span>Spoken intent</span>
              </div>
              <span className="text-[10px] font-mono text-[#38BDF8] bg-[#38BDF8]/10 px-1.5 py-0.5 rounded">
                {currentIntent.category}
              </span>
            </div>
            <p className="text-sm font-medium text-[#F8FAFC]">
              {currentIntent.speech}
            </p>
          </div>

          <div className="bg-[#0C101A] border border-[#38BDF8]/30 rounded-xl p-3.5 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all duration-300">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5 sm:mt-0">
                {currentIntent.category === 'Calendar' && <Calendar className="w-4 h-4" />}
                {currentIntent.category === 'Reminder' && <Clock className="w-4 h-4" />}
                {currentIntent.category === 'Memory' && <Check className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F8FAFC]">{currentIntent.title}</p>
                <p className="text-[11px] text-[#94A3B8]">{currentIntent.time}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {isConfirmed ? (
                <div className="px-3 py-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 rounded-md flex items-center gap-1.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]">
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Action Executed</span>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedIntentIndex((prev) => (prev + 1) % sampleIntents.length);
                      setIsConfirmed(false);
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#F8FAFC] rounded-md border border-[#1E293B] hover:border-[#38BDF8]/40 transition-colors"
                  >
                    Switch Intent
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmed(true)}
                    className="px-3 py-1 text-[11px] font-semibold text-[#070A11] bg-[#38BDF8] hover:bg-sky-300 rounded-md transition-colors shadow-[0_0_12px_rgba(56,189,248,0.4)] active:scale-95"
                  >
                    Confirm
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#1E293B]/50 flex items-center justify-between text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Offline engine active</span>
            </div>
            <span>Press Alt+Space anytime</span>
          </div>
        </div>

        <div className="absolute bottom-3 px-4 py-1.5 bg-[#0e1424]/85 backdrop-blur-md rounded-xl border border-[#1E293B] flex items-center gap-3">
          <span className="w-5 h-5 rounded-md bg-blue-600/30 border border-blue-500/30 flex items-center justify-center text-[10px] text-[#38BDF8] font-bold">
            W
          </span>
          <span className="w-5 h-5 rounded-md bg-slate-700/40" />
          <span className="w-5 h-5 rounded-md bg-slate-700/40" />
          <div className="w-5 h-5 rounded-md bg-[#38BDF8]/20 border border-[#38BDF8]/50 flex items-center justify-center">
            <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
          </div>
        </div>
      </div>
    </div>
  );
}
