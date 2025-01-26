import { EventBus, EventMap } from '../../Botc/EventBus/index.js';
import { BotcMessage } from '../../Botc/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';
import { replyDecisionResponse } from './OpenAIClient.types.js';

/**
 * OpenAI client
 */
export class OpenAIClient<T extends EventMap> {
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

    this.globalEvents.emit('OpenAIClient:Ready', {
      message: 'OpenAI client is ready.',
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
        console.debug(`OpenAIClient.createCompletion: payload: ${JSON.stringify(payload)}`);
      }

      return '';
    }
  }

  /**
   * Handle incoming message
   * @template T EventMap
   * @param {T['MessagePipeline:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: T['MessagePipeline:IncomingMessage']): Promise<void> {
    /**
     * Bypass reply decision prompt for DMs, evaluate otherwise
     */
    const messageIsDM = data.messageHistory[0].type === 'DirectMessage';
    if (!messageIsDM && !await this.willReplyToMessage(data.messageHistory)) {
      return;
    }

    const summary = await this.createPromptPayload(
      data.userContext,
      'Summarize the following messages to build a persona for the user.',
    );

    const payload = await this.createPromptPayload(data.messageHistory);
    const responseMessage = await this.createCompletion(payload);

    this.globalEvents.emit('OpenAIClient:ResponseComplete', {
      channelId: data.messageHistory[0].channelId,
      response: responseMessage,
    });
  }

  /**
   * Register event handlers
   */
  private registerHandlers(): void {
    this.globalEvents.on('MessagePipeline:IncomingMessage', (data) => {
      this.handleIncomingMessage(data);
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
      return responseJson.respondToUser.toLowerCase() === 'yes';
    }
    catch (error) {
      console.error(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`);

      // Fail-safe: check for "yes" in malformed JSON response
      return responseMessage.toLowerCase().includes('"yes"');
    }
  }
}
