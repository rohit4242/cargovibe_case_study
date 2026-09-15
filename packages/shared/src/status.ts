import { z } from "zod";

export const PARKING_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "checked_in",
  "checked_out",
] as const;

export type ParkingStatus = (typeof PARKING_STATUSES)[number];

export const parkingStatusSchema = z.enum(PARKING_STATUSES);

export const FINAL_STATUSES: readonly ParkingStatus[] = [
  "rejected",
  "checked_out",
];

export const ALLOWED_TRANSITIONS: Record<ParkingStatus, ParkingStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["checked_in"],
  checked_in: ["checked_out"],
  rejected: [],
  checked_out: [],
};

export function isFinalStatus(status: ParkingStatus): boolean {
  return FINAL_STATUSES.includes(status);
}

export function allowedNextStatuses(from: ParkingStatus): ParkingStatus[] {
  return ALLOWED_TRANSITIONS[from];
}

export function canTransition(from: ParkingStatus, to: ParkingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to);
}
