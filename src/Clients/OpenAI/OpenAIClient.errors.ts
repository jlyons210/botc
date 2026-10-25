export class OpenAINotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAINotAllowedError";
  }
}
