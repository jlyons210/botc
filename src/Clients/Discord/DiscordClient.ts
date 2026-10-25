import type { Guild, Message, TextChannel } from "discord.js";
import {
  ChannelType,
  Client,
  DiscordAPIError,
  DiscordjsError,
  DiscordjsErrorCodes,
  Events,
  GatewayIntentBits,
  Partials,
} from "discord.js";

import type {
  ConfigurationOptions,
  DiscordClientSettings,
} from "../../Botc/Configuration/index.ts";
import type { EventMap } from "../../Botc/EventBus/index.ts";
import { EventBus } from "../../Botc/EventBus/index.ts";
import { BotcMessage } from "../../Botc/index.ts";
import { Logger } from "../../Botc/Logger/index.ts";

/**
 * Discord client wrapper
 */
export class DiscordClient {
  private discordClient!: Client;
  private discordConfig!: DiscordClientSettings;
  private readonly globalEvents = EventBus.attach();
  private botUserId!: string;
  private logger!: Logger;
  private config: ConfigurationOptions;

  /**
   * New Discord client
   * @param config - Botc configuration
   */
  constructor(config: ConfigurationOptions) {
    this.config = config;
    this.initialize();
  }

  /**
   * Destroy the Discord Client
   */
  public destroy(): void {
    this.discordClient.destroy();
    this.logger.log(`Discord client destroyed.`, "INFO");
  }

  /**
   * Async initialize outside of constructor
   */
  private async initialize(): Promise<void> {
    this.logger = new Logger(
      this.config.featureGates.enableDebugLogging.value as boolean,
    );
    this.discordConfig = this.config.clients.discord;
    this.discordClient = await this.createDiscordClient();
    await this.registerHandlers();
    await this.authenticateDiscordClient();
    this.botUserId = this.discordClient.user?.id as string;
  }

  /**
   * Register Discord client event handlers
   */
  private async registerHandlers(): Promise<void> {
    this.discordClient.once(
      Events.ClientReady,
      this.handleClientReady.bind(this),
    );

    this.discordClient.on(
      Events.MessageCreate,
      this.handleMessageCreate.bind(this),
    );

    this.globalEvents.on(
      "Botc:ResponseComplete",
      this.handleResponseComplete.bind(this),
    );

    this.globalEvents.on(
      "DiscordClient:StartTyping",
      this.handleStartTyping.bind(this),
    );
  }

  /**
   * Handle Discord ClientReady event
   */
  private async handleClientReady(): Promise<void> {
    await this.logReadyBanner();
    this.globalEvents.emit("DiscordClient:Ready", {
      message: "Discord client is ready.",
    });
  }

  /**
   * Handle Discord MessageCreate event
   * @param discordMessage - Discord.js Message object
   */
  private async handleMessageCreate(discordMessage: Message): Promise<void> {
    const botcMessage = new BotcMessage({
      botUserId: this.botUserId,
      discordMessage: discordMessage,
    });

    this.globalEvents.emit("DiscordClient:IncomingMessage", {
      message: botcMessage,
    });
  }

