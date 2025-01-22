import { Configuration } from './Configuration/index.js';
import { DiscordBot } from './DiscordBot/DiscordBot.js';

/** Main entry point */
export class Main {
  /** Initialize */
  constructor() {
    try {
      const configuration = new Configuration();
      new DiscordBot(configuration);
    }
    catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}

new Main();
