import { app } from "@azure/functions";
import { createApp } from "./app";

const honoApp = createApp();

app.setup({ enableHttpStream: true });

app.http("hono", {
  methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
  authLevel: "anonymous",
  route: "{*path}",
  handler: async (request) => {
    const url = new URL(request.url);
    const incoming = new Request(url, {
      method: request.method,
      headers: request.headers,
      body: request.body as BodyInit | null,
    });
    return honoApp.fetch(incoming);
  },
});
