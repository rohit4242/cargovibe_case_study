import { Hono } from "hono";
import type { ParkingRequestService } from "../services/parking-request-service";

export function parkingRequestRoutes(service: ParkingRequestService) {
  const routes = new Hono();

  routes.get("/", (c) => {
    return c.json({ data: service.list() });
  });

  routes.get("/:id", (c) => {
    return c.json({ data: service.getById(c.req.param("id")) });
  });

  routes.post("/", async (c) => {
    const body = await c.req.json();
    return c.json({ data: service.create(body) }, 201);
  });

  routes.patch("/:id/status", async (c) => {
    const body = await c.req.json();
    return c.json({ data: service.updateStatus(c.req.param("id"), body) });
  });

  routes.delete("/:id", (c) => {
    service.delete(c.req.param("id"));
    return c.body(null, 204);
  });

  return routes;
}
