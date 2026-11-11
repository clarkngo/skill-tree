import type { AccentName, NodeKind, Rank, SkillNode, SkillSource, SkillState, SkillTreeFile } from '../types';
import { ACCENT_ORDER } from './theme';
import { RANK_XP } from './progress';

export interface Aggregate {
  /** Skills at or beneath this node (including itself if it is a skill). */
  skills: number;
  unlocked: number;
  mastered: number;
  xp: number;
}

export interface GraphIndex {
  player: SkillTreeFile['player'];
  byId: Map<string, SkillNode>;
  rootIds: string[];
  depth: Map<string, number>;
  pathTo(id: string): string[];
  siblingsOf(id: string): string[];
  agg: Map<string, Aggregate>;
  state: Map<string, SkillState>;
  accent: Map<string, AccentName>;
  branchIds: string[];
  total: Aggregate;
}

function inferKind(s: SkillSource, isRoot: boolean): NodeKind {
  if (s.kind) return s.kind;
  if (isRoot) return 'realm';
  if (s.rank !== undefined) return 'skill';
  return s.children?.length ? 'branch' : 'skill';
}

export function buildIndex(file: SkillTreeFile): GraphIndex {
  const byId = new Map<string, SkillNode>();
  const depth = new Map<string, number>();
  const accent = new Map<string, AccentName>();
  const rootIds: string[] = [];

  const add = (s: SkillSource, parentId: string | null, realmId: string, d: number) => {
    const kind = inferKind(s, parentId === null);
    byId.set(s.id, {
      id: s.id,
      label: s.label,
      kind,
      parentId,
      childrenIds: (s.children ?? []).map((c) => c.id),
      realmId,
      summary: s.summary,
      tags: s.tags ?? [],
      rank: kind === 'skill' ? (s.rank ?? 0) : 0,
      learning: !!s.learning,
      since: s.since,
      requires: s.requires ?? [],
      unlocks: [],
      notes: s.notes,
      evidence: s.evidence ?? [],
      next: s.next ?? [],
    });
    depth.set(s.id, d);
    accent.set(s.id, accent.get(realmId)!);
    (s.children ?? []).forEach((c) => add(c, s.id, realmId, d + 1));
  };

  file.realms.forEach((r, i) => {
    rootIds.push(r.id);
    accent.set(r.id, r.color ?? ACCENT_ORDER[i % ACCENT_ORDER.length]);
    add(r, null, r.id, 0);
  });

  for (const n of byId.values()) {
    for (const req of n.requires) byId.get(req)?.unlocks.push(n.id);
  }

  const state = new Map<string, SkillState>();
  for (const n of byId.values()) {
    if (n.kind !== 'skill') continue;
    if (n.rank === 5) state.set(n.id, 'mastered');
    else if (n.rank > 0) state.set(n.id, 'unlocked');
    else state.set(n.id, n.requires.every((r) => (byId.get(r)?.rank ?? 0) > 0) ? 'available' : 'locked');
  }

  const agg = new Map<string, Aggregate>();
  const walk = (id: string): Aggregate => {
    const n = byId.get(id)!;
    const a: Aggregate = { skills: 0, unlocked: 0, mastered: 0, xp: 0 };
    if (n.kind === 'skill') {
      a.skills = 1;
      a.unlocked = n.rank > 0 ? 1 : 0;
      a.mastered = n.rank === 5 ? 1 : 0;
      a.xp = RANK_XP[n.rank as Rank];
    }
    for (const c of n.childrenIds) {
      const sub = walk(c);
      a.skills += sub.skills;
      a.unlocked += sub.unlocked;
      a.mastered += sub.mastered;
      a.xp += sub.xp;
    }
    agg.set(id, a);
    return a;
  };
  const total: Aggregate = { skills: 0, unlocked: 0, mastered: 0, xp: 0 };
  for (const r of rootIds) {
    const a = walk(r);
    total.skills += a.skills;
    total.unlocked += a.unlocked;
    total.mastered += a.mastered;
    total.xp += a.xp;
  }

  const pathTo = (id: string) => {
    const path: string[] = [];
    let cur = byId.get(id);
    while (cur) {
      path.unshift(cur.id);
      cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    }
    return path;
  };

  const siblingsOf = (id: string) => {
    const node = byId.get(id);
    if (!node) return [];
    return node.parentId ? (byId.get(node.parentId)?.childrenIds ?? []) : rootIds;
  };

  const branchIds = [...byId.values()].filter((n) => n.childrenIds.length > 0).map((n) => n.id);

  return { player: file.player, byId, rootIds, depth, pathTo, siblingsOf, agg, state, accent, branchIds, total };
}

/** Nodes currently rendered: roots plus the children of every expanded, visible node. */
export function visibleIds(index: GraphIndex, expanded: ReadonlySet<string>): string[] {
  const out: string[] = [];
  const visit = (id: string) => {
    out.push(id);
    if (!expanded.has(id)) return;
    for (const c of index.byId.get(id)?.childrenIds ?? []) if (index.byId.has(c)) visit(c);
  };
  index.rootIds.forEach(visit);
  return out;
}
