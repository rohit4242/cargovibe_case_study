import { ErrorState, LoadingState } from "@/components/EmptyState";
import { StatusActions } from "@/components/StatusActions";
import { StatusBadge } from "@/components/StatusBadge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BusyLabel } from "@/components/BusyLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Text } from "@/components/ui/text";
import { ApiClientError } from "@/src/api/client";
import {
  useDeleteParkingRequest,
  useParkingRequest,
  useUpdateParkingStatus,
} from "@/src/hooks/parking-requests";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { ScrollView, View } from "react-native";

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <View className="gap-1">
      <Text variant="muted">{label}</Text>
      <Text>{value || "—"}</Text>
    </View>
  );
}

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const query = useParkingRequest(id);
  const mutation = useUpdateParkingStatus(id);
  const remove = useDeleteParkingRequest(id);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const request = query.data;

  return (
    <View className="bg-background flex-1">
      <Stack.Screen options={{ title: request?.driverName ?? "Request" }} />
      <ScrollView
        className="web:mx-auto web:max-w-xl w-full"
        contentContainerClassName="gap-4 p-4">
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? (
          <ErrorState
            message={query.error instanceof Error ? query.error.message : "Could not load request"}
            onRetry={() => query.refetch()}
          />
        ) : null}

        {request ? (
          <>
            <Card className="py-4">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Status</CardTitle>
                <StatusBadge status={request.status} />
              </CardHeader>
              <CardContent className="gap-4">
                <Field label="Request id" value={request.id} />
                <Separator />
                <Field label="Driver" value={request.driverName} />
                <Field label="License plate" value={request.licensePlate} />
                <Field label="Truck type" value={request.truckType} />
                <Field label="Requested from" value={new Date(request.requestedFrom).toLocaleString()} />
                <Field label="Requested until" value={new Date(request.requestedUntil).toLocaleString()} />
                <Field label="Parking spot" value={request.parkingSpotId} />
              </CardContent>
            </Card>

            <StatusActions
              currentStatus={request.status}
              pending={mutation.isPending}
              onTransition={(status, parkingSpotId) =>
                mutation.mutate({ status, parkingSpotId })
              }
            />

            {mutation.isSuccess ? (
              <Text className="text-primary">Status updated.</Text>
            ) : null}
            {mutation.isError ? (
              <Text className="text-destructive">
                {mutation.error instanceof ApiClientError
                  ? mutation.error.message
                  : "Update failed"}
              </Text>
            ) : null}

            <Button
              variant="outline"
              disabled={remove.isPending}
              onPress={() => setConfirmDelete(true)}>
              <BusyLabel busy={remove.isPending}>Delete request</BusyLabel>
            </Button>
            {remove.isError ? (
              <Text className="text-destructive">
                {remove.error instanceof ApiClientError
                  ? remove.error.message
                  : "Could not delete"}
              </Text>
            ) : null}

            <AlertDialog open={confirmDelete} onOpenChange={(open) => {
              if (!remove.isPending) {
                setConfirmDelete(open);
              }
            }}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete this request?</AlertDialogTitle>
                  <AlertDialogDescription>
                    It will be removed from the yard board. This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={remove.isPending}>
                    <Text>Cancel</Text>
                  </AlertDialogCancel>
                  <AlertDialogAction
                    disabled={remove.isPending}
                    onPress={() => {
                      remove.mutate(undefined, {
                        onSuccess: () => router.replace("/requests"),
                      });
                    }}>
                    <BusyLabel busy={remove.isPending}>Delete</BusyLabel>
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
