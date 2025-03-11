// Install dependencies using: npm install axios cheerio sleep-promise random-useragent @types/node

import axios from 'axios';
import * as cheerio from 'cheerio';
import sleep from 'sleep-promise';
import randomUseragent from 'random-useragent';
import fs from 'fs';

const baseUrl = 'https://forums.civfanatics.com';
const resourcesUrl = `${baseUrl}/resources/categories/civilization-vii-downloads.181/`;

interface ModVersion {
  version: string;
  date: string;
  downloadUrl: string;
  downloadCount: string;
  rating: string;
}

interface Mod {
  modName: string;
  modPageUrl: string;
  modAuthor: string;
  rating: string;
  shortDescription?: string;
  versions?: ModVersion[];
}

async function getModsFromPage(url: string): Promise<Mod[]> {
  const mods: Mod[] = [];

  const { data } = await axios.get(url, {
    headers: { 'User-Agent': randomUseragent.getRandom() },
  });
  const $ = cheerio.load(data);

  $('.structItem--resource').each((_, element) => {
    const el = $(element);

    const modName = el
      .find('.structItem-title')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const modPageRelativeUrl = el.find('.structItem-title a').attr('href');
    const modPageUrl = baseUrl + modPageRelativeUrl;
    const modAuthor = el.find('.username').first().text().trim();
    const ratingMatch = el
      .find('.ratingStarsRow .ratingStars')
      .attr('title')
      ?.match(/[\d.]+/);
    const rating = ratingMatch ? ratingMatch[0] : 'No rating';
    const shortDescription = el
      .find('.structItem-resourceTagLine')
      .text()
      .replace(/\s+/g, ' ')
      .trim();

    mods.push({
      modName,
      modPageUrl,
      modAuthor,
      rating,
      shortDescription,
    });
  });

  return mods;
}

async function getModVersions(historyUrl: string): Promise<ModVersion[]> {
  const versions: ModVersion[] = [];

  try {
    const { data } = await axios.get(historyUrl, {
      headers: { 'User-Agent': randomUseragent.getRandom() },
    });
    const $ = cheerio.load(data);

    $('.dataList-table tbody tr')
      .slice(1)
      .each((_, element) => {
        const el = $(element);

        const version = el.find('td:nth-child(1)').text().trim();
        const date =
          el.find('td:nth-child(2) time').attr('datetime') || 'Unknown date';
        const downloadCount = el.find('td:nth-child(3)').text().trim();
        const ratingMatch = el
          .find('td:nth-child(4) .ratingStars')
          .attr('title')
          ?.match(/[\d.]+/);
        const rating = ratingMatch ? ratingMatch[0] : 'No rating';
        const downloadRelativeUrl = el.find('td:last-child a').attr('href');
        const downloadUrl = downloadRelativeUrl
          ? baseUrl + downloadRelativeUrl
          : 'No download URL';

        versions.push({
          version,
          date,
          downloadUrl,
          downloadCount,
          rating,
        });
      });
  } catch (error) {
    console.error(`Failed to fetch versions from ${historyUrl}:`, error);
  }

  return versions;
}

// Keeping this function for future use, currently avoiding API calls
async function getModDetails(mod: Mod): Promise<Mod> {
  return mod;
}

async function scrapeMods(maxPages = 15): Promise<Mod[]> {
  // limit to avoid long scraping
  const mods: Mod[] = [];

  for (let page = 1; page <= maxPages; page++) {
    const pageUrl = page === 1 ? resourcesUrl : `${resourcesUrl}?page=${page}`;
    console.log(`Scraping page: ${pageUrl}`);

    const modsOnPage = await getModsFromPage(pageUrl);

    for (const mod of modsOnPage) {
      console.log(`Fetching versions for mod: ${mod.modName}`);
      const historyUrl = mod.modPageUrl + '/history';
      mod.versions = await getModVersions(historyUrl);
      mods.push(mod);

      //   console.log(`Mod`, JSON.stringify(mod, null, 2));
      //   process.exit(0); // Exit after first mod for testing

      const sleepTime = Math.floor(Math.random() * (2000 - 300 + 1)) + 1000; // Random sleep between 2-5 seconds
      console.log(`Sleeping for ${sleepTime} ms`);
      await sleep(sleepTime);
    }
  }

  return mods;
}

// Main entry point
scrapeMods()
  .then((mods) => {
    fs.writeFileSync('civ7_mods.json', JSON.stringify(mods, null, 2));
    console.log('Mods data saved to civ7_mods.json');
  })
  .catch((err) => console.error(err));
