import { BotcMessage, BotcMessageImageAttachment } from '../../Botc/index.js';
import { CreatePromptPayloadConfig, ReplyDecisionResponse } from './index.js';
import { EventBus, EventMap } from '../../Botc/EventBus/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { ObjectCache } from './ObjectCache/ObjectCache.js';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';

/**
 * OpenAI client wrapper
 * @todo Enhance API error handling. Returning '' will break Discord message sending.
 */
export class OpenAIClient {
  private client: OpenAI;
  private globalEvents = EventBus.attach();
  private imageDescriptionCache!: ObjectCache;
  private personaCache!: ObjectCache;
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
    this.imageDescriptionCache = new ObjectCache({
      ttlHours: config.caching.describeImageCacheTtlHours.value as number,
      logging: {
        logCacheEntries: config.caching.logCacheEntries.value as boolean,
        logCacheHits: config.caching.logCacheHits.value as boolean,
        logCacheMisses: config.caching.logCacheMisses.value as boolean,
        logCachePurges: config.caching.logCachePurges.value as boolean,
      },
    });

    // Initialize persona cache
    this.personaCache = new ObjectCache({
      ttlHours: config.caching.personaCacheTtlHours.value as number,
      logging: {
        logCacheEntries: config.caching.logCacheEntries.value as boolean,
        logCacheHits: config.caching.logCacheHits.value as boolean,
        logCacheMisses: config.caching.logCacheMisses.value as boolean,
        logCachePurges: config.caching.logCachePurges.value as boolean,
      },
    });

    // Emit ready event
    this.globalEvents.emit('OpenAIClient:Ready', {
      message: 'OpenAI client is ready.',
    });
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('MessagePipeline:IncomingMessage',
      this.handleIncomingMessage.bind(this),
    );
  }

  /**
   * Handle incoming message
   * @param {EventMap['MessagePipeline:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: EventMap['MessagePipeline:IncomingMessage']): Promise<void> {
    // Bypass reply decision prompt for DMs, evaluate otherwise
    const messageIsDM = data.messageHistory[0].type === 'DirectMessage';
    if (!messageIsDM && !await this.willReplyToMessage(data.messageHistory)) {
      return;
    }

    // Start typing indicator
    this.startTyping(data.messageHistory[0].channelId);

    // Describe images in server and channel message history
    await this.describeImages(data.serverHistory);
    await this.describeImages(data.messageHistory);

    // Generate a summary of the user's server-wide behavior
    const persona = await this.generatePersonaSummary(data.serverHistory);

    // Generate a response, factoring in the user's persona
    const responseMessage = await this.generateResponseMessage(data.messageHistory, persona);

    // Emit the response
    this.globalEvents.emit('OpenAIClient:ResponseComplete', {
      channelId: data.messageHistory[0].channelId,
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

    // Create completion for image description
    const describeImagePrompt = this.config.describeImagePrompt.value as string;
    const payload = [{
      role: 'user',
      content: [
        { type: 'text', text: describeImagePrompt },
        { type: 'image_url', image_url: { url: image.imageUrl } },
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
    await Promise.all(messageHistory

      // Filter messages with attached images
      .filter(message => message.hasAttachedImages)

      // Describe attached images
      .map(async (message) => {
        await Promise.all(
          message.attachedImages.map(async (image) => {
            const description = await this.describeImage(image);
            message.addImageDescription(description);
          }),
        );
      }),
    );
  }

  /**
   * Generate a persona for a user based on server history
   * @param {BotcMessage[]} serverHistory Server message history
   * @returns {Promise<string>} Persona
   */
  private async generatePersonaSummary(serverHistory: BotcMessage[]): Promise<string> {
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
   * Generate response message
   * @param {BotcMessage[]} messageHistory Channel message history
   * @param {string} persona Summarized user persona
   * @returns {Promise<string>} Response message
   */
  private async generateResponseMessage(messageHistory: BotcMessage[], persona: string): Promise<string> {
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
   * Send typing indicator to channel
   * @param {string} channelId Channel ID
   */
  private startTyping(channelId: string): void {
    this.globalEvents.emit('OpenAIClient:StartTyping', {
      channelId: channelId,
    });
  }

  /**
   * Decides whether to reply based on conversation history
   * @param {BotcMessage[]} messageHistory Message history
   * @returns {Promise<boolean>} boolean
   */
  private async willReplyToMessage(messageHistory: BotcMessage[]): Promise<boolean> {
    // Create completion for reply decision
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
