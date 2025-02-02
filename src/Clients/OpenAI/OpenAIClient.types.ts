import { BotcMessage } from '../../Botc/index.js';

export interface CreatePromptPayloadConfig {
  messageHistory: BotcMessage[];
  customSystemPrompt?: CustomSystemPrompt;
}

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
