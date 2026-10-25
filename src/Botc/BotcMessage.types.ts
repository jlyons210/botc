import type { Message } from "discord.js";

/** Configuration used when creating a BotcMessage. */
export interface BotcMessageConfig {
  /** Bot user ID provided by the authenticated Discord client. */
  botUserId: string;
  /** Original Discord.js message. */
  discordMessage: Message;
}

/** Image attachment data extracted from a Discord message. */
export type BotcMessageImageAttachment = {
  /** MIME type reported by Discord. */
  contentType: string;
  /** Image height in pixels. */
  height: number;
  /** URL of the image attachment. */
  imageUrl: string;
  /** Image width in pixels. */
  width: number;
};
