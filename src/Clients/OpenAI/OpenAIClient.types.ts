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
