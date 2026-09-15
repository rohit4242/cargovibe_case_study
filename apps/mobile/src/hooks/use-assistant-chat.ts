import { parkingKeys } from "@/src/hooks/parking-requests";
import {
  streamAssistantChat,
  type ChatTurn,
} from "@/src/api/assistant-stream";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";

export function useAssistantChat() {
  const queryClient = useQueryClient();
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateYard = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: parkingKeys.all });
  }, [queryClient]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) {
        return;
      }

      const userTurn: ChatTurn = { id: `u-${Date.now()}`, role: "user", text: trimmed };
      const assistantTurn: ChatTurn = { id: `a-${Date.now()}`, role: "assistant", text: "" };
      const history = [...messages, userTurn];

      setError(null);
      setPending(true);
      setMessages([...history, assistantTurn]);

      let reply = "";
      try {
        await streamAssistantChat(
          history,
          (streamed) => {
            reply = streamed;
            setMessages((current) =>
              current.map((turn) =>
                turn.id === assistantTurn.id ? { ...turn, text: streamed } : turn,
              ),
            );
          },
          (tool) => {
            if (tool.write && tool.ok) {
              invalidateYard();
            }
            setMessages((current) =>
              current.map((turn) =>
                turn.id === assistantTurn.id
                  ? { ...turn, tools: [...(turn.tools ?? []), tool] }
                  : turn,
              ),
            );
          },
        );
        return reply;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Assistant failed");
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [invalidateYard, messages, pending],
  );

  return {
    messages,
    pending,
    error,
    send,
    setError,
  };
}
