import { EventBus, EventMap } from './EventBus/index.js';
import { Configuration } from './Configuration/index.js';
import { DiscordClient } from '../Clients/Discord/index.js';
import { MessagePipeline } from './MessagePipeline/index.js';
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
    const discordConfig = this.config.options.clients.discord;
    const openAIConfig = this.config.options.llms.openai;

    this.registerHandlers();

    this.discordClient = new DiscordClient(discordConfig);
    this.messagePipeline = new MessagePipeline(this.discordClient);
    this.openAIClient = new OpenAIClient(openAIConfig);
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
