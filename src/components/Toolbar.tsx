import { useEffect, useState } from 'react';
import type { LayoutDirection } from '../types';
import { isMuted, onMutedChange, play, setMuted } from '../lib/sfx';
import type { GraphIndex } from '../lib/graphIndex';
import { levelFromXp } from '../lib/progress';

interface Props {
  index: GraphIndex;
  direction: LayoutDirection;
  onDirection: (d: LayoutDirection) => void;
  onSearch: () => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onFit: () => void;
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

const btn = 'cmd text-sm';

export function Toolbar({ index, direction, onDirection, onSearch, onExpandAll, onCollapseAll, onFit }: Props) {
  const { level, into, span, toNext } = levelFromXp(index.total.xp);
  const { name, title } = index.player;

  return (
    <header className="win win-flat z-10 flex flex-wrap items-center gap-3 px-4 py-2">
      <div className="mr-1 flex items-center gap-2">
        <svg viewBox="0 0 32 32" className="h-7 w-7 drop-shadow-[0_0_6px_rgba(245,200,76,0.6)]" aria-hidden>
          <path d="M16 2l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill="#fde68a" stroke="#8a6410" strokeWidth="1.2" />
          <circle cx="16" cy="16" r="3" fill="#fff" />
        </svg>
        <h1 className="title-gold text-lg">
          {name}’s Skill Tree
        </h1>
      </div>

      <div
        className="win-inset flex items-center gap-3 px-3 py-1"
        title={`${index.total.xp} EXP total · ${toNext} EXP to level ${level + 1}`}
        aria-label={`Level ${level}${title ? ` ${title}` : ''}. ${index.total.xp} XP, ${toNext} to next level. ${index.total.unlocked} of ${index.total.skills} skills unlocked, ${index.total.mastered} mastered.`}
      >
        <span className="flex items-baseline gap-1">
          <span className="label-gold text-[10px]">Lv</span>
          <span className="font-display text-xl font-bold leading-none text-white">{level}</span>
        </span>
        <span className="hidden flex-col gap-1 sm:flex">
          {title && <span className="text-[10px] leading-none text-indigo-100/90">{title}</span>}
          <span className="flex items-center gap-1.5">
            <span className="label-gold text-[9px]">Exp</span>
            <span className="gauge block w-28">
              <span style={{ width: `${(into / span) * 100}%` }} />
            </span>
          </span>
        </span>
        <span className="text-[11px] tabular-nums text-indigo-100/90">
          {index.total.unlocked}/{index.total.skills} <span className="text-gold-300">★{index.total.mastered}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onSearch}
        className="win-inset flex min-w-0 flex-1 items-center gap-2 px-3 py-1.5 text-left text-sm text-indigo-100/80 hover:text-white focus-visible:outline-2 focus-visible:outline-gold-300 sm:max-w-xs"
      >
        <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" aria-hidden>
          <path fill="currentColor" d="M8.5 3a5.5 5.5 0 014.38 8.83l3.65 3.64-1.06 1.06-3.64-3.65A5.5 5.5 0 118.5 3zm0 1.5a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
        <span className="flex-1 truncate">Search abilities…</span>
        <kbd className="hidden rounded-sm border border-indigo-200/40 px-1 text-[11px] sm:inline">{isMac ? '⌘K' : 'Ctrl K'}</kbd>
      </button>

      <nav className="ml-auto flex items-center gap-1" aria-label="Commands">
        <div role="group" aria-label="Layout direction" className="mr-2 flex gap-1">
          {(['LR', 'TB'] as const).map((d) => (
            <button key={d} type="button" aria-pressed={direction === d} onClick={() => onDirection(d)} className="cmd text-xs">
              {d === 'LR' ? 'Horizontal' : 'Vertical'}
            </button>
          ))}
        </div>
        <button type="button" className={btn} onClick={onExpandAll}>
          Expand
        </button>
        <button type="button" className={btn} onClick={onCollapseAll}>
          Collapse
        </button>
        <button type="button" className={`${btn} hidden sm:block`} onClick={onFit}>
          Fit
        </button>
        <SoundToggle />
      </nav>
    </header>
  );
}

function SoundToggle() {
  const [muted, setMutedState] = useState(isMuted);
  useEffect(() => onMutedChange(setMutedState), []);
  return (
    <button
      type="button"
      aria-pressed={!muted}
      aria-label="Sound effects"
      title={muted ? 'Sound off' : 'Sound on'}
      onClick={() => {
        setMuted(!muted);
        if (muted) play('confirm');
      }}
      className="ml-1 rounded-md p-1.5 text-indigo-100 hover:bg-white/10 hover:text-gold-300 focus-visible:outline-2 focus-visible:outline-gold-300"
    >
      <svg viewBox="0 0 20 20" className="h-5 w-5" aria-hidden>
        <path fill="currentColor" d="M3 7.5h3l4-3.5v12l-4-3.5H3z" />
        {muted ? (
          <path d="M13 7.5l5 5m0-5l-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        ) : (
          <path d="M13 7a4 4 0 010 6M15.5 4.5a7.5 7.5 0 010 11" stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        )}
      </svg>
    </button>
  );
}
