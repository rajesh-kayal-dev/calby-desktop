'use client';

import { Fragment, useEffect, useState } from 'react';
import { Settings, X } from 'lucide-react';
import { CalbyLogo } from '@/components/brand/CalbyLogo';
import { Waveform } from '@/components/ui/Waveform';

const QUICK_VOICE_STEPS = [
  'Press the shortcut.',
  'Speak naturally.',
  'Calby understands what you want.',
  'Calby completes the task.',
  "Quick Voice closes when you're done."
];

/** Shortcut rows shown right under the Quick Voice copy. */
const SHORTCUTS = [
  { id: 'windows-linux', label: 'Windows / Linux', keys: ['Ctrl', 'Shift', 'C'] },
  { id: 'macos', label: 'macOS', keys: ['⌘', 'Shift', 'C'] }
];

/** Best-effort check so the visitor's own shortcut reads first. */
function useIsMac() {
  const [isMac, setIsMac] = useState(false);

  useEffect(() => {
    setIsMac(/macintosh|mac os x/i.test(navigator.userAgent));
  }, []);

  return isMac;
}

/**
 * Static mockup of the real Quick Voice window: a short, wide floating bar.
 * Matches the desktop overlay (logo, waveform, status, timer, settings, close).
 */
function QuickVoiceMockup() {
  return (
    <div className="w-full max-w-[440px]">
      <div className="rounded-2xl border border-white/10 bg-[linear-gradient(145deg,rgba(16,28,46,0.97),rgba(5,10,18,0.98))] shadow-[0_18px_50px_rgba(0,0,0,0.6),0_0_40px_rgba(56,189,248,0.1)] backdrop-blur-xl overflow-hidden">
        {/* Header */}
        <div className="flex h-8 items-center justify-between px-3 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="flex h-4.5 w-4.5 items-center justify-center rounded-md bg-[#38BDF8]/10">
              <CalbyLogo variant="glyph" className="h-3 w-3" />
            </span>
            <span className="text-[11px] font-semibold tracking-tight text-slate-100">Calby</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-mono text-[10px] tabular-nums text-slate-500">0:04</span>
            <button
              type="button"
              aria-label="Quick Voice settings"
              className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
            >
              <Settings className="h-3 w-3" />
            </button>
            <button
              type="button"
              aria-label="Close Quick Voice"
              className="flex h-5 w-5 items-center justify-center rounded text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="beacon-pulse absolute inline-flex h-full w-full rounded-full bg-[#38BDF8] opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]" />
            </span>
            <Waveform active barCount={9} />
            <span className="text-[11px] font-medium text-slate-200">Listening...</span>
          </div>
          <p className="mt-1.5 text-[10px] leading-relaxed text-slate-500">
            <span className="text-slate-600">What Calby heard:</span>{' '}
            <span className="text-slate-300">&ldquo;Remind me to call Rahul&rdquo;</span>
          </p>
        </div>
      </div>
    </div>
  );
}

function KeyCombo({ keys }: { keys: string[] }) {
  return (
    <span className="flex items-center gap-1">
      {keys.map((key, index) => (
        <Fragment key={key}>
          {index > 0 && <span className="text-[10px] text-slate-600">+</span>}
          <kbd className="min-w-6 px-1.5 py-1 rounded-md border border-[#1E293B] bg-[#101625] font-mono text-[11px] font-semibold text-[#F8FAFC] text-center shadow-[0_1px_0_rgba(255,255,255,0.05)]">
            {key}
          </kbd>
        </Fragment>
      ))}
    </span>
  );
}

/** Compact shortcut reference — both platforms, the visitor's row highlighted. */
function ShortcutCard({ isMac }: { isMac: boolean }) {
  return (
    <div className="w-full max-w-md mb-6 rounded-xl border border-[#1E293B] bg-[#0C101A] px-4 py-3.5">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
          Keyboard shortcut
        </span>
      </div>

      <div className="flex flex-col gap-1.5">
        {SHORTCUTS.map((shortcut) => {
          const isCurrent = (shortcut.id === 'macos') === isMac;

          return (
            <div
              key={shortcut.id}
              className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 border transition-colors ${
                isCurrent
                  ? 'border-[#38BDF8]/35 bg-[#38BDF8]/[0.07]'
                  : 'border-transparent bg-white/[0.02]'
              }`}
            >
              <span className="text-xs text-[#94A3B8]">{shortcut.label}</span>
              <KeyCombo keys={shortcut.keys} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function QuickVoiceSection() {
  const isMac = useIsMac();

  return (
    <section id="quick-voice" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 items-center">
        <div>
          <span className="text-xs text-[#38BDF8] uppercase font-bold tracking-wider mb-2 block">
            Quick Voice
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-3">
            Talk to Calby from anywhere.
          </h2>
          <p className="text-sm sm:text-base text-[#94A3B8] leading-relaxed mb-4 max-w-md">
            Open Quick Voice instantly with a keyboard shortcut — no need to open the main app.
          </p>

          <ShortcutCard isMac={isMac} />

          <ul className="space-y-2.5">
            {QUICK_VOICE_STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-2.5 text-sm text-[#94A3B8]">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 flex items-center justify-center text-[9px] font-bold text-[#38BDF8] shrink-0">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex justify-center lg:justify-end">
          <div className="absolute inset-x-6 top-1/2 -translate-y-1/2 h-20 bg-[#38BDF8]/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative">
            <QuickVoiceMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
