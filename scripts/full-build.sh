#!/bin/bash
# Full build pipeline — run this instead of manual steps
set -e
cd "$(dirname "$0")/.."

export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
nvm use 20

echo "━━━ 0/5 Compile postgres-query-builder ━━━"
(cd node_modules/@evershop/postgres-query-builder && [ ! -d dist ] && npx tsc || true)

echo "━━━ 1/5 Compile core ━━━"
npm run compile

echo "━━━ 2/5 Fix Card.js + Table.js ━━━"
cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js
cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js

echo "━━━ 3/5 Fix import assert → with ━━━"
find packages/evershop/dist -name '*.js' -exec grep -l "assert {" {} \; | \
  while read f; do
    sed -i "s/from '\(.*\.json\)' assert {/from '\1' with {/g" "$f"
    sed -i "s/from \"\(.*\.json\)\" assert {/from \"\1\" with {/g" "$f"
  done

echo "━━━ 4/5 Compile extensions ━━━"
for ext in extensions/*/; do
  if [ -d "$ext/src" ]; then
    name=$(basename "$ext")
    echo "  → $name"
    (cd "$ext" && ../../node_modules/.bin/swc src/ -d dist/ --config-file ../../packages/evershop/.swcrc --copy-files --strip-leading-paths)
  fi
done

echo "━━━ 5/5 Build frontend ━━━"
npm run build

echo ""
echo "✅ Build complete! Run: npm run start"
