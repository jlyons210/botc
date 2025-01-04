import { Configuration } from '../Configuration/index.js';
import { DiscordBotClient } from './index.js';

/** DiscordBot */
export class DiscordBot {
  private discordBotClient!: DiscordBotClient;

  /**
   * New DiscordBot
   * @param {Configuration} config Configuration
   */
  constructor(private config: Configuration) {
    this.discordBotClient = new DiscordBotClient(this.config.options.clients.discord);
  }
}
