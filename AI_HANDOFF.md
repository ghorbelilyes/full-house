# AI Handoff — Protek (EverShop)

## Project Summary (10 lines)

- **Protek**: Tunisian e-commerce store for electricity & security products
- Built on **EverShop v2.1.0** open-source platform (source monorepo, not generated app)
- Stack: **Node 20**, **Express**, **React (SSR)**, **PostgreSQL 16**, **GraphQL**, **Webpack**, **SWC**, **Tailwind CSS 4**
- Entire UI is **French only** (`fr-TN`), currency is **TND**
- 14 core modules + 11 custom extensions enabled
- File-based routing with Area-based component layout system
- **No dev server / hot-reload** — every change requires: compile → sed fix → build → restart
- Extensions customize behavior; themes customize storefront appearance
- SWC compilation has known bugs requiring post-compile patches (sed fix + UI component copy)
- Production mode only: `npm run build` then `npm run start` on port 3000

## Most Important Paths

| Path | What |
|------|------|
| `config/default.json` | Store config, extensions list, OMS workflow |
| `packages/evershop/src/modules/` | Core modules (catalog, checkout, auth, etc.) |
| `extensions/` | Custom extensions (11 enabled) |
| `translations/fr-TN/` | French translation CSVs |
| `packages/evershop/src/components/common/` | Shared UI components |
| `.env` | Database + email credentials (secrets) |
| `packages/evershop/.swcrc` | SWC compiler config |
| `.evershop/` | Build output (generated, never edit) |
| `packages/evershop/dist/` | Compiled JS (generated, never edit) |

## Main Commands

```bash
nvm use 20                    # ALWAYS first
npm install                   # Install deps
npm run compile:db            # Compile postgres-query-builder
npm run compile               # Compile evershop core
# Then: sed fix + Card.js/Table.js copy (see AGENTS.md)
npm run build                 # Webpack build
kill $(lsof -ti:3000); npm run start  # Restart server
npm test                      # Run tests
npm run lint                  # Lint
```

## Current Assumptions

- Node 20 via nvm (don't set as global default)
- PostgreSQL running locally on port 5432
- French-only — no language switching
- Tax-inclusive pricing
- No CI/CD pipeline
- No active theme (default storefront)
- Docker setup exists but Dockerfile references Node 18

## Most Important Warnings

1. **MUST run sed fix after every compile** — `import with` → `import assert` for Node 20
2. **MUST copy Card.js/Table.js** after compile — SWC corrupts pre-built UI files
3. **MUST compile extensions separately** before `npm run build`
4. **No hot-reload** — stale code is the #1 debugging pitfall
5. **Never use `"` in translation CSV values** — use « » guillemets
6. **All UI strings must be in French** — storefront uses `_()`, admin uses direct French text
7. **Never edit** `node_modules/`, `.evershop/`, `dist/`
8. **Never expose** `.env` secrets

## What to Ask the User Before Big Changes

- "Should this be an extension or a core module edit?"
- "Which Area ID should this component render in?"
- "Is this for storefront, admin, or both?"
- "Should I update translations for this change?"
- "Are there related subscribers/events to update?"

## What to Check Before Editing

1. Read `AGENTS.md` for project rules
2. Search existing code first: `rg "pattern" packages/evershop/src/ extensions/`
3. Check if the feature already exists as an extension
4. Check `config/default.json` for relevant settings
5. Verify the Area ID using the component layout system
6. Check translation files if adding user-facing text
7. Confirm the build cycle runs clean after changes
