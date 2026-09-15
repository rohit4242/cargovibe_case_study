import { Icon } from "@/components/ui/icon";
import { Loader2 } from "lucide-react-native";
import { ActivityIndicator, Platform } from "react-native";

export function Spinner() {
  if (Platform.OS === "web") {
    return <Icon as={Loader2} className="size-4 animate-spin" />;
  }

  return <ActivityIndicator size="small" />;
}
