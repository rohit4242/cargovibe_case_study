import { getLiveWsUrl } from "@/src/config";
import { summarizeToolResult, type ChatToolEvent } from "@/src/api/assistant-stream";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

type LiveServerEvent = {
  type?: string;
  message?: string;
  data?: string;
  mimeType?: string;
  role?: "user" | "assistant";
  text?: string;
  name?: string;
  write?: boolean;
  result?: unknown;
};

const voiceSupported =
  Platform.OS === "web" &&
  typeof navigator !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

function floatTo16BitPcm(input: Float32Array): ArrayBuffer {
  const buffer = new ArrayBuffer(input.length * 2);
  const view = new DataView(buffer);
  for (let i = 0; i < input.length; i += 1) {
    const sample = Math.max(-1, Math.min(1, input[i] ?? 0));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }
  return buffer;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function base64ToInt16(base64: string): Int16Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Int16Array(bytes.buffer);
}

function downsample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) {
    return input;
  }
  const ratio = fromRate / toRate;
  const length = Math.round(input.length / ratio);
  const output = new Float32Array(length);
  for (let i = 0; i < length; i += 1) {
    output[i] = input[Math.min(input.length - 1, Math.round(i * ratio))] ?? 0;
  }
  return output;
}

class PcmPlayer {
  private context: AudioContext | null = null;
  private next = 0;
  private sources: AudioBufferSourceNode[] = [];

  ensure(sampleRate: number) {
    if (!this.context || this.context.sampleRate !== sampleRate) {
      this.stop();
      this.context = new AudioContext({ sampleRate });
      this.next = 0;
    }
    return this.context;
  }

  play(pcm: Int16Array, sampleRate: number) {
    const context = this.ensure(sampleRate);
    void context.resume();
    const buffer = context.createBuffer(1, pcm.length, sampleRate);
    const channel = buffer.getChannelData(0);
    for (let i = 0; i < pcm.length; i += 1) {
      channel[i] = (pcm[i] ?? 0) / 32768;
    }
    const source = context.createBufferSource();
    source.buffer = buffer;
    source.connect(context.destination);
    const startAt = Math.max(this.next, context.currentTime);
    source.start(startAt);
    this.next = startAt + buffer.duration;
    this.sources.push(source);
    source.onended = () => {
      this.sources = this.sources.filter((item) => item !== source);
    };
  }

  stop() {
    for (const source of this.sources) {
      try {
        source.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources = [];
    this.next = this.context?.currentTime ?? 0;
  }

  close() {
    this.stop();
    void this.context?.close();
    this.context = null;
  }
}

export function useGeminiLive(handlers: {
  onTranscript: (role: "user" | "assistant", text: string) => void;
  onTool: (tool: ChatToolEvent) => void;
  onError: (message: string) => void;
}) {
  const [active, setActive] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);
  const stopMicRef = useRef<(() => void) | null>(null);
  const playerRef = useRef(new PcmPlayer());
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  const disconnect = useCallback(() => {
    stopMicRef.current?.();
    stopMicRef.current = null;
    playerRef.current.stop();
    socketRef.current?.close();
    socketRef.current = null;
    setActive(false);
  }, []);

  useEffect(() => () => disconnect(), [disconnect]);

  const startMic = useCallback(async (socket: WebSocket) => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true },
    });
    const context = new AudioContext();
    const source = context.createMediaStreamSource(stream);
    const processor = context.createScriptProcessor(4096, 1, 1);
    const silence = context.createGain();
    silence.gain.value = 0;
    source.connect(processor);
    processor.connect(silence);
    silence.connect(context.destination);

    processor.onaudioprocess = (event) => {
      if (socket.readyState !== WebSocket.OPEN) {
        return;
      }
      const input = event.inputBuffer.getChannelData(0);
      const pcm = floatTo16BitPcm(downsample(input, context.sampleRate, 16000));
      socket.send(
        JSON.stringify({
          type: "audio",
          mimeType: "audio/pcm;rate=16000",
          data: arrayBufferToBase64(pcm),
        }),
      );
    };

    stopMicRef.current = () => {
      processor.disconnect();
      source.disconnect();
      stream.getTracks().forEach((track) => track.stop());
      void context.close();
    };
  }, []);

  const toggle = useCallback(async () => {
    if (active) {
      disconnect();
      return;
    }

    if (!voiceSupported) {
      handlersRef.current.onError(
        "Gemini Live voice needs the web app (or a dev client with PCM capture). Use text here.",
      );
      return;
    }

    const socket = new WebSocket(getLiveWsUrl());
    socketRef.current = socket;

    socket.onmessage = (event) => {
      let payload: LiveServerEvent;
      try {
        payload = JSON.parse(String(event.data)) as LiveServerEvent;
      } catch {
        return;
      }

      if (payload.type === "ready") {
        void startMic(socket).catch((err) => {
          handlersRef.current.onError(err instanceof Error ? err.message : "Microphone failed");
          disconnect();
        });
        setActive(true);
        return;
      }
      if (payload.type === "error" && payload.message) {
        handlersRef.current.onError(payload.message);
        return;
      }
      if (payload.type === "interrupted") {
        playerRef.current.stop();
        return;
      }
      if (payload.type === "transcript" && payload.role && payload.text) {
        handlersRef.current.onTranscript(payload.role, payload.text);
        return;
      }
      if (payload.type === "tool" && payload.name) {
        handlersRef.current.onTool({
          ...summarizeToolResult(payload.name, payload.result),
          write: payload.write,
        });
        return;
      }
      if (payload.type === "audio" && payload.data) {
        const rateMatch = payload.mimeType?.match(/rate=(\d+)/);
        const rate = rateMatch ? Number(rateMatch[1]) : 24000;
        playerRef.current.play(base64ToInt16(payload.data), rate);
      }
    };

    socket.onerror = () => {
      handlersRef.current.onError("Live voice connection failed");
      disconnect();
    };

    socket.onclose = () => {
      stopMicRef.current?.();
      stopMicRef.current = null;
      setActive(false);
    };
  }, [active, disconnect, startMic]);

  return { active, supported: voiceSupported, toggle };
}
