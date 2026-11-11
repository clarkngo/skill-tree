import type { AccentName, NodeKind, Rank, SkillState } from '../types';

export const KIND_LABEL: Record<NodeKind, string> = { realm: 'Realm', branch: 'Branch', skill: 'Skill' };

export const KIND_BADGE: Record<NodeKind, string> = {
  realm: 'border border-gold-400/70 bg-gold-700/40 text-gold-200',
  branch: 'border border-indigo-200/40 bg-indigo-950/60 text-indigo-100',
  skill: 'border border-indigo-200/40 bg-indigo-950/60 text-indigo-100',
};

export interface RankStyle {
  name: string;
  blurb: string;
  /** Crystal color (hex) for filled rank crystals. */
  crystal: string;
  badge: string;
}

export const RANKS: Record<Rank, RankStyle> = {
  0: {
    name: 'Locked',
    blurb: 'Not learned yet.',
    crystal: '#64748b',
    badge: 'border border-slate-400/40 bg-slate-900/70 text-slate-400',
  },
  1: {
    name: 'Novice',
    blurb: 'Tried it. Can follow a tutorial.',
    crystal: '#38bdf8',
    badge: 'border border-sky-300/60 bg-sky-950/70 text-sky-200',
  },
  2: {
    name: 'Apprentice',
    blurb: 'Used it for real, still looking things up often.',
    crystal: '#2dd4bf',
    badge: 'border border-teal-300/60 bg-teal-950/70 text-teal-200',
  },
  3: {
    name: 'Adept',
    blurb: 'Comfortable on my own; shipped real work with it.',
    crystal: '#818cf8',
    badge: 'border border-indigo-300/60 bg-indigo-950/70 text-indigo-200',
  },
  4: {
    name: 'Expert',
    blurb: 'Go-to person. Can debug the weird cases and teach it.',
    crystal: '#c084fc',
    badge: 'border border-violet-300/60 bg-violet-950/70 text-violet-200',
  },
  5: {
    name: 'Master',
    blurb: 'Deep, opinionated, battle-tested. Shapes how others do it.',
    crystal: '#f5c84c',
    badge: 'border border-gold-300/80 bg-gold-700/50 text-gold-200',
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
  dot: string;
  text: string;
  hex: string;
}

export const ACCENTS: Record<AccentName, Accent> = {
  sky: { dot: 'bg-sky-400', text: 'text-sky-300', hex: '#38bdf8' },
  violet: { dot: 'bg-violet-400', text: 'text-violet-300', hex: '#a78bfa' },
  emerald: { dot: 'bg-emerald-400', text: 'text-emerald-300', hex: '#34d399' },
  amber: { dot: 'bg-amber-400', text: 'text-amber-300', hex: '#fbbf24' },
  rose: { dot: 'bg-rose-400', text: 'text-rose-300', hex: '#fb7185' },
  indigo: { dot: 'bg-indigo-400', text: 'text-indigo-300', hex: '#818cf8' },
  teal: { dot: 'bg-teal-400', text: 'text-teal-300', hex: '#2dd4bf' },
  orange: { dot: 'bg-orange-400', text: 'text-orange-300', hex: '#fb923c' },
};

export const ACCENT_ORDER: AccentName[] = ['sky', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'teal', 'orange'];
