import type { WSContext } from "hono/ws";
import { serverEnv } from "../env";
import { ParkingRequestService } from "../services/parking-request-service";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt";
import {
  executeAssistantTool,
  isWriteTool,
  liveFunctionDeclarations,
} from "./tools";

export const LIVE_MODEL = "gemini-3.1-flash-live-preview";

const GEMINI_LIVE_URL =
  "wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent";

type ClientEvent =
  | { type: "audio"; data: string; mimeType?: string }
  | { type: "text"; text: string }
  | { type: "end" };

type GeminiServerMessage = {
  setupComplete?: unknown;
  toolCall?: {
    functionCalls?: Array<{ id?: string; name?: string; args?: unknown }>;
  };
  serverContent?: {
    interrupted?: boolean;
    modelTurn?: {
      parts?: Array<{
        inlineData?: { mimeType?: string; data?: string };
        text?: string;
      }>;
    };
    inputTranscription?: { text?: string };
    outputTranscription?: { text?: string };
  };
  error?: { message?: string };
};

function send(client: WSContext, payload: Record<string, unknown>) {
  client.send(JSON.stringify(payload));
}

function parseClientEvent(raw: unknown): ClientEvent | null {
  let text: string | null = null;
  if (typeof raw === "string") {
    text = raw;
  } else if (raw instanceof ArrayBuffer) {
    text = new TextDecoder().decode(raw);
  } else if (ArrayBuffer.isView(raw)) {
    text = new TextDecoder().decode(raw);
  }
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as ClientEvent;
  } catch {
    return null;
  }
}

export function liveSocketHandlers() {
  const service = new ParkingRequestService();
  let gemini: WebSocket | undefined;
  let closed = false;

  function closeGemini() {
    if (gemini && gemini.readyState < 2) {
      gemini.close();
    }
    gemini = undefined;
  }

  return {
    onOpen(_event: Event, client: WSContext) {
      if (!serverEnv.googleApiKey) {
        send(client, {
          type: "error",
          message: "Set GOOGLE_GENERATIVE_AI_API_KEY to use voice.",
        });
        client.close();
        return;
      }

      const url = `${GEMINI_LIVE_URL}?key=${encodeURIComponent(serverEnv.googleApiKey)}`;
      gemini = new WebSocket(url);

      gemini.addEventListener("open", () => {
        gemini?.send(
          JSON.stringify({
            setup: {
              model: `models/${LIVE_MODEL}`,
              generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                  voiceConfig: { prebuiltVoiceConfig: { voiceName: "Puck" } },
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: `${ASSISTANT_SYSTEM_PROMPT}\nCurrent time (ISO): ${new Date().toISOString()}`,
                  },
                ],
              },
              tools: [{ functionDeclarations: liveFunctionDeclarations() }],
              inputAudioTranscription: {},
              outputAudioTranscription: {},
            },
          }),
        );
      });

      gemini.addEventListener("message", (event) => {
        void handleGeminiMessage(client, service, gemini, event.data);
      });

      gemini.addEventListener("error", () => {
        if (!closed) {
          send(client, { type: "error", message: "Gemini Live connection failed" });
        }
      });

      gemini.addEventListener("close", () => {
        if (!closed) {
          client.close();
        }
      });
    },

    onMessage(event: MessageEvent, _client: WSContext) {
      const parsed = parseClientEvent(event.data);
      if (!parsed || !gemini || gemini.readyState !== WebSocket.OPEN) {
        return;
      }

      if (parsed.type === "audio" && parsed.data) {
        gemini.send(
          JSON.stringify({
            realtimeInput: {
              audio: {
                mimeType: parsed.mimeType ?? "audio/pcm;rate=16000",
                data: parsed.data,
              },
            },
          }),
        );
        return;
      }

      if (parsed.type === "text" && parsed.text.trim()) {
        gemini.send(
          JSON.stringify({
            clientContent: {
              turns: [{ role: "user", parts: [{ text: parsed.text.trim() }] }],
              turnComplete: true,
            },
          }),
        );
        return;
      }

      if (parsed.type === "end") {
        gemini.send(JSON.stringify({ realtimeInput: { audioStreamEnd: true } }));
      }
    },

    onClose() {
      closed = true;
      closeGemini();
    },

    onError() {
      closed = true;
      closeGemini();
    },
  };
}

async function handleGeminiMessage(
  client: WSContext,
  service: ParkingRequestService,
  gemini: WebSocket | undefined,
  data: unknown,
) {
  const text = await messageToString(data);
  if (!text) {
    return;
  }

  let payload: GeminiServerMessage;
  try {
    payload = JSON.parse(text) as GeminiServerMessage;
  } catch {
    return;
  }

  if (payload.setupComplete) {
    send(client, { type: "ready" });
    return;
  }

  if (payload.error?.message) {
    send(client, { type: "error", message: payload.error.message });
    return;
  }

  const calls = payload.toolCall?.functionCalls ?? [];
  if (calls.length > 0) {
    const functionResponses = [];
    for (const call of calls) {
      const name = call.name ?? "";
      let args: unknown = call.args ?? {};
      if (typeof call.args === "string") {
        try {
          args = JSON.parse(call.args);
        } catch {
          args = {};
        }
      }
      const result = await executeAssistantTool(service, name, args);
      functionResponses.push({
        id: call.id,
        name,
        response: result,
      });
      send(client, {
        type: "tool",
        name,
        write: isWriteTool(name),
        result,
      });
    }

    if (gemini && gemini.readyState === WebSocket.OPEN) {
      gemini.send(JSON.stringify({ toolResponse: { functionResponses } }));
    }
    return;
  }

  const content = payload.serverContent;
  if (!content) {
    return;
  }

  if (content.interrupted) {
    send(client, { type: "interrupted" });
  }

  if (content.inputTranscription?.text) {
    send(client, { type: "transcript", role: "user", text: content.inputTranscription.text });
  }

  if (content.outputTranscription?.text) {
    send(client, {
      type: "transcript",
      role: "assistant",
      text: content.outputTranscription.text,
    });
  }

  for (const part of content.modelTurn?.parts ?? []) {
    if (part.inlineData?.data) {
      send(client, {
        type: "audio",
        mimeType: part.inlineData.mimeType ?? "audio/pcm;rate=24000",
        data: part.inlineData.data,
      });
    }
    if (part.text) {
      send(client, { type: "transcript", role: "assistant", text: part.text });
    }
  }
}

async function messageToString(data: unknown): Promise<string | null> {
  if (typeof data === "string") {
    return data;
  }
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }
  if (data instanceof Blob) {
    return data.text();
  }
  if (data instanceof Uint8Array) {
    return new TextDecoder().decode(data);
  }
  return null;
}
