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

  /**
   * Fetch image
   * @param imageUrl - Image URL
   * @returns Image buffer
   */
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
    // Fetch image
    const fetchedImage = await this.fetchImage(imageUrl);
    if (!fetchedImage) {
      return "";
    }

    // Retrieve image width and height from original image
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
   * Resize image
   * @param config - Resize image configuration
   * @returns Image URL
   */
  private async resizeImage(config: ResizeImageConfig): Promise<string> {
    // Resize image
    const resizedImageBuffer = await config.image
      .resize(config.width, config.height, {
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    // Return resized image URL
    return `data:image/png;base64,${resizedImageBuffer.toString("base64")}`;
  }
}
