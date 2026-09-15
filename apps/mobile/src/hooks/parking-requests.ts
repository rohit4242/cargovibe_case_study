import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ParkingRequest, ParkingStatus } from "@cargovibe/shared";
import {
  deleteParkingRequest,
  getParkingRequest,
  listParkingRequests,
  updateParkingRequestStatus,
} from "@/src/api/client";

export const parkingKeys = {
  all: ["parking-requests"] as const,
  detail: (id: string) => ["parking-requests", id] as const,
};

export function useParkingRequests() {
  return useQuery({
    queryKey: parkingKeys.all,
    queryFn: listParkingRequests,
  });
}

export function useParkingRequest(id: string) {
  return useQuery({
    queryKey: parkingKeys.detail(id),
    queryFn: () => getParkingRequest(id),
    enabled: Boolean(id),
  });
}

export function useDeleteParkingRequest(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteParkingRequest(id),
    onSuccess: () => {
      queryClient.setQueryData<ParkingRequest[]>(parkingKeys.all, (current) =>
        current?.filter((item) => item.id !== id),
      );
      queryClient.removeQueries({ queryKey: parkingKeys.detail(id) });
    },
  });
}

export function useUpdateParkingStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { status: ParkingStatus; parkingSpotId?: string }) =>
      updateParkingRequestStatus(id, body),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: parkingKeys.all });
      await queryClient.invalidateQueries({ queryKey: parkingKeys.detail(id) });
    },
  });
}
