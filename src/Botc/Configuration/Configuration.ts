import type {
  ConfigurationOptions,
  ConfigurationSettings,
} from "./Configuration.types.ts";
import { ConfigurationDefaults } from "./Configuration.defaults.ts";

import { Logger } from "../Logger/index.ts";
import packageJson from "../../../package.json" with { type: "json" };

function isConfigurationSetting(
  value: unknown,
): value is ConfigurationSettings {
  if (
    typeof value !== "object" ||
    value === null ||
    Array.isArray(value) ||
    !("environmentVariable" in value) ||
    typeof value.environmentVariable !== "string" ||
    !("value" in value)
  ) {
    return false;
  }

  const valueType = typeof value.value;
  if (
    valueType !== "string" &&
    valueType !== "number" &&
    valueType !== "boolean"
  ) {
    return false;
  }

  if ("secret" in value && typeof value.secret !== "boolean") {
    return false;
  }

  return (
    !("options" in value) ||
    (Array.isArray(value.options) &&
      value.options.every((option) => typeof option === "string"))
  );
}

export class Configuration {
  private readonly _options: ConfigurationOptions;
  private readonly logger = new Logger();

  constructor() {
    this.logger.log("Configuration:", "INFO");
    this._options = ConfigurationDefaults;
    this.setUserConfiguration(this._options);
    this.augmentInternalPrompts();
  }

  private convertValueType(value: string): string | number | boolean {
    if (!isNaN(Number(value))) {
      return Number(value);
    } else if (value.toLowerCase() === "true") {
      return true;
    } else if (value.toLowerCase() === "false") {
      return false;
    }
    return value;
  }

  /**
   * Recursively set options by overriding defaults with environment variables
   * @param node - Working node
   * @param path - Path to node
   */
  private setUserConfiguration(node: unknown, path: string[] = []): void {
    if (typeof node !== "object" || node === null || Array.isArray(node)) {
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      if (isConfigurationSetting(child)) {
        const settings = child;
        const userSetting = process.env[settings.environmentVariable] as string;

        const userSettingIsInvalid =
          userSetting !== undefined &&
          settings.options &&
          !settings.options.includes(userSetting);

        if (userSettingIsInvalid) {
          throw new Error(
            `Invalid value '${userSetting}' for ${path.concat(key).join(".")}. ` +
              `Valid options are: ${settings.options?.join(", ")}`,
          );
        }

        settings.value =
          userSetting !== undefined
            ? this.convertValueType(userSetting)
            : settings.value;

        const userOrDefault =
          userSetting !== undefined ? `(user)` : `(default)`;

        // Log settings without exposing secret values
        this.logger.log(
          settings.secret
            ? `- ${path.concat(key).join(".")} = ${"*".repeat(12)} ${userOrDefault}`
            : `- ${path.concat(key).join(".")} = ${settings.value} ${userOrDefault}`,
          "INFO",
        );
      } else {
        this.setUserConfiguration(child, path.concat(key));
      }
    }
  }

  /** Replaces prompt placeholders with configured bot and model values. */
  private async augmentInternalPrompts(): Promise<void> {
    const discordOptions = this.options.clients.discord;
    const openaiOptions = this.options.llms.openai;

    openaiOptions.systemPrompt.value = (
      openaiOptions.systemPrompt.value as string
    )
      .replaceAll("{{botName}}", discordOptions.botName.value as string)
      .replaceAll("{{botVersion}}", packageJson.version)
      .replaceAll("{{openAIModel}}", openaiOptions.model.value as string);

    // {{promptBotBehavior}} is resolved per-channel at request time.

    openaiOptions.replyDecisionPrompt.value = (
      openaiOptions.replyDecisionPrompt.value as string
    ).replaceAll("{{botName}}", discordOptions.botName.value as string);

    this.logger.log(
      [
        "",
        `${"=".repeat(80)}`,
        `System prompt after injection:`,
        `${openaiOptions.systemPrompt.value}`,
        `${"=".repeat(80)}`,
        `Reply decision prompt after injection:`,
        `${openaiOptions.replyDecisionPrompt.value}`,
        `${"=".repeat(80)}`,
      ].join("\n"),
      "INFO",
    );
  }

  public get options(): ConfigurationOptions {
    return this._options;
  }
}
