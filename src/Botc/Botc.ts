import type {
  BotcMessage,
  BotcModules,
  CustomSystemPrompt,
  GroundDecisionResponse,
  ReplyDecisionResponse,
} from "./index.ts";

import type { EventMap } from "./EventBus/index.ts";
import { EventBus } from "./EventBus/index.ts";
import {
  OpenAIClient,
  type OpenAIResponsePayload,
} from "../Clients/OpenAI/index.ts";
import { AttachmentBuilder } from "discord.js";
import { Brave } from "../Clients/Brave/index.ts";
import { Configuration } from "./Configuration/index.ts";
import { DiscordClient } from "../Clients/Discord/index.ts";
import { ElevenLabs } from "../Clients/ElevenLabs/index.ts";
import { Logger } from "./Logger/index.ts";
import { ObjectCache } from "./ObjectCache/index.ts";
import { Resizer } from "./Resizer/index.ts";

export class Botc {
  private readonly config = new Configuration();
  private readonly globalEvents = EventBus.attach();
  private readonly logger: Logger;
  private readonly modules: BotcModules;

  constructor() {
    this.logger = new Logger(
      this.config.options.featureGates.enableDebugLogging.value as boolean,
    );
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
        brave: (this.config.options.featureGates.enableAiGrounding
          .value as boolean)
          ? new Brave(this.config.options)
          : null,
        discord: new DiscordClient(this.config.options),
        elevenlabs: (this.config.options.featureGates.enableVoiceResponse
          .value as boolean)
          ? new ElevenLabs(this.config.options)
          : null,
        openai: new OpenAIClient(this.config.options),
      },
    };
  }

  private registerHandlers(): void {
    ["SIGINT", "SIGTERM"].forEach((signal) => {
      process.once(signal, () => {
        this.handleShutdown();
      });
    });

    this.globalEvents.once(
      "Brave:Ready",
      this.handleBraveClientReady.bind(this),
    );

    this.globalEvents.once(
      "DiscordClient:Ready",
      this.handleDiscordClientReady.bind(this),
    );

    this.globalEvents.on(
      "DiscordClient:IncomingMessage",
      this.handleIncomingDiscordMessage.bind(this),
    );

    this.globalEvents.once(
      "ElevenLabsClient:Ready",
      this.handleElevenLabsClientReady.bind(this),
    );

    this.globalEvents.once(
      "OpenAIClient:Ready",
      this.handleOpenAIClientReady.bind(this),
    );
  }

  private async handleBraveClientReady(
    data: EventMap["Brave:Ready"],
  ): Promise<void> {
    this.logger.log(data.message, "INFO");
  }

  private async handleDiscordClientReady(
    data: EventMap["DiscordClient:Ready"],
  ): Promise<void> {
    this.logger.log(data.message, "INFO");
    this.preprocessMultimedia();
  }

  private async handleElevenLabsClientReady(
    data: EventMap["ElevenLabsClient:Ready"],
  ): Promise<void> {
    this.logger.log(data.message, "INFO");
  }

  private async handleIncomingDiscordMessage(
    data: EventMap["DiscordClient:IncomingMessage"],
  ): Promise<void> {
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

        const payload: EventMap["Botc:ResponseComplete"] = {
          channelId: channelId,
          content: "",
          attachments: [],
        };

        try {
          const isImageGenerationPrompt =
            await this.isImageGenerationPrompt(lastMessage);
          const imageGenerationEnabled = this.config.options.featureGates
            .enableImageGeneration.value as boolean;
          const voiceResponseEnabled = this.config.options.featureGates
            .enableVoiceResponse.value as boolean;

          if (voiceResponseEnabled && lastMessage.isVoiceMessage) {
            const textResponse = await this.prepareTextResponse(channelHistory);
            payload.attachments.push(
              await this.prepareVoiceResponse(textResponse),
            );
          } else if (imageGenerationEnabled && isImageGenerationPrompt) {
            payload.attachments.push(
              await this.prepareImageResponse(lastMessage),
            );
          } else {
            payload.content = await this.prepareTextResponse(channelHistory);
          }
        } catch (error) {
          this.logger.log(`Error preparing response: ${error}`, "ERROR");
          payload.content = "There was an error preparing the response.";
        }

        // Stop triggering typing indicator
        clearInterval(typingInterval);

        this.globalEvents.emit("Botc:ResponseComplete", payload);
      }
    }
  }

  private async handleOpenAIClientReady(
    data: EventMap["OpenAIClient:Ready"],
  ): Promise<void> {
    this.logger.log(data.message, "INFO");
  }

  private handleShutdown(): void {
    this.modules.caches.imageDescriptions.destroy();
    this.modules.caches.personas.destroy();
    this.modules.caches.transcriptions.destroy();
    this.modules.clients.discord.destroy();
  }

  private async createPromptPayload(
    messageHistory: BotcMessage[],
    customSystemPrompt?: CustomSystemPrompt,
  ): Promise<OpenAIResponsePayload> {
    const config = this.config.options.llms.openai;
    const configSystemPrompt = config.systemPrompt;

    const systemPrompt = customSystemPrompt?.append
      ? [configSystemPrompt.value, customSystemPrompt.value].join("\n")
      : customSystemPrompt?.value || configSystemPrompt.value;

    return {
      instructions: systemPrompt as string,
      input: messageHistory.map((message) => ({
        role: message.promptRole,
        content: `Username: ${message.promptUsername}\n${message.promptContent}`,
      })),
    };
  }

  private async describeImages(messageHistory: BotcMessage[]): Promise<void> {
    const cache = this.modules.caches.imageDescriptions;
    const openai = this.modules.clients.openai;

    const images = messageHistory
      .filter((message) => message.hasAttachedImages)
      .flatMap((message) =>
        message.attachedImages.map((image) => ({ message, image })),
      );

    await Promise.all(
      images.map(async ({ message, image }) => {
        if (!cache.contains(image.imageUrl)) {
          const resize = new Resizer(
            this.config.options.llms.openai.imageMaxSide.value as number,
          );
          const imageUrl = await resize.getUrl(image.imageUrl);
          const description = await openai.generateImageDescription(imageUrl);

          cache.put({
            key: image.imageUrl,
            value: description,
          });
        }

        message.addImageDescription(cache.get(image.imageUrl) as string);
      }),
    );
  }

  /** Builds an information query and returns Brave's grounding context when needed. */
  private async generateGroundingContext(
    messageHistory: BotcMessage[],
  ): Promise<string> {
    if (
      this.modules.clients.brave &&
      (await this.willGroundResponse(messageHistory))
    ) {
      this.logger.log(
        "Botc.generateGroundingContext: Will ground response with RAG",
        "DEBUG",
      );
    } else {
      this.logger.log(
        "Botc.generateGroundingContext: Will not ground response",
        "DEBUG",
      );
      return "";
    }

    const conversationPayload = await this.createPromptPayload(messageHistory, {
      value: [
        "Examine this conversation and identify any information gaps or questions that may need ",
        "up-to-date information from the internet to answer.\n ",
        "Do not summarize the conversation or include any information about the users. Instead, ",
        "respond only with a question or prompt that the Brave AI Grounding API can respond to ",
        "in order to augment the conversation.\n",
        "Include either the explicit date and time, or use reletave terms including or similar ",
        'to "today/tonight/yesterday" - but not both. Brave\'s API uses UTC and this confuses it.\n',
        "Do request a concise response because request and response tokens are expensive.\n",
        "When requesting information that may return international units of measure, be specific ",
        "in requesting US-based sources.\n",
      ].join(""),
      append: false,
    });

    const openai = this.modules.clients.openai;
    const groundingQuery = await openai.createResponse(conversationPayload);

    this.logger.log(
      `Botc.generateGroundingContext: Grounding query: ${groundingQuery}`,
      "DEBUG",
    );
    this.logger.log(
      "Botc.generateGroundingContext: Using Brave to ground response",
      "DEBUG",
    );

    const brave = this.modules.clients.brave;
    const groundingResponse =
      await brave.createGroundingResponse(groundingQuery);

    this.logger.log(
      `Botc.generateGroundingContext: Brave response: ${groundingResponse}`,
      "DEBUG",
    );

    return groundingResponse;
  }

  private async generatePersonalizedResponse(
    messageHistory: BotcMessage[],
    persona: string,
  ): Promise<string> {
    const groundingContext =
      await this.generateGroundingContext(messageHistory);
    const payload = await this.createPromptPayload(messageHistory, {
      value: [
        `<Sender Persona>${persona}</Sender Persona>`,
        `<Grounding Context>${groundingContext}</Grounding Context>`,
      ].join("\n"),
      append: true,
    });

    const openai = this.modules.clients.openai;
    return await openai.createResponse(payload);
  }

  /** Builds and caches a persona from the user's guild message history. */
  private async generateUserPersona(
    guildId: string,
    authorId: string,
  ): Promise<string> {
    const cache = this.modules.caches.personas;
    const cacheKey = `${guildId}:${authorId}`;
    const discord = this.modules.clients.discord;
    const openai = this.modules.clients.openai;

    if (!cache.contains(cacheKey)) {
      const guildHistory = await discord.getGuildHistory(guildId, authorId);
      await this.describeImages(guildHistory);
      await this.transcribeVoiceMessages(guildHistory);

      const nameSanitized = guildHistory[0].promptUsername;
      const payload = await this.createPromptPayload(guildHistory, {
        value: `Summarize the following messages to build a persona for the user ${nameSanitized}.`,
        append: false,
      });

      const persona = await openai.createResponse(payload);

      cache.put({
        key: cacheKey,
        value: persona,
      });
    }

    return cache.get(cacheKey) as string;
  }

  private async isImageGenerationPrompt(
    message: BotcMessage,
  ): Promise<boolean> {
    const openai = this.modules.clients.openai;
    const payload = await this.createPromptPayload([message], {
      value:
        'Is this message an image generation or image edit prompt? Respond with "yes" or "no".',
      append: false,
    });
    const response = await openai.createResponse(payload);

    return response.toLowerCase() === "yes";
  }

  private async prefetchImageDescriptions(
    allGuildsHistory: BotcMessage[],
  ): Promise<void> {
    this.logger.log(`Prefetching image descriptions for all guilds...`, "INFO");
    await this.describeImages(allGuildsHistory);
    this.logger.log(`Image description prefetching complete.`, "INFO");
  }

  private async prefetchVoiceTranscriptions(
    allGuildsHistory: BotcMessage[],
  ): Promise<void> {
    this.logger.log(
      `Prefetching voice transcriptions for all guilds...`,
      "INFO",
    );
    await this.transcribeVoiceMessages(allGuildsHistory);
    this.logger.log(`Voice transcription prefetching complete.`, "INFO");
  }

  private async prepareImageResponse(
    message: BotcMessage,
  ): Promise<AttachmentBuilder> {
    const openai = this.modules.clients.openai;
    const imageUrls = [
      ...message.attachedImages.map((image) => image.imageUrl),
      ...(message.replyToMessage?.attachedImages.map(
        (image) => image.imageUrl,
      ) || []),
    ];

    const responseImage = await openai.createImage(message.content, imageUrls);
    const imageBuffer = Buffer.from(responseImage, "base64");

    return new AttachmentBuilder(imageBuffer, {
      name: `openai-image-${Date.now()}.png`,
    });
  }

  /** Uses a user persona for guild messages and none for direct messages. */
  private async prepareTextResponse(
    channelHistory: BotcMessage[],
  ): Promise<string> {
    const lastMessage = channelHistory.at(-1) as BotcMessage;

    if (lastMessage.guildId) {
      const persona = await this.generateUserPersona(
        lastMessage.guildId,
        lastMessage.authorId,
      );
      return await this.generatePersonalizedResponse(channelHistory, persona);
    } else if (lastMessage.isDirectMessage || lastMessage.isVoiceMessage) {
      return await this.generatePersonalizedResponse(channelHistory, "");
    } else {
      // This should never happen
      throw new Error("OpenAIClient.prepareResponse: Guild not found");
    }
  }

  private async prepareVoiceResponse(
    responseText: string,
  ): Promise<AttachmentBuilder> {
    const elevenlabs = this.modules.clients.elevenlabs;
    if (!elevenlabs) {
      this.logger.log(
        "Botc.prepareVoiceResponse: ElevenLabs client is not available",
        "ERROR",
      );
      throw new Error("ElevenLabs client is not available");
    }

    const voiceStream = await elevenlabs.generateVoiceStream(responseText);
    return new AttachmentBuilder(voiceStream, {
      name: "voice-response.mp3",
    });
  }

  /** Prefetches image descriptions and voice transcriptions concurrently for guild history. */
  private async preprocessMultimedia(): Promise<void> {
    const discord = this.modules.clients.discord;
    const allGuildsHistory = await discord.getAllGuildsHistory();
    await Promise.all([
      this.prefetchImageDescriptions(allGuildsHistory),
      this.prefetchVoiceTranscriptions(allGuildsHistory),
    ]);
  }

  /**
   * Send typing indicator to channel
   * @param channelId - Channel ID
   */
  private startTyping(channelId: string): void {
    this.globalEvents.emit("DiscordClient:StartTyping", {
      channelId: channelId,
    });
  }

  private async transcribeVoiceMessages(
    messageHistory: BotcMessage[],
  ): Promise<void> {
    const cache = this.modules.caches.transcriptions;
    const openai = this.modules.clients.openai;

    await Promise.all(
      messageHistory
        .filter((message) => message.hasVoiceMessage)
        .map(async (message) => {
          const voiceMessageUrl = message.voiceMessage?.url;

          if (voiceMessageUrl) {
            if (!cache.contains(voiceMessageUrl)) {
              const fetchedAudio = await fetch(voiceMessageUrl);
              const audioBuffer = await fetchedAudio.arrayBuffer();
              const audioFile = new File([audioBuffer], "audio.ogg", {
                type: "audio/ogg",
              });

              const transcription =
                await openai.generateAudioTranscription(audioFile);

              cache.put({
                key: voiceMessageUrl,
                value: transcription,
              });
            }

            message.voiceMessageTranscription = cache.get(
              voiceMessageUrl,
            ) as string;
          }
        }),
    );
  }

  /**
   * Decides whether to ground the response with Brave Grounded AI RAG enhancement
   * @param messageHistory - Message history
   * @returns true if the response should be grounded
   */
  private async willGroundResponse(
    messageHistory: BotcMessage[],
  ): Promise<boolean> {
    if (!this.config.options.featureGates.enableAiGrounding.value as boolean)
      return false;

    const config = this.config.options.llms.openai;
    const groundResponsePrompt = config.groundDecisionPrompt.value as string;
    const payload = await this.createPromptPayload(messageHistory, {
      value: groundResponsePrompt,
      append: false,
    });

    this.logger.log(
      `Botc.willGroundResponse: Payload for grounding decision: ${JSON.stringify(payload)}`,
      "DEBUG",
    );

    const openai = this.modules.clients.openai;
    const responseMessage = await openai.createResponse(payload);

    this.logger.log(
      `Botc.willGroundResponse: Response from OpenAI: ${responseMessage}`,
      "DEBUG",
    );

    try {
      const responseJson = JSON.parse(
        responseMessage,
      ) as GroundDecisionResponse;

      this.logger.log(
        `Botc.willGroundResponse: Return value: ${responseJson.willGround === true}`,
        "DEBUG",
      );
      return responseJson.willGround === true;
    } catch (error) {
      // Log error parsing JSON response - sometimes the API returns malformed JSON
      this.logger.log(
        `Botc.willGroundResponse: Error ${error} parsing JSON: ${responseMessage}`,
        "ERROR",
      );

      // Fail-safe: check for "true" in malformed JSON response
      return responseMessage.toLowerCase().includes('"true"');
    }
  }

  /**
   * Decides whether to reply based on conversation history
   * @param channelHistory - Channel message history
   */
  private async willReplyToMessage(
    channelHistory: BotcMessage[],
  ): Promise<boolean> {
    const lastMessage = channelHistory.at(-1) as BotcMessage;
    const autoRespondEnabled = this.config.options.featureGates
      .enableAutoRespond.value as boolean;
    const alwaysRespond =
      (lastMessage.isAtMention || lastMessage.isDirectMessage) &&
      !lastMessage.isOwnMessage;

    if (alwaysRespond) {
      return true;
    } else if (
      !autoRespondEnabled ||
      lastMessage.isOwnMessage ||
      lastMessage.isBotMessage
    ) {
      return false;
    } else {
      const openai = this.modules.clients.openai;
      const config = this.config.options.llms.openai;
      const replyDecisionPrompt = config.replyDecisionPrompt.value as string;

      const payload = await this.createPromptPayload(channelHistory, {
        value: replyDecisionPrompt,
        append: false,
      });

      this.logger.log(
        `OpenAIClient.willReplyToMessage: Payload for reply decision: ${JSON.stringify(payload)}`,
        "DEBUG",
      );

      const responseMessage = await openai.createResponse(payload);

      this.logger.log(
        `OpenAIClient.willReplyToMessage: Response from OpenAI: ${responseMessage}`,
        "DEBUG",
      );

      try {
        const responseJson = JSON.parse(
          responseMessage,
        ) as ReplyDecisionResponse;
        return responseJson.respondToUser.toLowerCase() === "yes";
      } catch (error) {
        this.logger.log(
          `OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`,
          "ERROR",
        );
        return responseMessage.toLowerCase().includes('"yes"');
      }
    }
  }
}
