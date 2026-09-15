import type { ParkingRequest } from "@cargovibe/shared";

const hour = 60 * 60 * 1000;

function at(hoursFromNow: number, minutes = 0): string {
  const date = new Date(Date.now() + hoursFromNow * hour + minutes * 60 * 1000);
  date.setSeconds(0, 0);
  return date.toISOString();
}

/** Starting yard board. Windows are relative to process start so “tonight” / “now” stay meaningful. */
const seed: ParkingRequest[] = [
  {
    id: "parking_8c2a1f4e9b70",
    driverName: "Anna Kowalski",
    licensePlate: "HH-CV 1201",
    truckType: "solo",
    requestedFrom: at(0.5),
    requestedUntil: at(4.5),
    status: "pending",
    note: "Inbound from Cuxhaven. Prefers a bay next to the gatehouse.",
  },
  {
    id: "parking_3d91b6aa12c4",
    driverName: "Jamal Wright",
    licensePlate: "B-TK 8842",
    truckType: "tanker",
    requestedFrom: at(2),
    requestedUntil: at(18),
    status: "pending",
    note: "ADR diesel. Needs a tanker-rated island overnight (16h window).",
  },
  {
    id: "parking_c0d2e8b19576",
    driverName: "Marta Nowak",
    licensePlate: "PL-WN 4471",
    truckType: "semi",
    requestedFrom: at(8, 30),
    requestedUntil: at(11, 30),
    status: "pending",
    note: "Tonight: rest-hours only, then continues to Billbrook.",
  },
  {
    id: "parking_2e7c91a04bb8",
    driverName: "Thomas Richter",
    licensePlate: "HH-TR 3308",
    truckType: "solo",
    requestedFrom: at(9),
    requestedUntil: at(12),
    status: "pending",
  },
  {
    id: "parking_71e0c5d348aa",
    driverName: "Sofia Berg",
    licensePlate: "S-SE 4410",
    truckType: "semi",
    requestedFrom: at(-1),
    requestedUntil: at(7),
    status: "approved",
    parkingSpotId: "A-12",
    note: "Spot A-12 held. Trailer swap booked for 06:00.",
  },
  {
    id: "parking_5f88a1c3b429",
    driverName: "Jonas Meier",
    licensePlate: "HH-JM 9022",
    truckType: "tanker",
    requestedFrom: at(-0.5),
    requestedUntil: at(16),
    status: "approved",
    parkingSpotId: "T-04",
    note: "Long layover on tanker island T-04.",
  },
  {
    id: "parking_a19f44d0ce27",
    driverName: "Luis Ortega",
    licensePlate: "M-LO 2290",
    truckType: "semi",
    requestedFrom: at(-3),
    requestedUntil: at(5),
    status: "checked_in",
    parkingSpotId: "B-03",
  },
  {
    id: "parking_6a4d18e0c9f1",
    driverName: "Fatima El-Sayed",
    licensePlate: "HH-FE 6714",
    truckType: "solo",
    requestedFrom: at(-2),
    requestedUntil: at(2),
    status: "checked_in",
    parkingSpotId: "A-07",
    note: "On site. Driver reachable on gate radio.",
  },
  {
    id: "parking_e55b0c88f1d2",
    driverName: "Priya Shah",
    licensePlate: "F-PS 1188",
    truckType: "solo",
    requestedFrom: at(6),
    requestedUntil: at(10),
    status: "rejected",
    note: "No free bays in that window. Dispatcher asked to rebook 06:00 tomorrow.",
  },
  {
    id: "parking_4b10d7c2ae56",
    driverName: "Niklas Vogt",
    licensePlate: "K-NV 4419",
    truckType: "tanker",
    requestedFrom: at(1),
    requestedUntil: at(6),
    status: "rejected",
    note: "Tanker islands T-01–T-04 already assigned for the evening peak.",
  },
  {
    id: "parking_9b4e27a6d013",
    driverName: "Erik Holm",
    licensePlate: "K-EH 5501",
    truckType: "tanker",
    requestedFrom: at(-14),
    requestedUntil: at(-2),
    status: "checked_out",
    parkingSpotId: "C-07",
  },
  {
    id: "parking_d8f31b27a0c5",
    driverName: "Chen Wei",
    licensePlate: "HH-CW 2280",
    truckType: "semi",
    requestedFrom: at(-20),
    requestedUntil: at(-12),
    status: "checked_out",
    parkingSpotId: "B-11",
    note: "Departed on time. Spot B-11 released.",
  },
];

export const parkingRequests: Record<string, ParkingRequest> = Object.fromEntries(
  seed.map((request) => [request.id, { ...request }]),
);

export function allRequests(): ParkingRequest[] {
  return Object.values(parkingRequests);
}

export function findRequest(id: string): ParkingRequest | undefined {
  return parkingRequests[id];
}

export function saveRequest(request: ParkingRequest): ParkingRequest {
  parkingRequests[request.id] = request;
  return request;
}

export function removeRequest(id: string): boolean {
  if (!parkingRequests[id]) {
    return false;
  }
  delete parkingRequests[id];
  return true;
}
