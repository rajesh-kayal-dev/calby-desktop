import { type FC } from 'react'
import type { SystemInfo } from '../types'

interface AboutSettingsProps {
  systemInfo: SystemInfo | null
}

const GithubIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
  </svg>
)

const ExternalLinkIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
    <polyline points="15 3 21 3 21 9" />
    <line x1="10" y1="14" x2="21" y2="3" />
  </svg>
)

const ShieldCheckIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const REPO_URL = 'https://github.com/rajesh-kayal-dev/calby-desktop.git'

const CalbyLogoIcon = () => (
  <svg width="24" height="20" viewBox="0 0 24 20" fill="#38BDF8" aria-hidden="true">
    <rect x="0" y="6" width="3" height="8" rx="1.5" />
    <rect x="5" y="2" width="3" height="16" rx="1.5" />
    <rect x="10" y="0" width="3" height="20" rx="1.5" />
    <rect x="15" y="4" width="3" height="12" rx="1.5" />
    <rect x="20" y="7" width="3" height="6" rx="1.5" />
  </svg>
)

// Workflow Diagram SVG Icons matching the reference image
const MicIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
    <path d="M19 10v2a7 7 0 01-14 0v-2" />
    <line x1="12" y1="19" x2="12" y2="23" />
    <line x1="8" y1="23" x2="16" y2="23" />
  </svg>
)

const BrainIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 007 4.5v.7A3 3 0 004 8c0 1.2.7 2.2 1.7 2.7A3 3 0 004 13.5c0 1.2.7 2.2 1.7 2.7-.2.6-.2 1.3 0 1.8A2.5 2.5 0 008.2 20h.8a2.5 2.5 0 002.5-2.5V4.5A2.5 2.5 0 009.5 2z" />
    <path d="M14.5 2a2.5 2.5 0 012.5 2.5v.7A3 3 0 0120 8c0 1.2-.7 2.2-1.7 2.7A3 3 0 0120 13.5c0 1.2-.7 2.2-1.7 2.7.2.6.2 1.3 0 1.8a2.5 2.5 0 01-2.5 2h-.8a2.5 2.5 0 01-2.5-2.5V4.5A2.5 2.5 0 0114.5 2z" />
  </svg>
)

const ZapIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const CheckCircleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const DeviceIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="8" y1="21" x2="16" y2="21" />
    <line x1="12" y1="17" x2="12" y2="21" />
  </svg>
)

const DatabaseIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="12" cy="5" rx="9" ry="3" />
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
  </svg>
)

const CloudIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z" />
  </svg>
)

// Glow Node Component
interface WorkflowNodeProps {
  icon: React.ReactNode
  label: string
  color: string
  glowColor: string
}

