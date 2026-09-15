import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { RequestListItem } from "@/components/RequestListItem";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Icon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { useParkingRequests } from "@/src/hooks/parking-requests";
import type { ParkingStatus } from "@cargovibe/shared";
import { useRouter } from "expo-router";
import { ClipboardList, MessageCircle } from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const STATS: { status: ParkingStatus; label: string }[] = [
  { status: "pending", label: "Pending" },
  { status: "approved", label: "Approved" },
  { status: "checked_in", label: "On site" },
];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const query = useParkingRequests();
  const items = query.data ?? [];
  const upcoming = items.filter(
    (item) => item.status === "pending" || item.status === "approved",
  );

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="web:mx-auto web:max-w-xl w-full"
        contentContainerClassName="gap-8 px-5 pb-12"
        contentContainerStyle={{ paddingTop: Math.max(insets.top, 16) }}
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        <View className="flex-row items-center justify-between">
          <View className="gap-1">
            <Text variant="h3">CargoVibe</Text>
            <Text variant="muted">Parking yard</Text>
          </View>
          <ThemeToggle />
        </View>

        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? (
          <ErrorState
            message={query.error instanceof Error ? query.error.message : "Could not load requests"}
            onRetry={() => query.refetch()}
          />
        ) : null}

        {query.isSuccess ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push("/requests")}
              className="bg-card border-border flex-row rounded-2xl border px-2 py-5">
              {STATS.map(({ status, label }, index) => (
                <View
                  key={status}
                  className={cn(
                    "flex-1 items-center gap-1",
                    index > 0 && "border-border border-l",
                  )}>
                  <Text variant="h3">
                    {items.filter((item) => item.status === status).length}
                  </Text>
                  <Text variant="muted">{label}</Text>
                </View>
              ))}
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/requests")}
                className="bg-primary flex-1 flex-row items-center gap-2 rounded-2xl px-4 py-4">
                <Icon as={ClipboardList} className="size-5 text-primary-foreground" />
                <Text className="text-primary-foreground">Requests</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/assistant")}
                className="bg-secondary flex-1 flex-row items-center gap-2 rounded-2xl px-4 py-4">
                <Icon as={MessageCircle} className="size-5 text-secondary-foreground" />
                <Text className="text-secondary-foreground">Assistant</Text>
              </Pressable>
            </View>

            <View className="gap-3">
              <Text variant="large">Waiting on you</Text>
              {upcoming.length === 0 ? (
                <Text variant="muted">Nothing pending or approved.</Text>
              ) : (
                upcoming.slice(0, 5).map((request) => (
                  <RequestListItem
                    key={request.id}
                    request={request}
                    onPress={() => router.push(`/request/${request.id}`)}
                  />
                ))
              )}
            </View>
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
