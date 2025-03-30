import { scrapeMods } from '../mods/utils/scrapeMods';

// Test for dependencies:
// 'https://forums.civfanatics.com/resources/custom-alerts-framework.32005/';
// 'https://forums.civfanatics.com/resources/purchase-alerts.32034/';
// https://forums.civfanatics.com/resources/matts-leaders-oliver-cromwell.32128/
// https://forums.civfanatics.com/resources/addon-leader-model-changer.32124/

// Test for variants:
// https://forums.civfanatics.com/resources/sibr3s-transparent-appeal.32000/

const singleModUrl =
  'https://forums.civfanatics.com/resources/sibr3s-transparent-appeal.32000/';

const forceExtractAndStore = true;
const maxPages = 1; // 15 full
const stopAfterLastModVersion = false;
const onlyListData = false;

// Main entry point
scrapeMods({
  firstPage: 1,
  maxPages,
  // singleModUrl,
  forceExtractAndStore,
  stopAfterLastModVersion,
  onlyListData,
  stopAfterFirstMod: false,
})
  .then((mods) => {
    // fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    // console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
