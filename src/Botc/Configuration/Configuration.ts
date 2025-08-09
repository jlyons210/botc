import {
  ConfigurationDefaults,
  ConfigurationOptions,
  ConfigurationSettings,
} from './index.js';

import { Logger } from '../Logger/index.js';
import packageJson from '../../../package.json' with { type: 'json' };

/** Configuration */
export class Configuration {
  private readonly _options: ConfigurationOptions;
  private readonly logger = new Logger();

  /** Load Configuration */
  constructor() {
    this.logger.log('Configuration:', 'INFO');
    this._options = ConfigurationDefaults;
    this.setUserConfiguration(this._options);
    this.augmentSystemPrompt();
  }

  /**
   * Converts a string value to its appropriate type
   * @param {string} value Value to convert
   * @returns {string | number | boolean} Converted value
   */
  private convertValueType(value: string): string | number | boolean {
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    else if (value.toLowerCase() === 'true') {
      return true;
    }
    else if (value.toLowerCase() === 'false') {
      return false;
    }
    return value;
  }

  /**
   * Recursively set options by overriding defaults with environment variables
   * @param {any} node Working node
   * @param {string[]} path Path to node
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private setUserConfiguration(node: any, path: string[] = []): void {
    for (const key in node) {
      if (typeof node[key] === 'object' && node[key] !== null) {
        if ('value' in node[key] && 'environmentVariable' in node[key]) {
          // Leaf node, set value
          const settings = node[key] as ConfigurationSettings;
          const userSetting = process.env[settings.environmentVariable] as string;

          // Equals 'true' if user-defined setting is defined and not listed in options
          const userSettingIsInvalid = userSetting !== undefined
            && settings.options && !settings.options.includes(userSetting);

          // Quit with error if user-defined setting is invalid
          if (userSettingIsInvalid) {
            throw new Error(
              `Invalid value '${userSetting}' for ${path.concat(key).join('.')}. `
              + `Valid options are: ${settings.options?.join(', ')}`,
            );
          }

          // Prefer user-defined setting, otherwise use default
          settings.value = (userSetting !== undefined)
            ? this.convertValueType(userSetting)
            : settings.value;

          const userOrDefault = (userSetting !== undefined)
            ? `(user)`
            : `(default)`;

          // Log configuration setting, masking secret values
          this.logger.log(
            (settings.secret)
              ? `- ${path.concat(key).join('.')} = ${'*'.repeat(12)} ${userOrDefault}`
              : `- ${path.concat(key).join('.')} = ${settings.value} ${userOrDefault}`,
            'INFO',
          );
        }
        else {
          // Non-leaf node, recurse
          this.setUserConfiguration(node[key], path.concat(key));
        }
      }
    }
  }

  /**
   * Augment system prompt with optional configuration settings
   */
  private async augmentSystemPrompt(): Promise<void> {
    const discordOptions = this.options.clients.discord;
    const openaiOptions = this.options.llms.openai;

    openaiOptions.systemPrompt.value = (openaiOptions.systemPrompt.value as string)
      .replace('{{botName}}', discordOptions.botName.value as string)
      .replace('{{botVersion}}', packageJson.version)
      .replace('{{openAIModel}}', openaiOptions.model.value as string)
      .replace('{{promptBotBehavior}}', openaiOptions.promptBotBehavior.value as string);

    this.logger.log(
      [
        '\n',
        `${'='.repeat(80)}\n`,
        `System prompt after injection:\n`,
        `${openaiOptions.systemPrompt.value}\n`,
        `${'='.repeat(80)}`,
      ].join(''),
      'INFO',
    );
  }

  /**
   * Get configuration options
   * @returns {ConfigurationOptions} Configuration options
   */
  public get options(): ConfigurationOptions {
    return this._options;
  }
}
