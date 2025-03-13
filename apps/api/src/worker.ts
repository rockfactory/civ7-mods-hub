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

    await scrapeMods({ firstPage, maxPages });
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
