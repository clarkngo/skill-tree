import type { AccentName, NodeKind, Rank, SkillState } from '../types';

export const KIND_LABEL: Record<NodeKind, string> = { realm: 'Realm', branch: 'Branch', skill: 'Skill' };

export const KIND_BADGE: Record<NodeKind, string> = {
  realm: 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900',
  branch: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  skill: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
};

export interface RankStyle {
  name: string;
  blurb: string;
  pip: string;
  badge: string;
}

export const RANKS: Record<Rank, RankStyle> = {
  0: {
    name: 'Locked',
    blurb: 'Not learned yet.',
    pip: 'bg-slate-200 dark:bg-slate-700',
    badge: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
  },
  1: {
    name: 'Novice',
    blurb: 'Tried it. Can follow a tutorial.',
    pip: 'bg-sky-400',
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-900/60 dark:text-sky-100',
  },
  2: {
    name: 'Apprentice',
    blurb: 'Used it for real, still looking things up often.',
    pip: 'bg-teal-500',
    badge: 'bg-teal-100 text-teal-900 dark:bg-teal-900/60 dark:text-teal-100',
  },
  3: {
    name: 'Adept',
    blurb: 'Comfortable on my own; shipped real work with it.',
    pip: 'bg-indigo-500',
    badge: 'bg-indigo-100 text-indigo-900 dark:bg-indigo-900/60 dark:text-indigo-100',
  },
  4: {
    name: 'Expert',
    blurb: 'Go-to person. Can debug the weird cases and teach it.',
    pip: 'bg-violet-500',
    badge: 'bg-violet-100 text-violet-900 dark:bg-violet-900/60 dark:text-violet-100',
  },
  5: {
    name: 'Master',
    blurb: 'Deep, opinionated, battle-tested. Shapes how others do it.',
    pip: 'bg-amber-400',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-900/60 dark:text-amber-100',
  },
};

export const RANK_LEVELS: Rank[] = [0, 1, 2, 3, 4, 5];

export const STATE: Record<SkillState, { label: string; blurb: string }> = {
  locked: { label: 'Locked', blurb: 'A prerequisite is still locked.' },
  available: { label: 'Ready to unlock', blurb: 'Every prerequisite is unlocked. Go learn it.' },
  unlocked: { label: 'Unlocked', blurb: 'Learned, still room to grow.' },
  mastered: { label: 'Mastered', blurb: 'Max rank.' },
};

export interface Accent {
  border: string;
  dot: string;
  text: string;
  hex: string;
}

export const ACCENTS: Record<AccentName, Accent> = {
  sky: { border: 'border-l-sky-500', dot: 'bg-sky-500', text: 'text-sky-600 dark:text-sky-400', hex: '#0ea5e9' },
  violet: { border: 'border-l-violet-500', dot: 'bg-violet-500', text: 'text-violet-600 dark:text-violet-400', hex: '#8b5cf6' },
  emerald: { border: 'border-l-emerald-500', dot: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', hex: '#10b981' },
  amber: { border: 'border-l-amber-500', dot: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', hex: '#f59e0b' },
  rose: { border: 'border-l-rose-500', dot: 'bg-rose-500', text: 'text-rose-600 dark:text-rose-400', hex: '#f43f5e' },
  indigo: { border: 'border-l-indigo-500', dot: 'bg-indigo-500', text: 'text-indigo-600 dark:text-indigo-400', hex: '#6366f1' },
  teal: { border: 'border-l-teal-500', dot: 'bg-teal-500', text: 'text-teal-600 dark:text-teal-400', hex: '#14b8a6' },
  orange: { border: 'border-l-orange-500', dot: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', hex: '#f97316' },
};

export const ACCENT_ORDER: AccentName[] = ['sky', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'teal', 'orange'];
