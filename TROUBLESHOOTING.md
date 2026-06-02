# Troubleshooting — Full House (EverShop)

## Setup Problems

### `npm install` fails
- **Check**: Node version must be 20 → `nvm use 20`
- **Check**: npm version must be 9+ → `npm --version`
- **Fix**: `nvm install 20 && nvm use 20`
- **Fix**: Clear cache → `rm -rf node_modules package-lock.json && npm install`

### `npm run setup` fails with DB error
- **Check**: PostgreSQL is running → `pg_isready -h localhost -p 5432`
- **Check**: `.env` has correct `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- **Check**: Database exists → `psql -U postgres -c "SELECT 1" -d evershop`
- **Fix**: Start PostgreSQL → `docker compose up -d database`
- **Fix**: Create database → `createdb -U postgres evershop`

## Compile Problems

### `SyntaxError: Unexpected token 'with'`
- **Cause**: SWC produces `import ... with { type: 'json' }` which Node 20 doesn't support
- **Fix**: Run the sed fix after every `npm run compile`:
  ```bash
  find packages/evershop/dist -name '*.js' -exec grep -l "import .* with " {} \; | \
    while read f; do
      sed -i "s/from '\(.*\.json\)' with {/from '\1' assert {/g" "$f"
      sed -i "s/from \"\(.*\.json\)\" with {/from \"\1\" assert {/g" "$f"
    done
  ```

### Card.js / Table.js component corruption
- **Cause**: SWC re-compiles pre-built `.js` files in `src/components/common/ui/`, corrupting them
- **Fix**: Copy originals back after compile:
  ```bash
  cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js
  cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js
  ```

### `npm run compile` produces no output
- **Check**: `packages/evershop/.swcrc` exists
- **Check**: Running from project root
- **Fix**: Ensure `rimraf` is installed → `npm ls rimraf`

## Build Problems

### Webpack build fails with translation error
- **Cause**: Double quotes `"` in French translation CSV values break `TranslationLoader`
- **Fix**: Replace `"` with French guillemets `« »` in CSV values
- **Check**: `grep '"' translations/fr-TN/*.csv` (look for unescaped quotes in values)

### Build fails with "module not found"
- **Check**: `npm run compile` was run first
- **Check**: Extension `dist/` exists if extension code changed
- **Fix**: Compile the extension:
  ```bash
  cd extensions/<extName>
  npx swc src/ -d dist/ --config-file ../../packages/evershop/.swcrc --copy-files --strip-leading-paths
  ```

### Build hangs or runs out of memory
- **Fix**: Increase Node memory → `NODE_OPTIONS="--max-old-space-size=4096" npm run build`

## Runtime Problems

### Port 3000 already in use
- **Fix**: `kill $(lsof -ti:3000)`
- **Fix**: Or use different port → `PORT=3001 npm run start`

### Server starts but pages are blank
- **Check**: `.evershop/` build output exists
- **Check**: `npm run build` was run after compile
- **Fix**: Full rebuild cycle

### GraphQL query returns null
- **Check**: `layout.areaId` matches an actual Area ID
- **Check**: `query` export syntax is correct in the component
- **Check**: Resolver file exports match schema fields
- **Fix**: Use Area debug overlay in dev to inspect area IDs

### Database connection refused
- **Check**: PostgreSQL is running
- **Check**: `.env` variables match actual DB config
- **Check**: `DB_SSLMODE=disable` for local development
- **Fix**: `docker compose up -d database`

### Session / auth not working
- **Check**: Cookie settings in `config/default.json` → `system.session`
- **Check**: Browser cookies are not blocked
- **Fix**: Clear cookies and retry

### Extension not loading
- **Check**: Extension is listed in `config/default.json` → `system.extensions`
- **Check**: `enabled: true`
- **Check**: Extension `dist/` folder exists with compiled code
- **Check**: `bootstrap.ts` exports are correct

### Images not displaying
- **Check**: `media/` folder has the image files
- **Check**: File permissions are readable
- **Check**: `system.file_storage` is set to `"local"` in config

## Test Problems

### Tests fail with "Cannot find module"
- **Check**: `npm run compile` was run (tests run from `dist/`)
- **Check**: `jest.config.js` `moduleNameMapper` entries

### Tests timeout
- **Check**: Database is accessible for integration tests
- **Fix**: Increase timeout → `jest --testTimeout=30000`

## Deployment Problems

### Docker build fails
- **Check**: `Dockerfile` uses Node 18 but runtime needs Node 20
- **Fix**: Update Dockerfile `FROM node:20-alpine`
- **Check**: All required files are in Docker context (check `.dockerignore`)

### App crashes on startup in production
- **Check**: All env variables are set
- **Check**: Database is accessible from container
- **Check**: `npm run build` was run inside container

## Logs and Files to Inspect

| Symptom                  | Check First                                |
|--------------------------|--------------------------------------------|
| Compile error            | Terminal output of `npm run compile`       |
| Build error              | Terminal output of `npm run build`         |
| Runtime crash            | `npm run start` stdout/stderr              |
| Page render issue        | Browser console + Network tab              |
| DB error                 | PostgreSQL logs, `.env` file               |
| Missing translation      | `translations/fr-TN/*.csv`                |
| Component not showing    | Area debug overlay, `layout` export        |
| API 401/403              | `route.json` `access` field, auth cookies  |
| Extension not working    | `config/default.json` extensions array     |
| Stale code running       | Verify `dist/` timestamps, rebuild         |

## Known Flaky Areas

- **SWC compilation**: Produces Node 20-incompatible syntax → always run sed fix
- **Card.js / Table.js**: Always corrupted by SWC → always copy back
- **Translation CSV parsing**: Fragile with special characters
- **No hot-reload**: Easy to forget rebuild and debug stale code
- **Extension compile**: Must be done separately per extension
- **Webpack bundle**: Can be slow; may OOM on low-memory machines

## Quick Decision Rules

| If this happens…                       | Check this first…                        |
|----------------------------------------|------------------------------------------|
| `SyntaxError` on start                 | Did you run the `import with` sed fix?   |
| Component renders wrong                | Did you run `npm run build` after compile? |
| Extension code not taking effect       | Did you compile the extension's `src/`?  |
| Translation not appearing              | Is the CSV entry in `fr-TN/` (not just `fr/`)? |
| Admin page shows English               | Admin doesn't use `_()` — edit JSX directly |
| New route returns 404                  | Is `route.json` valid? Is route ID unique? |
| `EADDRINUSE` error                     | Kill port 3000: `kill $(lsof -ti:3000)`  |
| DB connection fails                    | Check `.env` and PostgreSQL status       |
| Build succeeds but page blank          | Check `.evershop/` output for errors     |
