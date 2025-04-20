import { LogLevel } from './index.js';
import { access } from 'fs/promises';

/**
 * Centralized logging class
 */
export class Logger {
  /**
   * Creates a Logger instance and sets debug logging enabled state
   * @param {boolean} debugLoggingIsEnabled indicating whether or not debug logging is to be enabled.
   */
  constructor(private debugLoggingIsEnabled = false) { }

  /**
   * Logs a message to the console with a timestamp and log level
   * @param {string} message The message to log
   * @param {LogLevel} level The log level (DEBUG, INFO, ERROR)
   */
  public async log(message: string, level: LogLevel): Promise<void> {
    // Don't log if debug logging is disabled and the level is DEBUG
    if (level === 'DEBUG' && !this.debugLoggingIsEnabled && !(await this.breakGlassDebugLoggingIsEnabled())) {
      return;
    }

    const timestamp = new Date().toISOString();

    switch (level) {
      case 'DEBUG':
        console.debug(`${timestamp} - ${level} - ${message}`);
        break;
      case 'INFO':
        console.log(`${timestamp} - ${level} - ${message}`);
        break;
      case 'ERROR':
        console.error(`${timestamp} - ${level} - ${message}`);
        break;
    }
  }

  /**
   * Break-glass debugging allows debug logging to be enabled during a live troubleshooting
   * scenario.
   * To enable within a running container:
   *   docker exec -it <container_name> /bin/sh
   *   /usr/src/app # touch DEBUG
   * @returns {Promise<boolean>} indicating whether or not the DEBUG file exists
   */
  private async breakGlassDebugLoggingIsEnabled(): Promise<boolean> {
    try {
      await access(process.cwd() + '/DEBUG');
      return true;
    }
    catch {
      return false;
    }
  }
}
