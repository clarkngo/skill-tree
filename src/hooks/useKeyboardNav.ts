import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { GraphIndex } from '../lib/graphIndex';
import type { LayoutDirection } from '../types';

export interface KeyboardNavOptions {
  index: GraphIndex | null;
  focusedId: string | null;
  expanded: ReadonlySet<string>;
  /** Arrow keys follow the layout: in TB, ↓ is the child axis and ←/→ the sibling axis. */
  direction: LayoutDirection;
  /** Called when a move has nowhere to go (leaf, root, only child). */
  onBump?: () => void;
  drawerOpen: boolean;
  searchOpen: boolean;
  /** Move the roving focus. `pan` asks the canvas to center the node. */
  focusNode: (id: string | null, opts?: { pan?: boolean }) => void;
  setExpanded: (id: string, open: boolean) => void;
  openDrawer: (id: string) => void;
  closeDrawer: () => void;
  openSearch: () => void;
  closeSearch: () => void;
}

export const nodeElementSelector = (id: string) => `[data-node-id="${CSS.escape(id)}"]`;

function isTypingTarget(el: EventTarget | null) {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Mindmap keyboard model (horizontal layout; vertical swaps the arrow axes):
 *   → / Tab           first child (expanding if needed)        [vertical: ↓]
 *   ← / Shift+Tab     parent                                   [vertical: ↑]
 *   ↓ / ↑             next / previous sibling (wraps)          [vertical: → / ←]
 *   Home / End        first / last sibling
 *   Enter / Space     open a skill's details, or toggle a realm / branch
 *   ⌘K / Ctrl+K / "/" open search
 *   Esc               close search → close drawer → deselect
 *
 * Tab only moves inside the tree while there is somewhere to go. At a leaf
 * (or Shift+Tab at a root) it falls through to the browser, so keyboard users
 * can always leave the canvas instead of being trapped in it.
 *
 * Returns the onKeyDown handler for the tree container; the global shortcuts
 * are bound to window.
 */
export function useKeyboardNav(opts: KeyboardNavOptions) {
  const optsRef = useRef(opts);
  optsRef.current = opts;

  const onTreeKeyDown = useCallback((e: ReactKeyboardEvent<HTMLElement>) => {
    const { index, focusedId, expanded, direction, focusNode, setExpanded, openDrawer, onBump } = optsRef.current;
    if (!index || e.altKey || e.ctrlKey || e.metaKey) return;
    // React Flow's controls and minimap live inside the tree container; keys
    // pressed on those must keep their normal behavior.
    const target = e.target as HTMLElement;
    if (target !== e.currentTarget && !target.hasAttribute('data-node-id')) return;

    // Nothing focused yet (e.g. after Esc): any nav key lands on the first root.
    if (!focusedId || !index.byId.has(focusedId)) {
      if (['ArrowRight', 'ArrowLeft', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) && index.rootIds[0]) {
        e.preventDefault();
        focusNode(index.rootIds[0], { pan: true });
      }
      return;
    }

    const node = index.byId.get(focusedId)!;
    const hasChildren = node.childrenIds.length > 0;
    const siblings = index.siblingsOf(focusedId);
    const pos = siblings.indexOf(focusedId);

    const goChild = () => {
      if (!hasChildren) return false;
      if (!expanded.has(node.id)) setExpanded(node.id, true);
      focusNode(node.childrenIds[0], { pan: true });
      return true;
    };
    const goParent = () => {
      if (!node.parentId) return false;
      focusNode(node.parentId, { pan: true });
      return true;
    };
    const goSibling = (target: number) => {
      if (siblings.length < 2) return onBump?.();
      focusNode(siblings[(target + siblings.length) % siblings.length], { pan: true });
    };

    const vertical = direction === 'TB';
    const key = {
      ArrowRight: vertical ? 'next' : 'child',
      ArrowLeft: vertical ? 'prev' : 'parent',
      ArrowDown: vertical ? 'child' : 'next',
      ArrowUp: vertical ? 'parent' : 'prev',
    }[e.key] ?? e.key;

    let handled = true;
    switch (key) {
      case 'child':
        if (!goChild()) onBump?.();
        break;
      case 'parent':
        if (!goParent()) onBump?.();
        break;
      case 'Tab':
        handled = e.shiftKey ? goParent() : goChild();
        break;
      case 'next':
        goSibling(pos + 1);
        break;
      case 'prev':
        goSibling(pos - 1);
        break;
      case 'Home':
        goSibling(0);
        break;
      case 'End':
        goSibling(siblings.length - 1);
        break;
      case 'Enter':
      case ' ':
        // Skills open their details (→ still expands sub-skills); realms and branches toggle.
        if (node.kind === 'skill') openDrawer(node.id);
        else if (hasChildren) setExpanded(node.id, !expanded.has(node.id));
        break;
      default:
        handled = false;
    }
    if (handled) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // Global shortcuts: search and escape work from anywhere on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const { searchOpen, drawerOpen, focusedId, openSearch, closeSearch, closeDrawer, focusNode } = optsRef.current;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (searchOpen) closeSearch();
        else openSearch();
        return;
      }
      if (e.key === '/' && !searchOpen && !isTypingTarget(e.target)) {
        e.preventDefault();
        openSearch();
        return;
      }
      if (e.key === 'Escape') {
        // The search modal handles its own Escape so it can restore focus.
        if (searchOpen) return;
        if (drawerOpen) {
          e.preventDefault();
          closeDrawer();
        } else if (focusedId) {
          focusNode(null);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Keep DOM focus on the roving node while no overlay owns focus. Only runs
  // when the focused id changes or an overlay closes, so toolbar clicks don't
  // get their focus stolen by unrelated re-renders.
  const { focusedId, drawerOpen, searchOpen } = opts;
  useEffect(() => {
    if (!focusedId || drawerOpen || searchOpen) return;
    // A freshly revealed node may not be mounted/measured by React Flow yet,
    // so retry for a few frames.
    let frames = 0;
    let raf = 0;
    const tryFocus = () => {
      const el = document.querySelector<HTMLElement>(nodeElementSelector(focusedId));
      if (el && el.offsetParent !== null) {
        el.focus({ preventScroll: true });
        if (document.activeElement === el) return;
      }
      if (++frames < 20) raf = requestAnimationFrame(tryFocus);
    };
    raf = requestAnimationFrame(tryFocus);
    return () => cancelAnimationFrame(raf);
  }, [focusedId, drawerOpen, searchOpen]);

  return { onTreeKeyDown };
}
