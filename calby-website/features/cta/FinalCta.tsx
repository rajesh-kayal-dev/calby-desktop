'use client';

import { ExternalLink } from 'lucide-react';
import { CalbyLogo } from '@/components/brand/CalbyLogo';
import { GITHUB_REPO_URL } from '@/lib/constants/navigation';
import { DownloadCta } from '@/components/download/DownloadCta';

export function FinalCta() {
  return (
    <section
      id="download-final"
      className="py-24 px-4 sm:px-8 max-w-4xl mx-auto text-center flex flex-col items-center relative overflow-hidden"
    >
      <div className="absolute inset-0 max-w-lg mx-auto bg-[#2563EB]/15 blur-3xl rounded-full pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#1E293B] bg-[#0C1220] shadow-[0_0_35px_rgba(56,189,248,0.5)]">
          <CalbyLogo variant="glyph" className="h-8 w-8" />
        </div>

        <h2 className="text-3xl sm:text-5xl font-bold text-[#F8FAFC] tracking-tight mb-4">
          Experience Calby on your desktop.
        </h2>

        <p className="text-base sm:text-lg text-[#94A3B8] mb-8 max-w-lg">
          A calmer way to remember, plan, and get things done.
        </p>

        <div className="flex flex-col items-center gap-4 mb-4">
          <DownloadCta />

          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="h-11 px-6 bg-[#0C101A] hover:bg-[#121826] border border-[#1E293B] text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center justify-center gap-2 transition-all hover:border-[#38BDF8]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <span>View on GitHub</span>
            <ExternalLink className="w-3.5 h-3.5 text-[#38BDF8]" />
          </a>
        </div>
      </div>
    </section>
  );
}
