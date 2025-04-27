import {
  BotcMessage,
  BotcModules,
  CustomSystemPrompt,
  ReplyDecisionResponse,
} from './index.js';

import { EventBus, EventMap } from './EventBus/index.js';
import { AttachmentBuilder } from 'discord.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Configuration } from './Configuration/index.js';
import { DiscordClient } from '../Clients/Discord/index.js';
import { ElevenLabs } from '../Clients/ElevenLabs/index.js';
import { Logger } from './Logger/index.js';
import { ObjectCache } from './ObjectCache/index.js';
import { OpenAIClient } from '../Clients/OpenAI/index.js';
import { Resizer } from './Resizer/index.js';

/**
 * Botc core class
 */
export class Botc {
  private readonly config = new Configuration();
  private readonly globalEvents = EventBus.attach();
  private readonly logger: Logger;
  private readonly modules: BotcModules;

  /**
   * New Botc
   */
  constructor() {
    this.logger = new Logger(this.config.options.debugLoggingEnabled.value as boolean);
    this.registerHandlers();

    this.modules = {
      caches: {
        imageDescriptions: new ObjectCache(
          this.config.options.llms.openai.caching.describeImageCacheTtlHours,
          this.config.options.llms.openai.caching.logging,
        ),
        personas: new ObjectCache(
          this.config.options.llms.openai.caching.personaCacheTtlHours,
          this.config.options.llms.openai.caching.logging,
        ),
        transcriptions: new ObjectCache(
          this.config.options.llms.openai.caching.voiceTranscriptCacheTtlHours,
          this.config.options.llms.openai.caching.logging,
        ),
      },
      clients: {
        discord: new DiscordClient(this.config.options),
        elevenlabs: new ElevenLabs(this.config.options),
        openai: new OpenAIClient(this.config.options),
      },
    };
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.once('DiscordClient:Ready',
      this.handleDiscordClientReady.bind(this),
    );

    this.globalEvents.on('DiscordClient:IncomingMessage',
      this.handleIncomingDiscordMessage.bind(this),
    );

    this.globalEvents.once('ElevenLabsClient:Ready',
      this.handleElevenLabsClientReady.bind(this),
    );

    this.globalEvents.once('OpenAIClient:Ready',
      this.handleOpenAIClientReady.bind(this),
    );
  }

  /**
   * Handle Discord client ready event
   * @param {EventMap['DiscordClient:Ready']} data Discord client ready event data
   */
  private async handleDiscordClientReady(data: EventMap['DiscordClient:Ready']): Promise<void> {
    this.logger.log(data.message, 'INFO');
    this.preprocessMultimedia();
  }

  /**
   * Handle ElevenLabs client ready event
   * @param {EventMap['ElevenLabsClient:Ready']} data ElevenLabs client ready event data
   */
  private async handleElevenLabsClientReady(data: EventMap['ElevenLabsClient:Ready']): Promise<void> {
    this.logger.log(data.message, 'INFO');
  }

  /**
   * Handle incoming Discord message
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming Discord message data
   */
  private async handleIncomingDiscordMessage(data: EventMap['DiscordClient:IncomingMessage']): Promise<void> {
    const discord = this.modules.clients.discord;
    const lastMessage = data.message;
    const channelId = lastMessage.channelId;

    if (lastMessage) {
      const channelHistory = await discord.getChannelHistory(channelId);
      await this.describeImages(channelHistory);
      await this.transcribeVoiceMessages(channelHistory);

      if (await this.willReplyToMessage(channelHistory)) {
        // Start typing indicator
        this.startTyping(channelId);
        // ...and keep it going until the response is ready - it times out after 10 seconds
        const typingInterval = setInterval(() => {
          this.startTyping(channelId);
        }, 9000);

        const payload: EventMap['Botc:ResponseComplete'] = {
          channelId: channelId,
          content: '',
          attachments: [],
        };

        try {
          const isImageGenerationPrompt = await this.isImageGenerationPrompt(lastMessage);

          if (lastMessage.isVoiceMessage) {
            const textResponse = await this.prepareTextResponse(channelHistory);
            payload.attachments.push(await this.prepareVoiceResponse(textResponse));
          }
          else if (isImageGenerationPrompt) {
            payload.attachments.push(await this.prepareImageResponse(lastMessage));
          }
          else {
            payload.content = await this.prepareTextResponse(channelHistory);
          }
        }
        catch (error) {
          this.logger.log(`Error preparing response: ${error}`, 'ERROR');
          payload.content = 'There was an error preparing the response.';
        }

        // Stop triggering typing indicator
        clearInterval(typingInterval);

        this.globalEvents.emit('Botc:ResponseComplete', payload);
      }
    }
  }

  /**
   * Handle OpenAI client ready event
   * @param {EventMap['OpenAIClient:Ready']} data OpenAI client ready event data
   */
  private async handleOpenAIClientReady(data: EventMap['OpenAIClient:Ready']): Promise<void> {
    this.logger.log(data.message, 'INFO');
  }

