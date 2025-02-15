import {
  BotcMessage,
  BotcModules,
  CustomSystemPrompt,
  ReplyDecisionResponse,
} from './index.js';

import { EventBus, EventMap } from './EventBus/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { Configuration } from './Configuration/index.js';
import { DiscordClient } from '../Clients/Discord/index.js';
import { ElevenLabs } from '../Clients/ElevenLabs/index.js';
import { ObjectCache } from '../Clients/OpenAI/ObjectCache/index.js';
import { OpenAIClient } from '../Clients/OpenAI/index.js';
import { Resizer } from '../Clients/OpenAI/Resizer/index.js';

/**
 * Botc core class
 */
export class Botc {
  private config = new Configuration();
  private globalEvents = EventBus.attach();
  private modules!: BotcModules;

  /**
   * New Botc
   */
  constructor() {
    this.initialize();
  }

  /**
   * Initialize Botc
   */
  private async initialize(): Promise<void> {
    await this.registerHandlers();

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
        discord: new DiscordClient(this.config.options.clients.discord),
        elevenlabs: new ElevenLabs(this.config.options.llms.elevenlabs),
        openai: new OpenAIClient(this.config.options.llms.openai),
      },
    };
  }

  /**
   * Register event handlers
   */
  private async registerHandlers(): Promise<void> {
    this.globalEvents.on('DiscordClient:Ready',
      this.handleDiscordClientReady.bind(this),
    );

    this.globalEvents.on('DiscordClient:IncomingMessage',
      this.handleIncomingDiscordMessage.bind(this),
    );

    this.globalEvents.on('ElevenLabsClient:Ready',
      this.handleElevenLabsClientReady.bind(this),
    );

    this.globalEvents.on('OpenAIClient:Ready',
      this.handleOpenAIClientReady.bind(this),
    );
  }

  /**
   * Handle Discord client ready event
   * @param {EventMap['DiscordClient:Ready']} data Discord client ready event data
   */
  private async handleDiscordClientReady(data: EventMap['DiscordClient:Ready']): Promise<void> {
    console.log(data.message);
    this.preprocessMultimedia();
  }

  /**
   * Handle ElevenLabs client ready event
   * @param {EventMap['ElevenLabsClient:Ready']} data ElevenLabs client ready event data
   */
  private async handleElevenLabsClientReady(data: EventMap['ElevenLabsClient:Ready']): Promise<void> {
    console.log(data.message);
  }

  /**
   * Handle incoming Discord message
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming Discord message data
   */
  private async handleIncomingDiscordMessage(data: EventMap['DiscordClient:IncomingMessage']): Promise<void> {
    const discord = this.modules.clients.discord;
    const lastMessage = data.message;
    const channelId = lastMessage.channelId;
    const channelHistory = await discord.getChannelHistory(channelId);

    if (lastMessage) {
      await this.describeImages(channelHistory);
      await this.transcribeVoiceMessages(channelHistory);
      const botWillRespond = await this.willReplyToMessage(channelHistory);

      if (botWillRespond) {
        // Start typing indicator
        this.startTyping(channelId);
        // ...and keep it going until the response is ready - it times out after 10 seconds
        const typingInterval = setInterval(() => {
          this.startTyping(lastMessage.channelId);
        }, 9000);

        const responseContent = await this.prepareResponse(channelHistory);

        const attachments = [];
        if (lastMessage.isVoiceMessage) {
          const elevenlabs = this.modules.clients.elevenlabs;
          const voiceMessage = await elevenlabs.generateVoiceFile(responseContent);
          attachments.push(voiceMessage);
        }

        const payload = (lastMessage.isVoiceMessage)
          ? { channelId, content: '', filenames: attachments }
          : { channelId, content: responseContent, filenames: [] };

        // Stop triggering typing indicator
        clearInterval(typingInterval);

        this.globalEvents.emit('Botc:ResponseComplete', payload);
      }
    }
    else {
      // This should never happen
      console.error('Botc.handleIncomingDiscordMessage: lastMessage is undefined');
      return;
    }
  }

  /**
   * Handle OpenAI client ready event
   * @param {EventMap['OpenAIClient:Ready']} data OpenAI client ready event data
   */
  private async handleOpenAIClientReady(data: EventMap['OpenAIClient:Ready']): Promise<void> {
    console.log(data.message);
  }

  /**
   * Create prompt payload
   * @param {BotcMessage[]} messageHistory Channel message history
   * @param {CustomSystemPrompt} customSystemPrompt Custom system prompt
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private async createPromptPayload(messageHistory: BotcMessage[], customSystemPrompt?: CustomSystemPrompt): Promise<ChatCompletionMessageParam[]> {
    const configSystemPrompt = this.config.options.llms.openai.systemPrompt;

    // Map message history to OpenAI prompt format
    const payload = messageHistory.map(message => ({
      content: message.promptContent,
      name: message.promptUsername,
      role: message.promptRole,
    } as ChatCompletionMessageParam));

    // Construct system prompt
    const systemPrompt = (customSystemPrompt?.append)
      ? [configSystemPrompt.value, customSystemPrompt.value].join('\n')
      : customSystemPrompt?.value || configSystemPrompt.value;

    // Prepend system prompt
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
   * Prefetch image descriptions for all guilds
   * @param {BotcMessage[]} allGuildsHistory Message history
   */
  private async prefetchImageDescriptions(allGuildsHistory: BotcMessage[]): Promise<void> {
    console.log(`Prefetching image descriptions for all guilds...`);
    await this.describeImages(allGuildsHistory);
    console.log(`Image description prefetching complete.`);
  }

  /**
   * Prefetch voice transcriptions for all guilds
   * @param {BotcMessage[]} allGuildsHistory Message history
   */
  private async prefetchVoiceTranscriptions(allGuildsHistory: BotcMessage[]): Promise<void> {
    console.log(`Prefetching voice transcriptions for all guilds...`);
    await this.transcribeVoiceMessages(allGuildsHistory);
    console.log(`Voice transcription prefetching complete.`);
  }

  /**
   * Prepare Discord message response
   * @param {BotcMessage[]} channelHistory Channel message history
   * @returns {Promise<string>} Response message
   */
  private async prepareResponse(channelHistory: BotcMessage[]): Promise<string> {
    const lastMessage = channelHistory.at(-1) as BotcMessage;
    const guildId = lastMessage.originalMessage.guild?.id;

    // Guild is not populated for direct messages
    if (guildId) {
      const authorId = lastMessage.originalMessage.author.id;
      const persona = await this.generateUserPersona(guildId, authorId);

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
        console.error(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`);

        // Fail-safe: check for "yes" in malformed JSON response
        return responseMessage.toLowerCase().includes('"yes"');
      }
    }
  }
}
