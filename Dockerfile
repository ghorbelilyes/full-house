FROM node:20-bookworm-slim

WORKDIR /app

# Keep image minimal but include tools needed by build scripts.
RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates bash \
  && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY packages ./packages
COPY extensions ./extensions
COPY config ./config
COPY translations ./translations
COPY public ./public
COPY media ./media
COPY seed ./seed
COPY scripts ./scripts
COPY run.sh ./run.sh

RUN npm install

# EverShop source build pipeline (required for this repo layout).
RUN npm run compile:db && npm run compile

# Node 20 compatibility fix for JSON import assertions in compiled output.
RUN find packages/evershop/dist -name '*.js' -exec grep -l "import .* with " {} \; \
  | while read -r f; do \
      sed -i "s/from '\\(.*\\.json\\)' with {/from '\\1' assert {/g" "$f"; \
      sed -i "s/from \"\\(.*\\.json\\)\" with {/from \"\\1\" assert {/g" "$f"; \
    done

# Keep known UI components stable after SWC compilation.
RUN cp packages/evershop/src/components/common/ui/Card.js packages/evershop/dist/components/common/ui/Card.js \
  && cp packages/evershop/src/components/common/ui/Table.js packages/evershop/dist/components/common/ui/Table.js

# Compile every custom extension in production mode.
RUN set -eux; \
  for ext in extensions/*; do \
    if [ -d "$ext/src" ]; then \
      ./node_modules/.bin/swc "$ext/src/" -d "$ext/dist/" \
        --config-file ./packages/evershop/.swcrc \
        --copy-files --strip-leading-paths; \
    fi; \
  done

RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

CMD ["npm", "run", "start"]
