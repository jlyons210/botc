import type { Sharp } from "sharp";

/** Options for resizing a Sharp image. */
export type ResizeImageConfig = {
  /** Image to resize. */
  image: Sharp;
  /** Target height in pixels. */
  height: number;
  /** Target width in pixels. */
  width: number;
};
