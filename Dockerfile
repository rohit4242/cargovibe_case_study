FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json bun.lock bunfig.toml tsconfig.json ./
COPY apps/server/package.json apps/server/tsconfig.json ./apps/server/
COPY packages/shared/package.json packages/shared/tsconfig.json ./packages/shared/
COPY apps/mobile/package.json ./apps/mobile/

RUN bun install --frozen-lockfile --production --filter @cargovibe/server

COPY packages/shared ./packages/shared
COPY apps/server ./apps/server

ENV PORT=8787
EXPOSE 8787

CMD ["bun", "apps/server/src/index.ts"]
