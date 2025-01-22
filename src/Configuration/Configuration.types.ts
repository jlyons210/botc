/**
 * Provides strong typing for Configuration.defaults.ts
 */
export interface ConfigurationOptions {
  clients: ClientsSettings;
  llms: LlmsSettings;
};

export interface ClientsSettings {
  discord: DiscordClientSettings;
}

export interface DiscordClientSettings {
  token: ConfigurationSettings;
}

export interface LlmsSettings {
  openai: OpenAISettings;
}

export interface OpenAISettings {
  apikey: ConfigurationSettings;
  model: OpenAIModelSettings;
  systemPrompt: ConfigurationSettings;
}

export interface OpenAIModelSettings extends ConfigurationSettings {
  value: 'gpt-4o-mini' | 'gpt-4o';
};

export interface ConfigurationSettings {
  environmentVariable: string;
  secret?: boolean;
  options?: string[];
  value: string;
};
