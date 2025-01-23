import { BotcMessage } from '../../Botc/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { EventBus } from '../../Botc/Core/EventBus/index.js';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Core/Configuration/index.js';

/**
 * OpenAI client
 */
export class OpenAIClient {
  private client: OpenAI;
  private globalEvents = EventBus.attach();

  /**
   * New OpenAIClient
   * @param {OpenAISettings} config OpenAI client configuration
   */
  constructor(private config: OpenAISettings) {
    this.registerHandlers();

    this.client = new OpenAI({
      apiKey: config.apikey.value as string,
      maxRetries: 3,
      timeout: 15000,
    });
  }

  /**
   * Create prompt payload
   * @param {BotcMessage[]} messageHistory Message history
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private createPromptPayload(messageHistory: BotcMessage[]): ChatCompletionMessageParam[] {
    const payload = messageHistory.map(message => ({
      content: message.content,
      name: message.username,
      role: message.role,
    } as ChatCompletionMessageParam));

    payload.unshift({
      content: this.config.systemPrompt.value as string,
      role: 'system',
    });

    return payload;
  }

  /**
   * Create completion
   * @param {ChatCompletionMessageParam[]} payload Chat completion message
   * @returns {Promise<string>} string
   */
  public async createCompletion(payload: ChatCompletionMessageParam[]): Promise<string> {
    const completion = await this.client.chat.completions.create({
      model: this.config.model.value as string,
      messages: payload,
    });

    return completion.choices[0].message.content as string;
  }

  /**
   * Handle incoming message
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async handleIncomingMessage(messageHistory: BotcMessage[]): Promise<void> {
    const payload = this.createPromptPayload(messageHistory);
    const responseMessage = await this.createCompletion(payload as ChatCompletionMessageParam[]);

    this.globalEvents.emit('OpenAIClient:ResponseComplete', {
      channelId: messageHistory[0].channelId,
      message: responseMessage,
    });
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('MessagePipeline:IncomingMessage', (data) => {
      this.handleIncomingMessage(data.messageHistory);
    });
  }
}
