'use client';

import { Mic, Bell, Calendar as CalendarIcon, Share2 } from 'lucide-react';
import { ShowcaseTab } from '@/types/product';

interface ProductTabsProps {
  activeTab: ShowcaseTab;
  onTabChange: (tab: ShowcaseTab) => void;
}

export function ProductTabs({ activeTab, onTabChange }: ProductTabsProps) {
  const tabs: { id: ShowcaseTab; label: string; icon: React.ElementType }[] = [
    { id: 'voice', label: 'Voice', icon: Mic },
    { id: 'reminders', label: 'Reminders', icon: Bell },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'memory', label: 'Memory', icon: Share2 },
  ];

  return (
    <div className="flex items-center justify-center p-1.5 bg-[#0C101A] border border-[#1E293B] rounded-2xl max-w-md mx-auto mb-8 shadow-inner">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${
              isActive
                ? 'bg-[#121826] text-[#38BDF8] border border-[#38BDF8]/30 shadow-[0_0_15px_rgba(56,189,248,0.15)]'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#121826]/50 border border-transparent'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-[#38BDF8]' : 'text-[#64748B]'}`} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
