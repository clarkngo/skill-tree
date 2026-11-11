import { Fragment, useEffect, useId, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import type { NodeKind, Rank, SkillState } from '../types';
import type { GraphIndex } from '../lib/graphIndex';
import { ACCENTS, KIND_BADGE, KIND_LABEL, RANKS } from '../lib/theme';
import { HandCursor, LockIcon, RankPips } from './SkillNodeCard';
import { play } from '../lib/sfx';

interface SearchDoc {
  id: string;
  label: string;
  kind: NodeKind;
  rank: Rank;
  state?: SkillState;
  learning: boolean;
  path: string;
  text: string;
  tags: string[];
  rankName: string;
}

interface Props {
  index: GraphIndex;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const MAX_RESULTS = 30;

export function SearchModal({ index, onSelect, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  const { fuse, docs } = useMemo(() => {
    const docs: SearchDoc[] = [...index.byId.values()].map((n) => ({
      id: n.id,
      label: n.label,
      kind: n.kind,
      rank: n.rank,
      state: index.state.get(n.id),
      learning: n.learning,
      path: index
        .pathTo(n.id)
        .slice(0, -1)
        .map((id) => index.byId.get(id)!.label)
        .join(' › '),
      text: [n.summary, n.notes, ...n.next].filter(Boolean).join(' '),
      tags: n.tags,
      rankName: n.kind === 'skill' ? `${RANKS[n.rank].name} ${index.state.get(n.id)} ${n.learning ? 'learning' : ''}` : '',
    }));
    const fuse = new Fuse(docs, {
      keys: [
        { name: 'label', weight: 3 },
        { name: 'tags', weight: 2 },
        { name: 'rankName', weight: 1.5 },
        { name: 'path', weight: 1 },
        { name: 'text', weight: 0.6 },
      ],
      ignoreLocation: true,
      minMatchCharLength: 2,
      threshold: 0.35,
    });
    return { fuse, docs };
  }, [index]);

  /** With no query, show the quest log: what I'm learning, then what's ready to unlock. */
  const { results, groups } = useMemo(() => {
    const q = query.trim();
    if (q) return { results: fuse.search(q, { limit: MAX_RESULTS }).map((r) => r.item), groups: null };
    const learning = docs.filter((d) => d.learning);
    const ready = docs.filter((d) => d.state === 'available' && !d.learning);
    return { results: [...learning, ...ready], groups: { learning: learning.length, ready: ready.length } };
  }, [query, fuse, docs]);

  useEffect(() => setActive(0), [query]);
  useEffect(() => inputRef.current?.focus(), []);
  const firstActive = useRef(true);
  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${active}"]`)?.scrollIntoView({ block: 'nearest' });
    if (firstActive.current) firstActive.current = false;
    else play('cursor');
  }, [active]);

  const choose = (i: number) => {
    const r = results[i];
    if (r) onSelect(r.id);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActive((a) => Math.min(a + 1, results.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        choose(active);
        break;
      case 'Escape':
        e.preventDefault();
        e.stopPropagation();
        onClose();
        break;
      case 'Tab':
        e.preventDefault();
        break;
    }
  };

  const heading = (label: string) => (
    <li role="presentation" className="label-gold px-3 pb-1 pt-2 text-xs">
      {label}
    </li>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-[#03051a]/60 px-4 pt-[12vh]"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search skills"
        className="win flex max-h-[70vh] w-full max-w-xl flex-col overflow-hidden animate-[window-pop_160ms_ease-out]"
      >
        <div className="flex items-center gap-2 border-b border-frame/30 px-4">
          <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0 text-gold-300" aria-hidden>
            <path fill="currentColor" d="M8.5 3a5.5 5.5 0 014.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z" />
          </svg>
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={results[active] ? `${listId}-${active}` : undefined}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search abilities, or try “expert”, “ready”, “learning”…"
            className="h-14 w-full bg-transparent text-base text-white outline-none placeholder:text-indigo-200/60"
          />
          <kbd className="win-inset hidden px-1.5 text-[11px] text-gold-200 sm:block">Esc</kbd>
        </div>

        <ul ref={listRef} id={listId} role="listbox" aria-label="Results" className="overflow-y-auto p-2">
          {results.length === 0 && (
            <li role="presentation" className="px-3 py-8 text-center text-sm text-indigo-100/80">
              {query.trim() ? `No matches for “${query}”` : 'Nothing in the quest log. Mark a skill "learning": true to track it here.'}
            </li>
          )}
          {results.map((r, i) => (
            <Fragment key={r.id}>
              {groups && i === 0 && groups.learning > 0 && heading('⚔ Learning now')}
              {groups && i === groups.learning && groups.ready > 0 && heading('Ready to unlock')}
              <li
                id={`${listId}-${i}`}
                data-idx={i}
                role="option"
                aria-selected={i === active}
                onMouseMove={() => setActive(i)}
                onClick={() => choose(i)}
                className={`relative flex cursor-pointer items-center gap-3 rounded-md py-2 pl-9 pr-3 ${i === active ? 'bg-white/10' : ''}`}
              >
                {i === active && <HandCursor className="absolute left-1 top-1/2 h-4 w-6 -translate-y-1/2" />}
                <span className={`h-2 w-2 shrink-0 rotate-45 ${ACCENTS[index.accent.get(r.id)!].dot}`} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-sm font-medium ${r.state === 'locked' ? 'text-slate-400' : 'text-white'}`}>
                    {r.label}
                  </span>
                  {r.path && <span className="block truncate text-xs text-indigo-100/70">{r.path}</span>}
                </span>
                {r.kind === 'skill' ? (
                  r.state === 'locked' ? (
                    <LockIcon className="h-3 w-3 shrink-0 text-slate-400" />
                  ) : r.state === 'available' ? (
                    <span className="shrink-0 rounded-sm border border-emerald-300/70 bg-emerald-950/70 px-1.5 py-0.5 text-[10px] text-emerald-200">
                      Ready
                    </span>
                  ) : (
                    <RankPips rank={r.rank} />
                  )
                ) : (
                  <span className={`shrink-0 rounded-sm px-1.5 py-0.5 text-[10px] uppercase ${KIND_BADGE[r.kind]}`}>{KIND_LABEL[r.kind]}</span>
                )}
              </li>
            </Fragment>
          ))}
        </ul>

        <div className="flex gap-4 border-t border-frame/30 px-4 py-2 text-[11px] text-indigo-100/70">
          <span>
            <kbd className="font-sans">↑↓</kbd> move
          </span>
          <span>
            <kbd className="font-sans">↵</kbd> jump to skill
          </span>
          <span className="ml-auto">{results.length} shown</span>
        </div>
      </div>
    </div>
  );
}
