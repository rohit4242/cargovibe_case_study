import { z } from "zod";

export const TRUCK_TYPES = ["solo", "semi", "tanker"] as const;
export type TruckType = (typeof TRUCK_TYPES)[number];

export const truckTypeSchema = z.enum(TRUCK_TYPES);
