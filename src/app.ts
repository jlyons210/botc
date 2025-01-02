import { Configuration } from './Configuration/index.js';
import { DiscordBot } from './DiscordBot/DiscordBot.js';

/** Main entry point */
export class Main {
  private discordBot: DiscordBot;

  /** Initialize */
  constructor() {
    const configuration = new Configuration();
    this.discordBot = new DiscordBot(configuration);
  }
}

new Main();
