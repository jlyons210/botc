import type { Brave } from "../Clients/Brave/index.ts";
import type { DiscordClient } from "../Clients/Discord/index.ts";
import type { ElevenLabs } from "../Clients/ElevenLabs/index.ts";
import type { ObjectCache } from "./ObjectCache/index.ts";
import type { OpenAIClient } from "../Clients/OpenAI/index.ts";

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
  brave: Brave | null;
  discord: DiscordClient;
  elevenlabs: ElevenLabs | null;
  openai: OpenAIClient;
};

export interface CustomSystemPrompt {
  value: string;
  append: boolean;
}

export interface GroundDecisionResponse {
  willGround: boolean;
}

export interface ReplyDecisionResponse {
  respondToUser: string;
  reason: string;
  conversationTarget: string;
  botIsAddressed: string;
}
