import { EmptyState, ErrorState, LoadingState } from "@/components/EmptyState";
import { RequestListItem } from "@/components/RequestListItem";
import { Text } from "@/components/ui/text";
import { useParkingRequests } from "@/src/hooks/parking-requests";
import { useRouter } from "expo-router";
import { RefreshControl, ScrollView, View } from "react-native";

export default function RequestListScreen() {
  const router = useRouter();
  const query = useParkingRequests();

  return (
    <View className="bg-background flex-1">
      <ScrollView
        className="web:mx-auto web:max-w-xl w-full"
        contentContainerClassName="gap-3 p-4"
        refreshControl={
          <RefreshControl refreshing={query.isRefetching} onRefresh={() => query.refetch()} />
        }>
        {query.isLoading ? <LoadingState /> : null}
        {query.isError ? (
          <ErrorState
            message={query.error instanceof Error ? query.error.message : "Could not load requests"}
            onRetry={() => query.refetch()}
          />
        ) : null}
        {query.isSuccess && query.data.length === 0 ? (
          <EmptyState message="Nothing on the board yet. Pull down to refresh." />
        ) : null}
        {query.data?.map((request) => (
          <RequestListItem
            key={request.id}
            request={request}
            onPress={() => router.push(`/request/${request.id}`)}
          />
        ))}
        {query.isSuccess ? (
          <Text variant="muted" className="pb-8 pt-2 text-center">
            Pull down to refresh
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
