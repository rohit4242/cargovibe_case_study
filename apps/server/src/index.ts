import { upgradeWebSocket, websocket } from "hono/bun";
import { createApp } from "./app";
import { liveSocketHandlers } from "./assistant/live";
import { serverEnv } from "./env";

const app = createApp();

app.get(
  "/chat/live",
  upgradeWebSocket(() => liveSocketHandlers()),
);

export default {
  port: serverEnv.port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
  websocket,
};

console.log(`Parking API listening on http://localhost:${serverEnv.port}`);
