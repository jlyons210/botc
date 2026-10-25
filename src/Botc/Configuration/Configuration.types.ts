/** Brave client settings. */
export interface BraveSettings {
  /** API key used to authenticate with Brave. */
  apikey: ConfigurationSettings;
}

/** Settings for external clients. */
export interface ClientsSettings {
  /** Discord client settings. */
  discord: DiscordClientSettings;
}

/** Configuration options loaded from defaults and environment variables. */
export interface ConfigurationOptions {
  /** External client settings. */
  clients: ClientsSettings;
  /** Feature switches. */
  featureGates: FeatureGateSettings;
  /** Language model provider settings. */
  llms: LlmsSettings;
}

/** A setting with a default value and optional environment-variable override. */
export interface ConfigurationSettings {
  /** Environment variable used to override the default value. */
  environmentVariable: string;
  /** Whether the value should be masked in logs. */
  secret?: boolean;
  /** Allowed string values, when the setting is restricted. */
  options?: string[];
  /** Default value, replaced by a validated environment value when present. */
  value: string | number | boolean;
}

/** Discord client settings. */
export interface DiscordClientSettings {
  /** Bot name used in conversation prompts. */
  botName: ConfigurationSettings;
  /** Number of hours of channel history to load. */
  channelHistoryHours: ConfigurationSettings;
  /** Maximum number of channel-history messages to load. */
  channelHistoryMessages: ConfigurationSettings;
  /** Maximum Discord API retries. */
  maxDiscordRetries: ConfigurationSettings;
  /** Token used to authenticate with Discord. */
  token: ConfigurationSettings;
}

/** ElevenLabs client settings. */
export interface ElevenLabsSettings {
  /** API key used to authenticate with ElevenLabs. */
  apikey: ConfigurationSettings;
  /** Model used to generate speech. */
  modelId: ConfigurationSettings;
  /** Voice used to generate speech. */
  voiceId: ConfigurationSettings;
}

/** Feature switches that enable or disable bot behavior. */
export interface FeatureGateSettings {
  /** Ground responses with information from Brave Search. */
  enableAiGrounding: ConfigurationSettings;
  /** Automatically respond to messages. */
  enableAutoRespond: ConfigurationSettings;
  /** Log debug-level messages. */
  enableDebugLogging: ConfigurationSettings;
  /** Generate images from prompts. */
  enableImageGeneration: ConfigurationSettings;
  /** Generate voice responses to voice messages. */
  enableVoiceResponse: ConfigurationSettings;
}

/** Settings for language model and search providers. */
export interface LlmsSettings {
  /** Brave Search settings. */
  brave: BraveSettings;
  /** ElevenLabs speech-generation settings. */
  elevenlabs: ElevenLabsSettings;
  /** OpenAI settings. */
  openai: OpenAISettings;
}

/** Logging controls for the OpenAI caches. */
export interface OpenAICacheLoggingSettings {
  /** Log when cache entries are created. */
  logCacheEntries: ConfigurationSettings;
  /** Log cache hits. */
  logCacheHits: ConfigurationSettings;
  /** Log cache misses. */
  logCacheMisses: ConfigurationSettings;
  /** Log when expired entries are removed. */
  logCachePurges: ConfigurationSettings;
}

/** Cache lifetimes and logging controls for OpenAI-related data. */
export interface OpenAICacheSettings {
  /** Image-description cache lifetime in hours. */
  describeImageCacheTtlHours: ConfigurationSettings;
  /** Cache logging controls. */
  logging: OpenAICacheLoggingSettings;
  /** Persona cache lifetime in hours. */
  personaCacheTtlHours: ConfigurationSettings;
  /** Voice-transcription cache lifetime in hours. */
  voiceTranscriptCacheTtlHours: ConfigurationSettings;
}

/** OpenAI client settings. */
export interface OpenAISettings {
  /** API key used to authenticate with OpenAI. */
  apikey: ConfigurationSettings;
  /** Cache lifetimes and logging controls. */
  caching: OpenAICacheSettings;
  /** Prompt used to describe images. */
  describeImagePrompt: ConfigurationSettings;
  /** Prompt used to decide whether to search for grounding information. */
  groundDecisionPrompt: ConfigurationSettings;
  /** Maximum input image side in pixels before resizing for vision requests. */
  imageMaxSide: ConfigurationSettings;
  /** Model used for image generation. */
  imageModel: ConfigurationSettings;
  /** Maximum number of API request retries. */
  maxRetries: ConfigurationSettings;
  /** Model used for chat responses. */
  model: ConfigurationSettings;
  /** Reasoning effort used for chat responses. */
  modelReasoningEffort: ConfigurationSettings;
  /** Additional behavior instructions for the bot. */
  promptBotBehavior: ConfigurationSettings;
  /** Prompt used to decide whether to reply to a message. */
  replyDecisionPrompt: ConfigurationSettings;
  /** System prompt used for chat responses. */
  systemPrompt: ConfigurationSettings;
  /** OpenAI request timeout in milliseconds. */
  timeout: ConfigurationSettings;
}
