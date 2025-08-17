/**
 * Brave client configuration object
 * @property {ConfigurationSettings} apikey Brave API key
 */
export interface BraveSettings {
  apikey: ConfigurationSettings;
}

/**
 * Clients configuration object
 * @property {DiscordClientSettings} discord Discord client settings
 */
export interface ClientsSettings {
  discord: DiscordClientSettings;
}

/**
 * Configuration object
 * @property {ClientsSettings} clients Clients settings
 * @property {LlmsSettings} llms Llms settings
 */
export interface ConfigurationOptions {
  clients: ClientsSettings;
  featureGates: FeatureGateSettings;
  llms: LlmsSettings;
};

/**
 * Generic configuration settings object
 * @property {string} environmentVariable Environment variable name
 * @property {boolean} [secret] Whether the value is a secret
 * @property {string[]} [options] Array of options
 * @property {string|number|boolean} value Configuration value
 */
export interface ConfigurationSettings {
  environmentVariable: string;
  secret?: boolean;
  options?: string[];
  value: string | number | boolean;
};

/**
 * Discord client configuration object
 * @property {ConfigurationSettings} channelHistoryHours Channel history hours
 * @property {ConfigurationSettings} channelHistoryMessages Channel history messages
 * @property {ConfigurationSettings} maxDiscordRetries Maximum number of retries
 * @property {ConfigurationSettings} token Discord bot token
 */
export interface DiscordClientSettings {
  botName: ConfigurationSettings;
  channelHistoryHours: ConfigurationSettings;
  channelHistoryMessages: ConfigurationSettings;
  maxDiscordRetries: ConfigurationSettings;
  token: ConfigurationSettings;
}

/**
 * ElevenLabs client configuration object
 * @property {ConfigurationSettings} apikey ElevenLabs API key
 * @property {ConfigurationSettings} modelId ElevenLabs model ID
 * @property {ConfigurationSettings} voiceId ElevenLabs voice ID
 */
export interface ElevenLabsSettings {
  apikey: ConfigurationSettings;
  modelId: ConfigurationSettings;
  voiceId: ConfigurationSettings;
}

/**
 * Feature gate settings object
 * @property {ConfigurationSettings} enableAiGrounding Enable AI grounding using the Brave AI Grounding API
 * @property {ConfigurationSettings} enableAutoRespond Enable bot auto-responding to messages
 * @property {ConfigurationSettings} enableDebugLogging Enable debug logging to the console
 */
export interface FeatureGateSettings {
  enableAiGrounding: ConfigurationSettings;
  enableAutoRespond: ConfigurationSettings;
  enableDebugLogging: ConfigurationSettings;
  enableVoiceResponse: ConfigurationSettings;
}

/**
 * ElevenLabs client configuration object
 * @property {BraveSettings} brave Brave settings
 * @property {ElevenLabsSettings} elevenlabs ElevenLabs settings
 * @property {OpenAISettings} openai OpenAI settings
 */
export interface LlmsSettings {
  brave: BraveSettings;
  elevenlabs: ElevenLabsSettings;
  openai: OpenAISettings;
}

/**
 * OpenAI cache logging settings object
 * @property {ConfigurationSettings} logCacheEntries Log cache entries
 * @property {ConfigurationSettings} logCacheHits Log cache hits
 * @property {ConfigurationSettings} logCacheMisses Log cache misses
 * @property {ConfigurationSettings} logCachePurges Log cache purges
 */
export interface OpenAICacheLoggingSettings {
  logCacheEntries: ConfigurationSettings;
  logCacheHits: ConfigurationSettings;
  logCacheMisses: ConfigurationSettings;
  logCachePurges: ConfigurationSettings;
}

/**
 * OpenAI cache settings object
 * @property {ConfigurationSettings} describeImageCacheTtlHours Describe image cache TTL hours
 * @property {OpenAICacheLoggingSettings} logging OpenAI cache logging settings
 * @property {ConfigurationSettings} personaCacheTtlHours Persona cache TTL hours
 * @property {ConfigurationSettings} voiceTranscriptCacheTtlHours Voice transcript cache TTL hours
 */
export interface OpenAICacheSettings {
  describeImageCacheTtlHours: ConfigurationSettings;
  logging: OpenAICacheLoggingSettings;
  personaCacheTtlHours: ConfigurationSettings;
  voiceTranscriptCacheTtlHours: ConfigurationSettings;
}

/**
 * OpenAI client configuration object
 * @property {ConfigurationSettings} apikey OpenAI API key
 * @property {OpenAICacheSettings} caching OpenAI cache settings
 * @property {ConfigurationSettings} describeImagePrompt OpenAI describe image prompt
 * @property {ConfigurationSettings} maxRetries Maximum number of retries
 * @property {ConfigurationSettings} model OpenAI model
 * @property {ConfigurationSettings} replyDecisionPrompt OpenAI reply decision prompt
 * @property {ConfigurationSettings} systemPrompt OpenAI system prompt
 * @property {ConfigurationSettings} timeout Request timeout
 */
export interface OpenAISettings {
  apikey: ConfigurationSettings;
  caching: OpenAICacheSettings;
  describeImagePrompt: ConfigurationSettings;
  groundDecisionPrompt: ConfigurationSettings;
  maxRetries: ConfigurationSettings;
  model: ConfigurationSettings;
  promptBotBehavior: ConfigurationSettings;
  replyDecisionPrompt: ConfigurationSettings;
  systemPrompt: ConfigurationSettings;
  timeout: ConfigurationSettings;
}
