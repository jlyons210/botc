import {
  ChannelType,
  Client,
  DiscordjsError,
  DiscordjsErrorCodes,
  Events,
  GatewayIntentBits,
  Message,
  Partials,
} from 'discord.js';

import { BotcMessage } from '../../Botc/index.js';
import { DiscordClientSettings } from '../../Botc/Core/Configuration/index.js';
import { EventBus } from '../../Botc/Core/EventBus/index.js';

/**
 * Utility functions for DiscordBot
 */
export class DiscordClient {
  private discordClient!: Client;
  private globalEvents = EventBus.attach();

  /**
   * New DiscordBot
   * @param {DiscordClientSettings} config Discord client
   */
  constructor(private config: DiscordClientSettings) {
    this.initialize();
  }

  /**
   * Async function to initialize Discord client
   */
  private async initialize(): Promise<void> {
    this.discordClient = await this.createDiscordClient();
    await this.registerHandlers();
    await this.authenticateDiscordClient();
  }

  /**
   * Register Discord client event handlers
   */
  private async registerHandlers(): Promise<void> {
    this.discordClient.on(
      Events.ClientReady,
      this.handleClientReady.bind(this),
    );

    this.discordClient.on(
      Events.MessageCreate,
      this.handleMessageCreate.bind(this),
    );
  }

  /**
   * Handle Discord ClientReady event
   */
  private async handleClientReady(): Promise<void> {
    await this.logReadyBanner();
    this.globalEvents.emit('DiscordClient:Ready', { message: 'Discord client is ready.' });
  }

  /**
   * Handle Discord MessageCreate event
   * @param {Message} message Message
   */
  private async handleMessageCreate(message: Message): Promise<void> {
    const botMessage = new BotcMessage(message, String(this.discordClient.user?.id));
    console.log(
      'Received message:\n'
      + `- Content: ${botMessage.originalMessage.content}\n`
      + `- Type: ${botMessage.type}`,
    );
  }

  /**
   * Authenticate Discord client
   */
  private async authenticateDiscordClient(): Promise<void> {
    try {
      await this.discordClient.login(this.config.token.value);
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
   * Logs ready banner
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
}
