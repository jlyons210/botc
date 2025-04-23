import { ConfigurationOptions, ElevenLabsSettings } from '../../Botc/Configuration/index.js';
import { ElevenLabsClient } from 'elevenlabs';
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
  private elevenlabsConfig!: ElevenLabsSettings;
  private readonly globalEvents = EventBus.attach();

  /**
   * New ElevenLabs client
   * @param {ConfigurationOptions} config Botc configuration
   */
  constructor(private config: ConfigurationOptions) {
    this.elevenlabsConfig = this.config.llms.elevenlabs;

    this.client = new ElevenLabsClient({
      apiKey: this.elevenlabsConfig.apikey.value as string,
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
      model_id: this.elevenlabsConfig.modelId.value as string,
      text: text,
      voice: this.elevenlabsConfig.voiceId.value as string,
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
