import { ChatComposer } from "@/components/ChatComposer";
import { MessageBubble } from "@/components/MessageBubble";
import { Text } from "@/components/ui/text";
import { useAssistantChat } from "@/src/hooks/use-assistant-chat";
import { useGeminiLive } from "@/src/hooks/use-gemini-live";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";

export default function AssistantScreen() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const chat = useAssistantChat();
  const live = useGeminiLive({
    onTranscript: chat.appendTranscript,
    onTool: chat.addTool,
    onError: chat.setError,
  });

  return (
    <View className="bg-background flex-1">
      <ScrollView
        ref={scrollRef}
        className="web:mx-auto web:max-w-xl w-full flex-1"
        contentContainerClassName="gap-3 p-4"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <Text variant="muted">
          Ask about the yard, or create and update requests. Voice uses Gemini Live (web).
        </Text>

        {chat.messages.map((turn) => (
          <MessageBubble
            key={turn.id}
            turn={turn}
            thinking={chat.pending && turn.role === "assistant" && turn === chat.messages.at(-1)}
          />
        ))}

        {chat.error ? <Text className="text-destructive">{chat.error}</Text> : null}
        {live.active ? <Text variant="muted">Listening…</Text> : null}
      </ScrollView>

      <ChatComposer
        value={input}
        onChangeText={setInput}
        pending={chat.pending}
        micEnabled
        micActive={live.active}
        onMicPress={() => void live.toggle()}
        onSend={() => {
          const text = input;
          setInput("");
          void chat.send(text);
        }}
      />
    </View>
  );
}
