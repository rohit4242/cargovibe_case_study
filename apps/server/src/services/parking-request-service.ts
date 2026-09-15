import {
  canTransition,
  createParkingRequestSchema,
  isFinalStatus,
  updateStatusSchema,
  type CreateParkingRequestInput,
  type ParkingRequest,
  type ParkingStatus,
  type TruckType,
  type UpdateStatusInput,
} from "@cargovibe/shared";
import {
  allRequests,
  findRequest,
  removeRequest,
  saveRequest,
} from "../data/yard";
import { invalidTransition, notFound, validationError } from "../http/errors";

const LONG_STAY_HOURS = 12;

export type ParkingSearchFilters = {
  status?: ParkingStatus;
  truckType?: TruckType;
  from?: string;
  until?: string;
  unusuallyLong?: boolean;
};

function durationHours(request: ParkingRequest): number {
  return (
    (Date.parse(request.requestedUntil) - Date.parse(request.requestedFrom)) /
    (1000 * 60 * 60)
  );
}

export class ParkingRequestService {
  list() {
    const items = allRequests();
    const rank: Record<ParkingRequest["status"], number> = {
      pending: 0,
      approved: 1,
      checked_in: 2,
      rejected: 3,
      checked_out: 4,
    };

    return [...items].sort((a, b) => {
      const byStatus = rank[a.status] - rank[b.status];
      if (byStatus !== 0) {
        return byStatus;
      }
      return Date.parse(a.requestedFrom) - Date.parse(b.requestedFrom);
    });
  }

  getById(id: string): ParkingRequest {
    const found = findRequest(id);
    if (!found) {
      throw notFound();
    }
    return found;
  }

  search(filters: ParkingSearchFilters = {}): ParkingRequest[] {
    let items = this.list();
    if (filters.status) {
      items = items.filter((item) => item.status === filters.status);
    }
    if (filters.truckType) {
      items = items.filter((item) => item.truckType === filters.truckType);
    }
    if (filters.from) {
      const from = Date.parse(filters.from);
      items = items.filter((item) => Date.parse(item.requestedUntil) >= from);
    }
    if (filters.until) {
      const until = Date.parse(filters.until);
      items = items.filter((item) => Date.parse(item.requestedFrom) <= until);
    }
    if (filters.unusuallyLong) {
      items = items.filter((item) => durationHours(item) > LONG_STAY_HOURS);
    }
    return items;
  }

  create(input: unknown): ParkingRequest {
    const parsed = createParkingRequestSchema.safeParse(input);
    if (!parsed.success) {
      throw validationError("Invalid parking request", parsed.error.issues);
    }

    const body: CreateParkingRequestInput = parsed.data;
    const request: ParkingRequest = {
      id: `parking_${crypto.randomUUID()}`,
      driverName: body.driverName,
      licensePlate: body.licensePlate,
      truckType: body.truckType,
      requestedFrom: new Date(body.requestedFrom).toISOString(),
      requestedUntil: new Date(body.requestedUntil).toISOString(),
      status: "pending",
      note: body.note,
    };

    return saveRequest(request);
  }

  updateStatus(id: string, input: unknown): ParkingRequest {
    const parsed = updateStatusSchema.safeParse(input);
    if (!parsed.success) {
      throw validationError("Invalid status update", parsed.error.issues);
    }

    const body: UpdateStatusInput = parsed.data;
    const current = this.getById(id);

    if (isFinalStatus(current.status)) {
      throw invalidTransition(
        `Requests in ${current.status} state cannot change status`,
      );
    }

    if (!canTransition(current.status, body.status)) {
      throw invalidTransition(
        `Cannot transition from ${current.status} to ${body.status}`,
      );
    }

    return this.applyTransition(current, body.status, body.parkingSpotId);
  }

  delete(id: string): void {
    if (!removeRequest(id)) {
      throw notFound();
    }
  }

  private applyTransition(
    current: ParkingRequest,
    nextStatus: ParkingStatus,
    parkingSpotId?: string,
  ): ParkingRequest {
    if (nextStatus === "approved" && !parkingSpotId?.trim()) {
      throw validationError("parkingSpotId is required when approving a request");
    }

    return saveRequest({
      ...current,
      status: nextStatus,
      parkingSpotId:
        nextStatus === "approved" ? parkingSpotId!.trim() : current.parkingSpotId,
    });
  }
}
