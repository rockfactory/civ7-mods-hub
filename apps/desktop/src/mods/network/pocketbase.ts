import { TypedPocketBase } from '@civmods/parser';
import PocketBase, { ClientResponseError } from 'pocketbase';

export const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL || 'https://backend.civmods.com'
  // 'http://localhost:8090'
) as TypedPocketBase;
