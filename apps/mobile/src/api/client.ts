import type { ParkingRequest, ParkingStatus } from "@cargovibe/shared";
import { API_URL } from "@/src/config";
import axios, { type AxiosResponse } from "axios";

export class ApiClientError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

const http = axios.create({
  baseURL: API_URL,
  validateStatus: () => true,
});

type Envelope<T> = {
  data?: T;
  error?: { code?: string; message?: string };
};

function unwrap<T>(response: AxiosResponse<Envelope<T>>): T {
  if (response.status === 204) {
    return undefined as T;
  }

  const payload = response.data;
  if (response.status >= 400) {
    throw new ApiClientError(
      payload?.error?.code ?? "INTERNAL_ERROR",
      payload?.error?.message ?? "Request failed",
      response.status,
    );
  }

  return payload.data as T;
}

export async function listParkingRequests() {
  return unwrap(await http.get<Envelope<ParkingRequest[]>>("/parking-requests"));
}

export async function getParkingRequest(id: string) {
  return unwrap(
    await http.get<Envelope<ParkingRequest>>(`/parking-requests/${encodeURIComponent(id)}`),
  );
}

export async function updateParkingRequestStatus(
  id: string,
  body: { status: ParkingStatus; parkingSpotId?: string },
) {
  return unwrap(
    await http.patch<Envelope<ParkingRequest>>(
      `/parking-requests/${encodeURIComponent(id)}/status`,
      body,
    ),
  );
}

export async function deleteParkingRequest(id: string) {
  return unwrap(
    await http.delete<Envelope<void>>(`/parking-requests/${encodeURIComponent(id)}`),
  );
}
