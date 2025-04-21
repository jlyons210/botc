import { Botc } from './Botc/index.js';
import { Logger } from './Botc/Logger/index.js';

try {
  new Botc();
}
catch (error) {
  if (error instanceof Error) {
    const logger = new Logger();
    logger.log(error.message, 'ERROR');
    logger.log(error.stack || 'Stack unavailable', 'ERROR');
  }
}