const WorkflowNode: FC<WorkflowNodeProps> = ({ icon, label, color, glowColor }) => (
  <div className="flex flex-col items-center gap-2.5 shrink-0 z-10">
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center border-2 bg-[#0B0F17]/90 transition-all duration-300 hover:scale-105"
      style={{
        borderColor: color,
        boxShadow: `0 0 18px ${glowColor}, inset 0 0 8px ${glowColor}`
      }}
    >
      <div style={{ color }}>{icon}</div>
    </div>
    <span className="text-xs font-medium text-slate-200 text-center whitespace-nowrap">
      {label}
    </span>
  </div>
)

// Gradient Arrow Connector
interface GradientArrowProps {
  id: string
  fromColor: string
  toColor: string
}

const GradientArrow: FC<GradientArrowProps> = ({ id, fromColor, toColor }) => (
  <div className="flex-1 flex items-center justify-center min-w-[32px] max-w-[110px] px-1 -mt-6">
    <svg className="w-full h-5" viewBox="0 0 100 24" fill="none" preserveAspectRatio="none">
      <defs>
        <linearGradient id={id} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={fromColor} />
          <stop offset="100%" stopColor={toColor} />
        </linearGradient>
      </defs>
      <line x1="2" y1="12" x2="86" y2="12" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M80 6L92 12L80 18" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  </div>
)

export const AboutSettings: FC<AboutSettingsProps> = ({ systemInfo }) => {
  const openUrl = (url: string) => {
    if (window.calby?.system?.openExternal) {
      void window.calby.system.openExternal(url)
    } else {
      window.open(url, '_blank')
    }
  }

  const appVersion = systemInfo?.version || '1.0.0'

  return (
    <div data-testid="about-settings" className="space-y-6">
      {/* App Identity Card */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#38BDF8]/10 border border-[#38BDF8]/30 flex items-center justify-center">
            <CalbyLogoIcon />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold" style={{ color: 'var(--ds-text-primary)' }}>
                Calby
              </h3>
              <span data-testid="app-version" className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono">
                v{appVersion}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: 'var(--ds-text-secondary)' }}>
              Your personal desktop voice assistant
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-0.5 opacity-40">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0110 0v4" />
          </svg>
          <span className="text-[8px] font-medium tracking-widest uppercase text-white">Safe & Secure</span>
        </div>
      </div>

      {/* How Calby Works - Reference Image Exact Design */}
      <div className="p-6 rounded-2xl bg-[#070A10] border border-white/10 space-y-9 overflow-x-auto">
        {/* Row 1 */}
        <div className="flex items-center justify-between min-w-[540px] px-2">
          <WorkflowNode icon={<MicIcon />} label="You speak" color="#38BDF8" glowColor="rgba(56, 189, 248, 0.35)" />
          <GradientArrow id="arrow1" fromColor="#38BDF8" toColor="#EC4899" />
          <WorkflowNode icon={<BrainIcon />} label="Calby understands" color="#EC4899" glowColor="rgba(236, 72, 153, 0.35)" />
          <GradientArrow id="arrow2" fromColor="#EC4899" toColor="#F59E0B" />
          <WorkflowNode icon={<ZapIcon />} label="Calby acts" color="#F59E0B" glowColor="rgba(245, 158, 11, 0.35)" />
          <GradientArrow id="arrow3" fromColor="#F59E0B" toColor="#10B981" />
          <WorkflowNode icon={<CheckCircleIcon />} label="You get the result" color="#10B981" glowColor="rgba(16, 185, 129, 0.35)" />
        </div>

        {/* Row 2 */}
        <div className="flex items-center justify-center min-w-[540px] px-6">
          <div className="flex items-center justify-between w-[78%]">
            <WorkflowNode icon={<DeviceIcon />} label="Your device" color="#38BDF8" glowColor="rgba(56, 189, 248, 0.35)" />
            <GradientArrow id="arrow4" fromColor="#38BDF8" toColor="#10B981" />
            <WorkflowNode icon={<DatabaseIcon />} label="Stored locally" color="#10B981" glowColor="rgba(16, 185, 129, 0.35)" />
            <GradientArrow id="arrow5" fromColor="#10B981" toColor="#A855F7" />
            <WorkflowNode icon={<CloudIcon />} label="Online when needed" color="#A855F7" glowColor="rgba(168, 85, 247, 0.35)" />
          </div>
        </div>
      </div>

      {/* GitHub Repository Actions */}
      <div className="p-5 rounded-2xl bg-[#11151F]/90 border border-white/10 space-y-3">
        <div className="flex items-center gap-2.5">
          <GithubIcon />
          <h4 className="text-sm font-bold text-white">
            Open source
          </h4>
        </div>

        <p className="text-xs text-slate-400">
          Calby is built in public and welcomes feedback, ideas, and contributions.
        </p>

        <div className="p-3 rounded-xl bg-black/40 border border-white/5 font-mono text-xs text-slate-400 break-all select-all">
          {REPO_URL}
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            type="button"
            data-testid="github-view-source"
            onClick={() => openUrl(REPO_URL)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-[#2563EB] hover:bg-[#1D4ED8] text-white transition-colors cursor-pointer"
          >
            View source <ExternalLinkIcon />
          </button>
          <button
            type="button"
            data-testid="github-star"
            onClick={() => openUrl(REPO_URL)}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-amber-300 transition-colors cursor-pointer"
          >
            ★ Star on GitHub <ExternalLinkIcon />
          </button>
          <button
            type="button"
            data-testid="github-fork"
            onClick={() => openUrl(REPO_URL.replace('.git', '/fork'))}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold bg-white/10 hover:bg-white/15 text-white transition-colors cursor-pointer"
          >
            Fork on GitHub <ExternalLinkIcon />
          </button>
        </div>
      </div>

      {/* Privacy Section */}
      <div className="p-5 rounded-xl bg-white/5 border border-white/10 space-y-2.5">
        <div className="flex items-center gap-2">
          <ShieldCheckIcon />
          <h4 className="text-sm font-semibold text-slate-200">
            Your data stays on your device
          </h4>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed">
          Calby ensures all your personal data and settings stay 100% local and secure on your machine.
        </p>
      </div>

      {/* Developer Credit */}
      <div className="text-right pt-2 pr-1">
        <span className="text-[11px] text-slate-500/60 font-medium">
          Built by Rajesh
        </span>
      </div>
    </div>
  )
}
