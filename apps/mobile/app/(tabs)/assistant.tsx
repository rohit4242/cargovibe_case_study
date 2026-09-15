import { ChatComposer } from "@/components/ChatComposer";
import { MessageBubble } from "@/components/MessageBubble";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useAssistantChat } from "@/src/hooks/use-assistant-chat";
import { useAssistantVoice } from "@/src/hooks/use-assistant-voice";
import * as Speech from "expo-speech";
import { useRef, useState } from "react";
import { ScrollView, View } from "react-native";

export default function AssistantScreen() {
  const [input, setInput] = useState("");
  const scrollRef = useRef<ScrollView>(null);
  const chat = useAssistantChat();
  const voice = useAssistantVoice({
    send: chat.send,
    onError: chat.setError,
  });

  function clearChat() {
    Speech.stop();
    chat.clear();
  }

  return (
    <View className="bg-background flex-1">
      <ScrollView
        ref={scrollRef}
        className="web:mx-auto web:max-w-xl w-full flex-1"
        contentContainerClassName="gap-3 p-4"
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        <View className="flex-row items-start justify-between gap-3">
          <Text variant="muted" className="flex-1">
            Ask about the yard, or create and update requests. Tap the mic to speak.
          </Text>
          {chat.messages.length > 0 ? (
            <Button variant="ghost" size="sm" onPress={clearChat}>
              <Text>Clear</Text>
            </Button>
          ) : null}
        </View>

        {chat.messages.map((turn) => (
          <MessageBubble
            key={turn.id}
            turn={turn}
            thinking={chat.pending && turn.role === "assistant" && turn === chat.messages.at(-1)}
          />
        ))}

        {chat.error ? <Text className="text-destructive">{chat.error}</Text> : null}
      </ScrollView>

      <ChatComposer
        value={input}
        onChangeText={setInput}
        pending={chat.pending}
        micEnabled
        listening={voice.listening}
        speaking={voice.speaking}
        onMicPress={() => void voice.toggle()}
        onSend={() => {
          const text = input;
          setInput("");
          void chat.send(text);
        }}
      />
    </View>
  );
}
