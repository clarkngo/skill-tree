// Validates public/data/skills.json. Runs before every build so a bad edit
// fails CI instead of shipping a broken tree.
import { readFileSync } from 'node:fs';

const file = new URL('../public/data/skills.json', import.meta.url);
const data = JSON.parse(readFileSync(file, 'utf8'));

const KINDS = ['realm', 'branch', 'skill'];
const ACCENTS = ['sky', 'violet', 'emerald', 'amber', 'rose', 'indigo', 'teal', 'orange'];
const errors = [];
const err = (id, msg) => errors.push(`${id}: ${msg}`);
const all = new Map();

if (!data.player?.name) err('player', 'needs a name');
if (!Array.isArray(data.realms)) err('realms', 'must be an array');

const walk = (n, depth) => {
  const id = n.id ?? `(unnamed under depth ${depth})`;
  if (!n.id || !/^[a-z0-9][a-z0-9-]*$/.test(n.id)) err(id, 'id must be lowercase kebab-case');
  if (all.has(n.id)) err(id, 'duplicate id');
  all.set(n.id, n);
  if (!n.label) err(id, 'missing label');
  if (n.kind && !KINDS.includes(n.kind)) err(id, `kind must be one of ${KINDS.join(', ')}`);
  if (n.rank !== undefined && !(Number.isInteger(n.rank) && n.rank >= 0 && n.rank <= 5)) err(id, 'rank must be an integer 0–5');
  if (n.color && (depth > 0 || !ACCENTS.includes(n.color))) err(id, `color is only for realms and must be one of ${ACCENTS.join(', ')}`);
  if (n.kind === 'skill' && depth === 0) err(id, 'top-level nodes are realms');
  if ((n.kind === 'branch' || n.kind === 'realm') && n.rank !== undefined) err(id, `${n.kind}es have no rank; it's derived from their skills`);
  for (const e of n.evidence ?? []) if (!e.label) err(id, 'every evidence item needs a label');
  (n.children ?? []).forEach((c) => walk(c, depth + 1));
};
(data.realms ?? []).forEach((r) => walk(r, 0));

// Prerequisites must exist and must not loop.
for (const n of all.values()) for (const r of n.requires ?? []) if (!all.has(r)) err(n.id, `requires unknown skill "${r}"`);
const color = new Map();
const visit = (id, stack) => {
  if (color.get(id) === 'done') return;
  if (color.get(id) === 'open') return err(id, `prerequisite cycle: ${[...stack, id].join(' → ')}`);
  color.set(id, 'open');
  for (const r of all.get(id)?.requires ?? []) if (all.has(r)) visit(r, [...stack, id]);
  color.set(id, 'done');
};
for (const id of all.keys()) visit(id, []);

if (errors.length) {
  console.error(`skills.json: ${errors.length} problem(s)\n  ` + errors.join('\n  '));
  process.exit(1);
}
const ranked = [...all.values()].filter((n) => n.rank !== undefined);
console.log(`skills.json OK: ${all.size} nodes, ${ranked.length} ranked skills, ${ranked.filter((n) => n.rank > 0).length} unlocked`);
