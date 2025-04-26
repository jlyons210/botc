import { ConfigurationOptions, OpenAISettings } from '../../Botc/Configuration/index.js';
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { EventBus } from '../../Botc/EventBus/index.js';
import { Logger } from '../../Botc/Logger/index.js';
import OpenAI from 'openai';
import { OpenAINotAllowedError } from './OpenAIClient.errors.js';

/**
 * OpenAI client wrapper
 * @todo Enhance API error handling. Returning '' will break Discord message sending.
 */
export class OpenAIClient {
  private readonly client: OpenAI;
  private readonly globalEvents = EventBus.attach();
  private readonly logger: Logger;
  private openAIConfig: OpenAISettings;
  private readonly model: string;

  /**
   * New OpenAIClient
   * @param {ConfigurationOptions} config OpenAI client configuration
   */
  constructor(private config: ConfigurationOptions) {
    this.openAIConfig = this.config.llms.openai;
    this.logger = new Logger(this.config.debugLoggingEnabled.value as boolean);

    this.client = new OpenAI({
      apiKey: this.openAIConfig.apikey.value as string,
      maxRetries: this.openAIConfig.maxRetries.value as number,
      timeout: this.openAIConfig.timeout.value as number,
    });

    this.model = this.openAIConfig.model.value as string;

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
   * Create image
   * @param {string} prompt Image creation prompt
   * @returns {Promise<string>} Image base64 string
   */
  public async createImage(prompt: string): Promise<string> {
    try {
      const image = await this.client.images.generate({
        prompt: prompt,
        model: 'gpt-image-1',
        n: 1,
        moderation: 'low',
        output_format: 'png',
      });

      return (image.data && image.data.length > 0)
        ? image.data[0].b64_json as string
        : '';
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(`OpenAIClient.createImage: OpenAI API error.`, 'ERROR');
        this.logger.log(`OpenAIClient.createImage: error: ${error.message}`, 'ERROR');
      }
      else {
        this.logger.log(`OpenAIClient.createImage: ${error}`, 'ERROR');
        this.logger.log(`OpenAIClient.createImage: prompt: ${JSON.stringify(prompt)}`, 'DEBUG');
      }

      return '';
    }
  }

  /**
   * Edit image
   * @param {string} prompt Image editing prompt
   * @param {string[]} imageUrls Image URLs
   * @returns {Promise<string>} Edited image base64 string
   */
  public async editImage(prompt: string, imageUrls: string[]): Promise<string> {
    this.logger.log(`OpenAIClient.editImage: imageUrls: ${JSON.stringify(imageUrls)}`, 'DEBUG');

    const imageFiles = await Promise.all(imageUrls.map(async (url) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const extension = blob.type.split('/')[1];
      const filename = `image.${extension}`;
      return new File([blob], filename, { type: blob.type });
    }));

    try {
      const image = await this.client.images.edit({
        prompt: prompt,
        model: 'gpt-image-1',
        n: 1,
        image: imageFiles,
      });

      return (image.data && image.data.length > 0)
        ? image.data[0].b64_json as string
        : '';
    }
    catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(`OpenAIClient.editImage: OpenAI API error.`, 'ERROR');
        this.logger.log(`OpenAIClient.editImage: error: ${error.message}`, 'ERROR');
      }
      else {
        this.logger.log(`OpenAIClient.editImage: ${error}`, 'ERROR');
        this.logger.log(`OpenAIClient.editImage: prompt: ${JSON.stringify(prompt)}`, 'DEBUG');
      }

      throw new OpenAINotAllowedError('OpenAI API rejected the request.');
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
    const describeImagePrompt = this.openAIConfig.describeImagePrompt.value as string;
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
