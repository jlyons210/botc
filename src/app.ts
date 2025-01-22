import { Botc } from './Botc/index.js';
import { Configuration } from './Botc/Core/Configuration/index.js';

/** Main entry point */
export class Main {
  /** Initialize */
  constructor() {
    try {
      const configuration = new Configuration();
      new Botc(configuration);
    }
    catch (error) {
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}

new Main();
