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

import { DiscordBotMessage } from './index.js';
import { DiscordClientSettings } from '../Configuration/index.js';

/**
 * Utility functions for DiscordBot
 */
export class DiscordBotClient {
  private discordClient!: Client;

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
  async initialize(): Promise<void> {
    this.discordClient = await this.createDiscordClient(this.config);
    this.registerHandlers();
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
  }

  /**
   * Handle Discord MessageCreate event
   * @param {Message} message Message
   */
  private async handleMessageCreate(message: Message): Promise<void> {
    const botMessage = new DiscordBotMessage(message, String(this.discordClient.user?.id));
    console.log(
      '- Received message:\n'
      + `- Content: ${botMessage.originalMessage.content}\n`
      + `- Type: ${botMessage.type}`,
    );
  }

  /**
   * Create Discord client
   * @param {DiscordClientSettings} config Discord client settings
   * @returns {Promise<Client>} Discord client
   */
  async createDiscordClient(config: DiscordClientSettings): Promise<Client> {
    const client = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [Partials.Channel],
    });

    try {
      await client.login(config.token.value);
      this.discordClient = client;
      return client;
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
   * Logs ready banner
   */
  async logReadyBanner(): Promise<void> {
    console.log('DiscordBot is ready');

    const guilds = this.discordClient.guilds.cache;
    console.log(`Connected to ${guilds.size} guild ${(guilds.size > 1) ? 's' : ''}`);

    for (const guild of guilds.values()) {
      guild.channels.fetch();
      const textChannelCount = guild.channels.cache.filter((channel) => {
        return channel.type === ChannelType.GuildText;
      }).size;

      guild.members.fetch();
      console.log(`Guild ${guild.name} (${guild.memberCount} members, ${textChannelCount} channels)`);
    }
  }
}
