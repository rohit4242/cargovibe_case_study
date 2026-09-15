import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import type { ParkingStatus } from "@cargovibe/shared";

const variantByStatus: Record<
  ParkingStatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  pending: "secondary",
  approved: "default",
  rejected: "destructive",
  checked_in: "outline",
  checked_out: "outline",
};

export function StatusBadge({ status }: { status: ParkingStatus }) {
  return (
    <Badge variant={variantByStatus[status]}>
      <Text>{status.replace("_", " ")}</Text>
    </Badge>
  );
}
