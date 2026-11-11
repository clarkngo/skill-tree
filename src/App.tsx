import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type NodeChange,
} from '@xyflow/react';
import type { LayoutDirection, SkillTreeFile } from './types';
import { buildIndex, visibleIds, type GraphIndex } from './lib/graphIndex';
import { NODE_HEIGHT, NODE_WIDTH, layoutTree } from './lib/layout';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { SkillNodeCard, NodeActionsContext, type SkillFlowNode, type NodeActions } from './components/SkillNodeCard';
import { ACCENTS } from './lib/theme';
import { SearchModal } from './components/SearchModal';
import { DetailDrawer } from './components/DetailDrawer';
import { Toolbar } from './components/Toolbar';
import { Legend } from './components/Legend';
import { play } from './lib/sfx';

const nodeTypes = { skill: SkillNodeCard };

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Matches the drawer's max-w-md. */
const DRAWER_WIDTH = 448;

const HASH_PREFIX = '#/n/';
const idFromHash = () => (location.hash.startsWith(HASH_PREFIX) ? decodeURIComponent(location.hash.slice(HASH_PREFIX.length)) : null);

export default function App() {
  const [index, setIndex] = useState<GraphIndex | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/skills.json`)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<SkillTreeFile>;
      })
      .then((t) => setIndex(buildIndex(t)))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) {
    return (
      <div className="starfield flex h-full items-center justify-center p-6 text-center">
        Couldn’t load the skill tree ({error}).
      </div>
    );
  }
  if (!index) {
    return <div className="starfield flex h-full items-center justify-center text-indigo-100">Now loading…</div>;
  }
  return (
    <ReactFlowProvider>
      <SkillTree index={index} />
    </ReactFlowProvider>
  );
}

function SkillTree({ index }: { index: GraphIndex }) {
  const rf = useReactFlow<SkillFlowNode>();
  const treeRef = useRef<HTMLDivElement>(null);

  const [direction, setDirection] = useState<LayoutDirection>(() =>
    window.matchMedia('(max-width: 640px)').matches ? 'TB' : 'LR',
  );
  const [expanded, setExpandedSet] = useState<Set<string>>(() => {
    // Open every realm so the first view shows the main branches.
    const initial = new Set(index.rootIds);
    const deep = idFromHash();
    if (deep && index.byId.has(deep)) index.pathTo(deep).slice(0, -1).forEach((id) => initial.add(id));
    return initial;
  });
  const [focusedId, setFocusedId] = useState<string | null>(() => {
    const deep = idFromHash();
    return deep && index.byId.has(deep) ? deep : null;
  });
  const [drawerId, setDrawerId] = useState<string | null>(() => {
    const deep = idFromHash();
    return deep && index.byId.get(deep)?.kind === 'skill' ? deep : null;
  });
  const [searchOpen, setSearchOpen] = useState(false);

  // Pan requests are counted so repeated requests for the same node still fire.
  const [panTick, setPanTick] = useState(focusedId ? 1 : 0);
  const lastFocused = useRef<string | null>(focusedId);
  const initialDeepLink = useRef(focusedId !== null);

  // ── Actions ────────────────────────────────────────────────────────────
  const focusNode = useCallback((id: string | null, opts?: { pan?: boolean }) => {
    setFocusedId(id);
    if (id) lastFocused.current = id;
    if (id && opts?.pan) setPanTick((t) => t + 1);
    if (!id && treeRef.current?.contains(document.activeElement)) treeRef.current.focus({ preventScroll: true });
  }, []);

  const setExpanded = useCallback((id: string, open: boolean) => {
    setExpandedSet((prev) => {
      if (prev.has(id) === open) return prev;
      const next = new Set(prev);
      if (open) next.add(id);
      else next.delete(id);
      return next;
    });
  }, []);

  /** Expand every ancestor so the node is on the canvas, then focus it. */
  const reveal = useCallback(
    (id: string) => {
      setExpandedSet((prev) => {
        const next = new Set(prev);
        index.pathTo(id).slice(0, -1).forEach((a) => next.add(a));
        return next;
      });
      focusNode(id, { pan: true });
    },
    [index, focusNode],
  );

  const openDrawer = useCallback(
    (id: string) => {
      if (index.byId.get(id)?.kind !== 'skill') return;
      focusNode(id, { pan: true });
      setDrawerId(id);
    },
    [index, focusNode],
  );
  const closeDrawer = useCallback(() => setDrawerId(null), []);

  const collapseAll = () => {
    setExpandedSet(new Set());
    if (focusedId) focusNode(index.pathTo(focusedId)[0], { pan: true });
    setDrawerId(null);
  };
  const expandAll = () => {
    setExpandedSet(new Set(index.branchIds));
    requestAnimationFrame(() => rf.fitView({ duration: 400, padding: 0.1 }));
  };

  const nodeActions = useMemo<NodeActions>(
    () => ({
      onActivate: (id) => focusNode(id),
      onToggle: (id) => {
        setExpandedSet((prev) => {
          const next = new Set(prev);
          if (next.has(id)) next.delete(id);
          else next.add(id);
          return next;
        });
        focusNode(id, { pan: true });
      },
      onOpen: openDrawer,
    }),
    [focusNode, openDrawer],
  );

  const { onTreeKeyDown } = useKeyboardNav({
    index,
    focusedId,
    expanded,
    direction,
    onBump: () => play('bump'),
    drawerOpen: drawerId !== null,
    searchOpen,
    focusNode,
    setExpanded,
    openDrawer,
    closeDrawer,
    openSearch: () => setSearchOpen(true),
    closeSearch: () => setSearchOpen(false),
  });

  // ── Sound ──────────────────────────────────────────────────────────
  // One sound per state change, picked by priority, so a single action that
  // changes several things (e.g. a search pick closes search and opens the
  // drawer) doesn't stack sounds.
  const prevUi = useRef({ focusedId, drawerId, searchOpen, expandedSize: expanded.size });
  useEffect(() => {
    const prev = prevUi.current;
    const now = { focusedId, drawerId, searchOpen, expandedSize: expanded.size };
    prevUi.current = now;
    if (now.drawerId && now.drawerId !== prev.drawerId) play('confirm');
    else if (now.searchOpen && !prev.searchOpen) play('open');
    else if ((prev.drawerId && !now.drawerId) || (prev.searchOpen && !now.searchOpen)) play('cancel');
    else if (now.expandedSize > prev.expandedSize) play('expand');
    else if (now.expandedSize < prev.expandedSize) play('collapse');
    else if (now.focusedId !== prev.focusedId) play(now.focusedId ? 'cursor' : 'cancel');
  }, [focusedId, drawerId, searchOpen, expanded.size]);

  // ── Layout ─────────────────────────────────────────────────────────────
  const visible = useMemo(() => visibleIds(index, expanded), [index, expanded]);

  const baseEdges = useMemo(() => {
    const set = new Set(visible);
    return visible.flatMap((id) => {
      const p = index.byId.get(id)!.parentId;
      return p && set.has(p) ? [{ id: `${p}->${id}`, source: p, target: id }] : [];
    });
  }, [index, visible]);

  const layout = useMemo(() => layoutTree(visible, baseEdges, direction), [visible, baseEdges, direction]);

  const focusPath = useMemo(() => new Set(focusedId ? index.pathTo(focusedId) : []), [index, focusedId]);

  const edges = useMemo<Edge[]>(
    () =>
      baseEdges.map((e) => {
        const onPath = focusPath.has(e.target);
        return {
          ...e,
          type: 'default',
          animated: onPath && e.target === focusedId,
          className: onPath ? 'tree-edge-active' : 'tree-edge',
          focusable: false,
        };
      }),
    [baseEdges, focusPath, focusedId],
  );

  // Prerequisite links are cross-tree, so draw them only for the focused skill
  // (both what it requires and what it unlocks) to keep the canvas readable.
  const reqEdges = useMemo<Edge[]>(() => {
    const f = focusedId ? index.byId.get(focusedId) : undefined;
    if (!f) return [];
    const set = new Set(visible);
    const pairs: [string, string][] = [...f.requires.map((r) => [r, f.id] as [string, string]), ...f.unlocks.map((u) => [f.id, u] as [string, string])];
    return pairs
      .filter(([s, t]) => set.has(s) && set.has(t))
      .map(([s, t]) => ({ id: `req:${s}->${t}`, source: s, target: t, type: 'default', className: 'req-edge', animated: true, focusable: false, zIndex: 1 }));
  }, [index, focusedId, visible]);

  const computedNodes = useMemo<SkillFlowNode[]>(
    () =>
      visible.map((id) => {
        const n = index.byId.get(id)!;
        const siblings = index.siblingsOf(id);
        const pos = layout.get(id)!;
        return {
          id,
          type: 'skill',
          position: { x: pos.x, y: pos.y },
          width: NODE_WIDTH,
          height: NODE_HEIGHT,
          focusable: false,
          selectable: false,
          // The card inside is the treeitem; the wrapper should be invisible to AT.
          ariaRole: 'none',
          data: {
            skill: n,
            state: index.state.get(id),
            agg: index.agg.get(id)!,
            accent: index.accent.get(id)!,
            expanded: expanded.has(id),
            focused: id === focusedId,
            direction,
            level: index.depth.get(id)! + 1,
            posInSet: siblings.indexOf(id) + 1,
            setSize: siblings.length,
          },
        };
      }),
    [visible, index, layout, expanded, focusedId, direction],
  );

  // React Flow owns drag positions; re-layout resets them, other updates keep them.
  const [nodes, setNodes] = useState<SkillFlowNode[]>(computedNodes);
  const prevLayout = useRef(layout);
  useEffect(() => {
    const relayout = prevLayout.current !== layout;
    prevLayout.current = layout;
    setNodes((prev) => {
      const prevById = new Map(prev.map((n) => [n.id, n]));
      return computedNodes.map((n) => {
        const old = prevById.get(n.id);
        return old ? { ...n, position: relayout ? n.position : old.position, measured: old.measured } : n;
      });
    });
  }, [computedNodes, layout]);

  const onNodesChange = useCallback(
    (changes: NodeChange<SkillFlowNode>[]) => setNodes((ns) => applyNodeChanges(changes, ns)),
    [],
  );

  // ── Viewport ───────────────────────────────────────────────────────────
  const nodesRef = useRef(nodes);
  nodesRef.current = nodes;
  useEffect(() => {
    if (!panTick || !focusedId) return;
    // Wait a frame so a re-layout triggered in the same update has landed.
    const raf = requestAnimationFrame(() => {
      const pos = nodesRef.current.find((n) => n.id === focusedId)?.position ?? layout.get(focusedId);
      if (!pos) return;
      const zoom = Math.max(rf.getZoom(), 0.75);
      // With the drawer open on a wide screen, center in the uncovered area.
      const drawerPx = drawerId && window.innerWidth >= 768 ? DRAWER_WIDTH : 0;
      rf.setCenter(pos.x + NODE_WIDTH / 2 + drawerPx / 2 / zoom, pos.y + NODE_HEIGHT / 2, {
        zoom,
        duration: reduceMotion() ? 0 : 350,
      });
    });
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panTick, layout]);

  // React Flow hard-codes role="application" on its wrapper, which would sit
  // between our role="tree" and the treeitems and break tree ownership for
  // screen readers. React never rewrites an unchanged prop, so this sticks.
  useEffect(() => {
    treeRef.current?.querySelector('.react-flow')?.setAttribute('role', 'presentation');
  }, []);

  // Follow links pasted into the address bar on an already-open page.
  useEffect(() => {
    const onHash = () => {
      const id = idFromHash();
      if (!id || !index.byId.has(id) || id === lastFocused.current) return;
      reveal(id);
      setDrawerId(index.byId.get(id)!.kind === 'skill' ? id : null);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [index, reveal]);

  // Keep a shareable deep link to the focused node (replaceState doesn't fire hashchange).
  useEffect(() => {
    const url = focusedId ? `${HASH_PREFIX}${encodeURIComponent(focusedId)}` : location.pathname + location.search;
    history.replaceState(null, '', url);
  }, [focusedId]);

  const drawerNode = drawerId ? index.byId.get(drawerId) : undefined;

  return (
    <div className="flex h-full flex-col">
      <Toolbar
        index={index}
        direction={direction}
        onDirection={(d) => {
          if (d !== direction) play('confirm');
          setDirection(d);
        }}
        onSearch={() => setSearchOpen(true)}
        onExpandAll={expandAll}
        onCollapseAll={collapseAll}
        onFit={() => {
          play('confirm');
          rf.fitView({ duration: 400, padding: 0.1 });
        }}
      />

      <main className="starfield relative min-h-0 flex-1">
        <NodeActionsContext.Provider value={nodeActions}>
          <div
            ref={treeRef}
            role="tree"
            aria-label="Skill tree. Arrow keys move between nodes; Enter opens a skill or toggles a branch."
            tabIndex={focusedId ? -1 : 0}
            onKeyDown={onTreeKeyDown}
            onFocus={(e) => {
              // Tabbing into the canvas with nothing focused lands on the last-used node.
              if (e.target !== e.currentTarget) return;
              if (e.relatedTarget && e.currentTarget.contains(e.relatedTarget as Node)) return;
              const target = lastFocused.current && visible.includes(lastFocused.current) ? lastFocused.current : index.rootIds[0];
              if (target) focusNode(target, { pan: true });
            }}
            className="h-full w-full outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-gold-300/40"
          >
            <ReactFlow
              nodes={nodes}
              edges={reqEdges.length ? [...edges, ...reqEdges] : edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onPaneClick={() => focusNode(null)}
              nodesConnectable={false}
              elementsSelectable={false}
              disableKeyboardA11y
              fitView={!initialDeepLink.current}
              onInit={() => initialDeepLink.current && setPanTick((t) => t + 1)}
              fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
              minZoom={0.15}
              maxZoom={1.75}
              colorMode="dark"
            >
              <Background gap={32} size={1} color="rgba(165,180,252,0.18)" />
              <Controls showInteractive={false} position="bottom-right" />
              <MiniMap
                pannable
                zoomable
                position="top-right"
                className="!hidden md:!block"
                nodeColor={(n) => {
                  const d = (n as SkillFlowNode).data;
                  return d.state === 'locked' ? 'rgb(71 85 105)' : ACCENTS[d.accent].hex;
                }}
                nodeStrokeWidth={3}
                nodeBorderRadius={20}
              />
            </ReactFlow>
          </div>
        </NodeActionsContext.Provider>

        <Legend direction={direction} />
      </main>

      {drawerNode && (
        <DetailDrawer
          index={index}
          node={drawerNode}
          onClose={closeDrawer}
          onNavigate={(id) => {
            reveal(id);
            setDrawerId(index.byId.get(id)?.kind === 'skill' ? id : null);
          }}
        />
      )}

      {searchOpen && (
        <SearchModal
          index={index}
          onClose={() => setSearchOpen(false)}
          onSelect={(id) => {
            setSearchOpen(false);
            reveal(id);
            setDrawerId(index.byId.get(id)?.kind === 'skill' ? id : null);
          }}
        />
      )}
    </div>
  );
}

