import { Text } from "@/components/ui/text";
import type { ChatToolEvent } from "@/src/api/assistant-stream";

export function ToolResultChip({ tool }: { tool: ChatToolEvent }) {
  return (
    <Text variant="small" className={tool.ok ? "text-muted-foreground" : "text-destructive"}>
      {tool.summary}
    </Text>
  );
}
