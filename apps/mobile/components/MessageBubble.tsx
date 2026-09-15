import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import type { ChatTurn } from "@/src/api/assistant-stream";
import { View } from "react-native";
import { ToolResultChip } from "@/components/ToolResultChip";

export function MessageBubble({ turn, thinking }: { turn: ChatTurn; thinking?: boolean }) {
  if (turn.role === "assistant" && !turn.text && thinking && !turn.tools?.length) {
    return (
      <Text variant="muted" className="self-start">
        Thinking…
      </Text>
    );
  }

  return (
    <View
      className={cn(
        "max-w-[90%] rounded-lg px-3 py-2",
        turn.role === "user"
          ? "bg-secondary self-end"
          : "bg-card border-border self-start border",
      )}>
      {turn.text ? <Text>{turn.text}</Text> : null}
      {turn.tools?.map((tool, index) => (
        <ToolResultChip key={`${turn.id}-${index}`} tool={tool} />
      ))}
    </View>
  );
}
