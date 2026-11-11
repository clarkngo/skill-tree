/**
 * realm   a top-level area of life or work (Software, Cooking, Teaching…)
 * branch  a grouping inside a realm; has no rank of its own
 * skill   something you can get better at; ranked 0–5, may have sub-skills
 */
export type NodeKind = 'realm' | 'branch' | 'skill';

/** 0 locked · 1 novice · 2 apprentice · 3 adept · 4 expert · 5 master */
export type Rank = 0 | 1 | 2 | 3 | 4 | 5;

export type AccentName = 'sky' | 'violet' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'teal' | 'orange';

export interface Evidence {
  label: string;
  url?: string;
}

/** Authoring format in public/data/skills.json: nested, so adding a skill is one object. */
export interface SkillSource {
  id: string;
  label: string;
  /** Inferred when omitted: roots are realms, nodes with a rank are skills, other parents are branches. */
  kind?: NodeKind;
  summary?: string;
  tags?: string[];
  rank?: Rank;
  /** Currently grinding this one. */
  learning?: boolean;
  /** When it was first unlocked, e.g. "2019" or "2023-04". */
  since?: string;
  /** Ids of skills that must be at rank 1+ before this one is unlockable. */
  requires?: string[];
  notes?: string;
  evidence?: Evidence[];
  /** Next quests: concrete things to do to rank this up. */
  next?: string[];
  /** Realms only. */
  color?: AccentName;
  children?: SkillSource[];
}

export interface SkillTreeFile {
  player: { name: string; title?: string };
  realms: SkillSource[];
}

/**
 * locked     rank 0 and a prerequisite is still locked
 * available  rank 0 but every prerequisite is unlocked: ready to learn
 * unlocked   rank 1–4
 * mastered   rank 5
 */
export type SkillState = 'locked' | 'available' | 'unlocked' | 'mastered';

export interface SkillNode {
  id: string;
  label: string;
  kind: NodeKind;
  parentId: string | null;
  childrenIds: string[];
  realmId: string;
  summary?: string;
  tags: string[];
  rank: Rank;
  learning: boolean;
  since?: string;
  requires: string[];
  /** Derived: skills that list this one in `requires`. */
  unlocks: string[];
  notes?: string;
  evidence: Evidence[];
  next: string[];
}

export type LayoutDirection = 'LR' | 'TB';
