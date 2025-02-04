export type CachedUsername = {
  [username: string]: CachedPersona;
};

export type CachedPersona = {
  persona: string;
  expiresAt: number;
};

export interface CacheConfig {
  /**
   * Username
   * @type {string}
   */
  username: string;

  /**
   * Persona
   * @type {string}
   */
  persona: string;
}

export interface PersonaCacheConfig {
  /**
   * Cache time-to-live in hours
   * @type {number}
   */
  ttlHours: number;
}
