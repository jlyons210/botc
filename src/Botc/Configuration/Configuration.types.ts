export interface ConfigurationOptions {
  clients: ClientsSettings;
  llms: LlmsSettings;
};

export interface ClientsSettings {
  discord: DiscordClientSettings;
}

export interface DiscordClientSettings {
  channelHistoryHours: ConfigurationSettings;
  token: ConfigurationSettings;
}

export interface LlmsSettings {
  openai: OpenAISettings;
}

export interface OpenAISettings {
  apikey: ConfigurationSettings;
  maxRetries: ConfigurationSettings;
  model: ConfigurationSettings;
  replyDecisionPrompt: ConfigurationSettings;
  systemPrompt: ConfigurationSettings;
  timeout: ConfigurationSettings;
}

export interface ConfigurationSettings {
  environmentVariable: string;
  secret?: boolean;
  options?: string[];
  value: string | number;
};
