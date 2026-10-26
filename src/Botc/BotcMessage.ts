import type { Attachment, Message } from "discord.js";
import {
  ChannelType,
  DiscordAPIError,
  RESTJSONErrorCodes,
  TextChannel,
} from "discord.js";

import type {
  BotcMessageConfig,
  BotcMessageImageAttachment,
} from "../Botc/index.ts";

import { Logger } from "./Logger/index.ts";

/**
 * A wrapper for Discord.js Message objects that provides additional properties and methods for
 * interacting with the message.
 */
export class BotcMessage {
  private readonly config: BotcMessageConfig;
  private readonly botUserId: string;
  private readonly logger = new Logger();
  private readonly message: Message;

  private _attachedImages: BotcMessageImageAttachment[] = [];
  private _imageDescriptions: string[] = [];
  private _nameSanitized!: string;
  private _voiceMessageTranscription: string | undefined;

  constructor(config: BotcMessageConfig) {
    this.config = config;
    this.botUserId = config.botUserId;
    this.message = config.discordMessage;
    this.initialize();
  }

  private async initialize(): Promise<void> {}

  public addImageDescription(description: string): void {
    this._imageDescriptions.push(description);
  }

  /** Formats the message being replied to for prompt context. */
  private getMessageReplyContext(): string | undefined {
    if (this.isReply && this.replyToMessage) {
      try {
        const replyMessage = this.replyToMessage;
        const replyAuthor =
          replyMessage.message.author.displayName ||
          replyMessage.message.author.username;
        const replyTimestampLocal = new Date(
          replyMessage.createdTimestamp,
        ).toLocaleString("en-US");

        return [
          `---`,
          `Focus your response on this message that was replied to:`,
          `- Message author: ${replyAuthor}`,
          `- Message timestamp: ${replyTimestampLocal}`,
          `- Message content: ${replyMessage.content}`,
          `---`,
        ].join("\n");
      } catch (error) {
        const messageUrl = this.message.url;

        if (error instanceof DiscordAPIError) {
          if (error.code === RESTJSONErrorCodes.UnknownMessage) {
            this.logger.log(
              `Message is a reply to another deleted message: Reference: ${messageUrl}`,
              "ERROR",
            );
          }
        } else {
          this.logger.log(`Failed to fetch reply message: ${error}`, "ERROR");
        }

        return [
          `---`,
          "The message that was replied to was deleted.",
          `---`,
        ].join("\n");
      }
    }
  }

  /** Builds OpenAI prompt content from the message and its metadata. */
  private getPromptContent(): string {
    const createdTimestampLocal = new Date(
      this.createdTimestamp,
    ).toLocaleString("en-US");

    const imageDescriptions = this.hasAttachedImages
      ? `Image descriptions:\n${this.imageDescriptions.join("\n---\n")}`
      : undefined;

    const replyContext = this.getMessageReplyContext();

    const resolvedContent =
      this.content === "" && this.voiceMessageTranscription
        ? this.voiceMessageTranscription
        : this.resolveTaggedUsers();

    const voiceMessageTranscription = this.voiceMessageTranscription
      ? `Voice message transcription:\n${this.voiceMessageTranscription}`
      : undefined;

    const promptContent = [
      resolvedContent,
      `<Message Metadata>`,
      `Preferred name: ${this.displayName}`,
      `Message channel: ${this.channelName}`,
      `Message timestamp: ${createdTimestampLocal}`,
      imageDescriptions,
      voiceMessageTranscription,
      replyContext,
      `</Message Metadata>`,
    ].join("\n");

    return promptContent;
  }

  private resolveTaggedUsers(): string {
    return this.content.replace(/<@!?(?<userId>\d+)>/g, (match, userId) => {
      const displayName =
        this.message.guild?.members.cache.get(userId)?.displayName;
      const username = this.message.client.users.cache.get(userId)?.username;
      return displayName || username || match;
    });
  }