  /**
   * Create prompt payload
   * @param {BotcMessage[]} messageHistory Channel message history
   * @param {CustomSystemPrompt} customSystemPrompt Custom system prompt
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private async createPromptPayload(messageHistory: BotcMessage[], customSystemPrompt?: CustomSystemPrompt): Promise<ChatCompletionMessageParam[]> {
    const config = this.config.options.llms.openai;
    const configSystemPrompt = config.systemPrompt;

    const payload = messageHistory.map(message => ({
      content: message.promptContent,
      name: message.promptUsername,
      role: message.promptRole,
    } as ChatCompletionMessageParam));

    const systemPrompt = (customSystemPrompt?.append)
      ? [configSystemPrompt.value, customSystemPrompt.value].join('\n')
      : customSystemPrompt?.value || configSystemPrompt.value;

    payload.unshift({
      content: systemPrompt,
      role: 'system',
    } as ChatCompletionMessageParam);

    return payload;
  }

  /**
   * Describe images in message history
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async describeImages(messageHistory: BotcMessage[]): Promise<void> {
    const cache = this.modules.caches.imageDescriptions;
    const openai = this.modules.clients.openai;

    const images = messageHistory
      .filter(message => message.hasAttachedImages)
      .flatMap(message => message.attachedImages
        .map(image => ({ message, image })),
      );

    await Promise.all(images.map(async ({ message, image }) => {
      if (!cache.isCached(image.imageUrl)) {
        const resize = new Resizer();
        const imageUrl = await resize.getUrl(image.imageUrl);
        const description = await openai.generateImageDescription(imageUrl);

        cache.cache({
          key: image.imageUrl,
          value: description,
        });
      }

      message.addImageDescription(cache.getValue(image.imageUrl) as string);
    }));
  }

  /**
   * Generate response message
   * @param {BotcMessage[]} messageHistory Channel message history
   * @param {string} persona Summarized user persona
   * @returns {Promise<string>} Response message
   */
  private async generatePersonalizedResponse(messageHistory: BotcMessage[], persona: string): Promise<string> {
    const openai = this.modules.clients.openai;
    const payload = await this.createPromptPayload(messageHistory, {
      value: [`<Sender Persona>`, persona, `</Sender Persona>`].join('\n'),
      append: true,
    });

    return await openai.createCompletion(payload);
  }

  /**
   * Generate a persona for a user based on guild history
   * @param {string} guildId Discord guild ID
   * @param {string} authorId Discord author ID
   * @returns {Promise<string>} Persona
   */
  private async generateUserPersona(guildId: string, authorId: string): Promise<string> {
    const cache = this.modules.caches.personas;
    const cacheKey = `${guildId}:${authorId}`;
    const discord = this.modules.clients.discord;
    const openai = this.modules.clients.openai;

    if (!cache.isCached(cacheKey)) {
      const guildHistory = await discord.getGuildHistory(guildId, authorId);
      await this.describeImages(guildHistory);
      await this.transcribeVoiceMessages(guildHistory);

      const nameSanitized = guildHistory[0].promptUsername;
      const payload = await this.createPromptPayload(guildHistory, {
        value: `Summarize the following messages to build a persona for the user ${nameSanitized}.`,
        append: false,
      });

      const persona = await openai.createCompletion(payload);

      cache.cache({
        key: cacheKey,
        value: persona,
      });
    }

    return cache.getValue(cacheKey) as string;
  }

  /**
   * Check if the message is an image generation prompt
   * @param {BotcMessage} message Message to check
   * @returns {Promise<boolean>} true if the message is an image generation prompt
   */
  private async isImageGenerationPrompt(message: BotcMessage): Promise<boolean> {
    const openai = this.modules.clients.openai;
    const payload = await this.createPromptPayload([message], {
      value: 'Is this message an image generation or image edit prompt? Respond with "yes" or "no".',
      append: false,
    });
    const response = await openai.createCompletion(payload);

    return (response.toLowerCase() === 'yes');
  }

  /**
   * Prefetch image descriptions for all guilds
   * @param {BotcMessage[]} allGuildsHistory Message history
   */
  private async prefetchImageDescriptions(allGuildsHistory: BotcMessage[]): Promise<void> {
    this.logger.log(`Prefetching image descriptions for all guilds...`, 'INFO');
    await this.describeImages(allGuildsHistory);
    this.logger.log(`Image description prefetching complete.`, 'INFO');
  }

  /**
   * Prefetch voice transcriptions for all guilds
   * @param {BotcMessage[]} allGuildsHistory Message history
   */
  private async prefetchVoiceTranscriptions(allGuildsHistory: BotcMessage[]): Promise<void> {
    this.logger.log(`Prefetching voice transcriptions for all guilds...`, 'INFO');
    await this.transcribeVoiceMessages(allGuildsHistory);
    this.logger.log(`Voice transcription prefetching complete.`, 'INFO');
  }

