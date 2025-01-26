import { CustomSystemPrompt, ReplyDecisionResponse } from './index.js';
import { EventBus, EventMap } from '../../Botc/EventBus/index.js';
import { BotcMessage } from '../../Botc/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';

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

    this.globalEvents.emit('OpenAIClient:Ready', {
      message: 'OpenAI client is ready.',
    });
  }

  /**
   * Create prompt payload
   * @param {BotcMessage[]} messageHistory Message history
   * @param {CustomSystemPrompt} customSystemPrompt Custom system prompt
   * @returns {ChatCompletionMessageParam[]} Chat completion message
   */
  private createPromptPayload(messageHistory: BotcMessage[], customSystemPrompt?: CustomSystemPrompt): ChatCompletionMessageParam[] {
    const payload = messageHistory.map(message => ({
      content: message.content,
      name: message.nameSanitized,
      role: message.role,
    } as ChatCompletionMessageParam));

    const systemPrompt = (customSystemPrompt?.append)
      ? `${this.config.systemPrompt.value as string}\n${customSystemPrompt.value}`
      : customSystemPrompt?.value || this.config.systemPrompt.value as string;

    payload.unshift({
      content: systemPrompt,
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
   * @param {EventMap['MessagePipeline:IncomingMessage']} data Incoming message
   */
  private async handleIncomingMessage(data: EventMap['MessagePipeline:IncomingMessage']): Promise<void> {
    // Bypass reply decision prompt for DMs, evaluate otherwise
    const messageIsDM = data.messageHistory[0].type === 'DirectMessage';
    if (!messageIsDM && !await this.willReplyToMessage(data.messageHistory)) {
      return;
    }

    this.startTyping(data.messageHistory[0].channelId);

    // Generate a summary of the user's server-wide behavior
    const nameSanitized = data.messageHistory[0].nameSanitized;
    const personaPrompt = await this.createPromptPayload(
      data.serverHistory,
      {
        value: `Summarize the following messages to build a persona for the user ${nameSanitized}.`,
        append: false,
      },
    );
    const persona = await this.createCompletion(personaPrompt);

    // Generate a response, factoring in the user's persona
    const payload = await this.createPromptPayload(
      data.messageHistory,
      {
        value: `For a richer response, here is a summary about ${nameSanitized}:\n${persona}`,
        append: true,
      },
    );
    const responseMessage = await this.createCompletion(payload);

    // Emit the response
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
   * Send typing indicator to channel
   * @param {string} channelId Channel ID
   */
  private startTyping(channelId: string): void {
    this.globalEvents.emit('OpenAIClient:StartTyping', {
      channelId: channelId,
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
      {
        value: this.config.replyDecisionPrompt.value as string,
        append: false,
      },
    );

    const responseMessage = await this.createCompletion(payload);

    try {
      const responseJson: ReplyDecisionResponse = JSON.parse(responseMessage);
      return responseJson.respondToUser.toLowerCase() === 'yes';
    }
    catch (error) {
      console.error(`OpenAIClient.willReplyToMessage: Error ${error} parsing JSON: ${responseMessage}`);

      // Fail-safe: check for "yes" in malformed JSON response
      return responseMessage.toLowerCase().includes('"yes"');
    }
  }
}
