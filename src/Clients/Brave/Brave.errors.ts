/**
 * Brave client errors
 */
export class BraveNotAllowedError extends Error {
  /**
   * BraveNotAllowedError constructor
   * @param message - Error message
   */
  constructor(message: string) {
    super(message);
    this.name = "BraveNotAllowedError";
  }
}
