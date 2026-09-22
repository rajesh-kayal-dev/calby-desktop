'use client';

import { Calendar, User, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';

export function CalendarMemorySynergy() {
  return (
    <section
      id="calendar-synergy"
      className="py-16 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="bg-[#0C101A] border border-[#1E293B] rounded-3xl p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#38BDF8]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-2xl mb-8">
          <span className="text-xs text-[#38BDF8] uppercase font-bold tracking-wider mb-2 block">
            Contextual Synergy
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight mb-2">
            Calendar meets personal context.
          </h3>
          <p className="text-sm text-[#94A3B8] leading-relaxed">
            Calby connects your upcoming schedule with remembered personal facts so you are instantly prepared before conversations start.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Card 1: Calendar */}
          <div className="bg-[#121826] border border-[#1E293B] rounded-2xl p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase text-[#38BDF8] font-bold">01 / Schedule</span>
                <Calendar className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <h4 className="text-sm font-semibold text-[#F8FAFC] mb-1">Team Meeting</h4>
              <p className="text-xs text-[#94A3B8]">10:00 AM · Google Calendar</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1E293B]/70 flex items-center gap-1.5 text-[11px] text-[#64748B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <span>Synced event</span>
            </div>
          </div>

          {/* Plus / Connector */}
          <div className="hidden md:flex flex-col items-center justify-center -mx-2 z-10">
            <div className="w-8 h-8 rounded-full bg-[#101625] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] font-bold text-sm shadow-md">
              +
            </div>
          </div>

          {/* Card 2: Memory */}
          <div className="bg-[#121826] border border-[#1E293B] rounded-2xl p-5 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-mono uppercase text-[#38BDF8] font-bold">02 / Context</span>
                <User className="w-4 h-4 text-[#38BDF8]" />
              </div>
              <h4 className="text-xs font-mono text-[#94A3B8] mb-1">Relevant context:</h4>
              <p className="text-sm font-medium text-[#F8FAFC]">“Rahul handles the payment module.”</p>
            </div>
            <div className="mt-4 pt-3 border-t border-[#1E293B]/70 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Local memory</span>
            </div>
          </div>
        </div>

        {/* Result: Meeting Preparation */}
        <div className="mt-6 bg-[#121A2C] border border-[#38BDF8]/40 rounded-2xl p-5 sm:p-6 shadow-[0_10px_30px_rgba(0,0,0,0.4)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase text-[#38BDF8] font-bold tracking-wider">
                Meeting Preparation
              </span>
              <h4 className="text-sm font-bold text-[#F8FAFC]">Prepare with Calby</h4>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Surfaces Rahul&apos;s ownership of the payment module directly ahead of your 10:00 AM Team Meeting.
              </p>
            </div>
          </div>

          <a
            href="#download"
            className="px-4 py-2 bg-[#2563EB] hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all self-end sm:self-center shrink-0 shadow-sm"
          >
            <span>See live in app</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </section>
  );
}
