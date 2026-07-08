import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const CONFIG_PATH = path.resolve('.vercel/output/config.json');
const GIFT_CARDS_ROUTE = {
  src: '/giftcards',
  dest: '/giftcards/',
};

const main = async () => {
  const raw = await readFile(CONFIG_PATH, 'utf8');
  const config = JSON.parse(raw);
  const routes = Array.isArray(config.routes) ? config.routes : [];

  const alreadyPresent = routes.some(route => {
    return route && route.src === GIFT_CARDS_ROUTE.src && route.dest === GIFT_CARDS_ROUTE.dest;
  });

  if (!alreadyPresent) {
    config.routes = [GIFT_CARDS_ROUTE, ...routes];
    await writeFile(CONFIG_PATH, `${JSON.stringify(config, null, 2)}\n`, 'utf8');
  }
};

main().catch(error => {
  console.error('Failed to patch Vercel output config:', error);
  process.exitCode = 1;
});
