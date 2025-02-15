import { DiscordClient } from '../Clients/Discord/index.js';
import { ElevenLabs } from '../Clients/ElevenLabs/index.js';
import { ObjectCache } from './ObjectCache/index.js';
import { OpenAIClient } from '../Clients/OpenAI/index.js';

export type BotcModules = {
  caches: BotcCacheModules;
  clients: BotcClientModules;
};

export type BotcCacheModules = {
  imageDescriptions: ObjectCache;
  personas: ObjectCache;
  transcriptions: ObjectCache;
};

export type BotcClientModules = {
  discord: DiscordClient;
  elevenlabs: ElevenLabs;
  openai: OpenAIClient;
};

export interface CustomSystemPrompt {
  value: string,
  append: boolean,
}

export interface ReplyDecisionResponse {
  respondToUser: string,
  reason: string,
  conversationTarget: string,
  botcIsAddressed: string,
}
