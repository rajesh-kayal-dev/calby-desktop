'use client';

import { useState } from 'react';
import { Mic, Bell, Calendar as CalendarIcon, Share2, Check, ExternalLink, Clock, ShieldCheck, Info } from 'lucide-react';
import { Waveform } from '@/components/ui/Waveform';

export function FeaturesGrid() {
  const [reminderDone, setReminderDone] = useState(false);
  const [voiceSimActive, setVoiceSimActive] = useState(true);

  return (
    <section
      id="features"
      className="py-20 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="flex flex-col mb-12">
        <span className="text-xs text-[#38BDF8] uppercase font-bold tracking-wider mb-2">
          Core Capabilities
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-2">
          Everything you need from your assistant.
        </h2>
        <p className="text-sm sm:text-base text-[#94A3B8]">
          Four core capabilities designed for how you actually work on your desktop.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* FEATURE 1: VOICE ASSISTANT */}
        <div
          id="feature-voice"
          className="bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:border-[#38BDF8]/40 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.2)] transition-all">
              <Mic className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] mb-1">Just talk to Calby.</h3>
            <p className="text-xs text-[#38BDF8] font-semibold mb-3">Voice Assistant</p>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
              Use your voice to ask Calby to remember something, check your schedule, or take an action.
            </p>
          </div>

          <div className="bg-[#0C1220] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setVoiceSimActive(!voiceSimActive)}
                  className="w-7 h-7 rounded-md bg-[#38BDF8]/15 hover:bg-[#38BDF8]/25 flex items-center justify-center text-[#38BDF8] transition-colors"
                  title="Toggle voice visualizer"
                  aria-label="Toggle voice visualizer"
                >
                  <Mic className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-[#94A3B8] font-mono">Listening on hotkey</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-[#64748B] font-mono">Alt + Space</span>
                <Waveform active={voiceSimActive} barCount={5} className="h-5" />
              </div>
            </div>

            <div className="bg-[#121A2C] px-3.5 py-2.5 rounded-lg border border-[#1E293B]">
              <span className="text-xs text-[#38BDF8] font-medium font-mono">
                “Prep notes for product review”
              </span>
            </div>

            <div className="bg-[#090E18] px-3 py-2 rounded text-[11px] text-[#94A3B8] flex items-center gap-2 border border-[#1E293B]/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              <span>Calby: Ready. Review points gathered from your calendar context.</span>
            </div>
          </div>
        </div>

        {/* FEATURE 2: SMART REMINDERS */}
        <div
          id="feature-reminders"
          className="bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between group"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:border-[#38BDF8]/40 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.2)] transition-all">
              <Bell className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] mb-1">Never forget what matters.</h3>
            <p className="text-xs text-[#38BDF8] font-semibold mb-3">Smart Reminders</p>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-6">
              Reliable reminders and optional alarms that run locally on your desktop.
            </p>
          </div>

          <div className="bg-[#0C1220] border border-[#38BDF8]/30 rounded-xl p-4 flex flex-col gap-3 shadow-[0_4px_20px_rgba(0,0,0,0.3)]">
            <div className="flex items-start justify-between">
              <div>
                <h4 className={`text-sm font-semibold transition-colors ${reminderDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                  Call Rahul
                </h4>
                <div className="flex items-center gap-1.5 text-[11px] text-[#94A3B8] mt-0.5">
                  <Clock className="w-3 h-3 text-[#38BDF8]" />
                  <span>Today · 5:00 PM</span>
                </div>
              </div>

              <span className="px-2 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-semibold text-[#38BDF8]">
                {reminderDone ? 'Completed' : 'Reminder in 5 min'}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setReminderDone(false)}
                className="px-3 py-1.5 rounded bg-[#121A2C] hover:bg-[#1A233A] text-[#94A3B8] hover:text-[#F8FAFC] text-xs border border-[#1E293B] transition-colors"
              >
                Snooze 10m
              </button>
              <button
                type="button"
                onClick={() => setReminderDone(!reminderDone)}
                className={`px-3 py-1.5 rounded text-xs font-semibold shadow-sm transition-all flex items-center gap-1.5 ${
                  reminderDone
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-[#2563EB] hover:bg-blue-500 text-white'
                }`}
              >
                {reminderDone ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Done</span>
                  </>
                ) : (
                  <span>Mark Done</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* FEATURE 3: GOOGLE CALENDAR */}
        <div
          id="feature-calendar"
          className="bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between group md:col-span-2 lg:flex-row gap-6 items-center"
        >
          <div className="flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:border-[#38BDF8]/40 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.2)] transition-all">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] mb-1">Know what&apos;s coming next.</h3>
            <p className="text-xs text-[#38BDF8] font-semibold mb-3">Google Calendar</p>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-4">
              Connect Google Calendar, create events, set reminders, and prepare for meetings.
            </p>
            <div className="flex items-center gap-2 text-xs text-[#38BDF8]">
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Instant hotkey sync &amp; context briefings</span>
            </div>
          </div>

          <div className="w-full lg:w-[420px] bg-[#0C1220] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
              <span className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">TODAY</span>
              <span className="text-[11px] text-[#94A3B8]">Wed, Oct 25</span>
            </div>

            <div className="bg-[#121A2C] border border-[#38BDF8]/30 rounded-lg p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-[#F8FAFC]">Team Meeting</h4>
                  <p className="text-[11px] text-[#38BDF8] font-mono">10:00 AM</p>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 bg-[#2563EB] hover:bg-blue-500 text-white rounded text-[11px] font-semibold transition-colors flex items-center gap-1 shadow-sm"
                >
                  <span>Prepare with Calby</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>

              <div className="bg-[#090E18] rounded p-2 text-[11px] text-[#94A3B8] flex items-center gap-2 border border-[#1E293B]/60">
                <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                <span>Prepare with Calby: Linked with personal attendee context</span>
              </div>
            </div>
          </div>
        </div>

        {/* FEATURE 4: PERSONAL MEMORY */}
        <div
          id="feature-memory"
          className="bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all duration-300 p-6 sm:p-7 rounded-2xl flex flex-col justify-between group md:col-span-2 lg:flex-row gap-6 items-center"
        >
          <div className="flex-1">
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8] mb-5 group-hover:border-[#38BDF8]/40 group-hover:shadow-[0_0_14px_rgba(56,189,248,0.2)] transition-all">
              <Share2 className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-[#F8FAFC] mb-1">Tell Calby once. It remembers.</h3>
            <p className="text-xs text-[#38BDF8] font-semibold mb-3">Personal Memory</p>
            <p className="text-sm text-[#94A3B8] leading-relaxed mb-3">
              Save important personal context that you explicitly ask Calby to remember.
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#0C101A] border border-[#1E293B] text-[11px] text-[#94A3B8]">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Explicit only • No unsolicited alarms or background scans</span>
            </div>
          </div>

          <div className="w-full lg:w-[420px] bg-[#0C1220] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-[#94A3B8]">Spoken Instruction:</span>
            </div>
            <div className="bg-[#121A2C] px-3.5 py-2.5 rounded-lg border border-[#1E293B]">
              <p className="text-xs text-[#F8FAFC] font-medium">
                “Remember Rahul handles the payment module.”
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Check className="w-4 h-4 shrink-0 stroke-[2.5]" />
              <span className="text-xs font-semibold">Memory saved</span>
            </div>
          </div>
        </div>
      </div>

      {/* MEMORY BOUNDARY CARD */}
      <div className="mt-8 bg-[#0C101A] border border-[#1E293B] rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8] shrink-0 mt-0.5">
            <Info className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-[#F8FAFC] uppercase tracking-wider">
              Product Boundary Distinction
            </h4>
            <div className="flex flex-wrap gap-x-6 gap-y-1 mt-1 text-xs text-[#94A3B8]">
              <span><strong className="text-[#F8FAFC]">Memory:</strong> stores personal information</span>
              <span><strong className="text-[#F8FAFC]">Reminder:</strong> stores an action/time</span>
              <span><strong className="text-[#F8FAFC]">Notification:</strong> delivers the reminder</span>
            </div>
          </div>
        </div>
        <span className="text-[11px] font-mono text-[#64748B] shrink-0 self-end sm:self-center">
          Memory does not trigger alarms
        </span>
      </div>
    </section>
  );
}
