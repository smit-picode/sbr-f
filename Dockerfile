# syntax=docker/dockerfile:1

# =====================================================================
# SBR Frontend
#   dev     — hot-reload image for local work (docker-compose targets it)
#   runner  — production image; the LAST stage, so a plain `docker build`
#             (what build_spec.yaml runs) produces it
# =====================================================================

FROM node:22-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat   # needed by Next.js SWC on Alpine
COPY package*.json ./
RUN npm ci

# ---- development (docker-compose: target dev, source bind-mounted) ----
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 7000
CMD ["npm", "run", "dev"]

# ---- production build ----
FROM deps AS builder
# NEXT_PUBLIC_* are inlined into the browser bundle at build time — container env vars set later have no effect.
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_ENV=production
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL \
    NEXT_PUBLIC_ENV=$NEXT_PUBLIC_ENV \
    NEXT_TELEMETRY_DISABLED=1
RUN test -n "$NEXT_PUBLIC_API_URL" || { echo "ERROR: build arg NEXT_PUBLIC_API_URL is required — it is baked into the client bundle." >&2; exit 1; }
COPY . .
RUN npm run build && npm prune --omit=dev

# ---- production runtime ----
FROM node:22-alpine AS runner
WORKDIR /app
RUN apk add --no-cache libc6-compat
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1
COPY --from=builder --chown=node:node /app/package.json /app/next.config.ts ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next ./.next
USER node
EXPOSE 7000
CMD ["node_modules/.bin/next", "start", "-p", "7000", "-H", "0.0.0.0"]
