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
- API calls go to `BACKEND_URL`
- Stop with `Ctrl+C`. Rebuild after dependency changes: `docker compose up --build`.

If you ever run your own backend locally instead, just omit `BACKEND_URL`
(it defaults to `http://localhost:3000`).
