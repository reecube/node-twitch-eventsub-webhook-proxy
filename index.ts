import * as dotenv from 'dotenv';
import { Main } from './src/Main';

dotenv.config();

(async () => {
  const main = new Main();
  await main.run();
})().catch((e) => {
  throw e;
});
