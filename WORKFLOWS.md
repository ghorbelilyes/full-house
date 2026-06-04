# Workflows — Protek (EverShop)

## How to Add a New Feature

### Via Extension (preferred)

1. Create extension folder:
   ```bash
   mkdir -p extensions/myFeature/src
   ```

2. Create `extensions/myFeature/package.json`:
   ```json
   {
     "name": "myFeature",
     "version": "1.0.0",
     "type": "module"
   }
   ```

3. Create `extensions/myFeature/tsconfig.json` (copy from another extension)

4. Add source code under `src/`:
   - `bootstrap.ts` — register hooks, processors, widgets
   - `api/<routeId>/route.json` + middleware — REST endpoints
   - `pages/admin/<routeId>/` — admin pages
   - `pages/frontStore/<routeId>/` — storefront pages
   - `graphql/types/<TypeName>/` — GraphQL schema + resolvers
   - `migration/Version-1.0.0.ts` — database migrations
   - `subscribers/` — event handlers

5. Enable in `config/default.json`:
   ```json
   { "name": "myFeature", "resolve": "extensions/myFeature", "enabled": true, "priority": 30 }
   ```

6. Compile + build + restart (see Build Cycle below)

### Via Core Module Edit (only for platform-level fixes)

1. Edit files in `packages/evershop/src/modules/<module>/`
2. Compile + build + restart

## How to Fix a Bug

1. Identify the failing module/extension
2. Search for relevant code: `rg "search term" packages/evershop/src/` or `rg "search term" extensions/`
3. Make the fix
4. Run the full build cycle
5. Verify on `localhost:3000`
6. Run tests: `npm test -- <pattern>`

## How to Add/Update an API Endpoint

1. Choose or create route folder:
   ```
   extensions/myExt/src/api/myEndpoint/
   ```

2. Create `route.json`:
   ```json
   {
     "methods": ["POST"],
     "path": "/my-endpoint",
     "access": "private"
   }
   ```

3. Add middleware files (lowercase `.ts`, run in alphabetical order):
   ```
   createSomething.ts
   validateInput.ts
   ```

4. Middleware signature:
   ```ts
   export default async function myMiddleware(request, response, delegate, next) {
     // logic
     next();
   }
   ```

5. Compile extension + build + restart

## How to Add/Update UI

### Storefront Component

1. Create component file (PascalCase `.tsx`) in appropriate page folder:
   ```
   pages/frontStore/<routeId>/MyComponent.tsx
   ```

2. Export layout to place in an Area:
   ```tsx
   export const layout = {
     areaId: 'content',
     sortOrder: 10
   };
   ```

3. For data, export a GraphQL query:
   ```tsx
   export const query = `
     query {
       product { name price { regular } }
     }
   `;
   ```

4. All user-facing text must be in French:
   - Use `_('English text')` wrapper
   - Add translation to `translations/fr-TN/<file>.csv`

5. Mobile-first responsive styles (≤768px base, then breakpoints up)

### Admin Component

- Write French text directly in JSX (no `_()`)
- Place in `pages/admin/<routeId>/`

### Override Core Component (Theme)

- Match exact path in theme folder: `themes/<name>/src/components/.../Component.tsx`

## How to Add/Update Database Models/Migrations

1. Create migration file:
   ```
   extensions/myExt/src/migration/Version-1.0.0.ts
   ```

2. Export up/down functions:
   ```ts
   export async function up(connection) {
     await connection.query(`
       CREATE TABLE my_table (
         id SERIAL PRIMARY KEY,
         name VARCHAR(255) NOT NULL
       )
     `);
   }

   export async function down(connection) {
     await connection.query('DROP TABLE IF EXISTS my_table');
   }
   ```

3. Migrations run automatically on `npm run setup` or app start
4. Migration files compile to `dist/migration/` — that's where EverShop reads them

## How to Add/Update GraphQL Types

1. Create folder: `graphql/types/MyType/`
2. Add schema: `MyType.graphql`
3. Add resolvers: `MyType.resolvers.ts`
4. Compile + build

## How to Run Tests

```bash
nvm use 20

# Compile first (tests run from dist/)
npm run compile
# Apply post-compile fixes

# Run all tests
npm test

# Run specific test
npm test -- myFeature

# Lint
npm run lint
```

## How to Debug Common Problems

1. **Check logs**: Server stdout/stderr
2. **Enable debug mode**: `npm run start:debug`
3. **Inspect build output**: Check `.evershop/` for webpack errors
4. **Database issues**: Check `DB_*` env vars, test connection with `psql`
5. **Component not rendering**: Check `layout.areaId` and `sortOrder`, use Area debug overlay
6. **GraphQL errors**: Check `.graphql` schema syntax and resolver exports
7. **Translation missing**: Check CSV file exists in `translations/fr-TN/`

## How to Add Translations

1. Open `translations/fr-TN/<scope>.csv` (general, catalog, checkout, account, promotion, admin)
2. Add line: `"English text","Texte français"`
3. **Never use `"` in the French value** — use « » guillemets instead
4. Rebuild for changes to take effect

## Build Cycle (Every Code Change)

```bash
nvm use 20

# 1. Compile core
npm run compile

# 2. Fix import with → assert
find packages/evershop/dist -name '*.js' -exec grep -l "import .* with " {} \; | \
  while read f; do
    sed -i "s/from '\(.*\.json\)' with {/from '\1' assert {/g" "$f"
    sed -i "s/from \"\(.*\.json\)\" with {/from \"\1\" assert {/g" "$f"
  done

# 3. Fix corrupted UI components
cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js
cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js

# 4. Compile extensions (if changed)
cd extensions/<extName>
npx swc src/ -d dist/ --config-file ../../packages/evershop/.swcrc --copy-files --strip-leading-paths
cd ../..

# 5. Build frontend
npm run build

# 6. Kill old server + start
kill $(lsof -ti:3000) 2>/dev/null
npm run start
```

## How to Deploy (Docker)

```bash
# Build image
docker build -t fullhouse-evershop .

# Run with docker-compose
docker compose up -d database   # Start PostgreSQL only
# Or full stack:
docker compose up -d

# Note: Dockerfile uses Node 18 — may need updating to Node 20
```

## How to Create a Theme

```bash
npm run theme:create -- --name my-theme
npm run theme:active    # Select active theme
npm run theme:twizz     # Copy component overrides into theme
npm run build           # Rebuild with theme
```

## How to Add an Event Subscriber

1. Create folder: `extensions/myExt/src/subscribers/event_name/`
2. Add handler file:
   ```ts
   export default async function handler(eventData) {
     // React to event
   }
   ```
3. Register in `bootstrap.ts` if needed
4. Compile + build
