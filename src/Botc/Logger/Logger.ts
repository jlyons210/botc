import type { LogLevel } from "./index.ts";

export class Logger {
  private readonly debugLoggingIsEnabled: boolean;

  constructor(debugLoggingIsEnabled = false) {
    this.debugLoggingIsEnabled = debugLoggingIsEnabled;
  }

  /**
   * Write a timestamped message at the requested level. Debug messages are skipped unless debug
   * logging is enabled.
   * @param message - Message to write.
   * @param level - Severity: DEBUG, INFO, or ERROR.
   */
  public async log(message: string, level: LogLevel): Promise<void> {
    // Don't log if debug logging is disabled and the level is DEBUG
    if (level === "DEBUG" && !this.debugLoggingIsEnabled) {
      return;
    }

    const timestamp = new Date().toISOString();

    switch (level) {
      case "DEBUG":
        console.debug(`${timestamp} - ${level} - ${message}`);
        break;
      case "INFO":
        console.log(`${timestamp} - ${level} - ${message}`);
        break;
      case "ERROR":
        console.error(`${timestamp} - ${level} - ${message}`);
        break;
    }
  }
}
