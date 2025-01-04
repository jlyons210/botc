import {
  ConfigurationDefaults,
  ConfigurationOptions,
  ConfigurationSettings,
} from './index.js';

/** Configuration */
export class Configuration {
  private _options: ConfigurationOptions;

  /** Load Configuration */
  constructor() {
    console.log('Configuration:');
    this._options = ConfigurationDefaults;
    this.setUserConfiguration(this._options);
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
          const settings = node[key] as ConfigurationSettings;
          settings.value = process.env[settings.environmentVariable] || settings.value;
          console.log(
            (settings.secret)
              ? `- ${path.concat(key).join('.')} = ********`
              : `- ${path.concat(key).join('.')} = ${settings.value}`,
          );
        }
        else {
          this.setUserConfiguration(node[key], path.concat(key));
        }
      }
    }
  }

  /**
   * Get configuration options
   * @returns {ConfigurationOptions} Configuration options
   */
  public get options(): ConfigurationOptions {
    return this._options;
  }
}
