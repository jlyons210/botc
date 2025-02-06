import sharp, { Sharp } from 'sharp';
import { ResizeImageConfig } from './index.js';

/**
 * Resizes images to fit within Vision API size limits
 */
export class Resizer {
  /**
   * Fetch image
   * @param {string} imageUrl Image URL
   * @returns {Promise<Buffer | null>} Image buffer
   */
  private async fetchImage(imageUrl: string): Promise<Sharp | null> {
    return await fetch(imageUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => Buffer.from(buffer))
      .then(buffer => sharp(buffer))
      .catch((error) => {
        console.error(`Resizer.fetchImage: Error fetching image: ${error}`);
        return null;
      });
  }

  /**
   * Preprocess image
   * @param {string} imageUrl Image URL
   * @returns {Promise<string>} Resized or original image URL
   */
  public async getUrl(imageUrl: string): Promise<string> {
    // Fetch image
    const fetchedImage = await this.fetchImage(imageUrl);
    if (!fetchedImage) {
      return '';
    }

    // Retrieve image width and height from original image
    const metadata = await fetchedImage.metadata();
    const originalWidth = metadata.width as number;
    const originalHeight = metadata.height as number;

    // Calculate new image dimensions
    const aspectRatio = originalWidth / originalHeight;
    const newWidth = (aspectRatio > 1) ? 2000 : 768;
    const newHeight = Math.round(newWidth / aspectRatio);

    // Image long side must not be >2000px, and image short side must not be >768px
    const longSide = Math.max(originalWidth, originalHeight);
    const shortSide = Math.min(originalWidth, originalHeight);

    // Return resized image URL if oversized or original image URL if within size limits
    return (longSide > 2000 || shortSide > 768)
      ? this.resizeImage({
          image: fetchedImage,
          height: newHeight,
          width: newWidth,
        })
      : imageUrl;
  }

  /**
   * Resize image
   * @param {ResizeImageConfig} config Resize image configuration
   * @returns {string} Image URL
   */
  private async resizeImage(config: ResizeImageConfig): Promise<string> {
    // Resize image
    const resizedImageBuffer = await config.image
      .resize(config.width, config.height)
      .png()
      .toBuffer();

    // Return resized image URL
    return `data:image/png;base64,${resizedImageBuffer.toString('base64')}`;
  }
}
