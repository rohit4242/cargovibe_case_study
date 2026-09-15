import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { RequestListItem } from "@/components/RequestListItem";
import { Icon } from "@/components/ui/icon";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useParkingRequests } from "@/src/hooks/parking-requests";
import type { ParkingStatus } from "@cargovibe/shared";
import { useRouter } from "expo-router";
import {
  ClipboardList,
  Clock,
  MessageCircle,
  ParkingCircle,
  Truck,
} from "lucide-react-native";
import { Pressable, RefreshControl, ScrollView, View } from "react-native";

const STATS: {
  status: ParkingStatus;
  label: string;
  hint: string;
  icon: typeof Clock;
}[] = [
  { status: "pending", label: "Pending", hint: "Waiting on a decision", icon: Clock },
  { status: "approved", label: "Approved", hint: "Spot assigned", icon: ParkingCircle },
  { status: "checked_in", label: "On site", hint: "Currently parked", icon: Truck },
];

export default function HomeScreen() {
  const router = useRouter();
  const query = useParkingRequests();
  const items = query.data ?? [];
  const upcoming = items.filter(
    (item) => item.status === "pending" || item.status === "approved",
  );

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="web:mx-auto web:max-w-3xl w-full"
        contentContainerClassName="gap-6 p-4 pb-10"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        <View className="gap-1">
          <Text variant="muted">CargoVibe yard</Text>
          <Text variant="h3">Overview</Text>
          <Text variant="muted">
            {query.isSuccess
              ? `${items.length} requests on the board`
              : "Live parking requests on this site."}
          </Text>
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
            <View className="flex-row flex-wrap gap-3">
              {STATS.map(({ status, label, hint, icon }) => (
                <Pressable
                  key={status}
                  accessibilityRole="button"
                  onPress={() => router.push("/requests")}
                  className="min-w-[148px] flex-1">
                  <Card className="py-4">
                    <CardHeader className="flex-row items-center justify-between gap-2">
                      <CardTitle>{label}</CardTitle>
                      <View className="bg-muted rounded-full p-2">
                        <Icon as={icon} className="size-4 text-foreground" />
                      </View>
                    </CardHeader>
                    <CardContent className="gap-1">
                      <Text variant="h3">
                        {items.filter((item) => item.status === status).length}
                      </Text>
                      <CardDescription>{hint}</CardDescription>
                    </CardContent>
                  </Card>
                </Pressable>
              ))}
            </View>

            <View className="flex-row flex-wrap gap-3">
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/requests")}
                className="min-w-[200px] flex-1">
                <Card className="py-4">
                  <CardHeader className="flex-row items-start gap-3">
                    <View className="bg-primary rounded-lg p-2">
                      <Icon as={ClipboardList} className="size-5 text-primary-foreground" />
                    </View>
                    <View className="flex-1 gap-1">
                      <CardTitle>All requests</CardTitle>
                      <CardDescription>Open the full list and update status.</CardDescription>
                    </View>
                  </CardHeader>
                </Card>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push("/assistant")}
                className="min-w-[200px] flex-1">
                <Card className="py-4">
                  <CardHeader className="flex-row items-start gap-3">
                    <View className="bg-secondary rounded-lg p-2">
                      <Icon as={MessageCircle} className="size-5 text-secondary-foreground" />
                    </View>
                    <View className="flex-1 gap-1">
                      <CardTitle>Assistant</CardTitle>
                      <CardDescription>Ask about pending, tankers, or tonight.</CardDescription>
                    </View>
                  </CardHeader>
                </Card>
              </Pressable>
            </View>

            <View className="flex-row items-center justify-between gap-3">
              <Text variant="large">Needs attention</Text>
              <Pressable onPress={() => router.push("/requests")} accessibilityRole="button">
                <Text variant="muted">See all</Text>
              </Pressable>
            </View>

            {upcoming.length === 0 ? (
              <Text variant="muted">Nothing waiting on a decision.</Text>
            ) : (
              <View className="gap-3">
                {upcoming.slice(0, 4).map((request) => (
                  <RequestListItem
                    key={request.id}
                    request={request}
                    onPress={() => router.push(`/request/${request.id}`)}
                  />
                ))}
              </View>
            )}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}
