import { scrapeMods } from '../mods/utils/scrapeMods';

// Main entry point
scrapeMods({ firstPage: 2, maxPages: 14 })
  .then((mods) => {
    // fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    // console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
