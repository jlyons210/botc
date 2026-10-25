import type { AttachmentBuilder } from "discord.js";
import type { BotcMessage } from "../index.ts";

/**
 * EventMap is a map of event names to their payload types
 */
export interface EventMap {
  "Botc:ResponseComplete": {
    channelId: string;
    content: string;
    attachments: AttachmentBuilder[];
  };

  "Brave:Ready": {
    message: string;
  };

  "DiscordClient:IncomingMessage": {
    message: BotcMessage;
  };

  "DiscordClient:Ready": {
    message: string;
  };

  "DiscordClient:StartTyping": {
    channelId: string;
  };

  "ElevenLabsClient:Ready": {
    message: string;
  };

  "OpenAIClient:Ready": {
    message: string;
  };
}
