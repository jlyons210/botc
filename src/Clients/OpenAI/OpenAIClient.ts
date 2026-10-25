import type {
  ConfigurationOptions,
  OpenAISettings,
} from "../../Botc/Configuration/index.ts";
import { EventBus } from "../../Botc/EventBus/index.ts";
import { Logger } from "../../Botc/Logger/index.ts";
import OpenAI from "openai";
import { OpenAINotAllowedError } from "./OpenAIClient.errors.ts";
import { type ResponseInputItem } from "openai/resources/responses/responses.js";

export type OpenAIResponsePayload = {
  instructions?: string;
  input: ResponseInputItem[];
};

export class OpenAIClient {
  private readonly client: OpenAI;
  private readonly globalEvents = EventBus.attach();
  private readonly logger: Logger;
  private openAIConfig: OpenAISettings;
  private readonly imageModel: string;
  private readonly model: string;
  private config: ConfigurationOptions;

  constructor(config: ConfigurationOptions) {
    this.config = config;
    this.openAIConfig = this.config.llms.openai;
    this.logger = new Logger(
      this.config.featureGates.enableDebugLogging.value as boolean,
    );

    this.client = new OpenAI({
      apiKey: this.openAIConfig.apikey.value as string,
      maxRetries: this.openAIConfig.maxRetries.value as number,
      timeout: this.openAIConfig.timeout.value as number,
    });

    this.imageModel = this.openAIConfig.imageModel.value as string;
    this.model = this.openAIConfig.model.value as string;

    this.globalEvents.emit("OpenAIClient:Ready", {
      message: "OpenAI client is ready.",
    });
  }

  /**
   * Create a response
   * @param payload - Response instructions and conversation input
   * @returns Response text
   */
  public async createResponse(payload: OpenAIResponsePayload): Promise<string> {
    try {
      const response = await this.client.responses.create({
        model: this.model,
        instructions: payload.instructions,
        input: payload.input,
        reasoning: {
          effort: this.openAIConfig.modelReasoningEffort
            .value as OpenAI.ReasoningEffort,
        },
        store: false,
      });

      return response.output_text;
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(
          "OpenAIClient.createResponse: OpenAI API error.",
          "ERROR",
        );
        this.logger.log(
          `OpenAIClient.createResponse: error: ${error.message}`,
          "ERROR",
        );
      } else {
        this.logger.log(`OpenAIClient.createResponse: ${error}`, "ERROR");
        this.logger.log(
          `OpenAIClient.createResponse: payload: ${JSON.stringify(payload)}`,
          "DEBUG",
        );
      }

      throw new OpenAINotAllowedError("OpenAI API rejected the request.");
    }
  }

  /**
   * Generate or edit an image
   * @param prompt - Image creation or editing prompt
   * @param imageUrls - Image URLs
   * @returns Image base64 string
   */
  public async createImage(
    prompt: string,
    imageUrls: string[] = [],
  ): Promise<string> {
    const imageFiles = await Promise.all(
      imageUrls.map(async (url) => {
        const response = await fetch(url);
        const blob = await response.blob();
        const extension = blob.type.split("/")[1];
        const filename = `image.${extension}`;
        return new File([blob], filename, { type: blob.type });
      }),
    );

    try {
      const response =
        imageFiles.length > 0
          ? await this.client.images.edit({
              prompt: prompt,
              model: this.imageModel,
              n: 1,
              image: imageFiles,
            })
          : await this.client.images.generate({
              prompt: prompt,
              model: this.imageModel,
              n: 1,
              moderation: "low",
              output_format: "png",
            });

      const imageData = response.data?.[0]?.b64_json;
      if (imageData) {
        return imageData;
      }

      throw new OpenAINotAllowedError("OpenAI API rejected the request.");
    } catch (error) {
      if (error instanceof OpenAI.APIError) {
        this.logger.log(
          `OpenAIClient.generateImage: OpenAI API error.`,
          "ERROR",
        );
        this.logger.log(
          `OpenAIClient.generateImage: error: ${error.message}`,
          "ERROR",
        );
      } else {
        this.logger.log(`OpenAIClient.generateImage: ${error}`, "ERROR");
        this.logger.log(
          `OpenAIClient.generateImage: prompt: ${JSON.stringify(prompt)}`,
          "DEBUG",
        );
      }

      throw new OpenAINotAllowedError("OpenAI API rejected the request.");
    }
  }

  /**
   * Create transcription
   * @param audioFile - Audio file
   * @returns Transcription
   */
  public async generateAudioTranscription(audioFile: File): Promise<string> {
    const transcription = await this.client.audio.transcriptions.create({
      file: audioFile,
      model: "gpt-transcribe",
    });

    return transcription.text;
  }

  /**
   * Generate image description
   * @param imageUrl - Image URL
   * @returns Image description
   */
  public async generateImageDescription(imageUrl: string): Promise<string> {
    const describeImagePrompt = this.openAIConfig.describeImagePrompt
      .value as string;
    const payload: OpenAIResponsePayload = {
      input: [
        {
          role: "user",
          content: [
            { type: "input_text", text: describeImagePrompt },
            { type: "input_image", image_url: imageUrl, detail: "auto" },
          ],
        },
      ],
    };

    return await this.createResponse(payload);
  }
}
