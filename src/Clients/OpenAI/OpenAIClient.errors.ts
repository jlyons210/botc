/**
 * OpenAINotAllowedError
 * This error is thrown when the OpenAI API is not allowed to be used.
 */
export class OpenAINotAllowedError extends Error {
  /**
   * OpenAINotAllowedError constructor
   * @param {string} message Error message
   */
  constructor(message: string) {
    super(message);
    this.name = 'OpenAINotAllowedError';
  }
}
