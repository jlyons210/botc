import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { EventBus } from '../../Botc/EventBus/index.js';
import { Logger } from '../../Botc/Logger/Logger.js';
import OpenAI from 'openai';
import { OpenAISettings } from '../../Botc/Configuration/index.js';

/**
 * OpenAI client wrapper
 * @todo Enhance API error handling. Returning '' will break Discord message sending.
 */
export class OpenAIClient {
  private readonly client: OpenAI;
  private readonly globalEvents = EventBus.attach();
  private readonly logger = new Logger();
  private readonly model: string;

  /**
   * New OpenAIClient
   * @param {OpenAISettings} config OpenAI client configuration
   */
  constructor(private config: OpenAISettings) {
    this.client = new OpenAI({
      apiKey: config.apikey.value as string,
      maxRetries: config.maxRetries.value as number,
      timeout: config.timeout.value as number,
    });

    this.model = config.model.value as string;

    this.globalEvents.emit('OpenAIClient:Ready', {
      message: 'OpenAI client is ready.',
    });
  }

  /**
   * Create completion
   * @param {ChatCompletionMessageParam[]} payload Chat completion message
   * @returns {Promise<string>} string
   */
  public async createCompletion(payload: ChatCompletionMessageParam[]): Promise<string> {
    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: payload,
      });

      return completion.choices[0].message.content as string;
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(`OpenAIClient.createCompletion: OpenAI API error.`, 'ERROR');
        this.logger.log(`OpenAIClient.createCompletion: error: ${error.message}`, 'ERROR');
      }
      else {
        this.logger.log(`OpenAIClient.createCompletion: ${error}`, 'ERROR');
        this.logger.log(`OpenAIClient.createCompletion: payload: ${JSON.stringify(payload)}`, 'DEBUG');
      }

      return '';
    }
  }

  /**
   * Create transcription
   * @param {File} audioFile Audio file
   * @returns {Promise<string>} Transcription
   */
  public async generateAudioTranscription(audioFile: File): Promise<string> {
    return await this.client.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: 'text',
    });
  }

  /**
   * Generate image description
   * @param {string} imageUrl Image URL
   * @returns {Promise<string>} Image description
   */
  public async generateImageDescription(imageUrl: string): Promise<string> {
    const describeImagePrompt = this.config.describeImagePrompt.value as string;
    const payload = [{
      role: 'user',
      content: [
        { type: 'text', text: describeImagePrompt },
        { type: 'image_url', image_url: { url: imageUrl } },
      ],
    }] satisfies ChatCompletionMessageParam[];

    return await this.createCompletion(payload);
  }
}
