import { z } from "zod";
import { parkingStatusSchema, type ParkingStatus } from "./status";
import { truckTypeSchema, type TruckType } from "./truck-type";

const isoDateTime = z
  .string()
  .min(1)
  .refine((value) => !Number.isNaN(Date.parse(value)), {
    message: "must be a valid ISO 8601 datetime",
  });

export type ParkingRequest = {
  id: string;
  driverName: string;
  licensePlate: string;
  truckType: TruckType;
  requestedFrom: string;
  requestedUntil: string;
  status: ParkingStatus;
  parkingSpotId?: string;
  note?: string;
};

export const createParkingRequestSchema = z
  .object({
    driverName: z.string().trim().min(1, "driverName is required"),
    licensePlate: z.string().trim().min(1, "licensePlate is required"),
    truckType: truckTypeSchema,
    requestedFrom: isoDateTime,
    requestedUntil: isoDateTime,
    note: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => Date.parse(value.requestedUntil) > Date.parse(value.requestedFrom),
    {
      message: "requestedUntil must be later than requestedFrom",
      path: ["requestedUntil"],
    },
  );

export type CreateParkingRequestInput = z.infer<typeof createParkingRequestSchema>;

export const updateStatusSchema = z.object({
  status: parkingStatusSchema,
  parkingSpotId: z.string().trim().min(1).optional(),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
