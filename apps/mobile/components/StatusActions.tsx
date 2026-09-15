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
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { allowedNextStatuses, isFinalStatus, type ParkingStatus } from "@cargovibe/shared";
import { useState } from "react";
import { View } from "react-native";

const labels: Record<ParkingStatus, string> = {
  pending: "Pending",
  approved: "Approve",
  rejected: "Reject",
  checked_in: "Check in",
  checked_out: "Check out",
};

export function StatusActions({
  currentStatus,
  pending,
  onTransition,
}: {
  currentStatus: ParkingStatus;
  pending?: boolean;
  onTransition: (status: ParkingStatus, parkingSpotId?: string) => void;
}) {
  const next = allowedNextStatuses(currentStatus);
  const [spotId, setSpotId] = useState("");
  const [confirming, setConfirming] = useState<ParkingStatus | null>(null);
  const [acting, setActing] = useState<ParkingStatus | null>(null);

  if (next.length === 0) {
    return (
      <Text variant="muted">This request is in a final state and cannot be updated.</Text>
    );
  }

  function run(status: ParkingStatus) {
    setActing(status);
    if (status === "approved") {
      onTransition(status, spotId.trim() || undefined);
      return;
    }
    onTransition(status);
  }

  return (
    <View className="gap-3">
      {next.includes("approved") ? (
        <Input
          placeholder="Parking spot id (required to approve)"
          value={spotId}
          onChangeText={setSpotId}
          autoCapitalize="characters"
        />
      ) : null}

      {next.map((status) => {
        const final = isFinalStatus(status);
        if (final) {
          return (
            <Button
              key={status}
              variant="destructive"
              disabled={pending}
              onPress={() => setConfirming(status)}>
              <BusyLabel busy={pending && acting === status}>{labels[status]}</BusyLabel>
            </Button>
          );
        }

        return (
            <Button
              key={status}
              variant={status === "approved" ? "default" : "secondary"}
              disabled={pending || (status === "approved" && !spotId.trim())}
              onPress={() => run(status)}>
              <BusyLabel busy={pending && acting === status}>{labels[status]}</BusyLabel>
            </Button>
        );
      })}

      <AlertDialog open={confirming !== null} onOpenChange={(open) => !open && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm {confirming ? labels[confirming] : ""}</AlertDialogTitle>
            <AlertDialogDescription>
              This status is final. You will not be able to change it afterwards.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              <Text>Cancel</Text>
            </AlertDialogCancel>
            <AlertDialogAction
              onPress={() => {
                if (confirming) {
                  run(confirming);
                }
                setConfirming(null);
              }}>
              <BusyLabel busy={pending && acting === confirming}>Confirm</BusyLabel>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </View>
  );
}
