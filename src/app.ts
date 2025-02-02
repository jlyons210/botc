import { Botc } from './Botc/index.js';

try {
  new Botc();
}
catch (error) {
  if (error instanceof Error) {
    console.error(error.message);
    console.error(error.stack);
  }
}
