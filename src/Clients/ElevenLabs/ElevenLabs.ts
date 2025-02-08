import { ElevenLabsClient } from 'elevenlabs';
import { ElevenLabsSettings } from '../../Botc/Configuration/index.js';
import { Readable } from 'node:stream';

/**
 * ElevenLabs client wrapper
 */
export class ElevenLabs {
  private client: ElevenLabsClient;

  /**
   * New ElevenLabsClient
   * @param {ElevenLabsSettings} config ElevenLabs configuration
   */
  constructor(private config: ElevenLabsSettings) {
    this.client = new ElevenLabsClient({
      apiKey: config.apikey.value as string,
    });
  }

  /**
   * Generate speech from text
   * @param {string} text Text to generate speech from
   * @returns {Promise<any>} Speech generation response
   */
  public async generateSpeech(text: string): Promise<Readable> {
    return await this.client.generate({
      model_id: this.config.modelId.value as string,
      text: text,
      voice: this.config.voiceId.value as string,
      voice_settings: {
        similarity_boost: 0.5,
        stability: 0.5,
      },
    });
  }
}