  /**
   * Send message to Discord channel
   * @param payload - Response payload
   */
  public async handleResponseComplete(
    payload: EventMap["Botc:ResponseComplete"],
  ): Promise<void> {
    const { channelId, content, attachments } = payload;
    const maxRetries = this.discordConfig.maxDiscordRetries.value as number;

    const channel = await this.discordClient.channels.fetch(channelId);

    if (channel && channel.isTextBased()) {
      let errorCount = 0;

      while (errorCount < maxRetries) {
        try {
          await (channel as TextChannel).send({
            content: content,
            files: attachments,
          });

          return;
        } catch (error) {
          this.logger.log(
            `Error sending message to channel ${channelId}: ${error}`,
            "ERROR",
          );
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * errorCount++),
          );
        }
      }
    }
  }

  /**
   * Start typing indicator in Discord channel
   * @param data - StartTyping event data
   */
  private async handleStartTyping(
    data: EventMap["DiscordClient:StartTyping"],
  ): Promise<void> {
    const channel = await this.discordClient.channels.fetch(data.channelId);
    if (channel?.isTextBased()) {
      await (channel as TextChannel).sendTyping();
    }
  }

  /**
   * Authenticate Discord client
   *   This occurs outside of createDiscordClient() to allow handlers to be registered before the
   *   client is authenticated.
   */
  private async authenticateDiscordClient(): Promise<void> {
    try {
      await this.discordClient.login(this.discordConfig.token.value as string);
    } catch (error) {
      if (
        error instanceof DiscordjsError &&
        error.code === DiscordjsErrorCodes.TokenInvalid
      ) {
        throw new Error("DISCORD_BOT_TOKEN is invalid. Exiting.", {
          cause: error,
        });
      } else {
        throw new Error(`Error: ${error}`, {
          cause: error,
        });
      }
    }
  }

  /**
   * Create Discord client
   * @returns Discord client
   */
  private async createDiscordClient(): Promise<Client> {
    return new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
    });
  }

  /**
   * Get all guilds history
   * @returns All guilds history
   */
  public async getAllGuildsHistory(): Promise<BotcMessage[]> {
    const guilds = this.discordClient.guilds.cache;

    const messages = await Promise.all(
      guilds.map(async (guild) => {
        return await this.getGuildHistory(guild.id);
      }),
    );

    return messages.flat();
  }

  /**
   * Get channel history
   * @param channelId - Channel ID
   * @param userId - (optional) User ID
   * @returns Channel history
   */
  public async getChannelHistory(
    channelId: string,
    userId?: string,
  ): Promise<BotcMessage[]> {
    const channel = await this.discordClient.channels.fetch(channelId);
    const isTextChannel = channel?.isTextBased();

    if (isTextChannel) {
      const channelHistoryHours = this.discordConfig.channelHistoryHours
        .value as number;
      const channelHistoryMessages = this.discordConfig.channelHistoryMessages
        .value as number;
      const afterTimestamp = Date.now() - channelHistoryHours * 60 * 60 * 1000;

      try {
        const messages = (
          await channel.messages.fetch({ limit: channelHistoryMessages })
        )
          .filter((message) => message.createdTimestamp > afterTimestamp)
          .map(
            (message) =>
              new BotcMessage({
                botUserId: this.botUserId,
                discordMessage: message,
              }),
          )
          .reverse();

        return userId
          ? // Filter messages to only those from userId, if provided
            messages.filter((message) => message.authorId === userId)
          : messages;
      } catch (error) {
        if (error instanceof DiscordAPIError) {
          this.logger.log(
            `Error '${error.code}' (${error.message}) fetching channel history for ${channel.id}.`,
            "ERROR",
          );
        }

        return [];
      }
    } else {
      throw Error("Channel is not a text channel");
    }
  }

  /**
   * Get guild
   * @param guildId - Guild ID
   * @returns Guild
   */
  public async getGuild(guildId: string): Promise<Guild> {
    return await this.discordClient.guilds.fetch(guildId);
  }

  /**
   * Get guild history
   * @param guildId - Guild ID
   * @param userId - Discord user ID for message filtering
   * @returns User context
   */
  public async getGuildHistory(
    guildId: string,
    userId?: string,
  ): Promise<BotcMessage[]> {
    const guild = await this.getGuild(guildId);
    const channels = await guild.channels.fetch();

    if (channels) {
      const messages = await Promise.all(
        channels
          .map((channel) => channels.get(channel?.id as string))
          .filter((channel) => channel?.isTextBased())
          .map(async (channel) => {
            return await this.getChannelHistory(channel?.id as string, userId);
          }),
      );

      return messages.flat();
    } else {
      return [];
    }
  }

  /**
   * Log the ready banner
   */
  private async logReadyBanner(): Promise<void> {
    const guilds = this.discordClient.guilds.cache;
    this.logger.log(
      `Connected to ${guilds.size} guild${guilds.size > 1 ? "s" : ""}:`,
      "INFO",
    );

    for (const guild of guilds.values()) {
      guild.channels.fetch();

      const textChannelCount = guild.channels.cache.filter((channel) => {
        return channel.type === ChannelType.GuildText;
      }).size;

      guild.members.fetch();
      this.logger.log(
        `- ${guild.name} (${guild.memberCount} members, ${textChannelCount} text channels)`,
        "INFO",
      );
    }
  }
}
