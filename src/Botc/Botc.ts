import { Configuration } from './Core/Configuration/index.js';
import { DiscordClient } from '../Clients/DiscordClient/index.js';
import { EventBus } from './Core/EventBus/index.js';

/** Botc */
export class Botc {
  private config = new Configuration();
  private discordClient!: DiscordClient;
  private globalEvents = EventBus.getInstance();

  /**
   * New Botc
   */
  constructor() {
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
