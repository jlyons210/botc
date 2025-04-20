import {
  Attachment,
  ChannelType,
  DiscordAPIError,
  Message,
  RESTJSONErrorCodes,
} from 'discord.js';

import {
  BotcMessageConfig,
  BotcMessageImageAttachment,
} from '../Botc/index.js';

import { Logger } from './Logger/Logger.js';

/**
 * A wrapper for Discord.js Message objects that provides additional properties and methods for
 * interacting with the message.
 */
export class BotcMessage {
  private readonly botUserId: string;
  private readonly logger = new Logger();
  private readonly message: Message;

  private _attachedImages: BotcMessageImageAttachment[] = [];
  private _imageDescriptions: string[] = [];
  private _nameSanitized!: string;
  private _replyContext!: string | undefined;
  private _voiceMessageTranscription: string | undefined;

  /**
   * New BotcMessage
   * @param {BotcMessageConfig} config BotcMessageConfig object
   */
  constructor(private config: BotcMessageConfig) {
    this.botUserId = config.botUserId;
    this.message = config.discordMessage;
    this.initialize();
  }

  /**
   * Initialize the BotcMessage object
   */
  private async initialize(): Promise<void> {
    await this.addMessageReplyContext();
  }

  /**
   * Add a description for an image attached to the message
   * @param {string} description Image description
   */
  public addImageDescription(description: string): void {
    this._imageDescriptions.push(description);
  }

  /**
   * Add the context of the message that was replied to for prompt enrichment
   */
  private async addMessageReplyContext(): Promise<void> {
    if (this.isReply && this.message.reference?.messageId) {
      try {
        const replyMessageId = this.message.reference.messageId;
        const replyMessage = await this.message.channel.messages.fetch(replyMessageId);
        const replyContent = replyMessage.content;
        const replyAuthor = replyMessage.author.displayName || replyMessage.author.username;
        const replyTimestampLocal = new Date(replyMessage.createdTimestamp).toLocaleString('en-US');

        this._replyContext = [
          `---`,
          `Focus your response on this message that was replied to:`,
          `- Message author: ${replyAuthor}`,
          `- Message timestamp: ${replyTimestampLocal}`,
          `- Message content: ${replyContent}`,
          `---`,
        ].join('\n');
      }
      catch (error) {
        const messageUrl = this.message.url;

        if (error instanceof DiscordAPIError) {
          if (error.code === RESTJSONErrorCodes.UnknownMessage) {
            this.logger.log(`Message is a reply to another deleted message: Reference: ${messageUrl}`, 'ERROR');
          }
        }
        else {
          this.logger.log(`Failed to fetch reply message: ${error}`, 'ERROR');
        }

        this._replyContext = [
          `---`,
          'The message that was replied to was deleted.',
          `---`,
        ].join('\n');
      }
    }
  }

  /**
   * Get the content of the message for the OpenAI prompt
   * @returns {string} Prompt content
   */
  private getPromptContent(): string {
    const resolvedContent = (this.content === '' && this.voiceMessageTranscription)
      ? this.voiceMessageTranscription
      : this.resolveTaggedUsers();

    const imageDescriptions = (this.hasAttachedImages)
      ? `Image descriptions:\n${this.imageDescriptions.join('\n---\n')}`
      : undefined;

    const voiceMessageTranscription = (this.voiceMessageTranscription)
      ? `Voice message transcription:\n${this.voiceMessageTranscription}`
      : undefined;

    const createdTimestampLocal = new Date(this.createdTimestamp).toLocaleString('en-US');

    const promptContent = [
      resolvedContent,
      `<Message Metadata>`,
      `Preferred name: ${this.displayName}`,
      `Message timestamp: ${createdTimestampLocal}`,
      imageDescriptions,
      voiceMessageTranscription,
      this.replyContext,
      `</Message Metadata>`,
    ].join('\n');

    return promptContent;
  }

  /**
   * Resolve tagged users in the message content to their display names
   * @returns {string} Resolved content
   */
  private resolveTaggedUsers(): string {
    return this.content.replace(/<@!?(?<userId>\d+)>/g, (match, userId) => {
      const displayName = this.message.guild?.members.cache.get(userId)?.displayName;
      const username = this.message.client.users.cache.get(userId)?.username;
      return displayName || username || match;
    });
  }

  /**
   * Populates a collection of image attachments with metadata from the message
   * @returns {BotcMessageImageAttachment[]} Collection of image attachments
   */
  public get attachedImages(): BotcMessageImageAttachment[] {
    if (this._attachedImages.length === 0) {
      /**
       * Allowed content types for image attachments per the OpanAI API
       * [Vision FAQ](https://platform.openai.com/docs/guides/vision#faq)
       */
      const allowedContentTypes = [
        'image/gif',
        'image/jpeg',
        'image/png',
        'image/webp',
      ];

      // Assign any image attachments to the backing variable
      this._attachedImages = this.message.attachments

        // Filter for allowed content types
        .filter(attachment =>
          attachment.contentType && allowedContentTypes.includes(attachment.contentType),
        )

        // Map matches to backing variable
        .map(attachment => ({
          contentType: attachment.contentType as string,
          height: attachment.height as number,
          imageUrl: attachment.url,
          width: attachment.width as number,
        }));
    }

    return this._attachedImages;
  }

