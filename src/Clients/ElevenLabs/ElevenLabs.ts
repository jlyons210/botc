import type {
  ConfigurationOptions,
  ElevenLabsSettings,
} from "../../Botc/Configuration/index.ts";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import EventBus from "../../Botc/EventBus/EventBus.ts";
import { Readable } from "node:stream";

/**
 * ElevenLabs client wrapper
 */
export class ElevenLabs {
  private readonly client: ElevenLabsClient;
  private readonly elevenlabsConfig: ElevenLabsSettings;
  private readonly globalEvents = EventBus.attach();
  private config: ConfigurationOptions;

  /**
   * New ElevenLabs client
   * @param config - Botc configuration
   */
  constructor(config: ConfigurationOptions) {
    this.config = config;
    this.elevenlabsConfig = this.config.llms.elevenlabs;

    this.client = new ElevenLabsClient({
      apiKey: this.elevenlabsConfig.apikey.value as string,
    });

    this.globalEvents.emit("ElevenLabsClient:Ready", {
      message: "ElevenLabs client is ready.",
    });
  }

  /**
   * Generate speech from text
   * @param text - Text to generate speech from
   * @returns Stream containing generated audio
   */
  public async generateVoiceStream(text: string): Promise<Readable> {
    const response = await this.client.textToSpeech.convert(
      this.elevenlabsConfig.voiceId.value as string,
      {
        modelId: this.elevenlabsConfig.modelId.value as string,
        text: text,
        voiceSettings: {
          similarityBoost: 0.5,
          stability: 0.5,
        },
      },
    );

    return Readable.from(response);
  }
}
