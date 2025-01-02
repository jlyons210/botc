import { Configuration } from './Configuration/index.js';
import { DiscordBot } from './DiscordBot/DiscordBot.js';

/** Main entry point */
export class Main {
  /** Initialize */
  constructor() {
    const configuration = new Configuration();
    new DiscordBot(configuration);
  }
}

new Main();
