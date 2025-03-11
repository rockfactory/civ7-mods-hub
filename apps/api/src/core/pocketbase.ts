/// <reference path="../../../backend/pb_data/types.d.ts" />
import PocketBase from 'pocketbase';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
);

if (!process.env.POCKETBASE_TOKEN) {
  console.error('POCKETBASE_TOKEN is required');
  process.exit(1);
}

pb.authStore.save(process.env.POCKETBASE_TOKEN);

// Async request from multiple users
pb.autoCancellation(false);

export { pb };
