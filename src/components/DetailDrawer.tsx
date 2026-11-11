import { useEffect, useRef } from 'react';
import type { SkillNode } from '../types';
import type { GraphIndex } from '../lib/graphIndex';
import { ACCENTS, RANKS, STATE } from '../lib/theme';
import { RANK_XP } from '../lib/progress';
import { LockIcon, RankPips } from './SkillNodeCard';

interface Props {
  index: GraphIndex;
  node: SkillNode;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

export function DetailDrawer({ index, node, onClose, onNavigate }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const headingId = `drawer-title-${node.id}`;
  const state = index.state.get(node.id)!;
  const accent = ACCENTS[index.accent.get(node.id)!];
  const path = index.pathTo(node.id).map((id) => index.byId.get(id)!);
  const subSkills = node.childrenIds.map((id) => index.byId.get(id)!);

  useEffect(() => closeRef.current?.focus(), [node.id]);

  return (
    <aside
      role="dialog"
      aria-modal="false"
      aria-labelledby={headingId}
      className="fixed inset-y-0 right-0 z-40 flex w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-2xl animate-[drawer-in_200ms_ease-out] dark:border-slate-700 dark:bg-slate-900"
    >
      <header className="flex items-start gap-3 border-b border-slate-200 p-5 dark:border-slate-700">
        <div className="min-w-0 flex-1">
          <nav aria-label="Path" className="mb-2 flex flex-wrap gap-x-1 text-xs text-slate-500 dark:text-slate-400">
            {path.slice(0, -1).map((p, i) => (
              <span key={p.id} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden>›</span>}
                <button type="button" className={`hover:underline ${i === 0 ? accent.text : 'hover:text-indigo-600'}`} onClick={() => onNavigate(p.id)}>
                  {p.label}
                </button>
              </span>
            ))}
          </nav>
          <h2 id={headingId} className="text-lg font-semibold leading-snug text-slate-900 dark:text-slate-50">
            {node.label}
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span className={`rounded px-2 py-0.5 font-semibold ${RANKS[node.rank].badge}`}>
              {node.rank === 0 ? STATE[state].label : `${RANKS[node.rank].name} · rank ${node.rank}/5`}
            </span>
            {node.rank > 0 && <RankPips rank={node.rank} size="md" />}
            {node.rank > 0 && <span className="tabular-nums text-slate-500 dark:text-slate-400">{RANK_XP[node.rank]} XP</span>}
            {node.learning && (
              <span className="rounded bg-rose-100 px-2 py-0.5 font-semibold text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">⚔ Learning now</span>
            )}
            {node.since && <span className="text-slate-500 dark:text-slate-400">since {node.since}</span>}
          </div>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="Close details"
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-2 focus-visible:outline-indigo-500 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
            <path fill="currentColor" d="M5.28 4.22L10 8.94l4.72-4.72 1.06 1.06L11.06 10l4.72 4.72-1.06 1.06L10 11.06l-4.72 4.72-1.06-1.06L8.94 10 4.22 5.28z" />
          </svg>
        </button>
      </header>

      <div className="flex-1 space-y-6 overflow-y-auto p-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
        {(node.summary || node.rank > 0) && (
          <Section title="About">
            {node.summary && <p>{node.summary}</p>}
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold">{node.rank === 0 ? STATE[state].label : RANKS[node.rank].name}:</span>{' '}
              {node.rank === 0 ? STATE[state].blurb : RANKS[node.rank].blurb}
            </p>
          </Section>
        )}

        {node.notes && (
          <Section title="Field notes">
            <p className="whitespace-pre-line">{node.notes}</p>
          </Section>
        )}

        {node.next.length > 0 && (
          <Section title={node.rank === 5 ? 'Keep sharp' : `Quests to reach ${RANKS[Math.min(node.rank + 1, 5) as 1].name}`}>
            <ul className="space-y-2">
              {node.next.map((q) => (
                <li key={q} className="flex gap-2">
                  <span className="mt-1 h-3 w-3 shrink-0 rounded-sm border-2 border-amber-400" aria-hidden />
                  <span>{q}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {node.evidence.length > 0 && (
          <Section title="Proof of work">
            <ul className="space-y-1.5">
              {node.evidence.map((e) => (
                <li key={e.label} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" aria-hidden />
                  {e.url ? (
                    <a href={e.url} target="_blank" rel="noreferrer" className="text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-400">
                      {e.label}
                    </a>
                  ) : (
                    <span>{e.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <LinkList title="Requires" ids={node.requires} index={index} onNavigate={onNavigate} showMet />
        <LinkList title="Unlocks" ids={node.unlocks} index={index} onNavigate={onNavigate} />
        <LinkList title="Sub-skills" ids={subSkills.map((s) => s.id)} index={index} onNavigate={onNavigate} />

        {node.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {node.tags.map((t) => (
              <span key={t} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {t}
              </span>
            ))}
          </div>
        )}
      </div>

      <footer className="border-t border-slate-200 px-5 py-3 text-[11px] text-slate-500 dark:border-slate-700">
        Skill · <code>{node.id}</code> · <kbd>Esc</kbd> to close
      </footer>
    </aside>
  );
}

function LinkList({
  title,
  ids,
  index,
  onNavigate,
  showMet,
}: {
  title: string;
  ids: string[];
  index: GraphIndex;
  onNavigate: (id: string) => void;
  showMet?: boolean;
}) {
  if (!ids.length) return null;
  return (
    <Section title={title}>
      <ul className="space-y-1">
        {ids.map((id) => {
          const n = index.byId.get(id);
          if (!n) return null;
          const st = index.state.get(id);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => onNavigate(id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className={`h-2 w-2 shrink-0 rounded-full ${ACCENTS[index.accent.get(id)!].dot}`} aria-hidden />
                <span className={`flex-1 ${n.rank === 0 ? 'text-slate-500' : ''}`}>{n.label}</span>
                {showMet && n.rank === 0 && <span className="text-xs font-medium text-rose-600 dark:text-rose-400">not yet</span>}
                {st === 'locked' ? <LockIcon className="h-3 w-3 text-slate-400" /> : n.kind === 'skill' && <RankPips rank={n.rank} />}
              </button>
            </li>
          );
        })}
      </ul>
    </Section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{title}</h3>
      {children}
    </section>
  );
}
