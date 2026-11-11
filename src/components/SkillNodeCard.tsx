import { createContext, memo, useContext } from 'react';
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react';
import type { AccentName, LayoutDirection, SkillNode, SkillState } from '../types';
import type { Aggregate } from '../lib/graphIndex';
import { ACCENTS, KIND_BADGE, KIND_LABEL, RANKS, STATE } from '../lib/theme';
import { NODE_HEIGHT, NODE_WIDTH } from '../lib/layout';

export type SkillFlowNode = Node<
  {
    skill: SkillNode;
    state?: SkillState;
    agg: Aggregate;
    accent: AccentName;
    expanded: boolean;
    focused: boolean;
    direction: LayoutDirection;
    level: number;
    posInSet: number;
    setSize: number;
  },
  'skill'
>;

export interface NodeActions {
  onActivate: (id: string) => void;
  onToggle: (id: string) => void;
  onOpen: (id: string) => void;
}

export const NodeActionsContext = createContext<NodeActions | null>(null);

function describe(n: SkillNode, state: SkillState | undefined, agg: Aggregate, expanded: boolean) {
  const kids = n.childrenIds.length ? `, ${n.childrenIds.length} ${n.childrenIds.length === 1 ? 'child' : 'children'}${expanded ? '' : ', collapsed'}` : '';
  if (n.kind === 'skill')
    return `${n.label}. Skill, ${RANKS[n.rank].name} (rank ${n.rank} of 5), ${STATE[state!].label}${n.learning ? ', currently learning' : ''}${kids}.`;
  return `${n.label}. ${KIND_LABEL[n.kind]}, ${agg.unlocked} of ${agg.skills} skills unlocked${kids}.`;
}

function SkillNodeCardImpl({ data }: NodeProps<SkillFlowNode>) {
  const actions = useContext(NodeActionsContext)!;
  const { skill: n, state, agg, accent, expanded, focused, direction, level, posInSet, setSize } = data;
  const isSkill = n.kind === 'skill';
  const hasChildren = n.childrenIds.length > 0;
  const locked = state === 'locked';
  const ready = state === 'available';
  const mastered = state === 'mastered';
  const [target, source] = direction === 'LR' ? [Position.Left, Position.Right] : [Position.Top, Position.Bottom];

  return (
    <div
      data-node-id={n.id}
      role="treeitem"
      aria-level={level}
      aria-posinset={posInSet}
      aria-setsize={setSize}
      aria-expanded={hasChildren ? expanded : undefined}
      aria-selected={focused}
      aria-label={describe(n, state, agg, expanded)}
      tabIndex={focused ? 0 : -1}
      onFocus={() => !focused && actions.onActivate(n.id)}
      onClick={() => (isSkill ? actions.onOpen(n.id) : actions.onActivate(n.id))}
      onDoubleClick={() => hasChildren && actions.onToggle(n.id)}
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT }}
      className={[
        'group relative flex flex-col justify-between rounded-xl border border-l-4 px-3 py-2 text-left shadow-sm outline-none transition-shadow',
        ACCENTS[accent].border,
        n.kind === 'realm' ? 'bg-slate-50 dark:bg-slate-800' : 'bg-white dark:bg-slate-900',
        locked || ready ? 'border-dashed' : '',
        ready && !focused ? 'ready-pulse border-emerald-400 dark:border-emerald-500' : '',
        mastered && !focused ? 'border-amber-300 shadow-amber-200/60 shadow-md dark:border-amber-500/70 dark:shadow-amber-900/40' : '',
        focused
          ? 'border-indigo-500 ring-4 ring-indigo-500/30 shadow-md dark:border-indigo-400'
          : !ready && !mastered
            ? 'border-slate-200 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
            : '',
        'focus-visible:ring-4 focus-visible:ring-indigo-500/60',
      ].join(' ')}
    >
      <Handle type="target" position={target} isConnectable={false} className="!pointer-events-none !opacity-0" />

      <div className="flex items-center gap-1.5">
        {isSkill ? (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${ready ? 'bg-emerald-100 text-emerald-900 dark:bg-emerald-900/60 dark:text-emerald-100' : RANKS[n.rank].badge}`}>
            {ready ? 'Ready' : mastered ? '★ Master' : RANKS[n.rank].name}
          </span>
        ) : (
          <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${KIND_BADGE[n.kind]}`}>{KIND_LABEL[n.kind]}</span>
        )}
        {n.learning && (
          <span title="Currently learning" className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">
            ⚔ Learning
          </span>
        )}
        <span className="ml-auto flex items-center gap-1">
          {isSkill ? (
            locked ? <LockIcon className="h-3 w-3 text-slate-400" /> : <RankPips rank={n.rank} />
          ) : (
            <span className="text-[10px] font-medium tabular-nums text-slate-500 dark:text-slate-400" aria-hidden>
              {agg.unlocked}/{agg.skills}
            </span>
          )}
        </span>
      </div>

      <div className={`line-clamp-2 text-[13px] font-semibold leading-snug ${locked ? 'text-slate-400 dark:text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
        {n.label}
      </div>

      {!isSkill && agg.skills > 0 && (
        <div className="h-1 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800" aria-hidden>
          <div className={`h-full rounded-full ${ACCENTS[accent].dot}`} style={{ width: `${(agg.unlocked / agg.skills) * 100}%` }} />
        </div>
      )}

      {hasChildren && (
        <button
          type="button"
          tabIndex={-1}
          aria-hidden
          onClick={(e) => {
            e.stopPropagation();
            actions.onActivate(n.id);
            actions.onToggle(n.id);
          }}
          className={[
            'nodrag absolute z-10 flex h-6 w-6 items-center justify-center rounded-full border bg-white text-xs font-bold text-slate-600 shadow-sm',
            'hover:border-indigo-500 hover:text-indigo-600 dark:bg-slate-800 dark:text-slate-300',
            direction === 'LR' ? '-right-3 top-1/2 -translate-y-1/2' : '-bottom-3 left-1/2 -translate-x-1/2',
            expanded ? 'border-slate-300 dark:border-slate-600' : 'border-indigo-400 dark:border-indigo-500',
          ].join(' ')}
        >
          {expanded ? '−' : n.childrenIds.length}
        </button>
      )}

      <Handle type="source" position={source} isConnectable={false} className="!pointer-events-none !opacity-0" />
    </div>
  );
}

export function RankPips({ rank, size = 'sm' }: { rank: number; size?: 'sm' | 'md' }) {
  const dim = size === 'sm' ? 'h-1.5 w-2.5' : 'h-2 w-4';
  return (
    <span className="flex gap-0.5" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`${dim} rounded-sm ${i <= rank ? RANKS[rank as 1].pip : RANKS[0].pip}`} />
      ))}
    </span>
  );
}

export function LockIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" className={className} aria-hidden>
      <path fill="currentColor" d="M5 7V5a3 3 0 016 0v2h1a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8a1 1 0 011-1h1zm1.5 0h3V5a1.5 1.5 0 00-3 0v2z" />
    </svg>
  );
}

export const SkillNodeCard = memo(SkillNodeCardImpl);