  public get attachedImages(): BotcMessageImageAttachment[] {
    if (this._attachedImages.length === 0) {
      /**
       * Allowed content types for image attachments per the OpanAI API
       * [Vision FAQ](https://platform.openai.com/docs/guides/vision#faq)
       */
      const allowedContentTypes = [
        "image/gif",
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      this._attachedImages = this.message.attachments
        .filter(
          (attachment) =>
            attachment.contentType &&
            allowedContentTypes.includes(attachment.contentType),
        )
        .map((attachment) => ({
          contentType: attachment.contentType as string,
          height: attachment.height as number,
          imageUrl: attachment.url,
          width: attachment.width as number,
        }));
    }

    return this._attachedImages;
  }

  public get authorId(): string {
    return this.message.author.id;
  }

  public get channelId(): string {
    return this.message.channel.id;
  }

  public get channelName(): string {
    switch (true) {
      case this.message.channel.isDMBased():
        this.logger.log("Message is a DM", "DEBUG");
        return "Direct Message";
      case this.message.channel.isTextBased() &&
        this.message.channel instanceof TextChannel:
        this.logger.log("Message is a text channel", "DEBUG");
        return this.message.channel.name;
      default:
        this.logger.log("Message is not a text channel", "DEBUG");
        return "";
    }
  }

  public get content(): string {
    return this.message.content;
  }

  public get createdTimestamp(): number {
    return this.message.createdTimestamp;
  }

  /**
   * Message author display name. Falls back to username if no display name is available.
   * @returns Display name or username
   */
  public get displayName(): string {
    return this.message.member?.displayName || this.username;
  }

  public get guildId(): string | undefined {
    return this.message.guild?.id;
  }

  public get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0;
  }

  public get hasVoiceMessage(): boolean {
    return this.message.attachments.some(
      (attachment) =>
        attachment.contentType?.startsWith("audio/ogg") &&
        attachment.waveform !== null,
    );
  }

  public get imageDescriptions(): string[] {
    return this._imageDescriptions;
  }

  public get isAtMention(): boolean {
    return this.message.mentions.has(this.botUserId);
  }

  public get isBotMessage(): boolean {
    return this.message.author.bot;
  }

  public get isChannelMessage(): boolean {
    return this.message.channel.type === ChannelType.GuildText;
  }

  public get isDirectMessage(): boolean {
    return this.message.channel.type === ChannelType.DM;
  }

  public get isOwnMessage(): boolean {
    return this.message.author.id === this.botUserId;
  }

  public get isReply(): boolean {
    return this.message.reference !== null;
  }

  public get isVoiceMessage(): boolean {
    return this.hasVoiceMessage;
  }

  /**
   * Message content used by the OpenAI prompt content field.
   * @returns Prompt content
   */
  public get promptContent(): string {
    return this.getPromptContent();
  }

  /**
   * Message role used by the OpenAI prompt role field.
   * @returns Prompt role
   */
  public get promptRole(): "assistant" | "user" {
    return this.isOwnMessage ? "assistant" : "user";
  }

  /**
   * Message author username (sanitized) used by the OpenAI prompt username field.
   * @returns Prompt username
   */
  public get promptUsername(): string {
    if (!this._nameSanitized) {
      this._nameSanitized = this.message.author.username.replace(
        /[^a-zA-Z0-9_-]/g,
        "-",
      );
    }
    return this._nameSanitized;
  }

  public get replyToMessage(): BotcMessage | undefined {
    if (this.isReply && this.message.reference?.messageId) {
      const replyMessageId = this.message.reference.messageId;
      const replyMessage =
        this.message.channel.messages.cache.get(replyMessageId);

      if (replyMessage) {
        return new BotcMessage({
          botUserId: this.botUserId,
          discordMessage: replyMessage,
        });
      }
    }

    return undefined;
  }

  public get username(): string {
    return this.message.author.username;
  }

  public get voiceMessage(): Attachment | undefined {
    return this.message.attachments.find((attachment) =>
      attachment.contentType?.startsWith("audio/ogg"),
    );
  }

  public get voiceMessageTranscription(): string | undefined {
    return this._voiceMessageTranscription;
  }

  public set voiceMessageTranscription(transcription: string) {
    this._voiceMessageTranscription = transcription;
  }
}
