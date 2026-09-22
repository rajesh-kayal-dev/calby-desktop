'use client';

import { ArrowRight, ExternalLink } from 'lucide-react';
import { Orb } from '@/components/ui/Orb';
import { GITHUB_REPO_URL } from '@/lib/constants/navigation';

export function FinalCta() {
  return (
    <section
      id="download-final"
      className="py-24 px-4 sm:px-8 max-w-4xl mx-auto text-center flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 max-w-lg mx-auto bg-[#2563EB]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <Orb size="xl" className="mb-6 shadow-[0_0_35px_rgba(56,189,248,0.5)]" />

        <h2 className="text-3xl sm:text-5xl font-bold text-[#F8FAFC] tracking-tight mb-4">
          Experience Calby on your desktop.
        </h2>

        <p className="text-base sm:text-lg text-[#94A3B8] mb-8 max-w-lg">
          A calmer way to remember, plan, and get things done.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3.5 mb-4">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-8 bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <span>Download Calby — Free</span>
            <ArrowRight className="w-4 h-4 stroke-[2.5]" />
          </a>

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-12 px-6 bg-[#0C101A] hover:bg-[#121826] border border-[#1E293B] text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all hover:border-[#38BDF8]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
          </a>
        </div>

        <span className="text-xs text-[#94A3B8] font-medium tracking-wide">
          Available for Windows (10 &amp; 11) • macOS coming later
        </span>
      </div>
    </section>
  );
}
