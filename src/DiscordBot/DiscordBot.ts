import {
  // AttachmentBuilder,
  // ChannelType,
  Client,
  // DiscordAPIError,
  DiscordjsError,
  DiscordjsErrorCodes,
  // EmbedBuilder,
  // EmojiIdentifierResolvable,
  Events,
  GatewayIntentBits,
  Message,
  Partials,
} from 'discord.js';

import { Configuration } from '../app.types';
import { DiscordBotMessage } from './DiscordBotMessage';

/** DiscordBot */
export class DiscordBot {
  private discordClient!: Client;

  /**
   * New DiscordBot
   * @param config Configuration
   */
  constructor(private config: Configuration) {
    this.createDiscordClient();
    this.registerHandlers();
  }

  /** Create Discord client */
  private async createDiscordClient(): Promise<void> {
    this.discordClient = new Client({
      intents: [
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
      ],
      partials: [ Partials.Channel ],
    });

    try {
      const botToken = this.config.clients.discord.token;
      await this.discordClient.login(botToken);
    }
    catch (error) {
      if (error instanceof DiscordjsError && error.code === DiscordjsErrorCodes.TokenInvalid) {
        console.error('The configured Discord bot token is invalid. Exiting.');
        process.exit(1);
      }
      else {
        console.error(`Error: ${error}`);
        process.exit(1);
      }
    }
  }

  /**
   * Handle Discord client ready event
   */
  private async handleDiscordClientReady(): Promise<void> {
    console.log('DiscordBot is ready');

    const guilds = this.discordClient.guilds.cache;
    console.log(`- Connected to ${guilds.size} guilds`);

    for (const guild of guilds.values()) {
      console.log(`  - Guild ${guild.name} (${guild.memberCount} members, ${guild.channels.cache.size} channels)`);

      await guild.channels.fetch();
      await guild.members.fetch();

      for (const member of guild.members.cache.values()) {
        console.log(`    - Member: ${member.user.username}`);
      }

      for (const channel of guild.channels.cache.values()) {
        if (channel.isTextBased()) {
          console.log(`    - Channel: ${channel.name}`);
        }
      }
    }
  }

  /**
   * Handle incoming Discord messages
   * @param message Message
   */
  private handleDiscordMessageCreate(message: Message): void {
    const botMessage = new DiscordBotMessage(message, String(this.discordClient.user?.id));
    console.log(
      '- Received message\n' +
      `  - Content: ${botMessage.originalMessage.content}\n` +
      `  - Type: ${botMessage.type}`
    );
  }

  /** Register event handlers */
  private registerHandlers(): void {
    this.discordClient.on(Events.ClientReady, () => {
      this.handleDiscordClientReady();
    });

    this.discordClient.on(Events.MessageCreate, (message: Message) => {
      this.handleDiscordMessageCreate(message);
    });
  }

}
