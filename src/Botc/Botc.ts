import { EventBus, EventMap } from './Core/EventBus/index.js';
import { Configuration } from './Core/Configuration/index.js';
import { DiscordClient } from '../Clients/DiscordClient/index.js';
import { MessagePipeline } from './Core/MessagePipeline/index.js';
import { OpenAIClient } from '../Clients/OpenAI/OpenAIClient.js';

/** Botc */
export class Botc {
  private config = new Configuration();
  private discordClient: DiscordClient;
  private globalEvents = EventBus.attach();
  private messagePipeline!: MessagePipeline<EventMap>;
  private openAIClient: OpenAIClient;

  /**
   * New Botc
   */
  constructor() {
    this.registerHandlers();
    this.discordClient = new DiscordClient(this.config.options.clients.discord);
    this.messagePipeline = new MessagePipeline(this.discordClient);
    this.openAIClient = new OpenAIClient(this.config.options.llms.openai);
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
