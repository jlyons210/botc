export class BraveNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BraveNotAllowedError";
  }
}
