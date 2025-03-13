import { pb } from '../core/pocketbase';

// Main function to process mod archives
async function processModArchives() {
  const modsVersions = await pb.collection('mod_versions').getFullList();

  for (const version of modsVersions) {
  }
}

console.error('Not implemented yet');
