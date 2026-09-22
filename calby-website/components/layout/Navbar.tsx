'use client';

import { useState, useEffect } from 'react';
import { Download, Menu, X, Star, ArrowRight, Code } from 'lucide-react';
import { NAV_ITEMS, GITHUB_REPO_URL } from '@/lib/constants/navigation';
import { CalbyLogo } from '@/components/brand/CalbyLogo';

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      id="main-navigation"
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#070A11]/95 backdrop-blur-xl border-b border-[#1E293B] shadow-[0_10px_30px_rgba(0,0,0,0.5)]'
          : 'bg-[#070A11]/80 backdrop-blur-md border-b border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto h-16 px-4 sm:px-8 flex items-center justify-between gap-4">
        <div className="flex items-center gap-8">
          <a
            href="#overview"
            id="nav-logo"
            className="flex items-center gap-2.5 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] rounded-md"
          >
            <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-[#0C1220] border border-[#1E293B] group-hover:border-[#38BDF8]/60 shadow-[0_0_15px_rgba(56,189,248,0.15)] transition-all duration-200">
              <CalbyLogo variant="glyph" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            </div>
            <span className="font-bold text-lg tracking-tight text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors">
              Calby
            </span>
          </a>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-[#94A3B8]">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="hover:text-[#F8FAFC] transition-colors focus:outline-none focus-visible:text-[#38BDF8]"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {/* GitHub Star Pill Button matching requested design */}
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            id="nav-github-link"
            className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0C101A] hover:bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/40 transition-all text-xs font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8] group shadow-sm"
          >
            <div className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-[#F8FAFC] group-hover:text-[#38BDF8] transition-colors" />
              <span className="text-[#F8FAFC] font-semibold text-xs">GitHub</span>
            </div>
            <span className="w-px h-3.5 bg-[#1E293B] group-hover:bg-[#38BDF8]/30 transition-colors" />
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="text-[#F8FAFC] font-bold text-xs">25</span>
            </div>
          </a>

          {/* Download Calby Free Pill matching requested design */}
          <a
            href="#download-final"
            id="nav-cta-button"
            className="h-9 px-5 bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] text-xs font-semibold rounded-full flex items-center gap-2 shadow-[0_0_18px_rgba(37,99,235,0.4)] hover:shadow-[0_0_24px_rgba(56,189,248,0.4)] transition-all active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            <span>Download Calby — Free</span>
            <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
          </a>

          <button
            type="button"
            id="mobile-menu-toggle"
            aria-label="Toggle mobile menu"
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826] transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div
          id="mobile-drawer"
          className="md:hidden border-b border-[#1E293B] bg-[#0C101A]/95 backdrop-blur-2xl px-6 py-6 space-y-4"
        >
          <div className="flex flex-col space-y-3">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:translate-x-1 transition-all py-1.5"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="pt-4 border-t border-[#1E293B]/70 flex flex-col gap-3">
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="h-9 w-full bg-[#121826] border border-[#1E293B] text-xs font-semibold text-[#F8FAFC] rounded-lg flex items-center justify-center gap-2"
            >
              <Star className="w-3.5 h-3.5 text-[#38BDF8]" />
              <span>Star on GitHub</span>
            </a>
            <a
              href="#download-final"
              onClick={() => setMobileMenuOpen(false)}
              className="h-10 w-full bg-[#2563EB] hover:bg-blue-500 text-[#F8FAFC] text-sm font-semibold rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(37,99,235,0.4)]"
            >
              <Download className="w-4 h-4" />
              <span>Download Calby — Free</span>
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
