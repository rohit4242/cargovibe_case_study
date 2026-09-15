# CargoVibe parking

Operator app for a truck yard: incoming parking requests, status changes, and a chat assistant that can look things up, create requests, and apply legal status changes. Delete stays in the operator UI.

```
apps/server     HTTP API (Hono on Bun) and an Azure Functions host for the same app
apps/mobile     Expo app — list, detail, assistant
packages/shared ParkingRequest types, status transitions, validation
```

The API keeps requests in a dict in `apps/server/src/data/yard.ts`. Restarting restores that board (twelve requests covering every status and truck type).

## Requirements

- [Bun](https://bun.sh)
- Node 20+ (used by Expo)
- Expo Go or a browser
- [Gemini API key](https://aistudio.google.com/apikey) for the assistant (`GOOGLE_GENERATIVE_AI_API_KEY`)
- Optional: [Azure Functions Core Tools](https://learn.microsoft.com/en-us/azure/azure-functions/functions-run-local) v4

## Run locally

```bash
bun install
```

### API

```bash
cp apps/server/.env.example apps/server/.env
# set GOOGLE_GENERATIVE_AI_API_KEY
bun run --filter @cargovibe/server dev
```

Listens on `http://localhost:8787`.

### App

```bash
cp apps/mobile/.env.example apps/mobile/.env
bun run --filter @cargovibe/mobile start
```

- Web: press `w`. If 8081 is taken: `bun run --filter @cargovibe/mobile web -- --port 8083`
- Phone: same Wi‑Fi as the machine, scan the QR code with Expo Go

`EXPO_PUBLIC_API_URL` overrides the base URL. If it is empty:

- web / iOS simulator → `http://localhost:8787`
- Android emulator → `http://10.0.2.2:8787`
- physical device → LAN address from Expo (`http://<your-machine>:8787`)

Cleartext HTTP is allowed in `app.json` so a phone can reach the local API. Open port 8787 on the laptop firewall if the list does not load.

### Azure Functions

Same Hono app, hosted as a catch-all HTTP trigger in `apps/server/src/azure-functions.ts`:

```bash
cd apps/server
cp local.settings.json.example local.settings.json
func start
```

Typical base URL: `http://localhost:7071/api`. Point `EXPO_PUBLIC_API_URL` at that if you use this host.

## Deploy the API

This API is a long-running Bun process with an in-memory yard. **Do not put it on Vercel** (or other serverless hosts): each invocation can be a new process, so the dict would reset constantly and streaming chat is awkward.

Use a small container that runs `bun apps/server/src/index.ts`. A `Dockerfile` at the repo root is set up for that. Hosts inject `PORT`; the server already reads it and binds `0.0.0.0`.

Env vars on the host:

| Variable | Required | Notes |
| --- | --- | --- |
| `GOOGLE_GENERATIVE_AI_API_KEY` | For chat | Same as local `.env` |
| `CORS_ORIGIN` | No | Defaults to `*` |
| `PORT` | No | Render / Railway set this |

The yard **resets on every deploy, crash, or free-tier sleep**. That is expected.

### Render

1. Push this repo to GitHub.
2. [New Web Service](https://dashboard.render.com/select-repo?type=web) → this repo.
3. Runtime: **Docker**. Dockerfile path: `./Dockerfile`.
4. Add `GOOGLE_GENERATIVE_AI_API_KEY`. Health check path: `/health`.
5. Or apply `render.yaml` as a Blueprint (`New` → `Blueprint`).

After the first deploy you get `https://<name>.onrender.com`. Free instances sleep after idle time; the first request after sleep is slow and the seed board comes back.

### Railway

1. [New project](https://railway.app/new) → deploy from GitHub.
2. Railway uses `railway.toml` (Docker build).
3. Variables: `GOOGLE_GENERATIVE_AI_API_KEY` (and `CORS_ORIGIN=*` if you want it explicit).
4. Generate a public HTTPS domain in the service settings.

### Point Expo at the deployed API

In `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=https://your-service.onrender.com
```

Restart Expo. Use **https** (especially on a physical iPhone). Do not use `localhost` on a phone.

## API

JSON. Success bodies are `{ "data": ... }`. Errors:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/parking-requests` | All requests (active first, then by window) |
| GET | `/parking-requests/:id` | One request |
| POST | `/parking-requests` | Create (`pending`) |
| PATCH | `/parking-requests/:id/status` | Status only |
| DELETE | `/parking-requests/:id` | Delete |
| POST | `/chat` | Streaming text assistant (Gemini + tools) |
| POST | `/assistant/chat` | Alias of `/chat` |
| GET | `/chat/live` | Gemini Live WebSocket (voice; key stays on the server) |
| GET | `/health` | Liveness |

Create: `driverName`, `licensePlate`, `truckType` (`solo` \| `semi` \| `tanker`), `requestedFrom`, `requestedUntil` (ISO 8601). Optional `note`. Ids are `parking_<uuid>`. `requestedUntil` must be after `requestedFrom`.

Status: `{ "status": "...", "parkingSpotId": "..." }`. `parkingSpotId` is required when moving to `approved`.

Allowed transitions:

- `pending` → `approved` or `rejected`
- `approved` → `checked_in`
- `checked_in` → `checked_out`

`rejected` and `checked_out` are final (`INVALID_TRANSITION`, 409). Bad input: `VALIDATION_ERROR` (400). Unknown id: `NOT_FOUND` (404).

## App

Bottom tabs: **Home**, **Requests**, **Assistant**. Opening a request pushes a stack screen with a back button (tabs hide on detail).

1. **Home** — counts for pending / approved / on site, shortcuts, and requests that need attention.
2. **Requests** — driver, plate, window, status. Pull to refresh. Loading, empty, and error states. Tap a row for detail.
3. **Detail** — every field except `note`. Only legal next statuses. Approve requires a parking spot. Reject and check-out ask for confirmation. Delete asks for confirmation, then removes the request. Success and failure are shown on screen.
4. **Assistant** — text streams from `POST /chat`. The model can search, fetch, create, and change status through the same service as REST. Home / Requests refresh after a successful write. Voice is Gemini Live on `GET /chat/live` (web; microphone PCM). Delete stays on the detail screen.

## Assistant

Text: `streamText` (Vercel AI SDK) with `gemini-2.5-flash` on `POST /chat`. Voice: Gemini Live (`gemini-3.1-flash-live-preview`) on `GET /chat/live`. The app never receives `GOOGLE_GENERATIVE_AI_API_KEY`.

Tools call `ParkingRequestService` (not the in-memory dict). Multi-step: `stopWhen: stepCountIs(6)`.

- `searchParkingRequests` — status, truck type, time window, stays longer than 12 hours
- `getRequestById` — by id
- `createRequest` — creates `pending`
- `updateRequestStatus` — legal transitions only; `parkingSpotId` required to approve

The assistant cannot delete. It should only claim a write after a tool returns `ok: true`. Without a Gemini key, chat and Live return an error.

Voice is not on-device STT/TTS. The phone (web) sends 16 kHz PCM; the server talks to Gemini Live, runs tools, and streams audio back. Expo Go / native apps can still use **text**; Live mic capture is implemented for the **web** app (or a future dev client with PCM).

## Architecture

```
Expo text  →  expo/fetch POST /chat  →  streamText + tools
Expo voice →  WebSocket /chat/live   →  Gemini Live + same tools
                                      ↘  ParkingRequestService  →  parkingRequests dict
REST     →  Hono routes              ↗
```

`packages/shared` owns `ParkingRequest`, truck types, and `canTransition()`. The API enforces that table. The UI uses `allowedNextStatuses()` so buttons match the server.

Routes stay thin. Rules live in `ParkingRequestService`. The yard is a `Record<id, ParkingRequest>` in `yard.ts`.

## Decisions

- Yard data is a dict in process memory. Swap `yard.ts` if this ever gets a database.
- Hono is the HTTP layer. Azure Functions is an optional host around `app.fetch`.
- Uniwind (free) so the app runs in Expo Go.
- Operator UI is list, detail, and assistant. Create is API + assistant. Delete is API + detail.
- Assistant voice is Gemini Live through the server, not the system speech recognizer.
- Host the API as a container (Render / Railway), not serverless. See **Deploy the API**.

## Device

1. Start the API on `:8787`.
2. Set a Gemini key in `apps/server/.env` to use chat.
3. Phone on the same Wi‑Fi.
4. `bun run --filter @cargovibe/mobile start`, open in Expo Go.
5. If the list fails, set `EXPO_PUBLIC_API_URL=http://<laptop-lan-ip>:8787` in `apps/mobile/.env` and restart Expo.
6. Voice: press `w` for Expo web and allow the microphone. The Live URL is derived from `EXPO_PUBLIC_API_URL` (`ws://…/chat/live`).
