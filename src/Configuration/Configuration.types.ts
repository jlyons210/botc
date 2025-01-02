/**
 * Top-level configuration options
 */
export interface ConfigurationOptions {
  clients: ClientsConfigurationOptions;
  llms: LlmsConfigurationOptions;
};

/**
 * Secondary-level configuration options
 */
export interface ClientsConfigurationOptions {
  discord: DiscordClientConfigurationOptions;
}

export interface LlmsConfigurationOptions {
  openai: OpenAIConfigurationOptions;
}

/**
 * Configuration options
 */
export interface DiscordClientConfigurationOptions {
  token: ConfigurationValue;
}

export interface OpenAIConfigurationOptions {
  apikey: ConfigurationValue;
  model: OpenAIModelConfigurationValue;
  systemPrompt: ConfigurationValue;
}

export interface ConfigurationValue {
  value: string;
  environmentVariable: string;
  secret?: boolean;
};

export interface OpenAIModelConfigurationValue extends ConfigurationValue {
  value: 'gpt-4o-mini' | 'gpt-4o';
};
