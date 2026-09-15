import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { inlineParts } from "@/src/lib/chat-text";
import type { ChatTurn } from "@/src/api/assistant-stream";
import { View } from "react-native";
import { ToolResultChip } from "@/components/ToolResultChip";

function ChatFormattedText({ value }: { value: string }) {
  const blocks = value
    .split(/\n{2,}/)
    .map((block) => block.replace(/^\s*[-*]\s+/gm, "").trim())
    .filter(Boolean);

  return (
    <View className="gap-2">
      {blocks.map((block, index) => (
        <Text key={index}>
          {inlineParts(block.replace(/\n/g, " ")).map((part, partIndex) => (
            <Text key={partIndex} className={part.bold ? "font-semibold" : undefined}>
              {part.text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
}

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
      {turn.text ? <ChatFormattedText value={turn.text} /> : null}
      {turn.tools?.map((tool, index) => (
        <ToolResultChip key={`${turn.id}-${index}`} tool={tool} />
      ))}
    </View>
  );
}
