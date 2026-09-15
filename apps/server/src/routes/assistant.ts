import { Hono } from "hono";
import type { UIMessage } from "ai";
import { handleAssistantChat } from "../assistant/chat";
import type { ParkingRequestService } from "../services/parking-request-service";

export function assistantRoutes(service: ParkingRequestService) {
  const routes = new Hono();

  routes.post("/chat", async (c) => {
    const body = (await c.req.json()) as { messages?: UIMessage[] };
    return handleAssistantChat(body, service);
  });

  return routes;
}
