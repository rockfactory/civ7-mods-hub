import { scrapeMods } from '../mods/utils/scrapeMods';

const forceExtractAndStore = false;
const maxPages = 1; // 15 full
const stopAfterLastModVersion = true;

// Main entry point
scrapeMods({
  firstPage: 1,
  maxPages,
  forceExtractAndStore,
  stopAfterLastModVersion,
})
  .then((mods) => {
    // fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    // console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
