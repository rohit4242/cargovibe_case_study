import { z } from "zod";
import { tool } from "ai";
import {
  parkingStatusSchema,
  truckTypeSchema,
  type ApiErrorCode,
} from "@cargovibe/shared";
import { AppError } from "../http/errors";
import type { ParkingRequestService } from "../services/parking-request-service";

export const WRITE_TOOLS = ["createRequest", "updateRequestStatus"] as const;

const createRequestToolSchema = z.object({
  driverName: z.string().trim().min(1),
  licensePlate: z.string().trim().min(1),
  truckType: truckTypeSchema,
  requestedFrom: z.string().min(1).describe("ISO 8601 datetime"),
  requestedUntil: z.string().min(1).describe("ISO 8601 datetime"),
  note: z.string().trim().min(1).optional(),
});

export const searchFiltersSchema = z.object({
  status: parkingStatusSchema.optional(),
  truckType: truckTypeSchema.optional(),
  from: z.string().optional().describe("ISO datetime; keep requests that end after this"),
  until: z.string().optional().describe("ISO datetime; keep requests that start before this"),
  unusuallyLong: z.boolean().optional().describe("Stays longer than 12 hours"),
});

const getByIdSchema = z.object({
  id: z.string().min(1),
});

const updateStatusToolSchema = z.object({
  id: z.string().min(1),
  status: parkingStatusSchema,
  parkingSpotId: z
    .string()
    .optional()
    .describe("Required when moving a request to approved"),
});

export type ToolResult =
  | { ok: true; data: unknown }
  | { ok: false; code: ApiErrorCode | "INTERNAL_ERROR"; message: string };

function ok(data: unknown): ToolResult {
  return { ok: true, data };
}

function fail(code: ApiErrorCode | "INTERNAL_ERROR", message: string): ToolResult {
  return { ok: false, code, message };
}

export async function executeAssistantTool(
  service: ParkingRequestService,
  name: string,
  args: unknown,
): Promise<ToolResult> {
  try {
    switch (name) {
      case "searchParkingRequests": {
        const parsed = searchFiltersSchema.safeParse(args ?? {});
        if (!parsed.success) {
          return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid search");
        }
        return ok(service.search(parsed.data));
      }
      case "getRequestById": {
        const parsed = getByIdSchema.safeParse(args);
        if (!parsed.success) {
          return fail("VALIDATION_ERROR", "id is required");
        }
        return ok(service.getById(parsed.data.id));
      }
      case "createRequest":
        return ok(service.create(args));
      case "updateRequestStatus": {
        const parsed = updateStatusToolSchema.safeParse(args);
        if (!parsed.success) {
          return fail("VALIDATION_ERROR", parsed.error.issues[0]?.message ?? "Invalid status update");
        }
        const { id, status, parkingSpotId } = parsed.data;
        return ok(service.updateStatus(id, { status, parkingSpotId }));
      }
      default:
        return fail("VALIDATION_ERROR", `Unknown tool ${name}`);
    }
  } catch (error) {
    if (error instanceof AppError) {
      return fail(error.code, error.message);
    }
    console.error(error);
    return fail("INTERNAL_ERROR", "Tool failed");
  }
}

export function createAssistantTools(service: ParkingRequestService) {
  return {
    searchParkingRequests: tool({
      description:
        "Search parking requests. Filter by status, truck type, overlapping time window, or stays longer than 12 hours.",
      inputSchema: searchFiltersSchema,
      execute: async (input) => executeAssistantTool(service, "searchParkingRequests", input),
    }),
    getRequestById: tool({
      description: "Load one parking request by id (parking_<uuid>).",
      inputSchema: getByIdSchema,
      execute: async (input) => executeAssistantTool(service, "getRequestById", input),
    }),
    createRequest: tool({
      description:
        "Create a pending parking request. requestedFrom and requestedUntil must be ISO 8601; until must be after from.",
      inputSchema: createRequestToolSchema,
      execute: async (input) => executeAssistantTool(service, "createRequest", input),
    }),
    updateRequestStatus: tool({
      description:
        "Apply a legal status change. parkingSpotId is required when approving. Does not delete.",
      inputSchema: updateStatusToolSchema,
      execute: async (input) => executeAssistantTool(service, "updateRequestStatus", input),
    }),
  };
}

export function liveFunctionDeclarations() {
  const statuses = ["pending", "approved", "rejected", "checked_in", "checked_out"];
  const trucks = ["solo", "semi", "tanker"];

  return [
    {
      name: "searchParkingRequests",
      description:
        "Search parking requests. Filter by status, truck type, overlapping time window, or stays longer than 12 hours.",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: statuses },
          truckType: { type: "string", enum: trucks },
          from: { type: "string", description: "ISO datetime; keep requests that end after this" },
          until: { type: "string", description: "ISO datetime; keep requests that start before this" },
          unusuallyLong: { type: "boolean", description: "Stays longer than 12 hours" },
        },
      },
    },
    {
      name: "getRequestById",
      description: "Load one parking request by id.",
      parameters: {
        type: "object",
        properties: { id: { type: "string" } },
        required: ["id"],
      },
    },
    {
      name: "createRequest",
      description: "Create a pending parking request.",
      parameters: {
        type: "object",
        properties: {
          driverName: { type: "string" },
          licensePlate: { type: "string" },
          truckType: { type: "string", enum: trucks },
          requestedFrom: { type: "string", description: "ISO 8601 datetime" },
          requestedUntil: { type: "string", description: "ISO 8601 datetime" },
          note: { type: "string" },
        },
        required: ["driverName", "licensePlate", "truckType", "requestedFrom", "requestedUntil"],
      },
    },
    {
      name: "updateRequestStatus",
      description: "Apply a legal status change. parkingSpotId is required when approving.",
      parameters: {
        type: "object",
        properties: {
          id: { type: "string" },
          status: { type: "string", enum: statuses },
          parkingSpotId: { type: "string" },
        },
        required: ["id", "status"],
      },
    },
  ];
}

export function isWriteTool(name: string): boolean {
  return (WRITE_TOOLS as readonly string[]).includes(name);
}
