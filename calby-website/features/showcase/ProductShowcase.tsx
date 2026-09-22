'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Bell, Calendar as CalendarIcon, Check, Clock, ExternalLink, Sparkles, User } from 'lucide-react';
import { ShowcaseTab } from '@/types/product';
import { ProductTabs } from './ProductTabs';
import { Orb } from '@/components/ui/Orb';
import { Waveform } from '@/components/ui/Waveform';

export function ProductShowcase() {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('voice');
  const [reminderDone, setReminderDone] = useState(false);

  return (
    <section id="showcase" className="py-20 px-4 sm:px-8 max-w-5xl mx-auto border-t border-[#1E293B]">
      <div className="flex flex-col items-center text-center mb-8">
        <span className="text-xs text-[#38BDF8] uppercase font-bold tracking-wider mb-2">
          Interactive Experience
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-2">
          Experience Calby in action.
        </h2>
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl">
          Toggle between core desktop modes to see how Calby handles voice, reminders, schedule, and personal context.
        </p>
      </div>

      <ProductTabs activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="w-full max-w-4xl mx-auto relative rounded-2xl p-2 bg-[#0C101A] border border-[#1E293B] shadow-[0_25px_60px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Windows Desktop Header Bar */}
        <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-[#1E293B]/70 bg-[#070A11] rounded-t-xl">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#1E293B]" />
            </div>
            <div className="flex items-center gap-1.5 ml-2.5">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span className="text-xs text-[#94A3B8] font-medium font-mono">
                calby://{activeTab}
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#64748B] font-mono">Windows 10 / 11</span>
        </div>

        {/* Content Canvas */}
        <div className="relative min-h-[380px] sm:min-h-[420px] bg-gradient-to-b from-[#0B0F19] to-[#070A11] rounded-b-xl p-4 sm:p-8 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === 'voice' && (
              <motion.div
                key="voice"
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-full max-w-lg bg-[#121826] border border-[#1E293B] rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <Orb size="md" pulse={true} />
                    <div>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">Voice Assistant</h4>
                      <p className="text-[11px] text-[#38BDF8] font-mono">Listening on hotkey (Alt + Space)</p>
                    </div>
                  </div>
                  <Waveform active={true} barCount={6} className="h-6" />
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono text-[#64748B]">Spoken Thought</span>
                  <div className="bg-[#0C101A] border border-[#1E293B] rounded-xl p-3.5 flex items-center gap-3">
                    <Mic className="w-4 h-4 text-[#38BDF8]" />
                    <p className="text-xs sm:text-sm font-medium text-[#F8FAFC]">
                      “Prep notes for product review”
                    </p>
                  </div>
                </div>

                <div className="bg-[#0C1220] border border-[#38BDF8]/30 rounded-xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-[#38BDF8] shadow-[0_0_8px_#38BDF8]" />
                    <span className="text-xs text-[#94A3B8]">Calby voice response ready</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#38BDF8]/15 text-[#38BDF8]">
                    Active
                  </span>
                </div>
              </motion.div>
            )}

            {activeTab === 'reminders' && (
              <motion.div
                key="reminders"
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-full max-w-lg bg-[#121826] border border-[#38BDF8]/30 rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0C101A] border border-[#38BDF8]/30 flex items-center justify-center text-[#38BDF8]">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">Smart Desktop Reminder</h4>
                      <p className="text-[11px] text-[#94A3B8]">Offline local desktop alarm</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8]/15 border border-[#38BDF8]/30 text-[10px] font-semibold text-[#38BDF8]">
                    {reminderDone ? 'Completed' : 'Reminder in 5 min'}
                  </span>
                </div>

                <div className="bg-[#0C101A] border border-[#1E293B] rounded-xl p-4 flex flex-col gap-2">
                  <h5 className={`text-base font-bold transition-all ${reminderDone ? 'line-through text-[#64748B]' : 'text-[#F8FAFC]'}`}>
                    Call Rahul
                  </h5>
                  <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
                    <Clock className="w-3.5 h-3.5 text-[#38BDF8]" />
                    <span>Today · 5:00 PM</span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setReminderDone(false)}
                    className="px-3 py-1.5 rounded-lg bg-[#0C101A] hover:bg-[#121826] text-[#94A3B8] hover:text-[#F8FAFC] text-xs font-medium border border-[#1E293B] transition-colors"
                  >
                    Snooze 10m
                  </button>
                  <button
                    type="button"
                    onClick={() => setReminderDone(!reminderDone)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                      reminderDone
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-[#2563EB] hover:bg-blue-500 text-white shadow-sm'
                    }`}
                  >
                    {reminderDone ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Done</span>
                      </>
                    ) : (
                      <span>Mark Done</span>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'calendar' && (
              <motion.div
                key="calendar"
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-full max-w-lg bg-[#121826] border border-[#1E293B] rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
                      <CalendarIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">Google Calendar</h4>
                      <p className="text-[11px] text-[#94A3B8]">Connected schedule &amp; preparation</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-[#38BDF8]">10:00 AM Today</span>
                </div>

                <div className="bg-[#0C101A] border border-[#38BDF8]/30 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="text-sm font-bold text-[#F8FAFC]">Team Meeting</h5>
                      <p className="text-xs text-[#38BDF8] font-mono">10:00 AM – 10:30 AM</p>
                    </div>
                    <button
                      type="button"
                      className="px-3 py-1 bg-[#2563EB] hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <span>Join</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="bg-[#121A2C] rounded-lg p-2.5 text-xs text-[#94A3B8] flex items-start gap-2 border border-[#1E293B]">
                    <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0 mt-0.5" />
                    <span>
                      <strong className="text-[#F8FAFC]">Prepare with Calby:</strong> Review discussion points and linked attendee memories before you join.
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'memory' && (
              <motion.div
                key="memory"
                initial={{ opacity: 0, scale: 0.97, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -10 }}
                transition={{ duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] }}
                className="w-full max-w-lg bg-[#121826] border border-[#1E293B] rounded-2xl p-6 shadow-2xl flex flex-col gap-5"
              >
                <div className="flex items-center justify-between pb-3 border-b border-[#1E293B]">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#0C101A] border border-[#1E293B] flex items-center justify-center text-[#38BDF8]">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-[#F8FAFC]">Personal Memory</h4>
                      <p className="text-[11px] text-[#94A3B8]">Explicit local storage · No alarm</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-semibold">
                    Local Device
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] uppercase font-mono text-[#64748B]">Explicit Instruction</span>
                  <div className="bg-[#0C101A] border border-[#1E293B] rounded-xl p-3.5">
                    <p className="text-xs sm:text-sm font-medium text-[#F8FAFC]">
                      “Remember Rahul handles the payment module.”
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center gap-2.5 text-emerald-400">
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span className="text-xs font-semibold">Memory saved to local device context</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
