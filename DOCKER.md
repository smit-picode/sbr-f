# Docker — SBR Frontend

## Frontend developers (local dev)

You run the **frontend from source** (hot reload) and call the backend over a
**dev-tunnel URL** shared by a backend developer. You do NOT need the backend
code, the VPN, or DB credentials.

```bash
# 1. Get and set up the backend dev-tunnel URL from a backend developer
#    e.g. https://xxxx-3000.devtunnels.ms

# 2. Start the frontend
docker compose up
```

- Frontend → http://localhost:7000 (hot reload)
- API calls go to `NEXT_PUBLIC_API_URL`
- Stop with `Ctrl+C`. Rebuild after dependency changes: `docker compose up --build`.

If you ever run your own backend locally instead, just omit `NEXT_PUBLIC_API_URL`
(it defaults to `http://localhost:4000`).

## Production image (CI / deployed environments)

A plain `docker build` produces the **production** image (the Dockerfile's last stage,
`runner`): it runs `next build` and serves with `next start` on port 7000 — no dev
server, no Next.js dev indicator. `docker compose` keeps using the `dev` stage.

```bash
docker build --build-arg NEXT_PUBLIC_API_URL=https://<api-host> -t sbr-frontend .
docker run -p 7000:7000 sbr-frontend
```

`NEXT_PUBLIC_API_URL` is read **at build time**: Next.js inlines it into the
browser bundle, so setting it on the running container has no effect. A different
API URL means a new image build. Leave it empty (or `''`) to call the site's own
`/api/v1`, for deployments where the ingress forwards `/api` to the backend.
