import { Hono } from "hono";
import { cors } from "hono/cors";
import { AppError } from "./http/errors";
import { parkingRequestRoutes } from "./routes/parking-requests";
import { assistantRoutes } from "./routes/assistant";
import { ParkingRequestService } from "./services/parking-request-service";
import { serverEnv } from "./env";
import { handleAssistantChat } from "./assistant/chat";

export function createApp() {
  const service = new ParkingRequestService();

  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: serverEnv.corsOrigin === "*" ? "*" : serverEnv.corsOrigin.split(","),
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      allowHeaders: ["Content-Type"],
    }),
  );

  app.onError((error, c) => {
    if (error instanceof AppError) {
      return c.json(error.toBody(), error.httpStatus as 400 | 404 | 409 | 500);
    }
    console.error(error);
    return c.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      500,
    );
  });

  app.get("/health", (c) => c.json({ ok: true }));
  app.post("/chat", async (c) => {
    const body = await c.req.json();
    return handleAssistantChat(body, service);
  });
  app.route("/parking-requests", parkingRequestRoutes(service));
  app.route("/assistant", assistantRoutes(service));

  return app;
}
