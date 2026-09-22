'use client';

import { Shield, Monitor, Lock, Globe } from 'lucide-react';

export function PrivacySection() {
  return (
    <section
      id="privacy"
      className="py-20 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="bg-[#121826] border border-[#1E293B] rounded-3xl p-8 sm:p-12 flex flex-col lg:flex-row items-center gap-10">
        <div className="flex flex-col gap-4 flex-1 text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C101A] border border-[#1E293B] w-fit">
            <Shield className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">
              Privacy by Design
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
            Your data stays under your control.
          </h3>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed">
            Your memories and reminders stay on your device. Online services are used only when needed for connected features like Google Calendar synchronization. No background tracking, no advertising, no sold data.
          </p>

          <div className="pt-2 flex flex-wrap gap-3 text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0C101A] border border-[#1E293B]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Local-first architecture
            </span>
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0C101A] border border-[#1E293B]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
              Zero telemetry selling
            </span>
          </div>
        </div>

        <div className="w-full lg:w-[440px] bg-[#0C1220] border border-[#1E293B] rounded-2xl p-6 flex flex-col gap-5">
          {/* Step 1 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">Your Device</h4>
              <p className="text-[11px] text-[#94A3B8]">Local audio intake &amp; transcription</p>
            </div>
          </div>

          {/* Connecting line */}
          <div className="h-4 ml-5 border-l-2 border-dashed border-[#38BDF8]/40" />

          {/* Step 2 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#121A2C] border border-[#38BDF8] flex items-center justify-center text-[#38BDF8] shrink-0 shadow-[0_0_14px_rgba(56,189,248,0.25)]">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#38BDF8]">Stored Locally</h4>
              <p className="text-[11px] text-[#94A3B8]">Personal memories &amp; reminder lists</p>
            </div>
          </div>

          {/* Connecting line */}
          <div className="h-4 ml-5 border-l-2 border-dashed border-[#1E293B]" />

          {/* Step 3 */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#94A3B8] shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#F8FAFC]">Online Only When Needed</h4>
              <p className="text-[11px] text-[#94A3B8]">Explicit Google Calendar syncing</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
