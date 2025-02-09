import { EventBus, EventMap } from './EventBus/index.js';
import { BotcModules } from './index.js';
import { Configuration } from './Configuration/index.js';
import { DiscordClient } from '../Clients/Discord/index.js';
import { ElevenLabs } from '../Clients/ElevenLabs/index.js';
import { OpenAIClient } from '../Clients/OpenAI/index.js';

/** Botc */
export class Botc {
  private config = new Configuration();
  private modules: BotcModules;

  /**
   * New Botc
   */
  constructor() {
    this.registerHandlers();

    this.modules = {
      DiscordClient: new DiscordClient(this.config.options.clients.discord),
      ElevenLabsClient: new ElevenLabs(this.config.options.llms.elevenlabs),
      EventBus: EventBus.attach(),
      OpenAIClient: new OpenAIClient(this.config.options.llms.openai),
    };
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.registerHandlersDiscord();
    this.registerHandlersElevenLabs();
    this.registerHandlersOpenAI();
  }

  /**
   * Register Discord event handlers
   */
  private registerHandlersDiscord(): void {
    this.modules.EventBus.on('DiscordClient:Ready', (data) => {
      console.log(data.message);
    });

    this.modules.EventBus.on('DiscordClient:IncomingMessage',
      this.handleIncomingMessage.bind(this),
    );
  }

  /**
   * Register ElevenLabs event handlers
   */
  private registerHandlersElevenLabs(): void {
    this.modules.EventBus.on('ElevenLabsClient:Ready', (data) => {
      console.log(data.message);
    });
  }

  /**
   * Register OpenAI event handlers
   */
  private registerHandlersOpenAI(): void {
    this.modules.EventBus.on('OpenAIClient:Ready', (data) => {
      console.log(data.message);
    });

    this.modules.EventBus.on('OpenAIClient:ResponseComplete',
      this.handleResponseComplete.bind(this),
    );

    this.modules.EventBus.on('OpenAIClient:VoiceResponseComplete',
      this.handleVoiceResponseComplete.bind(this),
    );
  }

  /**
   * Handle incoming message
   * @param {EventMap['DiscordClient:IncomingMessage']} data Incoming message
   * @deprecated
   * @todo This is probably not needed anymore
   */
  private async handleIncomingMessage(data: EventMap['DiscordClient:IncomingMessage']): Promise<void> {
    // Re-fire the incoming message event with the message histories and Discord client
    this.modules.EventBus.emit('MessagePipeline:IncomingMessage', {
      discordClient: this.discordClient,
      message: data.message,
    });
  }

  /**
   * Handle response complete
   * @param {EventMap['OpenAIClient:ResponseComplete']} data Response data
   */
  private async handleResponseComplete(data: EventMap['OpenAIClient:ResponseComplete']): Promise<void> {
    await this.modules.DiscordClient.sendMessage(data.channelId, data.response);
  }

  /**
   * Handle voice response complete
   * @param {EventMap['OpenAIClient:VoiceResponseComplete']} data Voice response data
   */
  private async handleVoiceResponseComplete(data: EventMap['OpenAIClient:VoiceResponseComplete']): Promise<void> {
    await this.modules.DiscordClient.sendVoiceMessage(data.channelId, data.response);
  }
}
