import { GITHUB_REPO_URL } from '@/lib/constants/navigation';
import { CalbyLogo } from '@/components/brand/CalbyLogo';

export function Footer() {
  return (
    <footer id="app-footer" className="px-6 sm:px-8 py-12 border-t border-[#1E293B] bg-[#0C101A]/60 mt-auto">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row items-center gap-3 text-center sm:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#0C1220] border border-[#1E293B] flex items-center justify-center shadow-sm">
              <CalbyLogo variant="glyph" className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-[#F8FAFC]">Calby</span>
          </div>
          <span className="text-xs text-[#94A3B8] sm:border-l sm:border-[#1E293B] sm:pl-3">
            Your personal desktop voice assistant.
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5 text-xs text-[#94A3B8]">
          <a href="#overview" className="hover:text-[#38BDF8] transition-colors">
            Overview
          </a>
          <a href="#features" className="hover:text-[#38BDF8] transition-colors">
            Features
          </a>
          <a href="#how-it-works" className="hover:text-[#38BDF8] transition-colors">
            How it works
          </a>
          <a href="#privacy" className="hover:text-[#38BDF8] transition-colors">
            Privacy
          </a>
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#38BDF8] transition-colors"
          >
            GitHub
          </a>
          <a href="#download-final" className="hover:text-[#38BDF8] transition-colors">
            Download Calby
          </a>
        </div>
      </div>

      <div className="max-w-5xl mx-auto mt-6 pt-6 border-t border-[#1E293B]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#64748B]">
        <span>Calby for Windows · Free local desktop assistant</span>
        <div className="flex items-center gap-4">
          <a href="#privacy" className="hover:text-[#94A3B8] transition-colors">
            Privacy
          </a>
          <span>·</span>
          <a href="#privacy" className="hover:text-[#94A3B8] transition-colors">
            Terms
          </a>
        </div>
      </div>
    </footer>
  );
}
