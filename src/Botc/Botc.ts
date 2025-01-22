import { Configuration } from './Core/Configuration/index.js';
import { DiscordClient } from '../Clients/DiscordClient/index.js';
import { EventBus } from './Core/EventBus/index.js';

/** Botc */
export class Botc {
  private globalEvents = EventBus.getInstance();
  private discordClient!: DiscordClient;

  /**
   * New Botc
   * @param {Configuration} config Configuration
   */
  constructor(private config: Configuration) {
    this.registerHandlers();
    this.discordClient = new DiscordClient(this.config.options.clients.discord);
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('DiscordClient:Ready', (data) => {
      console.log(data.message);
    });
  }
}
