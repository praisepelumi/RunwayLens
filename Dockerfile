FROM node:22-slim AS base
RUN corepack enable pnpm

WORKDIR /app

# ── Install dependencies ──
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY packages/shared/package.json packages/shared/
COPY server/package.json server/
COPY client/package.json client/

RUN pnpm install --frozen-lockfile

# ── Copy source ──
COPY . .

# ── Build client (Vite) ──
ARG VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
RUN pnpm --filter client build

# ── Move client dist to server/public for static serving ──
RUN mkdir -p server/public && cp -r client/dist/* server/public/

# ── Production ──
ENV NODE_ENV=production
EXPOSE 8080

CMD ["pnpm", "--filter", "server", "start"]
