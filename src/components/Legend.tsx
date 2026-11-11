import { RANKS, RANK_LEVELS } from '../lib/theme';
import { RANK_XP } from '../lib/progress';
import { LockIcon, RankPips } from './SkillNodeCard';

const SHORTCUTS: [string, string][] = [
  ['→ / Tab', 'First child'],
  ['← / ⇧Tab', 'Parent'],
  ['↑ ↓', 'Siblings'],
  ['Home / End', 'First / last sibling'],
  ['Enter / Space', 'Skill details · toggle branch'],
  ['⌘K / Ctrl K or /', 'Search'],
  ['Esc', 'Close · deselect'],
];

export function Legend() {
  return (
    <details className="group absolute bottom-3 left-3 z-10 max-w-[calc(100%-5rem)] rounded-xl border border-slate-200 bg-white/95 text-xs shadow-lg backdrop-blur sm:max-w-xs dark:border-slate-700 dark:bg-slate-900/95">
      <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2 font-medium text-slate-700 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:text-slate-200 [&::-webkit-details-marker]:hidden">
        <RankPips rank={5} />
        Ranks &amp; keys
        <span className="ml-auto text-slate-400 transition-transform group-open:rotate-180" aria-hidden>
          ▴
        </span>
      </summary>

      <div className="space-y-3 border-t border-slate-200 px-3 py-3 dark:border-slate-700">
        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Ranks</h2>
          <ul className="space-y-1.5">
            {RANK_LEVELS.slice(1).map((r) => (
              <li key={r} className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <span className={`mt-px w-[4.5rem] shrink-0 rounded px-1.5 py-0.5 text-center text-[10px] font-semibold ${RANKS[r].badge}`}>{RANKS[r].name}</span>
                <span>
                  {RANKS[r].blurb} <span className="tabular-nums text-slate-400">+{RANK_XP[r]} XP</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Not learned yet</h2>
          <ul className="space-y-1.5 text-slate-600 dark:text-slate-300">
            <li className="flex items-center gap-2">
              <span className="ready-pulse rounded border border-dashed border-emerald-400 bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100">
                Ready
              </span>
              Every prerequisite is unlocked
            </li>
            <li className="flex items-center gap-2">
              <span className="flex items-center gap-1 rounded border border-dashed border-slate-300 px-1.5 py-0.5 text-[10px] font-semibold text-slate-500 dark:border-slate-600">
                <LockIcon className="h-2.5 w-2.5" /> Locked
              </span>
              Needs a prerequisite first
            </li>
            <li className="flex items-center gap-2">
              <span className="rounded border-2 border-dashed border-amber-500 px-2 py-0.5 text-[10px]" aria-hidden />
              Dashed gold line: prerequisite link
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-1.5 font-semibold text-slate-900 dark:text-white">Keyboard</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-slate-600 dark:text-slate-300">
            {SHORTCUTS.map(([k, v]) => (
              <div key={k} className="contents">
                <dt>
                  <kbd className="rounded border border-slate-300 bg-slate-50 px-1 font-sans text-[11px] dark:border-slate-600 dark:bg-slate-800">{k}</kbd>
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
