import { DiscordBot } from './DiscordBot/DiscordBot';
import configuration from '../botc.json';

/** Main entry point */
export class Main {
  private discordBot!: DiscordBot;

  /** Initialize */
  constructor() {
    this.discordBot = new DiscordBot(configuration);
  }
}

new Main();
