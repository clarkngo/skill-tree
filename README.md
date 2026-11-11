# Skill Tree

A personal, ever-expanding map of what I know, laid out like an RPG skill tree. Realms branch into skill groups, and each skill has a **rank**, earns **XP** toward a character **level**, and can **require** other skills before it unlocks.

Built on the same canvas as [Problem Atlas](https://github.com/clarkngo/problem-atlas): React 19 + TypeScript + Vite, Tailwind v4, React Flow, Dagre, and Fuse.js. Fully static, no backend.

```bash
npm install
npm run dev        # http://localhost:5173/skill-tree/
npm run build      # validate data → typecheck → build to dist/
npm run validate   # check public/data/skills.json only
```

Pushing to `main` deploys to GitHub Pages via `.github/workflows/static.yml` (set **Settings → Pages → Source** to **GitHub Actions**).

## Ranks & XP

| Rank | Name | Meaning | XP |
| --- | --- | --- | --- |
| 0 | Locked | Not learned yet | 0 |
| 1 | Novice | Tried it, can follow a tutorial | 10 |
| 2 | Apprentice | Used it for real, still looking things up | 30 |
| 3 | Adept | Comfortable alone, shipped real work | 60 |
| 4 | Expert | Go-to person, can teach it | 100 |
| 5 | Master | Deep, opinionated, battle-tested | 150 |

Character level *L* starts at `20·(L−1)²` total XP. A rank-0 skill shows as **Ready** (pulsing green) when every skill it `requires` is unlocked, otherwise **Locked**.

## Adding knowledge

Everything lives in [`public/data/skills.json`](public/data/skills.json) as a **nested** tree, so leveling up is a one-line edit and adding a skill is one object:

```jsonc
{
  "id": "agents",                    // unique kebab-case; used in links (#/n/agents) and `requires`
  "label": "Agents & tool use",
  "rank": 2,                         // 0–5. Having a rank makes it a skill.
  "learning": true,                  // shows ⚔ Learning and puts it in the quest log (search with empty query)
  "since": "2024",
  "requires": ["prompting", "apis"], // prerequisites, drawn as dashed gold links when focused
  "summary": "…",
  "notes": "…",                      // free-form field notes
  "next": ["Build and ship an MCP server"],                 // quests to reach the next rank
  "evidence": [{ "label": "My MCP server", "url": "https://…" }],
  "tags": ["ai"],
  "children": []                     // skills can have sub-skills
}
```

Top-level entries are **realms** (optionally `"color": "sky" | "violet" | "emerald" | "amber" | "rose" | "indigo" | "teal" | "orange"`). Nodes with children but no rank are **branches**, whose progress is rolled up from the skills beneath them.

## Keyboard

`→`/`Tab` first child · `←`/`⇧Tab` parent · `↑`/`↓` siblings · `Enter` open a skill or toggle a branch · `⌘K` or `/` search · `Esc` close.
