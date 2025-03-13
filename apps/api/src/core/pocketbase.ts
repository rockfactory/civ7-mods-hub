import { type TypedPocketBase } from '../../../desktop/src/pocketbase-types';
import PocketBase from 'pocketbase/cjs';

const pb = new PocketBase(
  process.env.POCKETBASE_URL || 'http://127.0.0.1:8090'
) as unknown as TypedPocketBase;

if (!process.env.POCKETBASE_TOKEN) {
  console.error('POCKETBASE_TOKEN is required');
  process.exit(1);
}

pb.authStore.save(process.env.POCKETBASE_TOKEN);

// Async request from multiple users
pb.autoCancellation(false);

export { pb };
