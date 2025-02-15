import { Sharp } from 'sharp';

export type ResizeImageConfig = {
  image: Sharp;
  height: number;
  width: number;
};
