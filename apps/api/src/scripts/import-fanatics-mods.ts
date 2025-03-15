import { scrapeMods } from '../mods/utils/scrapeMods';

const forceExtractAndStore = false;

// Main entry point
scrapeMods({ firstPage: 1, maxPages: 15, forceExtractAndStore })
  .then((mods) => {
    // fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    // console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
