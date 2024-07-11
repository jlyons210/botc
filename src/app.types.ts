export type Configuration = {
  clients: {
    discord: {
      token: string;
    };
  },
  llms: {
    openai: {
      apikey: string;
    }
  }
};
