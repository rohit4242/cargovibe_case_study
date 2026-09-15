import { BusyLabel } from "@/components/BusyLabel";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Mic, MicOff } from "lucide-react-native";
import { View } from "react-native";

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  pending,
  micEnabled,
  micActive,
  onMicPress,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  pending?: boolean;
  micEnabled?: boolean;
  micActive?: boolean;
  onMicPress?: () => void;
}) {
  return (
    <View className="web:mx-auto web:max-w-xl border-border w-full flex-row items-center gap-2 border-t p-3">
      <Input
        className="flex-1"
        placeholder="Which requests are still pending?"
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSend}
      />
      {micEnabled ? (
        <Button
          variant={micActive ? "default" : "outline"}
          size="icon"
          onPress={onMicPress}
          accessibilityLabel={micActive ? "Stop voice" : "Start voice"}>
          <Icon as={micActive ? MicOff : Mic} className="size-5" />
        </Button>
      ) : null}
      <Button disabled={!value.trim() || pending} onPress={onSend}>
        <BusyLabel busy={pending}>Send</BusyLabel>
      </Button>
    </View>
  );
}
