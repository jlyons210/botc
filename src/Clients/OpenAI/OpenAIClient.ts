import { BotcMessage } from '../../Botc/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { EventBus } from '../../Botc/EventBus/index.js';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';
import { replyDecisionResponse } from './OpenAIClient.types.js';

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
      maxRetries: config.maxRetries.value as number,
      timeout: config.timeout.value as number,
    });
  }

  /**
   * Create prompt payload
   * @param {BotcMessage[]} messageHistory Message history
   * @param {string} systemPromptOverride (optional) System prompt override
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private createPromptPayload(messageHistory: BotcMessage[], systemPromptOverride?: string): ChatCompletionMessageParam[] {
    const payload = messageHistory.map(message => ({
      content: message.content,
      name: message.nameSanitized,
      role: message.role,
    } as ChatCompletionMessageParam));

    payload.unshift({
      content: systemPromptOverride || this.config.systemPrompt.value as string,
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
    try {
      const completion = await this.client.chat.completions.create({
        model: this.config.model.value as string,
        messages: payload,
      });

      return completion.choices[0].message.content as string;
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        console.error(`OpenAIClient.createCompletion: OpenAI API error.`);
      }
      else {
        console.error(`OpenAIClient.createCompletion: ${error}`);
      }

      return '';
    }
  }

  /**
   * Handle incoming message
   * @param {BotcMessage[]} messageHistory Message history
   */
  private async handleIncomingMessage(messageHistory: BotcMessage[]): Promise<void> {
    if (!await this.willReplyToMessage(messageHistory)) return;

    const payload = await this.createPromptPayload(messageHistory);
    const responseMessage = await this.createCompletion(payload);

    this.globalEvents.emit('OpenAIClient:ResponseComplete', {
      channelId: messageHistory[0].channelId,
      response: responseMessage,
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

  /**
   * Decides whether to reply based on conversation history
   * @param {BotcMessage[]} messageHistory Message history
   * @returns {Promise<boolean>} boolean
   */
  private async willReplyToMessage(messageHistory: BotcMessage[]): Promise<boolean> {
    const payload = this.createPromptPayload(
      messageHistory,
      this.config.replyDecisionPrompt.value as string,
    );

    const responseMessage = await this.createCompletion(payload);

    try {
      const responseJson: replyDecisionResponse = JSON.parse(responseMessage);
      const response = responseJson.respondToUser.toLowerCase() === 'yes';
      return response;
    }
    catch (error) {
      console.error(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`);

      // Fail-safe: check for "yes" in malformed JSON response
      const response = responseMessage.toLowerCase().includes('"yes"');
      console.debug(`OpenAIClient.willReplyToMessage: response: ${response}`);

      return response;
    }
  }
}
