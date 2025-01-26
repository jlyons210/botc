import { EventBus, EventMap } from '../EventBus/index.js';
import { DiscordClient } from '../../Clients/Discord/index.js';

/**
 * The message pipeline is responsible for processing messages from the chat service and passing
 * them through the various stages of the bot's processing pipeline.
 */
export class MessagePipeline<T extends EventMap> {
  private globalEvents = EventBus.attach();

  /**
   * Initialize the message pipeline
   * @param {DiscordClient} discordClient Discord client
   */
  constructor(private discordClient: DiscordClient) {
    this.registerHandlers();

    this.globalEvents.emit('MessagePipeline:Ready', {
      message: 'Message pipeline is ready.',
    });
  }

  /**
   * Handle incoming message
   * @template T EventMap
   * @param {T['DiscordClient:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: T['DiscordClient:IncomingMessage']): Promise<void> {
    // Ignore bot's own messages
    if (data.message.type === 'OwnMessage') return;

    const userContext = await this.summarizeUser(data);

    const channelHistory = await this.discordClient.getChannelHistory(data.message.originalMessage.channelId);

    this.globalEvents.emit('MessagePipeline:IncomingMessage', {
      messageHistory: channelHistory,
      userContext: userContext,
    });
  }

  /**
   * Handle response complete
   * @template T EventMap
   * @param {T['OpenAIClient:ResponseComplete']} data Response complete
   */
  private async handleResponseComplete(data: T['OpenAIClient:ResponseComplete']): Promise<void> {
    await this.discordClient.sendMessage(data.channelId, data.response);
  }

  /**
   * Register message pipeline event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('DiscordClient:IncomingMessage', (data) => {
      this.handleIncomingMessage(data);
    });

    this.globalEvents.on('OpenAIClient:ResponseComplete', (data) => {
      this.handleResponseComplete(data);
    });
  }

  /**
   * Summarize user behavior
   * @template T EventMap
   * @param {T['DiscordClient:IncomingMessage']} data Incoming message
   * @returns {Promise<string>} User context
   */
  private async summarizeUser(data: T['DiscordClient:IncomingMessage']): Promise<string> {
    const messages: string[] = [];
    const channels = await data.message.originalMessage.guild?.channels.fetch();

    if (channels) {
      const channelWait = channels.map(async (channel) => {
        const channelObject = channels.get(channel?.id as string);

        if (channelObject?.isTextBased()) {
          await this.discordClient.getChannelHistory(
            channelObject.id,
            data.message.originalMessage.author.id,
          ).then(history => history
            .filter(message => message.content.length > 0)
            .map((message) => {
              messages.push(message.content);
            }));
        }
      });

      await Promise.all(channelWait);
    }

    return messages.map(message => `- ${message}`).join('\n');
  }
}
