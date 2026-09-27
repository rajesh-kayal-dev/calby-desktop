'use client';

import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { HeroProductDemo } from './HeroProductDemo';
import { DownloadCta } from '@/components/download/DownloadCta';

export function Hero() {
  return (
    <section
      id="overview"
      className="relative pt-12 sm:pt-16 pb-20 px-4 sm:px-8 max-w-5xl mx-auto flex flex-col items-center text-center overflow-hidden"
    >
      <div className="absolute top-10 w-96 h-96 bg-[#38BDF8]/10 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0C101A] border border-[#1E293B] rounded-full mb-6 relative z-10 shadow-sm"
      >
        <span className="relative flex h-2 w-2">
          <span className="beacon-pulse absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
        </span>
        <span className="text-[11px] font-semibold text-[#38BDF8] uppercase tracking-wider">
          CALBY FOR DESKTOP
        </span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#F8FAFC] leading-[1.15] mb-5 max-w-3xl relative z-10"
      >
        Meet Calby.
        <br />
        Your personal desktop assistant.
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        className="text-base sm:text-lg text-[#94A3B8] leading-relaxed mb-6 max-w-2xl relative z-10"
      >
        Talk to Calby. It remembers what matters, keeps you on schedule, and helps you get things done.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="inline-flex items-center gap-3 px-4 py-1.5 bg-[#101625] border border-[#1E293B] rounded-full mb-8 relative z-10"
      >
        <span className="text-xs font-semibold text-[#F8FAFC]">Remember</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8] flow-arrow-anim" />
        <span className="text-xs font-semibold text-[#F8FAFC]">Understand</span>
        <ArrowRight className="w-3.5 h-3.5 text-[#38BDF8] flow-arrow-anim" />
        <span className="text-xs font-semibold text-[#38BDF8]">Act</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.25 }}
        className="flex flex-col items-center mb-14 relative z-20"
        id="download"
      >
        <DownloadCta />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="w-full flex justify-center"
      >
        <HeroProductDemo />
      </motion.div>
    </section>
  );
}
