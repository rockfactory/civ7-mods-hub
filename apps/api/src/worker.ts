import cron from 'node-cron';
import { scrapeMods } from './mods/utils/scrapeMods.js';
import { pb } from './core/pocketbase.js';

console.log('Hello, Civ world!');

let isRunning = false;

cron.schedule('*/1 * * * *', () => {
  checkForManualScheduledTasks()
    .then(() => console.log('Finished checking for manual scheduled tasks'))
    .catch((err) => console.error(err));
});

async function checkForManualScheduledTasks() {
  // Check for manual scheduled tasks
  const scheduledTasks = await pb.collection('scheduled_tasks').getList(1, 10, {
    filter: pb.filter('is_processed = {:is_processed}', {
      is_processed: false,
    }),
  });

  if (scheduledTasks.items.length === 0) {
    return;
  }

  console.log(`Found ${scheduledTasks.items.length} manual scheduled tasks`);
  for (const task of scheduledTasks.items) {
    console.log('Processing task:', task);
    await pb.collection('scheduled_tasks').update(task.id, {
      is_processed: true,
    });
  }

  if (isRunning) {
    console.log('Previous job is still running, skipping this run');
    return;
  }

  isRunning = true;

  try {
    const scheduleTask = scheduledTasks.items[0];
    const firstPage =
      typeof scheduleTask.options === 'object' &&
      scheduleTask.options !== null &&
      'firstPage' in scheduleTask.options
        ? (scheduleTask.options.firstPage as number)
        : 1;

    const maxPages =
      typeof scheduleTask.options === 'object' &&
      scheduleTask.options !== null &&
      'maxPages' in scheduleTask.options
        ? (scheduleTask.options.maxPages as number)
        : 1;

    const stopAfterLastModVersion =
      typeof scheduleTask.options === 'object' &&
      scheduleTask.options !== null &&
      'stopAfterLastModVersion' in scheduleTask.options
        ? (scheduleTask.options.stopAfterLastModVersion as boolean)
        : false;

    const forceExtractAndStore =
      typeof scheduleTask.options === 'object' &&
      scheduleTask.options !== null &&
      'forceExtractAndStore' in scheduleTask.options
        ? (scheduleTask.options.forceExtractAndStore as boolean)
        : false;

    await scrapeMods({
      firstPage,
      maxPages,
      stopAfterLastModVersion,
      forceExtractAndStore,
    });
    await pb.collection('scheduled_tasks').update(scheduledTasks.items[0].id, {
      is_processed: true,
      processed_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
  } finally {
    isRunning = false;
    console.log('\n\n=== Finished mods updating cron job ===\n\n');
  }
}

/**
 * Main cron job for updating mods. Processes the latest two pages of mods.
 * Doesn't stop after the first updated mod found.
 */
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

/**
 * "Fast" cron job for updating mods; stops after the first updated mod found.
 * This is useful for quickly updating the latest mods.
 */
cron.schedule('*/5 * * * *', () => {
  if (isRunning) {
    console.log('Previous job is still running, skipping this run');
    return;
  }

  isRunning = true;

  console.log('\n\n=== Running [FAST] mods updating cron job ===\n\n');
  scrapeMods({ firstPage: 1, maxPages: 1, stopAfterLastModVersion: true })
    .then((mods) => {
      console.log(`[FAST] Scraped ${mods.length} mods`);
    })
    .catch((err) => console.error(err))
    .finally(() => {
      isRunning = false;
      console.log('\n\n=== Finished [FAST] mods updating cron job ===\n\n');
    });
});

/**
 * Cron job to update "list" data, e.g. mod names, downloads, rating
 * Runs every 4 hours
 */
cron.schedule('0 */4 * * *', () => {
  if (isRunning) {
    console.log('Previous job is still running, skipping this run');
    return;
  }

  isRunning = true;

  console.log('\n\n=== Running [LIST] mods updating cron job ===\n\n');
  scrapeMods({ firstPage: 1, maxPages: 50, onlyListData: true })
    .then((mods) => {
      console.log(`[LIST] Scraped ${mods.length} mods`);
    })
    .catch((err) => console.error(err))
    .finally(() => {
      isRunning = false;
      console.log('\n\n=== Finished [LIST] mods updating cron job ===\n\n');
    });
});
