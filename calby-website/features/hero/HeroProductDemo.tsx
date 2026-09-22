'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Home,
  Bell,
  Calendar,
  Lightbulb,
  Settings,
  X,
  Keyboard,
  Check,
  Sparkles,
  User,
  Mic,
  Link2,
  Shield,
  Info,
  LogOut,
  ArrowLeft,
  ExternalLink,
  SlidersHorizontal,
  Volume2,
} from 'lucide-react';
import { CalbyLogo } from '@/components/brand/CalbyLogo';

type AppTab = 'home' | 'reminders' | 'calendar' | 'memory';
type DemoStage = 'idle' | 'listening' | 'transcribing' | 'action' | 'done';
type SettingsSection =
  | 'general'
  | 'ai'
  | 'personalize'
  | 'voice'
  | 'reminders'
  | 'connect'
  | 'privacy'
  | 'about';

const ROTATING_GREETINGS = [
  'How can I help you today?',
  "What's on your mind?",
  "What's your today's important task?",
  'What are we working on?',
  'Anything you want me to remember?',
  'Need to schedule or set a reminder?',
];

export function HeroProductDemo() {
  const [activeTab, setActiveTab] = useState<AppTab>('home');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [activeSettingsSection, setActiveSettingsSection] = useState<SettingsSection>('general');
  const [stage, setStage] = useState<DemoStage>('listening');
  const [dismissNotification, setDismissNotification] = useState(false);
  const [greetingIndex, setGreetingIndex] = useState(0);

  // Settings interactive toggles state matching reference screenshot
  const [settingsToggles, setSettingsToggles] = useState({
    startWithComputer: true,
    keepRunningBackground: true,
    closeToTray: true,
    allowNotifications: true,
    offlineSpeech: true,
    localEncryption: true,
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Rotate greeting every 5 seconds as requested
  useEffect(() => {
    if (isSettingsOpen || activeTab !== 'home') return;

    const interval = setInterval(() => {
      setGreetingIndex((prev) => (prev + 1) % ROTATING_GREETINGS.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isSettingsOpen, activeTab]);

  // Spacebar interactive hotkey
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT') {
        if (containerRef.current && containerRef.current.contains(document.activeElement)) {
          e.preventDefault();
          if (isSettingsOpen) {
            setIsSettingsOpen(false);
          } else {
            setStage((prev) => (prev === 'listening' ? 'idle' : 'listening'));
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen]);

  const triggerNextStage = () => {
    setStage((prev) => {
      switch (prev) {
        case 'idle':
          return 'listening';
        case 'listening':
          return 'transcribing';
        case 'transcribing':
          return 'action';
        case 'action':
          return 'done';
        case 'done':
          return 'idle';
        default:
          return 'listening';
      }
    });
  };

  const toggleSetting = (key: keyof typeof settingsToggles) => {
    setSettingsToggles((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  return (
    <div
      ref={containerRef}
      id="calby-hero-app-mockup"
      tabIndex={0}
      className="w-full max-w-4xl relative rounded-2xl p-2 bg-[#070A11] border border-[#1E293B] shadow-[0_25px_70px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 hover:border-[#38BDF8]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
      aria-label="Calby Interactive Desktop Software"
    >
      {/* Top Application Bar matching actual Calby Software */}
      <div className="flex items-center justify-between px-3 sm:px-5 py-3 border-b border-[#1E293B]/70 bg-[#070A11] rounded-t-xl select-none">
        {/* Left: Waveform Logo & Navigation Tabs */}
        <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto no-scrollbar">
          {/* Calby Ribbon Brand Icon */}
          <button
            type="button"
            onClick={() => {
              setIsSettingsOpen(false);
              setActiveTab('home');
            }}
            className="flex items-center gap-2.5 shrink-0 group text-left"
          >
            <CalbyLogo variant="glyph" className="w-5 h-5 group-hover:scale-110 transition-transform duration-200" />
            <span className="font-bold text-sm sm:text-base text-[#F8FAFC] tracking-tight group-hover:text-[#38BDF8] transition-colors">
              Calby
            </span>
          </button>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveTab('home');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isSettingsOpen && activeTab === 'home'
                  ? 'bg-[#121826] text-[#F8FAFC] border border-[#1E293B] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]/50'
              }`}
            >
              <Home className={`w-3.5 h-3.5 ${!isSettingsOpen && activeTab === 'home' ? 'text-[#38BDF8]' : ''}`} />
              <span>Home</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveTab('reminders');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isSettingsOpen && activeTab === 'reminders'
                  ? 'bg-[#121826] text-[#F8FAFC] border border-[#1E293B] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]/50'
              }`}
            >
              <Bell className={`w-3.5 h-3.5 ${!isSettingsOpen && activeTab === 'reminders' ? 'text-[#38BDF8]' : ''}`} />
              <span>Reminders</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveTab('calendar');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isSettingsOpen && activeTab === 'calendar'
                  ? 'bg-[#121826] text-[#F8FAFC] border border-[#1E293B] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]/50'
              }`}
            >
              <Calendar className={`w-3.5 h-3.5 ${!isSettingsOpen && activeTab === 'calendar' ? 'text-[#38BDF8]' : ''}`} />
              <span>Calendar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSettingsOpen(false);
                setActiveTab('memory');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !isSettingsOpen && activeTab === 'memory'
                  ? 'bg-[#121826] text-[#F8FAFC] border border-[#1E293B] shadow-sm'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]/50'
              }`}
            >
              <Lightbulb className={`w-3.5 h-3.5 ${!isSettingsOpen && activeTab === 'memory' ? 'text-[#38BDF8]' : ''}`} />
              <span>Memory</span>
            </button>
          </div>
        </div>

        {/* Right: Green Online Status & Settings Button */}
        <div className="flex items-center gap-3 shrink-0 ml-2">
          <div className="flex items-center gap-1.5" title="Calby Desktop Engine: Connected">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 shadow-[0_0_8px_#10B981]" />
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            className={`p-1.5 rounded-md transition-colors ${
              isSettingsOpen
                ? 'text-[#38BDF8] bg-[#121826] border border-[#38BDF8]/40'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]'
            }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Window Canvas: toggles between Workspace & Settings View */}
      {isSettingsOpen ? (
        /* SETTINGS VIEW (Exactly matching user reference image) */
        <motion.div
          key="settings-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="relative min-h-[480px] sm:min-h-[520px] bg-[#070A11] rounded-b-xl flex flex-col md:flex-row overflow-hidden border-t border-[#1E293B]/60"
        >
          {/* Settings Left Sidebar */}
          <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#1E293B]/70 p-4 sm:p-5 flex flex-col justify-between shrink-0 bg-[#070A11]">
            <div>
              {/* Header with back button */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Settings</h3>
                  <p className="text-xs text-[#64748B]">Preferences</p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSettingsOpen(false)}
                  className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826] transition-colors"
                  title="Back to home"
                  aria-label="Back to home"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Items */}
              <div className="flex flex-col gap-1">
                {[
                  { id: 'general', label: 'General', icon: SlidersHorizontal },
                  { id: 'ai', label: 'AI', icon: Sparkles },
                  { id: 'personalize', label: 'Personalize', icon: User },
                  { id: 'voice', label: 'Voice & Microphone', icon: Mic },
                  { id: 'reminders', label: 'Reminders', icon: Bell },
                  { id: 'connect', label: 'Connect', icon: Link2 },
                  { id: 'privacy', label: 'Privacy', icon: Shield },
                  { id: 'about', label: 'About', icon: Info },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = activeSettingsSection === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveSettingsSection(item.id as SettingsSection)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                        isSelected
                          ? 'bg-[#2563EB] text-white shadow-md'
                          : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-[#64748B]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Sign out & reset */}
            <div className="pt-4 border-t border-[#1E293B]/60 mt-4">
              <button
                type="button"
                onClick={() => {
                  setSettingsToggles({
                    startWithComputer: true,
                    keepRunningBackground: true,
                    closeToTray: true,
                    allowNotifications: true,
                    offlineSpeech: true,
                    localEncryption: true,
                  });
                }}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 text-xs text-[#94A3B8] hover:text-[#EF4444] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out & reset</span>
              </button>
            </div>
          </div>

          {/* Settings Right Main Content Panel */}
          <div className="flex-1 p-5 sm:p-8 overflow-y-auto max-h-[520px]">
            {activeSettingsSection === 'general' && (
              <motion.div
                key="sec-general"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-xl flex flex-col gap-6"
              >
                {/* Header */}
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] tracking-tight">
                    General
                  </h2>
                  <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                    Simple app-level preferences and notification controls.
                  </p>
                </div>

                {/* App Behavior Section */}
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-wide">
                    App behavior
                  </h3>
                  <div className="bg-[#0C1220]/80 border border-[#1E293B] rounded-2xl p-4 flex flex-col gap-4">
                    {/* Toggle: Start Calby with computer */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col text-left">
                        <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                          Start Calby with your computer
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#94A3B8]">
                          Automatically open Calby when you log into your system.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSetting('startWithComputer')}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          settingsToggles.startWithComputer ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
                        }`}
                        aria-label="Toggle start with computer"
                      >
                        <motion.span
                          layout
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            settingsToggles.startWithComputer ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px bg-[#1E293B]/60" />

                    {/* Toggle: Keep Calby running in background */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col text-left">
                        <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                          Keep Calby running in background
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#94A3B8]">
                          Maintain voice listening readiness and global hotkeys.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSetting('keepRunningBackground')}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          settingsToggles.keepRunningBackground ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
                        }`}
                        aria-label="Toggle keep running in background"
                      >
                        <motion.span
                          layout
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            settingsToggles.keepRunningBackground ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="h-px bg-[#1E293B]/60" />

                    {/* Toggle: Close to tray */}
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col text-left">
                        <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                          Close to tray
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#94A3B8]">
                          Minimize to the system tray instead of exiting when closing the main window.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSetting('closeToTray')}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          settingsToggles.closeToTray ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
                        }`}
                        aria-label="Toggle close to tray"
                      >
                        <motion.span
                          layout
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            settingsToggles.closeToTray ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Notifications Section */}
                <div className="flex flex-col gap-2.5">
                  <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-wide">
                    Notifications
                  </h3>
                  <div className="bg-[#0C1220]/80 border border-[#1E293B] rounded-2xl p-4 flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col text-left">
                        <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                          Allow desktop notifications
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#94A3B8]">
                          Receive desktop banners for reminders and upcoming schedule alerts.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSetting('allowNotifications')}
                        className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                          settingsToggles.allowNotifications ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
                        }`}
                        aria-label="Toggle allow notifications"
                      >
                        <motion.span
                          layout
                          className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                            settingsToggles.allowNotifications ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    <a
                      href="#open-notification-settings"
                      onClick={(e) => e.preventDefault()}
                      className="inline-flex items-center gap-1.5 text-xs text-[#38BDF8] hover:underline w-fit pt-1"
                    >
                      <span>Open system notification settings</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>

                {/* Offline Section */}
                <div className="flex flex-col gap-2.5 pb-4">
                  <h3 className="text-xs font-semibold text-[#F8FAFC] tracking-wide">
                    Offline
                  </h3>
                  <div className="bg-[#0C1220]/80 border border-[#1E293B] rounded-2xl p-4 flex items-center justify-between gap-4">
                    <div className="flex flex-col text-left">
                      <span className="text-xs sm:text-sm font-semibold text-[#F8FAFC]">
                        Local speech recognition engine
                      </span>
                      <span className="text-[11px] sm:text-xs text-[#94A3B8]">
                        Enables voice transcription and local parsing without cloud reliance.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleSetting('offlineSpeech')}
                      className={`w-11 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                        settingsToggles.offlineSpeech ? 'bg-[#2563EB]' : 'bg-[#1E293B]'
                      }`}
                      aria-label="Toggle offline speech engine"
                    >
                      <motion.span
                        layout
                        className={`block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                          settingsToggles.offlineSpeech ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeSettingsSection !== 'general' && (
              <div className="flex flex-col gap-4 text-left max-w-xl">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-[#F8FAFC] capitalize tracking-tight">
                    {activeSettingsSection} Settings
                  </h2>
                  <p className="text-xs sm:text-sm text-[#94A3B8] mt-0.5">
                    Configure your {activeSettingsSection} preferences and desktop integration.
                  </p>
                </div>
                <div className="bg-[#0C1220]/80 border border-[#1E293B] rounded-2xl p-5 text-xs text-[#94A3B8]">
                  <p className="text-[#F8FAFC] font-medium mb-1">
                    Calby operates entirely on your Windows PC.
                  </p>
                  <p>
                    All hotkeys, microphone streams, and notification listeners run in the native
                    system tray.
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        /* MAIN WORKSPACE VIEW (Cleaned up, no name, no bottom line, rotating message every 5s) */
        <div className="relative min-h-[420px] sm:min-h-[460px] bg-[#070A11] rounded-b-xl flex flex-col items-center justify-between p-4 sm:p-8 overflow-hidden">
          {/* Subtle radial ambient glow */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(56,189,248,0.06),transparent_65%)] pointer-events-none" />

          {/* Top-Right Notification Card (Calby Meeting Reminder) */}
          <AnimatePresence>
            {!dismissNotification && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -8 }}
                className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 bg-[#0B101D]/90 backdrop-blur-md border border-[#1E293B] rounded-xl px-3.5 py-2.5 shadow-[0_10px_25px_rgba(0,0,0,0.6)] flex flex-col gap-0.5 text-left min-w-[170px] max-w-[210px] group hover:border-[#38BDF8]/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-semibold text-[#38BDF8] tracking-wide">
                    Tomorrow · 2:00 AM
                  </span>
                  <button
                    type="button"
                    onClick={() => setDismissNotification(true)}
                    className="text-[#64748B] hover:text-[#94A3B8] transition-colors p-0.5"
                    title="Dismiss notification"
                    aria-label="Dismiss notification"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <span className="text-xs sm:text-sm font-bold text-[#F8FAFC] truncate">
                  Calby test Meting
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center Primary Content */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-auto z-10 relative text-center max-w-lg">
            {activeTab === 'home' && (
              <motion.div
                key="tab-home"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center"
              >
                {/* Main Headline: changes smoothly every 5 seconds without personal name */}
                <div className="h-12 sm:h-14 flex items-center justify-center">
                  <AnimatePresence mode="wait">
                    <motion.h2
                      key={greetingIndex}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="text-2xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-1"
                    >
                      {ROTATING_GREETINGS[greetingIndex]}
                    </motion.h2>
                  </AnimatePresence>
                </div>

                {/* Subheading / Interactive Transcript */}
                <p className="text-xs sm:text-sm text-[#94A3B8] max-w-md transition-all h-6">
                  {stage === 'idle' && 'Anything you want me to remember?'}
                  {stage === 'listening' && (
                    <span className="text-[#38BDF8] font-mono animate-pulse">
                      Listening... Speak or say a reminder
                    </span>
                  )}
                  {stage === 'transcribing' && (
                    <span className="text-[#F8FAFC] font-medium font-mono">
                      “Schedule product review tomorrow at 10 AM”
                    </span>
                  )}
                  {stage === 'action' && (
                    <span className="text-[#38BDF8] font-medium">
                      Resolving calendar slot and linked memories...
                    </span>
                  )}
                  {stage === 'done' && (
                    <span className="text-emerald-400 font-medium inline-flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      Added to Google Calendar
                    </span>
                  )}
                </p>

                {/* Central Glowing Voice Visualizer Ring */}
                <div
                  onClick={triggerNextStage}
                  className="relative my-7 sm:my-9 cursor-pointer group"
                  title="Click to simulate voice interaction"
                >
                  {/* Outer Breathing Glow Rings */}
                  <motion.div
                    animate={{
                      scale: stage === 'listening' || stage === 'transcribing' ? [1, 1.15, 1] : 1,
                      opacity: stage === 'listening' || stage === 'transcribing' ? [0.4, 0.8, 0.4] : 0.25,
                    }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="absolute -inset-3 rounded-full bg-gradient-to-tr from-[#38BDF8]/20 to-[#2563EB]/20 blur-md pointer-events-none"
                  />

                  {/* Main Orb Circle */}
                  <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-full border border-[#38BDF8]/40 shadow-[0_0_35px_rgba(56,189,248,0.22)] bg-[#070D18]/90 flex items-center justify-center relative overflow-hidden group-hover:border-[#38BDF8] transition-colors">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(56,189,248,0.15),transparent_70%)] pointer-events-none" />

                    {/* Animated Waveform Equalizer Bars */}
                    <div className="flex items-center justify-center gap-1.5 h-12 z-10">
                      {[
                        { base: 14, peak: 28, delay: 0 },
                        { base: 22, peak: 40, delay: 0.1 },
                        { base: 34, peak: 52, delay: 0.2 },
                        { base: 26, peak: 44, delay: 0.15 },
                        { base: 16, peak: 32, delay: 0.05 },
                      ].map((bar, i) => (
                        <motion.span
                          key={i}
                          animate={{
                            height:
                              stage === 'listening' || stage === 'transcribing'
                                ? [bar.base, bar.peak, bar.base]
                                : stage === 'action'
                                ? [bar.base, bar.base + 6, bar.base]
                                : bar.base,
                          }}
                          transition={{
                            duration: 0.8,
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: bar.delay,
                          }}
                          className={`w-1 rounded-full ${
                            i === 2
                              ? 'bg-[#F8FAFC] shadow-[0_0_8px_#F8FAFC]'
                              : i === 1 || i === 3
                              ? 'bg-[#38BDF8] shadow-[0_0_6px_#38BDF8]'
                              : 'bg-[#0284C7]'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Interactive Reminders Tab */}
            {activeTab === 'reminders' && (
              <motion.div
                key="tab-reminders"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#0C1220] border border-[#1E293B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                  <span className="text-xs font-bold text-[#F8FAFC]">Active Reminders</span>
                  <span className="text-[10px] font-mono text-[#38BDF8]">Local Offline Engine</span>
                </div>
                <div className="bg-[#121826] border border-[#38BDF8]/30 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F8FAFC]">Team Review</h4>
                    <p className="text-[11px] text-[#94A3B8]">Today · 5:00 PM</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8] text-[10px] font-mono">
                    In 5 min
                  </span>
                </div>
                <p className="text-[11px] text-[#64748B]">
                  Reminders run locally and ring even when offline.
                </p>
              </motion.div>
            )}

            {/* Interactive Calendar Tab */}
            {activeTab === 'calendar' && (
              <motion.div
                key="tab-calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#0C1220] border border-[#1E293B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                  <span className="text-xs font-bold text-[#F8FAFC]">Connected Calendar</span>
                  <span className="text-[10px] font-mono text-[#38BDF8]">Google Calendar</span>
                </div>
                <div className="bg-[#121826] border border-[#1E293B] rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-[#F8FAFC]">Calby test Meting</h4>
                    <p className="text-[11px] text-[#94A3B8]">Tomorrow · 2:00 AM</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 text-[10px] font-mono">
                    Synced
                  </span>
                </div>
              </motion.div>
            )}

            {/* Interactive Memory Tab */}
            {activeTab === 'memory' && (
              <motion.div
                key="tab-memory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-[#0C1220] border border-[#1E293B] rounded-2xl p-5 text-left flex flex-col gap-3 shadow-xl"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#1E293B]">
                  <span className="text-xs font-bold text-[#F8FAFC]">Personal Memory Context</span>
                  <span className="text-[10px] font-mono text-emerald-400">Device Encrypted</span>
                </div>
                <div className="bg-[#121826] border border-[#1E293B] rounded-xl p-3 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-mono text-[#64748B]">Saved Explicitly:</span>
                  <p className="text-xs font-medium text-[#F8FAFC]">
                    “Payment module and checkout integrations configured with Stripe.”
                  </p>
                </div>
                <span className="text-[11px] text-[#64748B]">
                  Stores personal knowledge without unsolicited alarms.
                </span>
              </motion.div>
            )}
          </div>

          {/* Clean Center Bottom Trigger Pill without the bottom wavy line and without extra labels */}
          <div className="relative z-20 flex flex-col items-center gap-2 mt-4">
            <button
              type="button"
              onClick={triggerNextStage}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-[#0C1220] hover:bg-[#121A2C] border border-[#1E293B] hover:border-[#38BDF8]/50 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] shadow-lg transition-all active:scale-95 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[#38BDF8]"
            >
              <Keyboard className="w-4 h-4 text-[#38BDF8] group-hover:scale-110 transition-transform" />
              <span>
                {stage === 'listening'
                  ? 'Listening... Click to advance'
                  : stage === 'transcribing'
                  ? 'Transcribing speech...'
                  : stage === 'action'
                  ? 'Processing action...'
                  : stage === 'done'
                  ? 'Action complete'
                  : 'Press Space to talk'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
