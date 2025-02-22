import { ElevenLabsClient } from 'elevenlabs';
import { ElevenLabsSettings } from '../../Botc/Configuration/index.js';
import EventBus from '../../Botc/EventBus/EventBus.js';
import fs from 'node:fs/promises';
import { join } from 'node:path';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';

/**
 * ElevenLabs client wrapper
 */
export class ElevenLabs {
  private readonly client: ElevenLabsClient;
  private readonly globalEvents = EventBus.attach();

  /**
   * New ElevenLabs client
   * @param {ElevenLabsSettings} config ElevenLabs configuration
   */
  constructor(private config: ElevenLabsSettings) {
    this.client = new ElevenLabsClient({
      apiKey: config.apikey.value as string,
    });

    this.globalEvents.emit('ElevenLabsClient:Ready', {
      message: 'ElevenLabs client is ready.',
    });
  }

  /**
   * Generate speech from text
   * @param {string} text Text to generate speech from
   * @returns {Promise<string>} Path to generated audio file
   */
  public async generateVoiceFile(text: string): Promise<string> {
    const response = await this.client.generate({
      model_id: this.config.modelId.value as string,
      text: text,
      voice: this.config.voiceId.value as string,
      voice_settings: {
        similarity_boost: 0.5,
        stability: 0.5,
      },
    });

    const tempDir = mkdtempSync(join(tmpdir(), 'botc-'));
    const fullPath = join(tempDir, `botc-voice-response-${Date.now()}.mp3`);
    await fs.writeFile(fullPath, response, 'binary');

    return fullPath;
  }
}
