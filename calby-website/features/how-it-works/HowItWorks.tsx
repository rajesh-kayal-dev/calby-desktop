'use client';

import { motion } from 'motion/react';
import { Mic, Brain, Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';

export function HowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'You speak',
      description: 'Press your hotkey and speak naturally. Calby listens only when actively summoned.',
      icon: Mic,
      tag: 'Capture',
    },
    {
      number: '02',
      title: 'Calby understands',
      description: 'Resolves context, timestamps, and relates your intent to schedule and memory.',
      icon: Brain,
      tag: 'Parse',
    },
    {
      number: '03',
      title: 'Calby acts',
      description: 'Creates your calendar event, sets local reminder, or saves personal context.',
      icon: Sparkles,
      tag: 'Execute',
    },
    {
      number: '04',
      title: 'You get the result',
      description: 'Your workflow continues smoothly with timely, quiet desktop delivery.',
      icon: CheckCircle2,
      tag: 'Deliver',
    },
  ];

  return (
    <section
      id="how-it-works"
      className="py-20 px-4 sm:px-8 max-w-5xl mx-auto"
    >
      <div className="flex flex-col items-center text-center mb-14">
        <span className="text-xs text-[#38BDF8] uppercase font-bold tracking-wider mb-2">
          Simplicity by Design
        </span>
        <h2 className="text-2xl sm:text-4xl font-bold text-[#F8FAFC] tracking-tight mb-2">
          How Calby works
        </h2>
        <p className="text-sm sm:text-base text-[#94A3B8] max-w-xl">
          A seamless flow from spoken thought to accomplished desktop action.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: idx * 0.12 }}
              whileHover={{ y: -4 }}
              className="bg-[#121826] border border-[#1E293B] hover:border-[#38BDF8]/60 hover:shadow-[0_10px_25px_rgba(56,189,248,0.1)] transition-all duration-300 p-5 rounded-2xl flex flex-col justify-between group cursor-default relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono font-bold text-[#38BDF8]">
                    {step.number} / {step.tag}
                  </span>
                  <div className="w-8 h-8 rounded-lg bg-[#0C101A] border border-[#1E293B] group-hover:border-[#38BDF8]/40 flex items-center justify-center text-[#94A3B8] group-hover:text-[#38BDF8] group-hover:shadow-[0_0_10px_rgba(56,189,248,0.2)] transition-all">
                    <Icon className="w-4 h-4" />
                  </div>
                </div>

                <h3 className="text-base font-bold text-[#F8FAFC] mb-2">{step.title}</h3>
                <p className="text-xs text-[#94A3B8] leading-relaxed mb-6">
                  {step.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#1E293B]/70 flex items-center justify-between text-[11px] text-[#64748B] group-hover:text-[#38BDF8] transition-colors">
                <span>Stage {step.number}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#1E293B] group-hover:text-[#38BDF8] transition-all group-hover:translate-x-0.5" />
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
