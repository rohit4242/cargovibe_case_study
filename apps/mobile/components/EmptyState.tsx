import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { View } from "react-native";

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center gap-2 py-16">
      <Text variant="large">No parking requests</Text>
      <Text variant="muted" className="text-center">
        {message}
      </Text>
    </View>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <View className="items-center gap-3 py-16">
      <Text variant="large">Something went wrong</Text>
      <Text variant="muted" className="text-center">
        {message}
      </Text>
      {onRetry ? (
        <Button variant="outline" onPress={onRetry}>
          <Text>Try again</Text>
        </Button>
      ) : null}
    </View>
  );
}

export function LoadingState() {
  return (
    <View className="gap-3 py-4">
      <View className="bg-muted h-24 rounded-xl" />
      <View className="bg-muted h-24 rounded-xl" />
      <View className="bg-muted h-24 rounded-xl" />
    </View>
  );
}
