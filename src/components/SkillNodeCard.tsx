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

  const orbClass = !isSkill ? '' : locked ? 'orb-locked' : ready ? 'orb-ready' : mastered ? 'orb-mastered' : '';
  const orbGlyph = !isSkill ? (n.kind === 'realm' ? '✦' : '◆') : locked ? null : ready ? '!' : mastered ? '★' : n.rank;

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
      style={{ width: NODE_WIDTH, height: NODE_HEIGHT, ['--accent' as string]: ACCENTS[accent].hex }}
      className={[
        'win node-card group flex items-center gap-3 py-2 pl-2.5 pr-3 text-left outline-none',
        locked ? 'node-card-locked' : '',
        mastered ? 'node-card-mastered' : '',
        focused ? 'node-card-focused' : '',
      ].join(' ')}
    >
      <Handle type="target" position={target} isConnectable={false} className="!pointer-events-none !opacity-0" />

      {focused && <HandCursor className={direction === 'TB' ? 'hand-cursor hand-cursor-down' : 'hand-cursor'} />}

      <span
        className={`orb shrink-0 ${n.kind === 'realm' ? 'h-12 w-12 text-xl' : 'h-10 w-10 text-base'} ${orbClass}`}
        style={ready ? undefined : { ['--accent' as string]: ACCENTS[accent].hex }}
        aria-hidden
      >
        {orbGlyph === null ? <LockIcon className="h-4 w-4" /> : orbGlyph}
      </span>

      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1">
        <div className="flex items-center gap-1.5">
          {isSkill ? (
            <span className={`rounded-sm px-1 text-[9px] uppercase leading-[14px] tracking-wider ${ready ? 'border border-emerald-300/70 bg-emerald-950/70 text-emerald-200' : RANKS[n.rank].badge}`}>
              {ready ? 'Ready' : RANKS[n.rank].name}
            </span>
          ) : (
            <span className={`rounded-sm px-1 text-[9px] uppercase leading-[14px] tracking-wider ${KIND_BADGE[n.kind]}`}>{KIND_LABEL[n.kind]}</span>
          )}
          {n.learning && (
            <span title="Currently learning" className="rounded-sm border border-rose-300/70 bg-rose-950/70 px-1 text-[9px] uppercase leading-[14px] tracking-wider text-rose-200">
              ⚔ Quest
            </span>
          )}
          <span className="ml-auto flex items-center">
            {isSkill ? (
              !locked && <RankPips rank={n.rank} />
            ) : (
              <span className="text-[10px] tabular-nums text-indigo-100/80" aria-hidden>
                {agg.unlocked}/{agg.skills}
              </span>
            )}
          </span>
        </div>

        <div
          className={`line-clamp-2 leading-tight ${n.kind === 'realm' ? 'title-gold text-[15px]' : 'text-[13px]'} ${locked ? 'text-slate-400' : 'text-white'}`}
        >
          {n.label}
        </div>

        {!isSkill && agg.skills > 0 && (
          <div className="gauge gauge-accent" aria-hidden>
            <span style={{ width: `${(agg.unlocked / agg.skills) * 100}%` }} />
          </div>
        )}
      </div>

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
            'nodrag absolute z-10 flex h-6 w-6 rotate-45 items-center justify-center border-2 text-[11px] shadow-md',
            'bg-gradient-to-br from-win-hi to-win-lo hover:border-gold-300',
            direction === 'LR' ? '-right-3 top-1/2 -mt-3' : '-bottom-3 left-1/2 -ml-3',
            expanded ? 'border-frame/70 text-indigo-100' : 'border-gold-400 text-gold-300',
          ].join(' ')}
        >
          <span className="-rotate-45">{expanded ? '−' : n.childrenIds.length}</span>
        </button>
      )}

      <Handle type="source" position={source} isConnectable={false} className="!pointer-events-none !opacity-0" />
    </div>
  );
}

/** The classic pointing glove. */
export function HandCursor({ className = 'hand-cursor' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 22" className={className} aria-hidden>
      <path
        d="M1 8h15V5.5a2.5 2.5 0 012.5-2.5H29a2 2 0 010 4h-6v1h3a2 2 0 010 4h-1a2 2 0 010 4h-1a2 2 0 010 4H12c-3 0-5-2-6-4H1z"
        fill="#fff"
        stroke="#1b1f3a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M22 11h3M22 15h2M16 8v3" stroke="#1b1f3a" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function RankPips({ rank, size = 'sm' }: { rank: number; size?: 'sm' | 'md' }) {
  const color = RANKS[(rank || 0) as 0].crystal;
  return (
    <span className={`flex ${size === 'sm' ? 'gap-[3px]' : 'gap-1.5'} px-0.5`} aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={`crystal ${size === 'md' ? 'crystal-md' : ''} ${i <= rank ? 'crystal-on' : ''}`} style={{ ['--c' as string]: color }} />
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
