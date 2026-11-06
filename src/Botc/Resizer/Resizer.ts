import type { Sharp } from "sharp";
import sharp from "sharp";
import { Logger } from "../Logger/index.ts";
import type { ResizeImageConfig } from "./index.ts";

/**
 * Caps oversized images before sending them to the vision API
 */
export class Resizer {
  private readonly logger = new Logger();
  private readonly maxImageSide: number;

  constructor(maxImageSide: number) {
    if (!Number.isInteger(maxImageSide) || maxImageSide < 1) {
      throw new RangeError("Maximum image side must be a positive integer.");
    }
    this.maxImageSide = maxImageSide;
  }

  private async fetchImage(imageUrl: string): Promise<Sharp | null> {
    return await fetch(imageUrl)
      .then((response) => response.arrayBuffer())
      .then((buffer) => Buffer.from(buffer))
      .then((buffer) => sharp(buffer))
      .catch((error) => {
        this.logger.log(
          `Resizer.fetchImage: Error fetching image: ${error}`,
          "ERROR",
        );
        return null;
      });
  }

  /**
   * Preprocess image
   * @param imageUrl - Image URL
   * @returns Resized or original image URL
   */
  public async getUrl(imageUrl: string): Promise<string> {
    const fetchedImage = await this.fetchImage(imageUrl);
    if (!fetchedImage) {
      return "";
    }

    const { width, height } = await fetchedImage.metadata();
    if (!width || !height) {
      return imageUrl;
    }

    const longestSide = Math.max(width, height);
    if (longestSide <= this.maxImageSide) {
      return imageUrl;
    }

    const scale = this.maxImageSide / longestSide;
    return this.resizeImage({
      image: fetchedImage,
      width: Math.max(1, Math.floor(width * scale)),
      height: Math.max(1, Math.floor(height * scale)),
    });
  }

  /**
   * Prepares an image as a resized PNG data URL.
   * @param imageUrl - Image URL
   * @returns PNG data URL
   */
  public async getDataUrl(imageUrl: string): Promise<string> {
    const fetchedImage = await this.fetchImage(imageUrl);
    if (!fetchedImage) {
      return "";
    }

    const { width, height } = await fetchedImage.metadata();
    if (!width || !height) {
      return this.encodeImage(fetchedImage);
    }

    const longestSide = Math.max(width, height);
    if (longestSide <= this.maxImageSide) {
      return this.encodeImage(fetchedImage);
    }

    const scale = this.maxImageSide / longestSide;
    return this.resizeImage({
      image: fetchedImage,
      width: Math.max(1, Math.floor(width * scale)),
      height: Math.max(1, Math.floor(height * scale)),
    });
  }

  private async resizeImage(config: ResizeImageConfig): Promise<string> {
    return this.encodeImage(
      config.image.resize(config.width, config.height, {
        fit: "inside",
        withoutEnlargement: true,
      }),
    );
  }

  private async encodeImage(image: Sharp): Promise<string> {
    const imageBuffer = await image.png().toBuffer();
    return `data:image/png;base64,${imageBuffer.toString("base64")}`;
  }
}
