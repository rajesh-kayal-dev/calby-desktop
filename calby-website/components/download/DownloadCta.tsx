'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, ChevronRight, Download, Monitor } from 'lucide-react';
import {
  PLATFORMS,
  RELEASE_URL,
  assetUrl,
  type OptionId,
  type PlatformId
} from '@/lib/constants/downloads';
import { guessMacOption, guessPlatform } from '@/lib/utils/platform';

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M3 5.5 10.5 4.4v7.1H3V5.5zM11.5 4.2 21 3v8.5h-9.5V4.2zM3 12.5h7.5v7.1L3 18.5v-6zM11.5 12.5H21V21l-9.5-1.3v-7.2z" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.05 12.54c-.03-2.89 2.36-4.27 2.47-4.34-1.35-1.97-3.44-2.24-4.18-2.27-1.78-.18-3.47 1.05-4.37 1.05-.9 0-2.29-1.02-3.77-1-1.94.03-3.72 1.13-4.72 2.86-2.01 3.49-.51 8.66 1.45 11.5.96 1.39 2.1 2.95 3.6 2.89 1.45-.06 2-.93 3.74-.93s2.24.93 3.77.9c1.56-.03 2.55-1.41 3.5-2.8 1.1-1.61 1.55-3.17 1.58-3.25-.04-.02-3.03-1.16-3.07-4.61zM14.16 4.06c.8-.97 1.34-2.32 1.19-3.66-1.15.05-2.55.77-3.38 1.74-.74.86-1.39 2.23-1.22 3.55 1.29.1 2.6-.65 3.41-1.63z" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <ellipse cx="12" cy="14.5" rx="5.5" ry="6.5" />
      <ellipse cx="12" cy="16.5" rx="3" ry="3.8" fill="#0b111b" />
      <circle cx="12" cy="6.8" r="3.2" />
      <circle cx="10.9" cy="6.2" r="0.55" fill="#0b111b" />
      <circle cx="13.1" cy="6.2" r="0.55" fill="#0b111b" />
      <path d="M12 7.4l-1 1.3h2l-1-1.3z" fill="#f59e0b" />
      <ellipse cx="9.2" cy="21" rx="1.7" ry="0.8" fill="#f59e0b" />
      <ellipse cx="14.8" cy="21" rx="1.7" ry="0.8" fill="#f59e0b" />
    </svg>
  );
}

function PlatformGlyph({
  platformId,
  className
}: {
  platformId: PlatformId | null;
  className?: string;
}) {
  if (platformId === 'windows') return <WindowsIcon className={className} />;
  if (platformId === 'macos') return <AppleIcon className={className} />;
  if (platformId === 'linux') return <LinuxIcon className={className} />;
  return <Monitor className={className} />;
}

/** Height the expanded platform list can reach (all rows + nested options). */
const LISTBOX_HEIGHT = 264;

/**
 * Primary download button + platform selector.
 *
 * The platform is detected automatically on load and the matching installer is
 * pre-selected, so the button is always ready to use. The selector only exists
 * for visitors who want a different platform or format.
 */