  /**
   * Message author ID
   * @returns {string} Author ID
   */
  public get authorId(): string {
    return this.message.author.id;
  }

  /**
   * Message channel ID
   * @returns {string} Channel ID
   */
  public get channelId(): string {
    return this.message.channel.id;
  }

  /**
   * Message content
   * @returns {string} string
   */
  public get content(): string {
    return this.message.content;
  }

  /**
   * Message created timestamp
   * @returns {number} number
   */
  public get createdTimestamp(): number {
    return this.message.createdTimestamp;
  }

  /**
   * Message author display name. Falls back to username if no display name is available.
   * @returns {string} Display name or username
   */
  public get displayName(): string {
    return this.message.member?.displayName || this.username;
  }

  /**
   * Message guild ID
   * @returns {string | undefined} Guild ID
   */
  public get guildId(): string | undefined {
    return this.message.guild?.id;
  }

  /**
   * Returns true if the message has any attachments
   * @returns {boolean} boolean
   */
  public get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0;
  }

  /**
   * Returns true if the message has any audio attachments
   * @returns {boolean} boolean
   */
  public get hasVoiceMessage(): boolean {
    return this.message.attachments.some(attachment =>
      attachment.contentType?.startsWith('audio/ogg')
      && attachment.waveform !== null,
    );
  }

  /**
   * Descriptions of images attached to the message
   * @returns {string[]} Image descriptions
   */
  public get imageDescriptions(): string[] {
    return this._imageDescriptions;
  }

  /**
   * Message has a mention of the bot
   * @returns {boolean} boolean
   */
  public get isAtMention(): boolean {
    return this.message.mentions.has(this.botUserId);
  }

  /**
   * Message author is a bot
   * @returns {boolean} boolean
   */
  public get isBotMessage(): boolean {
    return this.message.author.bot;
  }

  /**
   * Message is a channel message
   * @returns {boolean} boolean
   */
  public get isChannelMessage(): boolean {
    return (this.message.channel.type === ChannelType.GuildText);
  }

  /**
   * Message is a direct message
   * @returns {boolean} boolean
   */
  public get isDirectMessage(): boolean {
    return (this.message.channel.type === ChannelType.DM);
  }

  /**
   * Message is from this bot
   * @returns {boolean} boolean
   */
  public get isOwnMessage(): boolean {
    return (this.message.author.id === this.botUserId);
  }

  /**
   * Returns true if the message is a reply to another message
   * @returns {boolean} boolean
   */
  public get isReply(): boolean {
    return this.message.reference !== null;
  }

  /**
   * Message is a voice message
   * @returns {boolean} boolean
   */
  public get isVoiceMessage(): boolean {
    return this.hasVoiceMessage;
  }

  /**
   * Message content used by the OpenAI prompt content field.
   * @returns {string} Prompt content
   */
  public get promptContent(): string {
    return this.getPromptContent();
  }

  /**
   * Message role used by the OpenAI prompt role field.
   * @returns {string} Prompt role
   */
  public get promptRole(): string {
    return (this.isOwnMessage)
      ? 'assistant'
      : 'user';
  }

  /**
   * Message author username (sanitized) used by the OpenAI prompt username field.
   * @returns {string} Prompt username
   */
  public get promptUsername(): string {
    if (!this._nameSanitized) {
      this._nameSanitized = this.message.author.username.replace(/[^a-zA-Z0-9_-]/g, '-');
    }
    return this._nameSanitized;
  }

  /**
   * Context of the message that was replied to for the OpenAI prompt
   * @returns {string | undefined} Prompt context
   */
  public get replyContext(): string | undefined {
    return this._replyContext;
  }

  /**
   * Message author username
   * @returns {string} Username (not displayname)
   */
  public get username(): string {
    return this.message.author.username;
  }

  /**
   * Voice message attachment
   * @returns {any | undefined} Voice message attachment
   */
  public get voiceMessage(): Attachment | undefined {
    return this.message.attachments.find(attachment =>
      attachment.contentType?.startsWith('audio/ogg'),
    );
  }

  /**
   * Voice message transcription
   * @returns {string | undefined} Transcription
   */
  public get voiceMessageTranscription(): string | undefined {
    return this._voiceMessageTranscription;
  }

  /**
   * Voice message transcription
   * @param {string} transcription Transcription
   */
  public set voiceMessageTranscription(transcription: string) {
    this._voiceMessageTranscription = transcription;
  }
}
