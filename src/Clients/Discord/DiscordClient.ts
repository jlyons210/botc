import {
  AttachmentBuilder,
  ChannelType,
  Client,
  DiscordAPIError,
  DiscordjsError,
  DiscordjsErrorCodes,
  Events,
  GatewayIntentBits,
  Guild,
  Message,
  Partials,
  TextChannel,
} from 'discord.js';

import { DiscordClientSettings, ElevenLabsSettings } from '../../Botc/Configuration/index.js';
import { BotcMessage } from '../../Botc/index.js';
import { ElevenLabs } from '../ElevenLabs/index.js';
import { EventBus } from '../../Botc/EventBus/index.js';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

/**
 * Utility functions for DiscordBot
 */
export class DiscordClient {
  private discordClient!: Client;
  private globalEvents = EventBus.attach();
  private botUserId!: string;

  /**
   * New DiscordBot
   * @param {DiscordClientSettings} discordConfig Discord client
   * @param {ElevenLabsSettings} elevenlabsConfig Eleven Labs settings
   */
  constructor(private discordConfig: DiscordClientSettings, private elevenlabsConfig: ElevenLabsSettings) {
    this.initialize();
  }

  /**
   * Async function to initialize Discord client
   */
  private async initialize(): Promise<void> {
    this.discordClient = await this.createDiscordClient();
    await this.registerHandlers();
    await this.authenticateDiscordClient();
    this.botUserId = this.discordClient.user?.id as string;
  }

  /**
   * Register Discord client event handlers
   */
  private async registerHandlers(): Promise<void> {
    this.discordClient.on(Events.ClientReady,
      this.handleClientReady.bind(this),
    );

    this.discordClient.on(Events.MessageCreate,
      this.handleMessageCreate.bind(this),
    );

    this.globalEvents.on('OpenAIClient:StartTyping', async (data) => {
      const channel = await this.discordClient.channels.fetch(data.channelId);
      if (channel?.isTextBased()) {
        await (channel as TextChannel).sendTyping();
      }
    });
  }

  /**
   * Handle Discord ClientReady event
   */
  private async handleClientReady(): Promise<void> {
    await this.logReadyBanner();
    this.globalEvents.emit('DiscordClient:Ready', {
      message: 'Discord client is ready.',
    });
  }

  /**
   * Handle Discord MessageCreate event
   * @param {Message} message Message
   */
  private async handleMessageCreate(message: Message): Promise<void> {
    // Wrap incoming message in BotcMessage
    const botcMessage = new BotcMessage({ botUserId: this.botUserId, message: message });

    // Trigger describeImages if message contains image attachments
    if (botcMessage.hasAttachedImages) {
      this.globalEvents.emit('DiscordClient:PrefetchImageDescriptions', {
        messageHistory: [botcMessage],
      });
    }

    // Emit incoming message event
    this.globalEvents.emit('DiscordClient:IncomingMessage', {
      message: botcMessage,
    });
  }

  /**
   * Authenticate Discord client
   */
  private async authenticateDiscordClient(): Promise<void> {
    try {
      await this.discordClient.login(this.discordConfig.token.value as string);
    }
    catch (error) {
      if (error instanceof DiscordjsError && error.code === DiscordjsErrorCodes.TokenInvalid) {
        throw Error('DISCORD_BOT_TOKEN is invalid. Exiting.');
      }
      else {
        throw Error(`Error: ${error}`);
      }
    }
  }