  /**
   * Prepare image response
   * @param {BotcMessage} message Message to prepare
   * @returns {Promise<AttachmentBuilder>} Prepared image attachment
   */
  private async prepareImageResponse(message: BotcMessage): Promise<AttachmentBuilder> {
    const openai = this.modules.clients.openai;
    const imageUrls = [
      ...(message.attachedImages.map(image => image.imageUrl)),
      ...(message.replyToMessage?.attachedImages.map(image => image.imageUrl) || []),
    ];

    const responseImage = await openai.createImage(message.promptContent, imageUrls);
    const imageBuffer = Buffer.from(responseImage, 'base64');

    return new AttachmentBuilder(imageBuffer, {
      name: `openai-image-${Date.now()}.png`,
    });
  }

  /**
   * Prepare Discord message response
   * @param {BotcMessage[]} channelHistory Channel message history
   * @returns {Promise<string>} Response message
   */
  private async prepareTextResponse(channelHistory: BotcMessage[]): Promise<string> {
    const lastMessage = channelHistory.at(-1) as BotcMessage;

    if (lastMessage.guildId) {
      // Respond to channel messages
      const persona = await this.generateUserPersona(lastMessage.guildId, lastMessage.authorId);
      return await this.generatePersonalizedResponse(channelHistory, persona);
    }
    else if (lastMessage.isDirectMessage || lastMessage.isVoiceMessage) {
      // Respond directly to direct messages
      return await this.generatePersonalizedResponse(channelHistory, '');
    }
    else {
      // This should never happen
      throw new Error('OpenAIClient.prepareResponse: Guild not found');
    }
  }

  /**
   * Prepare voice response
   * @param {string} responseText Response text
   * @returns {Promise<AttachmentBuilder>} Prepared voice attachment
   */
  private async prepareVoiceResponse(responseText: string): Promise<AttachmentBuilder> {
    const elevenlabs = this.modules.clients.elevenlabs;
    const voiceMessage = await elevenlabs.generateVoiceFile(responseText);
    return new AttachmentBuilder(voiceMessage);
  }

  /**
   * Send typing indicator to channel
   * @param {string} channelId Channel ID
   */
  private startTyping(channelId: string): void {
    this.globalEvents.emit('DiscordClient:StartTyping', {
      channelId: channelId,
    });
  }

  /**
   * Preprocess multimedia content types concurrently
   */
  private async preprocessMultimedia(): Promise<void> {
    const discord = this.modules.clients.discord;
    const allGuildsHistory = await discord.getAllGuildsHistory();
    await Promise.all([
      this.prefetchImageDescriptions(allGuildsHistory),
      this.prefetchVoiceTranscriptions(allGuildsHistory),
    ]);
  }

  /**
   * Transcribe a voice message
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async transcribeVoiceMessages(messageHistory: BotcMessage[]): Promise<void> {
    const cache = this.modules.caches.transcriptions;
    const openai = this.modules.clients.openai;

    await Promise.all(messageHistory
      .filter(message => message.hasVoiceMessage)
      .map(async (message) => {
        const voiceMessageUrl = message.voiceMessage?.url;

        if (voiceMessageUrl) {
          if (!cache.isCached(voiceMessageUrl)) {
            const fetchedAudio = await fetch(voiceMessageUrl);
            const audioBuffer = await fetchedAudio.arrayBuffer();
            const audioFile = new File([audioBuffer], 'audio.ogg', {
              type: 'audio/ogg',
            });

            const transcription = await openai.generateAudioTranscription(audioFile);

            cache.cache({
              key: voiceMessageUrl,
              value: transcription,
            });
          }

          message.voiceMessageTranscription = cache.getValue(voiceMessageUrl) as string;
        }
      }),
    );
  }

  /**
   * Decides whether to reply based on conversation history
   * @param {BotcMessage[]} channelHistory Channel message history
   * @returns {Promise<boolean>} boolean
   */
  private async willReplyToMessage(channelHistory: BotcMessage[]): Promise<boolean> {
    const lastMessage = channelHistory.at(-1) as BotcMessage;
    const automaticYes = (
      lastMessage.isAtMention
      || lastMessage.isDirectMessage
      || lastMessage.isVoiceMessage
    );

    // Don't reply to own messages
    if (lastMessage.isOwnMessage) {
      return false;
    }
    // Do reply for automaticYes types
    else if (automaticYes) {
      return true;
    }
    // Otherwise, use decision prompt to determine response
    else {
      const openai = this.modules.clients.openai;
      const config = this.config.options.llms.openai;
      const replyDecisionPrompt = config.replyDecisionPrompt.value as string;

      const payload = await this.createPromptPayload(channelHistory, {
        value: replyDecisionPrompt,
        append: false,
      });

      const responseMessage = await openai.createCompletion(payload);

      try {
        // Parse JSON response for decision to respond
        const responseJson: ReplyDecisionResponse = JSON.parse(responseMessage);
        return responseJson.respondToUser.toLowerCase() === 'yes';
      }
      catch (error) {
        // Log error parsing JSON response - sometimes the API returns malformed JSON
        this.logger.log(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`, 'ERROR');

        // Fail-safe: check for "yes" in malformed JSON response
        return responseMessage.toLowerCase().includes('"yes"');
      }
    }
  }
}
