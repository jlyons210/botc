import {
  CacheConfig,
  CachedUsername,
  PersonaCacheConfig,
} from './index.js';

/**
 * Cache for user personas
 */
export class PersonaCache {
  private personas: CachedUsername = {};

  /**
   * New PersonaCache
   * @param {PersonaCacheConfig} config configuration
   */
  constructor(private config: PersonaCacheConfig) {
    setInterval(() => this.clearExpired(), 60000);
  }

  /**
   * Cache the provided entry
   * @param {CacheConfig} entry Entry to be cached
   */
  public cache(entry: CacheConfig): void {
    this.personas[entry.username] = {
      persona: entry.persona,
      expiresAt: Date.now() + this.config.ttlHours * 60 * 60 * 1000,
    };
  }

  /**
   * Clears expired cache entries
   */
  private clearExpired(): void {
    for (const persona in this.personas) {
      if (this.personas[persona].expiresAt < Date.now()) {
        delete this.personas[persona];
        console.debug(`PersonaCache.clearExpired: ${persona} is expired. Removed.`);
      }
    }
  }

  /**
   * Retrieve cached description
   * @param {string} username Username
   * @returns {string} Persona
   */
  public getPersona(username: string): string {
    return (this.personas[username])
      ? this.personas[username].persona
      : '';
  }

  /**
   * Check if username is cached
   * @param {string} username Username
   * @returns {boolean} true if cached
   */
  public isCached(username: string): boolean {
    return (this.getPersona(username) !== '');
  }
}
