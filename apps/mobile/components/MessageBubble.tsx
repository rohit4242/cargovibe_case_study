import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { parseChatBlocks } from "@/src/lib/chat-text";
import type { ChatTurn } from "@/src/api/assistant-stream";
import { View } from "react-native";
import { ToolResultChip } from "@/components/ToolResultChip";

function ChatFormattedText({ value }: { value: string }) {
  const blocks = parseChatBlocks(value);

  return (
    <View className="gap-3">
      {blocks.map((block, index) =>
        block.type === "text" ? (
          <Text key={index}>{block.text}</Text>
        ) : (
          <View key={index} className="gap-3">
            {block.items.map((item, itemIndex) => (
              <View key={itemIndex} className="gap-0.5">
                <Text className="font-semibold">
                  {itemIndex + 1}. {item.title}
                </Text>
                {item.detail ? (
                  <Text variant="muted">{item.detail}</Text>
                ) : null}
              </View>
            ))}
          </View>
        ),
      )}
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

  const tools = turn.tools?.filter((tool) => tool.write);

  return (
    <View
      className={cn(
        "max-w-[90%] rounded-2xl px-3.5 py-2.5",
        turn.role === "user"
          ? "bg-secondary self-end"
          : "bg-card border-border self-start border",
      )}>
      {turn.text ? <ChatFormattedText value={turn.text} /> : null}
      {tools?.map((tool, index) => (
        <ToolResultChip key={`${turn.id}-${index}`} tool={tool} />
      ))}
    </View>
  );
}
