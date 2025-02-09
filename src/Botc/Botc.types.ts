import { EventBus, EventMap } from './EventBus/index.js';
import { DiscordClient } from '../Clients/Discord/index.js';
import { ElevenLabs } from '../Clients/ElevenLabs/index.js';
import { OpenAIClient } from '../Clients/OpenAI/index.js';

/**
 * A collection of modules used throughout the bot.
 */
export type BotcModules = {

  /**
   * Discord client
   */
  DiscordClient: DiscordClient;

  /**
   * ElevenLabs client
   */
  ElevenLabsClient: ElevenLabs;

  /**
   * Event bus
   */
  EventBus: EventBus<EventMap>;

  /**
   * OpenAI client
   */
  OpenAIClient: OpenAIClient;
};
