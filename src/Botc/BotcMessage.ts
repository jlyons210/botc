import {
  Attachment,
  ChannelType,
  Message,
} from 'discord.js';

import {
  BotcMessageConfig,
  BotcMessageImageAttachment,
  BotcMessageType,
} from '../Botc/index.js';

import { EventBus } from './EventBus/index.js';

/**
 * A wrapper for Discord.js Message objects that provides additional properties and methods for
 * interacting with the message.
 */
export class BotcMessage {
  private globalEvents = EventBus.attach();
  private readonly botUserId: string;
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
    if (this.isReply && this.originalMessage.reference?.messageId) {
      const replyMessageId = this.originalMessage.reference.messageId;
      const replyMessage = await this.originalMessage.channel.messages.fetch(replyMessageId);
      const replyContent = replyMessage.content;
      const replyAuthor = replyMessage.author.displayName || replyMessage.author.username;
      const replyTimestampLocal = new Date(replyMessage.createdTimestamp).toLocaleString('en-US', {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      this._replyContext = [
        `---`,
        `Focus your response on this message that was replied to:`,
        `- Message author: ${replyAuthor}`,
        `- Message timestamp: ${replyTimestampLocal}`,
        `- Message content: ${replyContent}`,
        `---`,
      ].join('\n');
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

    const createTimestampLocal = new Date(this.createdTimestamp).toLocaleString('en-US', {
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    const promptContent = [
      resolvedContent,
      `<Message Metadata>`,
      `Preferred name: ${this.displayName}`,
      `Message timestamp: ${createTimestampLocal}`,
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
    const resolvedContent = this.content.replace(/<@!?(?<userId>\d+)>/g, (match, userId) => {
      const displayName = this.message.guild?.members.cache.get(userId)?.displayName;
      const username = this.message.client.users.cache.get(userId)?.username;
      return displayName || username || match;
    });

    return resolvedContent;
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
   * Returns true if the message has any attachments
   * @returns {boolean} boolean
   */
  public get hasAttachedImages(): boolean {
    return this.attachedImages.length > 0;
  }

  /**
   * Descriptions of images attached to the message
   * @returns {string[]} Image descriptions
   */
  public get imageDescriptions(): string[] {
    return this._imageDescriptions;
  }

  /**
   * Returns true if the message is a reply to another message
   * @returns {boolean} boolean
   */
  public get isReply(): boolean {
    return this.message.reference !== null;
  }

  /**
   * Original Discord message
   * @returns {Message} Original Discord.js Message object
   */
  public get originalMessage(): Message {
    return this.message;
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
    return (this.botUserId === this.message.author.id)
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

  private _typeAttributes: BotcMessageType[] = [];

  /**
   * Message type attributes
   * @returns {BotcMessageType[]} Type attributes
   */
  public get typeAttributes(): BotcMessageType[] {
    if (this._typeAttributes.length === 0) {
      if (this.message.author.id === this.botUserId) {
        this._typeAttributes.push('OwnMessage');
      }
      if (this.hasVoiceMessage) {
        this._typeAttributes.push('VoiceMessage');
      }
      if (this.message.channel.type === ChannelType.DM) {
        this._typeAttributes.push('DirectMessage');
      }
      if (this.message.author.bot) {
        this._typeAttributes.push('BotMessage');
      }
      if (this.message.mentions.has(this.botUserId)) {
        this._typeAttributes.push('AtMention');
      }
      if (this._typeAttributes.length === 0) {
        this._typeAttributes.push('ChannelMessage');
      }
    }

    return this._typeAttributes;
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
