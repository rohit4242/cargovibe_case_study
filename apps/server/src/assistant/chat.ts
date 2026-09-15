import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { google } from "@ai-sdk/google";
import { AppError } from "../http/errors";
import { serverEnv } from "../env";
import { ASSISTANT_SYSTEM_PROMPT } from "./prompt";
import { createAssistantTools } from "./tools";
import type { ParkingRequestService } from "../services/parking-request-service";

export async function handleAssistantChat(
  body: { messages?: UIMessage[] },
  service: ParkingRequestService,
): Promise<Response> {
  if (!serverEnv.googleApiKey) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Set GOOGLE_GENERATIVE_AI_API_KEY in apps/server/.env to use the assistant.",
    );
  }

  const messages = body.messages ?? [];
  const result = streamText({
    model: google("gemini-2.5-flash"),
    system: `${ASSISTANT_SYSTEM_PROMPT}\nCurrent time (ISO): ${new Date().toISOString()}`,
    messages: await convertToModelMessages(messages),
    tools: createAssistantTools(service),
    stopWhen: stepCountIs(6),
  });

  return result.toUIMessageStreamResponse({
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "none",
    },
  });
}
