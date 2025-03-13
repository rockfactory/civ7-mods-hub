import cron from 'node-cron';
import { scrapeMods } from './mods/utils/scrapeMods.js';

console.log('Hello, Civ world!');

let isRunning = false;

cron.schedule('*/30 * * * *', () => {
  if (isRunning) {
    console.log('Previous job is still running, skipping this run');
    return;
  }

  console.log('\n\n=== Running mods updating cron job ===\n\n');

  isRunning = true;

  scrapeMods({ firstPage: 1, maxPages: 1 })
    .then((mods) => {
      console.log(`Scraped ${mods.length} mods`);
    })
    .catch((err) => console.error(err))
    .finally(() => {
      isRunning = false;
      console.log('\n\n=== Finished mods updating cron job ===\n\n');
    });
});
