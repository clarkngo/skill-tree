import type { LayoutDirection } from '../types';
import { RANKS, RANK_LEVELS } from '../lib/theme';
import { RANK_XP } from '../lib/progress';
import { LockIcon, RankPips } from './SkillNodeCard';

const shortcuts = (direction: LayoutDirection): [string, string][] => [
  [direction === 'TB' ? '↓ / Tab' : '→ / Tab', 'First child'],
  [direction === 'TB' ? '↑ / ⇧Tab' : '← / ⇧Tab', 'Parent'],
  [direction === 'TB' ? '← →' : '↑ ↓', 'Siblings'],
  ['Home / End', 'First / last sibling'],
  ['Enter / Space', 'Skill details · toggle branch'],
  ['⌘K / Ctrl K or /', 'Search'],
  ['Esc', 'Close · deselect'],
];

export function Legend({ direction }: { direction: LayoutDirection }) {
  return (
    <details className="win group absolute bottom-3 left-3 z-10 max-w-[calc(100%-5rem)] text-xs sm:max-w-xs">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-md px-3 py-2 text-white focus-visible:outline-2 focus-visible:outline-gold-300 [&::-webkit-details-marker]:hidden">
        <RankPips rank={5} />
        <span className="label-gold">Ranks &amp; Controls</span>
        <span className="ml-auto text-gold-300 transition-transform group-open:rotate-180" aria-hidden>
          ▴
        </span>
      </summary>

      <div className="space-y-3 border-t border-frame/30 px-3 py-3">
        <section>
          <h2 className="label-gold mb-1.5">Ranks</h2>
          <ul className="space-y-1.5">
            {RANK_LEVELS.slice(1).map((r) => (
              <li key={r} className="flex items-start gap-2 text-indigo-50">
                <span className={`mt-px w-[4.5rem] shrink-0 rounded-sm px-1.5 py-0.5 text-center text-[10px] ${RANKS[r].badge}`}>{RANKS[r].name}</span>
                <span>
                  {RANKS[r].blurb} <span className="tabular-nums text-gold-300">+{RANK_XP[r]} EXP</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="label-gold mb-1.5">Not learned yet</h2>
          <ul className="space-y-1.5 text-indigo-50">
            <li className="flex items-center gap-2">
              <span className="ready-pulse rounded-sm border border-emerald-300/70 bg-emerald-950/70 px-1.5 py-0.5 text-[10px] text-emerald-200">
                Ready
              </span>
              Every prerequisite is unlocked
            </li>
            <li className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded-sm border border-slate-400/40 bg-slate-900/70 px-1.5 py-0.5 text-[10px] text-slate-400">
                <LockIcon className="h-2.5 w-2.5" /> Locked
              </span>
              Needs a prerequisite first
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded-sm border-2 border-dashed border-fuchsia-300 px-2 py-0.5 text-[10px]" aria-hidden />
              Dashed pink line: prerequisite link
            </li>
          </ul>
        </section>

        <section>
          <h2 className="label-gold mb-1.5">Controls</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-indigo-50">
            {shortcuts(direction).map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="win-inset px-1 text-[11px] text-gold-200">{k}</kbd>
                </dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </details>
  );
}
