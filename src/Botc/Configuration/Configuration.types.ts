export interface ConfigurationOptions {
  clients: ClientsSettings;
  llms: LlmsSettings;
};

export interface ClientsSettings {
  discord: DiscordClientSettings;
}

export interface DiscordClientSettings {
  channelHistoryHours: ConfigurationSettings;
  channelHistoryMessages: ConfigurationSettings;
  token: ConfigurationSettings;
}

export interface LlmsSettings {
  openai: OpenAISettings;
}

export interface OpenAICacheLoggingSettings {
  logCacheEntries: ConfigurationSettings;
  logCacheHits: ConfigurationSettings;
  logCacheMisses: ConfigurationSettings;
  logCachePurges: ConfigurationSettings;
}

export interface OpenAICacheSettings {
  describeImageCacheTtlHours: ConfigurationSettings;
  logging: OpenAICacheLoggingSettings;
  personaCacheTtlHours: ConfigurationSettings;
  voiceTranscriptCacheTtlHours: ConfigurationSettings;
}

export interface OpenAISettings {
  apikey: ConfigurationSettings;
  caching: OpenAICacheSettings;
  describeImagePrompt: ConfigurationSettings;
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
  value: string | number | boolean;
};
