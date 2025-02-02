export type BotcMessageImageAttachment = {
  contentType: string;
  height: number;
  imageBase64?: string;
  imageUrl: string;
  width: number;
};

export type BotcMessageType = 'BotMessage' | 'ChannelMessage' | 'DirectMessage' | 'OwnMessage';
