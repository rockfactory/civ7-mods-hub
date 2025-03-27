import { scrapeMods } from '../mods/utils/scrapeMods';

const singleModUrl =
  'https://forums.civfanatics.com/resources/higher-relics-count-for-cultural-victory-in-exploration-age-by-rico.31926/';

const forceExtractAndStore = true;
const maxPages = 1; // 15 full
const stopAfterLastModVersion = true;
const onlyListData = false;

// Main entry point
scrapeMods({
  firstPage: 1,
  maxPages,
  // singleModUrl,
  forceExtractAndStore,
  stopAfterLastModVersion,
  onlyListData,
  stopAfterFirstMod: true,
})
  .then((mods) => {
    // fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    // console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
