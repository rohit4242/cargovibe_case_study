import { fetch } from "expo/fetch";
import { API_URL } from "@/src/config";

export type ChatToolEvent = {
  name: string;
  ok: boolean;
  summary: string;
  write?: boolean;
};

export type ChatTurn = {
  id: string;
  role: "user" | "assistant";
  text: string;
  tools?: ChatToolEvent[];
};

type StreamEvent = {
  type?: string;
  delta?: string;
  text?: string;
  output?: unknown;
  toolName?: string;
};

export function summarizeToolResult(name: string, output: unknown): ChatToolEvent {
  if (!output || typeof output !== "object") {
    return { name, ok: false, summary: "No result" };
  }

  const value = output as {
    ok?: boolean;
    message?: string;
    data?: { id?: string; driverName?: string; status?: string } | unknown[];
  };

  if (value.ok === false) {
    return { name, ok: false, summary: value.message ?? "Failed" };
  }

  const write = name === "createRequest" || name === "updateRequestStatus";
  const data = value.data;

  if (Array.isArray(data)) {
    return { name, ok: true, summary: `${data.length} requests`, write };
  }

  if (data && typeof data === "object") {
    const row = data as { id?: string; driverName?: string; status?: string };
    if (name === "createRequest") {
      return { name, ok: true, summary: `Created ${row.id}`, write };
    }
    if (name === "updateRequestStatus") {
      return {
        name,
        ok: true,
        summary: `${row.driverName ?? row.id}: ${row.status}`,
        write,
      };
    }
    if (row.id) {
      return { name, ok: true, summary: row.id, write };
    }
  }

  return { name, ok: true, summary: name, write };
}

async function readSse(
  response: Response,
  onEvent: (event: StreamEvent) => void,
): Promise<void> {
  if (!response.body) {
    throw new Error("The assistant response was empty");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    buffer = buffer.replace(/\r\n/g, "\n");

    let separator = buffer.indexOf("\n\n");
    while (separator !== -1) {
      const chunk = buffer.slice(0, separator);
      buffer = buffer.slice(separator + 2);
      const dataLine = chunk
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.startsWith("data:"));
      if (dataLine) {
        const data = dataLine.slice(5).trim();
        if (data && data !== "[DONE]") {
          onEvent(JSON.parse(data) as StreamEvent);
        }
      } else {
        const line = chunk.trim();
        if (line.startsWith("{")) {
          onEvent(JSON.parse(line) as StreamEvent);
        }
      }
      separator = buffer.indexOf("\n\n");
    }
  }
}

export async function streamAssistantChat(
  history: ChatTurn[],
  onText: (text: string) => void,
  onTool: (tool: ChatToolEvent) => void,
): Promise<void> {
  const messages = history.map((turn) => ({
    id: turn.id,
    role: turn.role,
    parts: [{ type: "text" as const, text: turn.text }],
  }));

  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    let message = "Assistant request failed";
    try {
      const json = (await response.json()) as { error?: { message?: string } };
      message = json.error?.message ?? message;
    } catch {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }

  let assembled = "";
  let lastToolName = "";

  await readSse(response, (event) => {
    if (typeof event.toolName === "string") {
      lastToolName = event.toolName;
    }
    if (event.type === "text-delta" && event.delta) {
      assembled += event.delta;
      onText(assembled);
    }
    if (event.type === "text" && event.text) {
      assembled = event.text;
      onText(assembled);
    }
    if (event.type === "tool-output-available" || event.type === "tool-result") {
      onTool(summarizeToolResult(lastToolName || "tool", event.output));
    }
  });
}
