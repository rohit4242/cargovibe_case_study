# CargoVibe parking

Operator app for a truck yard: parking requests, status changes, and an assistant that can look up, create, and update requests (delete stays in the UI).

```
apps/server     Hono API on Bun (optional Azure Functions wrapper)
apps/mobile     Expo — Home, Requests, Assistant
packages/shared Types, status transitions, validation
```

Yard data lives in memory (`apps/server/src/data/yard.ts`). A restart restores twelve seeded requests. The Expo app talks to the deployed API at `https://cargovibe-parking-api-production.up.railway.app` (`apps/mobile/src/config.ts`).

## Run

```bash
bun install
cp apps/server/.env.example apps/server/.env   # set OPENAI_API_KEY
bun run --filter @cargovibe/server dev         # http://localhost:8787
bun run --filter @cargovibe/mobile start
```

- **Web:** press `w`. Mic uses the browser speech API.
- **iOS / Android:** `npx expo run:android` or `npx expo run:ios` (or EAS), then open **CargoVibe Parking** — not Expo Go. Voice needs that native module.

Optional local Azure Functions: `cd apps/server && func start` (`http://localhost:7071/api`). The phone app still uses Railway unless you change `config.ts`.

## Deploy the API

Long-running Bun process — not Vercel. Use the root `Dockerfile`. Hosts set `PORT`; the server binds `0.0.0.0`.

| Variable | Required | Notes |
| --- | --- | --- |
| `OPENAI_API_KEY` | For chat | [platform.openai.com](https://platform.openai.com/api-keys) — not ChatGPT Pro |
| `CORS_ORIGIN` | No | Default `*` |
| `PORT` | No | Render / Railway set this |

Data resets on every deploy, crash, or free-tier sleep.

**Railway (current):** GitHub → Docker (`railway.toml`) → set `OPENAI_API_KEY` → public HTTPS domain. Update `apps/mobile/src/config.ts` if the URL changes.

**Render:** Web Service, Docker, health `/health`, same env. Or apply `render.yaml`.

## API

Success: `{ "data": ... }`. Errors: `{ "error": { "code", "message", "details?" } }`.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/parking-requests` | List (active first) |
| GET | `/parking-requests/:id` | One request |
| POST | `/parking-requests` | Create (`pending`) |
| PATCH | `/parking-requests/:id/status` | Status only |
| DELETE | `/parking-requests/:id` | Delete |
| POST | `/chat` | Streaming assistant |
| POST | `/assistant/chat` | Alias of `/chat` |

Create: `driverName`, `licensePlate`, `truckType` (`solo` \| `semi` \| `tanker`), `requestedFrom`, `requestedUntil` (ISO 8601). Optional `note`. Ids are `parking_<uuid>`. `requestedUntil` must be after `requestedFrom`.

Status body: `{ "status", "parkingSpotId?" }`. Spot is required on `approved`.

Transitions: `pending` → `approved` \| `rejected`; `approved` → `checked_in`; `checked_in` → `checked_out`. `rejected` and `checked_out` are final (409).

## App

Tabs: **Home** (counts + shortcuts, no nav header), **Requests**, **Assistant**. Detail is a stack screen with back.

Assistant: `POST /chat` with OpenAI `gpt-4o-mini` and tools. Mic: on-device STT → same `/chat` → `expo-speech` reads the reply. The API key never ships in the app. ChatGPT Pro is not an API key — use a key from [platform.openai.com](https://platform.openai.com/api-keys) with API billing.

Tools (all go through `ParkingRequestService`): `searchParkingRequests`, `getRequestById`, `createRequest`, `updateRequestStatus`. No delete tool. Multi-step: `stopWhen: stepCountIs(6)`.

## Architecture

```
Expo (text or STT)  →  POST /chat  →  streamText + tools
REST                →  Hono        ↘  ParkingRequestService  →  in-memory yard
```

`packages/shared` owns types and `canTransition()`. The UI uses `allowedNextStatuses()` so buttons match the server.
