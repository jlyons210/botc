import { Sharp } from 'sharp';

/**
 * ResizeImageConfig
 * @property {Sharp} image - Sharp image object
 * @property {number} height - Height of the image
 * @property {number} width - Width of the image
 */
export type ResizeImageConfig = {
  image: Sharp;
  height: number;
  width: number;
};
