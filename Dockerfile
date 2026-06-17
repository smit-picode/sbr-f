# syntax=docker/dockerfile:1

# =====================================================================
# SBR Frontend — development image (Next.js hot reload)
# Source is bind-mounted by docker-compose; this image provides Node +
# the installed dependencies and runs `npm run dev` on port 7000.
# =====================================================================
FROM node:22-alpine AS dev
WORKDIR /app
RUN apk add --no-cache libc6-compat   # needed by Next.js SWC on Alpine

ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci
COPY . .
EXPOSE 7000
CMD ["npm", "run", "dev"]
