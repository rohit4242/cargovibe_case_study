import { createApp } from "./app";
import { serverEnv } from "./env";

const app = createApp();

export default {
  port: serverEnv.port,
  hostname: "0.0.0.0",
  fetch: app.fetch,
};

console.log(`Parking API listening on http://localhost:${serverEnv.port}`);
