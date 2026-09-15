import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { StatusBadge } from "@/components/StatusBadge";
import type { ParkingRequest } from "@cargovibe/shared";
import { Pressable, View } from "react-native";

function formatWindow(from: string, until: string) {
  const start = new Date(from);
  const end = new Date(until);
  return `${start.toLocaleString()} → ${end.toLocaleString()}`;
}

export function RequestListItem({
  request,
  onPress,
}: {
  request: ParkingRequest;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <Card className="py-4">
        <CardHeader className="flex-row items-start justify-between gap-3">
          <View className="flex-1">
            <CardTitle>{request.driverName}</CardTitle>
            <Text variant="muted">{request.licensePlate}</Text>
          </View>
          <StatusBadge status={request.status} />
        </CardHeader>
        <CardContent>
          <Text variant="small">{formatWindow(request.requestedFrom, request.requestedUntil)}</Text>
        </CardContent>
      </Card>
    </Pressable>
  );
}
