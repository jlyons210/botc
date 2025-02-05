import {
  Image,
  createCanvas,
  loadImage,
} from 'canvas';

/**
 * Resizes images to fit within Vision API size limits
 */
export class ResizedImage {
  /**
   * Fetch image
   * @param {string} imageUrl Image URL
   * @returns {Promise<Buffer | null>} Image buffer
   */
  private async fetchImage(imageUrl: string): Promise<Image | null> {
    return await fetch(imageUrl)
      .then(response => response.arrayBuffer())
      .then(buffer => Buffer.from(buffer))
      .then(buffer => loadImage(buffer))
      .catch((error) => {
        console.error(`OpenAIClient.resizeImageIfOversized: Error fetching image: ${error}`);
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

    // Image long side must not be >2000px, and image short side must not be >768px
    const longSide = Math.max(fetchedImage.width, fetchedImage.height);
    const shortSide = Math.min(fetchedImage.width, fetchedImage.height);

    // Return resized image URL if oversized or original image URL if within size limits
    return (longSide > 2000 || shortSide > 768)
      ? this.resizeImage(fetchedImage)
      : imageUrl;
  }

  /**
   * Resize image
   * @param {Image} image Image (canvas)
   * @returns {string} Image URL
   */
  private resizeImage(image: Image): string {
    console.debug(`OpenAIClient.resizeImageIfOversized: Image dimensions exceed maximum size, resizing.`);

    // Calculate new image dimensions
    const aspectRatio = image.width / image.height;
    const newWidth = (aspectRatio > 1) ? 2000 : 768;
    const newHeight = Math.round(newWidth / aspectRatio);

    // Resize image
    const canvas = createCanvas(newWidth, newHeight);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, newWidth, newHeight);
    const resizedImageBuffer = canvas.toBuffer('image/jpeg');

    // Return resized image URL
    return `data:image/jpeg;base64,${resizedImageBuffer.toString('base64')}`;
  }
}
