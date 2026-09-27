'use client';

import { useEffect } from 'react';

interface TitleSection {
  id: string;
  title: string;
}

/**
 * Short tab title per page section — one continuous string, never a
 * "Part | Calby" split or a full sentence.
 */
const TITLE_SECTIONS: TitleSection[] = [
  { id: 'overview', title: 'Calby' },
  { id: 'features', title: 'Features' },
  { id: 'quick-voice', title: 'Quick Voice' },
  { id: 'calendar-synergy', title: 'Calendar' },
  { id: 'how-it-works', title: 'How It Works' },
  { id: 'privacy', title: 'Privacy' },
  { id: 'trust', title: 'Trust' },
  { id: 'download-final', title: 'Download' }
];

/** Keeps document.title in sync with the section the visitor is reading. */
export function DynamicTitle() {
  useEffect(() => {
    const sections: Array<{ title: string; element: HTMLElement }> = [];

    for (const section of TITLE_SECTIONS) {
      const element = document.getElementById(section.id);
      if (element) sections.push({ title: section.title, element });
    }

    if (sections.length === 0) return;

    let frame = 0;

    const update = () => {
      frame = 0;
      // The section covering the upper third of the viewport is the one being read.
      const marker = window.innerHeight * 0.35;
      let current = sections[0];

      for (const section of sections) {
        if (section.element.getBoundingClientRect().top <= marker) current = section;
      }

      if (document.title !== current.title) document.title = current.title;
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return null;
}
