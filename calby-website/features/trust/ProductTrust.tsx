'use client';

import { HardDrive, Brain, BellOff, ShieldCheck } from 'lucide-react';

export function ProductTrust() {
  const trustPoints = [
    {
      title: 'Local-first',
      description: 'Your memories and reminders stay on your device.',
      icon: HardDrive,
    },
    {
      title: 'Explicit memory',
      description: 'Calby remembers things when you ask it to.',
      icon: Brain,
    },
    {
      title: 'Offline reminders',
      description: 'Local reminders can still alert you without Gemini.',
      icon: BellOff,
    },
  ];

  return (
    <section
      id="trust"
      className="py-16 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="flex flex-col mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0C101A] border border-[#1E293B] w-fit mx-auto sm:mx-0 mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-[#38BDF8]" />
          <span className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">
            Factual Commitments
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-[#F8FAFC] tracking-tight">
          Built on direct, transparent principles.
        </h3>
        <p className="text-sm text-[#94A3B8] mt-1 max-w-xl">
          No artificial ratings, manufactured metrics, or hidden telemetry models.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {trustPoints.map((point) => {
          const Icon = point.icon;
          return (
            <div
              key={point.title}
              className="bg-[#0C101A] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all duration-300 p-6 rounded-2xl flex flex-col justify-between group"
            >
              <div>
                <div className="w-10 h-10 rounded-xl bg-[#121826] border border-[#1E293B] group-hover:border-[#38BDF8]/40 flex items-center justify-center text-[#38BDF8] mb-4 transition-colors">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-[#F8FAFC] mb-2">{point.title}</h4>
                <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
                  {point.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-[#1E293B]/70 flex items-center gap-1.5 text-[11px] text-[#64748B]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Verified architecture</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
