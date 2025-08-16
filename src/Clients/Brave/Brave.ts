import { BraveSettings, ConfigurationOptions } from '../../Botc/Configuration/index.js';
import { BraveNotAllowedError } from './Brave.errors.js';
import { ChatCompletionMessageParam } from 'openai/resources';
import { EventBus } from '../../Botc/EventBus/index.js';
import { Logger } from '../../Botc/Logger/index.js';
import OpenAI from 'openai';

/**
 * Brave client wrapper
 */
export class Brave {
  private readonly brave: OpenAI;
  private readonly globalEvents = EventBus.attach();
  private readonly logger: Logger;
  private braveConfig: BraveSettings;

  /**
   * New Brave client
   * @param {ConfigurationOptions} config Brave client configuration
   */
  constructor(private config: ConfigurationOptions) {
    this.braveConfig = this.config.llms.brave;
    this.logger = new Logger(this.config.debugLoggingEnabled.value as boolean);

    this.brave = new OpenAI({
      apiKey: this.braveConfig.apikey.value as string,
      baseURL: 'https://api.search.brave.com/res/v1',
      maxRetries: 3,
      timeout: 10000,
    });

    this.globalEvents.emit('Brave:Ready', {
      message: 'Brave client is ready.',
    });
  }

  /**
   * Create completion
   * @param {ChatCompletionMessageParam[]} query Chat completion message
   * @returns {Promise<string>} string
   */
  public async createGroundingResponse(query: string): Promise<string> {
    try {
      const payload = [{
        role: 'user',
        content: query,
      }] as ChatCompletionMessageParam[];

      const completion = await this.brave.chat.completions.create({
        messages: payload,
        model: 'brave',
      });

      return completion.choices[0].message.content as string;
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(`Brave.createCompletion: Brave API error.`, 'ERROR');
        this.logger.log(`Brave.createCompletion: error: ${error.message}`, 'ERROR');
      }
      else {
        this.logger.log(`Brave.createCompletion: ${error}`, 'ERROR');
        this.logger.log(`Brave.createCompletion: payload: ${JSON.stringify(query)}`, 'DEBUG');
      }

      throw new BraveNotAllowedError('Brave API request failed.');
    }
  }
}
