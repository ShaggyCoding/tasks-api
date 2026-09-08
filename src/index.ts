import { createApp } from './app';
import { migrate } from './db';
import config from './config';

async function main(): Promise<void> {
  await migrate();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`Tasks API läuft auf Port ${config.port}`);
  });
}

main().catch((err) => {
  console.error('Start fehlgeschlagen:', err);
  process.exit(1);
});
