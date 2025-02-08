import { BotcMessage, BotcMessageImageAttachment } from '../../Botc/index.js';
import { CreatePromptPayloadConfig, ReplyDecisionResponse } from './index.js';
import { EventBus, EventMap } from '../../Botc/EventBus/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { ObjectCache } from './ObjectCache/index.js';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';
import { Resizer } from './Resizer/index.js';

/**
 * OpenAI client wrapper
 * @todo Enhance API error handling. Returning '' will break Discord message sending.
 */
export class OpenAIClient {
  private client: OpenAI;
  private globalEvents = EventBus.attach();
  private imageDescriptionCache: ObjectCache;
  private personaCache: ObjectCache;
  private transcriptionCache: ObjectCache;
  private readonly model: string;

  /**
   * New OpenAIClient
   * @param {OpenAISettings} config OpenAI client configuration
   */
  constructor(private config: OpenAISettings) {
    this.registerHandlers();

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: config.apikey.value as string,
      maxRetries: config.maxRetries.value as number,
      timeout: config.timeout.value as number,
    });

    // Set model from configuration
    this.model = config.model.value as string;

    // Initialize image description cache
    this.imageDescriptionCache = new ObjectCache(
      this.config.caching.describeImageCacheTtlHours,
      this.config.caching.logging,
    );

    // Initialize persona cache
    this.personaCache = new ObjectCache(
      this.config.caching.personaCacheTtlHours,
      this.config.caching.logging,
    );

    // Initialize transcription cache
    this.transcriptionCache = new ObjectCache(
      this.config.caching.voiceTranscriptCacheTtlHours,
      this.config.caching.logging,
    );

    // Emit ready event
    this.globalEvents.emit('OpenAIClient:Ready', {
      message: 'OpenAI client is ready.',
    });
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('DiscordClient:PrefetchImageDescriptions', async (data) => {
      await this.describeImages(data.messageHistory);
    });

    this.globalEvents.on('MessagePipeline:IncomingMessage',
      this.handleIncomingMessage.bind(this),
    );
  }

  /**
   * Handle incoming message
   * @param {EventMap['MessagePipeline:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: EventMap['MessagePipeline:IncomingMessage']): Promise<void> {
    const messageChannelId = data.message.originalMessage.channelId;
    const channelHistory = await data.discordClient.getChannelHistory(messageChannelId);
    const lastMessage = channelHistory.at(-1);

    if (!lastMessage) {
      return;
    }

    // If the last message is a reply, set the reply context
    if (lastMessage.isReply) {
      lastMessage.setReplyContext();
    }

    const willRespond = await this.willReplyToMessage(channelHistory);

    if (!willRespond) {
      return;
    }

    // Prepare response
    const responseMessage = await this.prepareResponse(data, channelHistory);

    const responseEvent = (!lastMessage.hasVoiceMessage)
      ? 'OpenAIClient:ResponseComplete'
      : 'OpenAIClient:VoiceResponseComplete';

    // Emit the response event
    this.globalEvents.emit(responseEvent, {
      channelId: channelHistory[0].channelId,
      response: responseMessage,
    });
  }

  /**
   * Create completion
   * @param {ChatCompletionMessageParam[]} payload Chat completion message
   * @returns {Promise<string>} string
   */
  public async createCompletion(payload: ChatCompletionMessageParam[]): Promise<string> {
    try {
      // Create chat completion
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: payload,
      });

      // Return completion message content
      return completion.choices[0].message.content as string;
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        // Log OpenAI API error
        console.error(`OpenAIClient.createCompletion: OpenAI API error.`);
        console.error(`OpenAIClient.createCompletion: error: ${error.message}`);
      }
      else {
        // Log generic error
        console.error(`OpenAIClient.createCompletion: ${error}`);
        console.debug(`OpenAIClient.createCompletion: payload: ${JSON.stringify(payload)}`);
      }

      // Return empty string on error
      return '';
    }
  }

  /**
   * Create prompt payload
   * @param {CreatePromptPayloadConfig} config Create prompt payload configuration
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private async createPromptPayload(config: CreatePromptPayloadConfig): Promise<ChatCompletionMessageParam[]> {
    // Map BotcMessage[] to ChatCompletionMessageParam[]
    const payload = config.messageHistory.map(message => ({
      content: message.promptContent,
      name: message.promptUsername,
      role: message.promptRole,
    } as ChatCompletionMessageParam));

    // Construct system prompt
    const systemPrompt = (config.customSystemPrompt?.append)
      ? [this.config.systemPrompt.value as string, config.customSystemPrompt.value].join('\n')
      : config.customSystemPrompt?.value || this.config.systemPrompt.value as string;

    // Prepend system prompt
    payload.unshift({
      content: systemPrompt,
      role: 'system',
    });

    return payload;
  }

  /**
   * Describe an image
   * @param {BotcMessageImageAttachment} image Image attachment
   * @returns {Promise<string>} Image description
   */
  private async describeImage(image: BotcMessageImageAttachment): Promise<string> {
    // Check cache for image description and return if found
    if (this.imageDescriptionCache.isCached(image.imageUrl)) {
      return this.imageDescriptionCache.getValue(image.imageUrl) as string;
    }

    // Resize image if oversized
    const resize = new Resizer();
    const promptUrl = await resize.getUrl(image.imageUrl);

    // Create completion for image description
    const describeImagePrompt = this.config.describeImagePrompt.value as string;
    const payload = [{
      role: 'user',
      content: [
        { type: 'text', text: describeImagePrompt },
        { type: 'image_url', image_url: { url: promptUrl } },
      ],
    }] satisfies ChatCompletionMessageParam[];
    const description = await this.createCompletion(payload);

    // Cache image description
    this.imageDescriptionCache.cache({
      key: image.imageUrl,
      value: description,
    });

    return description;
  }

  /**
   * Describe images in message history
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async describeImages(messageHistory: BotcMessage[]): Promise<void> {
    // Process entire message history
    const images = messageHistory
      .filter(message => message.hasAttachedImages)
      .flatMap(message => message.attachedImages
        .map(image => ({ message, image })),
      );

    // Describe all images in parallel
    await Promise.all(images.map(async ({ message, image }) => {
      const description = await this.describeImage(image);
      message.addImageDescription(description);
    }));
  }

  /**
   * Generate response message
   * @param {BotcMessage[]} messageHistory Channel message history
   * @param {string} persona Summarized user persona
   * @returns {Promise<string>} Response message
   */
  private async generatePersonalizedResponse(messageHistory: BotcMessage[], persona: string): Promise<string> {
    const payload = await this.createPromptPayload({
      messageHistory: messageHistory,
      customSystemPrompt: {
        value: [
          `<Sender Persona>`,
          persona,
          `</Sender Persona>`,
        ].join('\n'),
        append: true,
      },
    });

    return await this.createCompletion(payload);
  }

  /**
   * Generate a persona for a user based on server history
   * @param {BotcMessage[]} serverHistory Server message history
   * @returns {Promise<string>} Persona
   */
  private async generateUserPersona(serverHistory: BotcMessage[]): Promise<string> {
    const nameSanitized = serverHistory[0].promptUsername;

    // Check cache for persona and return if found
    if (this.personaCache.isCached(nameSanitized)) {
      return this.personaCache.getValue(nameSanitized) as string;
    }

    // Create persona for user
    const payload = await this.createPromptPayload({
      messageHistory: serverHistory,
      customSystemPrompt: {
        value: `Summarize the following messages to build a persona for the user ${nameSanitized}.`,
        append: false,
      },
    });
    const persona = await this.createCompletion(payload);

    // Cache persona
    this.personaCache.cache({
      key: nameSanitized,
      value: persona,
    });

    return persona;
  }

  /**
   * Prepare response
   * @param {EventMap['MessagePipeline:IncomingMessage']} data Incoming message
   * @param {BotcMessage[]} channelHistory Channel message history
   * @returns {Promise<string>} Response message
   */
  private async prepareResponse(
    data: EventMap['MessagePipeline:IncomingMessage'],
    channelHistory: BotcMessage[],
  ): Promise<string> {
    const authorId = data.message.originalMessage.author.id;
    const guild = data.message.originalMessage.guild;
    const isDirectMessage = channelHistory.at(-1)?.type === 'DirectMessage';

    this.startTyping(channelHistory[0].channelId);
    await this.describeImages(channelHistory);

    this.startTyping(channelHistory[0].channelId);
    await this.transcribeVoiceMessages(channelHistory);

    // Guild is not populated for direct messages
    if (guild) {
      // Respond with personalized message from guild persona
      this.startTyping(channelHistory[0].channelId);
      const serverHistory = await data.discordClient.getServerHistoryForUser(guild, authorId);

      this.startTyping(channelHistory[0].channelId);
      await this.describeImages(serverHistory);

      this.startTyping(channelHistory[0].channelId);
      const persona = await this.generateUserPersona(serverHistory);

      this.startTyping(channelHistory[0].channelId);
      return await this.generatePersonalizedResponse(channelHistory, persona);
    }
    else if (isDirectMessage) {
      // Respond directly to direct messages
      this.startTyping(channelHistory[0].channelId);
      return await this.generatePersonalizedResponse(channelHistory, '');
    }
    else {
      // This should never happen
      throw new Error('OpenAIClient.prepareResponse: Guild not found');
    }
  }

  /**
   * Send typing indicator to channel
   * @param {string} channelId Channel ID
   */
  private startTyping(channelId: string): void {
    this.globalEvents.emit('OpenAIClient:StartTyping', {
      channelId: channelId,
    });
  }

  /**
   * Transcribe a voice message
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async transcribeVoiceMessages(messageHistory: BotcMessage[]): Promise<void> {
    console.debug('OpenAIClient.transcribeVoiceMessages: Transcribing voice messages');

    await Promise.all(messageHistory
      .filter(message => message.hasVoiceMessage)
      .map(async (message) => {
        const voiceMessageUrl = message.voiceMessage?.url;

        console.debug(`OpenAIClient.transcribeVoiceMessage: Transcribing voice message: ${voiceMessageUrl}`);

        if (!voiceMessageUrl) {
          return;
        }

        if (this.transcriptionCache.isCached(voiceMessageUrl)) {
          message.voiceMessageTranscription = this.transcriptionCache.getValue(voiceMessageUrl) as string;
          return;
        }

        const fetchedAudio = await fetch(voiceMessageUrl);
        const audioBuffer = await fetchedAudio.arrayBuffer();
        const audioFile = new File([audioBuffer], 'audio.ogg', {
          type: 'audio/ogg',
        });

        const transcription = await this.client.audio.transcriptions.create({
          file: audioFile,
          model: 'whisper-1',
          response_format: 'text',
        });

        this.transcriptionCache.cache({
          key: voiceMessageUrl,
          value: transcription,
        });

        message.voiceMessageTranscription = transcription;
      }),
    );
  }

  /**
   * Decides whether to reply based on conversation history
   * @param {BotcMessage[]} messageHistory Message history
   * @returns {Promise<boolean>} boolean
   */
  private async willReplyToMessage(messageHistory: BotcMessage[]): Promise<boolean> {
    // Screen based upon message type
    const lastMessageType = messageHistory.at(-1)?.type;
    const isAtMentionOrReply = lastMessageType === 'AtMention';
    const isDirectMessage = lastMessageType === 'DirectMessage';
    const isOwnMessage = lastMessageType === 'OwnMessage';
    const IsVoiceMessage = lastMessageType === 'VoiceMessage';

    // Automatic true or false based on message type
    if (isOwnMessage) {
      return false;
    }
    else if (isAtMentionOrReply || isDirectMessage || IsVoiceMessage) {
      return true;
    }

    // Otherwise, use decision prompt to determine response
    const payload = await this.createPromptPayload({
      messageHistory: messageHistory,
      customSystemPrompt: {
        value: this.config.replyDecisionPrompt.value as string,
        append: false,
      },
    });
    const responseMessage = await this.createCompletion(payload);

    try {
      // Parse JSON response for decision to respond
      const responseJson: ReplyDecisionResponse = JSON.parse(responseMessage);
      return responseJson.respondToUser.toLowerCase() === 'yes';
    }
    catch (error) {
      // Log error parsing JSON response - sometimes the API returns malformed JSON
      console.error(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`);

      // Fail-safe: check for "yes" in malformed JSON response
      return responseMessage.toLowerCase().includes('"yes"');
    }
  }
}
