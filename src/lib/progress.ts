import type { Rank } from '../types';

/** Cumulative XP for reaching each rank. Higher ranks are worth disproportionately more. */
export const RANK_XP: Record<Rank, number> = { 0: 0, 1: 10, 2: 30, 3: 60, 4: 100, 5: 150 };

/** Level L starts at 20·(L−1)² XP, so each level takes a little longer than the last. */
const levelStart = (level: number) => 20 * (level - 1) ** 2;

export function levelFromXp(xp: number) {
  const level = Math.floor(Math.sqrt(xp / 20)) + 1;
  const start = levelStart(level);
  const end = levelStart(level + 1);
  return { level, into: xp - start, span: end - start, toNext: end - xp };
}
