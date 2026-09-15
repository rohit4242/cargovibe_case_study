import { Spinner } from "@/components/ui/spinner";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { Mic, Send, Square } from "lucide-react-native";
import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";

export function ChatComposer({
  value,
  onChangeText,
  onSend,
  pending,
  micEnabled,
  listening,
  speaking,
  onMicPress,
}: {
  value: string;
  onChangeText: (value: string) => void;
  onSend: () => void;
  pending?: boolean;
  micEnabled?: boolean;
  listening?: boolean;
  speaking?: boolean;
  onMicPress?: () => void;
}) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!listening) {
      pulse.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1.18,
          duration: 550,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 1,
          duration: 550,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [listening, pulse]);

  const status = listening ? "Listening — tap the mic to stop" : speaking ? "Reading reply — tap to stop" : pending ? "Thinking…" : null;
  const micBusy = listening || speaking;

  return (
    <View className="web:mx-auto web:max-w-xl border-border w-full gap-2 border-t px-3 pt-2 pb-3">
      {status ? (
        <Text variant="muted" className="text-center">
          {status}
        </Text>
      ) : null}
      <View
        className={cn(
          "bg-muted flex-row items-center gap-1 rounded-full px-1.5 py-1",
          listening && "border-primary border",
        )}>
        {micEnabled ? (
          <Animated.View style={{ transform: [{ scale: pulse }] }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={micBusy ? "Stop" : "Speak"}
              onPress={onMicPress}
              className={cn(
                "size-10 items-center justify-center rounded-full",
                listening && "bg-primary",
                speaking && "bg-destructive",
                !micBusy && "bg-background",
              )}>
              <Icon
                as={micBusy ? Square : Mic}
                className={cn(
                  "size-5",
                  micBusy ? "text-primary-foreground" : "text-foreground",
                )}
              />
            </Pressable>
          </Animated.View>
        ) : null}
        <Input
          className="h-11 min-h-11 flex-1 border-0 bg-transparent px-2 shadow-none"
          placeholder={listening ? "Listening…" : "Ask about the yard…"}
          value={listening ? "" : value}
          editable={!listening && !pending}
          onChangeText={onChangeText}
          onSubmitEditing={onSend}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Send"
          disabled={!value.trim() || pending || listening}
          onPress={onSend}
          className={cn(
            "size-10 items-center justify-center rounded-full",
            value.trim() && !pending && !listening ? "bg-primary" : "bg-background opacity-50",
          )}>
          {pending ? (
            <Spinner />
          ) : (
            <Icon
              as={Send}
              className={cn(
                "size-5",
                value.trim() && !listening ? "text-primary-foreground" : "text-muted-foreground",
              )}
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}
