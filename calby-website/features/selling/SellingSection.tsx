'use client';

import { ArrowRight, Sparkles, Check, Laptop, Shield } from 'lucide-react';

export function SellingSection() {
  return (
    <section
      id="pricing"
      className="py-20 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="bg-gradient-to-b from-[#0C101A] to-[#121826] border border-[#1E293B] rounded-3xl p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 right-1/4 w-72 h-72 bg-[#2563EB]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#121826] border border-[#1E293B] mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#38BDF8]" />
            <span className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">
              CALBY — FREE DESKTOP ASSISTANT
            </span>
          </div>

          <h3 className="text-3xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-4">
            Your day, without the busywork.
          </h3>

          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-3">
            No subscription is required to use Calby&apos;s core desktop experience.
          </p>
          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-6">
            Download Calby once and keep your reminders, memories, and desktop workflow close at hand.
          </p>

          <div className="bg-[#070A11]/70 border border-[#1E293B] rounded-2xl p-4 sm:p-5 text-xs sm:text-sm text-[#F8FAFC] leading-relaxed mb-8 max-w-xl">
            Instead of constantly switching between apps to remember, plan, and check what&apos;s next, talk to Calby.
          </div>

          <div className="flex flex-col items-center gap-2">
            <a
              href="#download-final"
              className="h-12 px-8 bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.35)] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <span>Download Calby — Free</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </a>
            <span className="text-xs text-[#64748B] font-mono">Windows desktop</span>
          </div>
        </div>

        {/* Ownership / Local-First Message */}
        <div className="pt-8 border-t border-[#1E293B]/70 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          <div>
            <div className="flex items-center gap-2 mb-2 text-[#38BDF8]">
              <Laptop className="w-4 h-4" />
              <h4 className="text-sm font-bold text-[#F8FAFC]">
                Your reminders and memories stay with your device.
              </h4>
            </div>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Calby is designed local-first: your everyday local data remains available on your computer, while online services are used only when a feature needs them.
            </p>
          </div>

          <div className="bg-[#070A11] border border-[#1E293B] rounded-xl p-4 text-xs text-[#94A3B8] flex items-start gap-3">
            <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#F8FAFC]">No account required</span>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                No account is required for the core local reminder and memory experience unless future product requirements introduce one.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