export function DownloadCta() {
  const [platformId, setPlatformId] = useState<PlatformId | null>(null);
  const [optionId, setOptionId] = useState<OptionId | null>(null);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<PlatformId | null>(null);
  const [dropUp, setDropUp] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;

    const detected = guessPlatform();
    if (detected !== 'macos') {
      setPlatformId(detected);
      return () => {
        cancelled = true;
      };
    }

    void guessMacOption().then((macOption) => {
      if (cancelled) return;
      setPlatformId('macos');
      setOptionId(macOption);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // The list needs room for all three platform rows plus the nested macOS /
  // Linux formats. Measure against the viewport *and* against every ancestor
  // that clips (both CTA sections use overflow-hidden), then open on whichever
  // side really has the room so an option is never cut off or covered.
  const toggleOpen = () => {
    if (!open && rootRef.current) {
      const rect = rootRef.current.getBoundingClientRect();
      let top = 8;
      let bottom = window.innerHeight - 8;

      for (let node = rootRef.current.parentElement; node; node = node.parentElement) {
        if (node === document.body) break;
        const style = window.getComputedStyle(node);
        if (/(hidden|auto|scroll|clip)/.test(`${style.overflow}${style.overflowY}`)) {
          const box = node.getBoundingClientRect();
          top = Math.max(top, box.top + 8);
          bottom = Math.min(bottom, box.bottom - 8);
        }
      }

      const spaceBelow = bottom - rect.bottom;
      const spaceAbove = rect.top - top;
      setDropUp(spaceBelow < LISTBOX_HEIGHT && spaceAbove > spaceBelow);
    }
    setOpen((value) => !value);
  };

  const platform = PLATFORMS.find((item) => item.id === platformId) ?? null;
  const option =
    platform?.options.find((item) => item.id === optionId) ?? platform?.options[0] ?? null;

  const selectPlatform = (id: PlatformId) => {
    const target = PLATFORMS.find((item) => item.id === id);
    if (!target) return;
    setPlatformId(id);
    setOptionId(target.options[0]?.id ?? null);
    setExpanded(null);
    setOpen(false);
  };

  const selectOption = (nextPlatform: PlatformId, nextOption: OptionId) => {
    setPlatformId(nextPlatform);
    setOptionId(nextOption);
    setExpanded(null);
    setOpen(false);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <a
          href={option ? assetUrl(option.fileName) : RELEASE_URL}
          className="h-12 px-7 bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center justify-center gap-2.5 shadow-[0_0_24px_rgba(37,99,235,0.45)] hover:shadow-[0_0_30px_rgba(56,189,248,0.4)] active:scale-[0.98] transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
        >
          <PlatformGlyph platformId={platform?.id ?? null} className="w-5 h-5" />
          <span>Download Calby — Free</span>
          <Download className="w-4 h-4" />
        </a>

        <span className="hidden sm:block h-8 w-px bg-white/10" aria-hidden="true" />

        <div className="relative" ref={rootRef}>
          <button
            type="button"
            onClick={toggleOpen}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="h-12 px-4 bg-[#0C101A] hover:bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 text-[#F8FAFC] font-semibold text-sm rounded-full flex items-center gap-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] cursor-pointer"
          >
            <PlatformGlyph platformId={platform?.id ?? null} className="w-4.5 h-4.5 text-[#38BDF8]" />
            <span>{platform?.label ?? 'Select platform'}</span>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
                open ? 'rotate-180' : ''
              }`}
            />
          </button>

          {open && (
            <div
              role="listbox"
              className={`absolute left-1/2 -translate-x-1/2 ${
                dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
              } w-64 rounded-xl border border-[#1E293B] bg-[#0C101A]/95 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.6)] p-1.5 z-40`}
            >
              {PLATFORMS.map((item) => {
                const isExpanded = expanded === item.id;
                const hasOptions = item.options.length > 1;

                return (
                  <div key={item.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={platform?.id === item.id}
                      onClick={(event) => {
                        event.stopPropagation();
                        if (hasOptions) {
                          // Reveal this platform's formats. Also select the
                          // platform itself so the state stays obvious, but
                          // never overwrite a format the visitor already picked.
                          if (platform?.id !== item.id) {
                            setPlatformId(item.id);
                            setOptionId(item.options[0]?.id ?? null);
                          }
                          setExpanded(isExpanded ? null : item.id);
                        } else {
                          selectPlatform(item.id);
                        }
                      }}
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left hover:bg-white/5 transition-colors cursor-pointer"
                    >
                      <PlatformGlyph platformId={item.id} className="h-4 w-4 text-[#38BDF8]" />
                      <span className="flex-1 text-sm font-medium text-slate-100">
                        {item.label}
                      </span>
                      {hasOptions ? (
                        <ChevronRight
                          className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-200 ${
                            isExpanded ? 'rotate-90' : ''
                          }`}
                        />
                      ) : (
                        platform?.id === item.id && (
                          <Check className="h-4 w-4 text-[#38BDF8]" />
                        )
                      )}
                    </button>

                    {hasOptions && isExpanded && (
                      <div className="ml-9 mr-1 mb-1 border-l border-white/10 pl-3">
                        {item.options.map((downloadOption) => (
                          <button
                            key={downloadOption.id}
                            type="button"
                            role="option"
                            aria-selected={option?.id === downloadOption.id}
                            onClick={(event) => {
                              // The nested format rows are their own click
                              // target and must never fall through to the
                              // parent row above them.
                              event.stopPropagation();
                              selectOption(item.id, downloadOption.id);
                            }}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-white/5 transition-colors cursor-pointer"
                          >
                            <span className="flex-1">
                              <span className="block text-xs font-medium text-slate-200">
                                {downloadOption.label}
                              </span>
                              {downloadOption.note && (
                                <span className="block text-[10px] text-slate-500">
                                  {downloadOption.note}
                                </span>
                              )}
                            </span>
                            {option?.id === downloadOption.id && (
                              <Check className="h-3.5 w-3.5 text-[#38BDF8]" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <span className="text-xs text-[#64748B] font-medium tracking-wide">
        Available for Windows, macOS, and Linux.
      </span>
    </div>
  );
}