  /**
   * Create Discord client
   * @returns {Promise<Client>} Discord client
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
   * Get channel history
   * @param {string} channelId Channel ID
   * @param {string} userId (optional) User ID
   * @returns {Promise<BotcMessage[]>} Channel history
   */
  public async getChannelHistory(channelId: string, userId?: string): Promise<BotcMessage[]> {
    const channel = await this.discordClient.channels.fetch(channelId);
    const isTextChannel = channel?.isTextBased();

    if (isTextChannel) {
      const channelHistoryHours = this.discordConfig.channelHistoryHours.value as number;
      const channelHistoryMessages = this.discordConfig.channelHistoryMessages.value as number;
      const afterTimestamp = Date.now() - (channelHistoryHours * 60 * 60 * 1000);

      try {
        const messages = (await channel.messages.fetch({ limit: channelHistoryMessages }))
          .filter(message => message.createdTimestamp > afterTimestamp)
          .map(message => new BotcMessage({
            botUserId: this.botUserId,
            message: message,
          }))
          .reverse();

        return (userId)
          // Filter messages to only those from userId, if provided
          ? messages.filter(message => message.originalMessage.author.id === userId)
          : messages;
      }
      catch (error) {
        if (error instanceof DiscordAPIError) {
          console.error(`Error '${error.code}' (${error.message}) fetching channel history for ${channel.id}.`);
        }

        return [];
      }
    }
    else {
      throw Error('Channel is not a text channel');
    }
  }

  /**
   * Summarize user behavior
   * @param {string} guild Discord.js Guild object
   * @param {string} authorId Author ID
   * @returns {Promise<BotcMessage[]>} User context
   */
  public async getServerHistoryForUser(guild: Guild, authorId: string): Promise<BotcMessage[]> {
    const channels = await guild.channels.fetch();

    if (channels) {
      const messages = await Promise.all(channels

        // Retrieve channel objects using channel IDs
        .map(channel => channels.get(channel?.id as string))

        // Filter to text channels
        .filter(channel => channel?.isTextBased())

        // Return user's message history for each channel
        .map(async (channel) => {
          return await this.getChannelHistory(
            channel?.id as string,
            authorId,
          );
        }));

      // Return flattened array of messages
      return messages.flat();
    }
    else {
      // Return empty array if user has no message history
      return [];
    }
  }

  /**
   * Log the ready banner
   */
  private async logReadyBanner(): Promise<void> {
    const guilds = this.discordClient.guilds.cache;
    console.log(`Connected to ${guilds.size} guild${(guilds.size > 1) ? 's' : ''}:`);

    for (const guild of guilds.values()) {
      guild.channels.fetch();

      const textChannelCount = guild.channels.cache.filter((channel) => {
        return channel.type === ChannelType.GuildText;
      }).size;

      guild.members.fetch();
      console.log(`- ${guild.name} (${guild.memberCount} members, ${textChannelCount} text channels)`);
    }
  }

  /**
   * Send message
   * @param {string} channelId Channel ID
   * @param {string} message Message text
   */
  public async sendMessage(channelId: string, message: string): Promise<void> {
    const channel = await this.discordClient.channels.fetch(channelId);

    if (channel?.isTextBased()) {
      await (channel as TextChannel).send(message);
    }
  }

  /**
   * Send voice message
   * @param {string} channelId Channel ID
   * @param {string} message Message text
   */
  public async sendVoiceMessage(channelId: string, message: string): Promise<void> {
    const channel = await this.discordClient.channels.fetch(channelId);

    if (channel?.isTextBased()) {
      const elevenlabs = new ElevenLabs(this.elevenlabsConfig);
      const outputFile = `voice-response-${Date.now()}.mp3`;

      // Set file path to temp directory using node fs module
      const outputDir = mkdtempSync(join(tmpdir(), 'botc-'));
      const fullPath = join(outputDir, outputFile);
      console.debug(`DiscordClient.sendVoiceMessage: tempDir: ${outputDir}`);
      console.debug(`DiscordClient.sendVoiceMessage: fullPath: ${fullPath}`);

      // Generate audio file
      const response = await elevenlabs.generateSpeech(message);
      await fs.writeFile(fullPath, response, 'binary');

      // Create attachment
      const attachment = new AttachmentBuilder(fullPath);

      // Send voice message to Discord channel
      await (channel as TextChannel).send({ files: [attachment] });

      // Cleanup audio file
      await fs.unlink(fullPath);
    }
  }
}
