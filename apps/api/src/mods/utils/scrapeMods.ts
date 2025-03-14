import axios from 'axios';
import * as cheerio from 'cheerio';
import sleep from 'sleep-promise';
import randomUseragent from 'random-useragent';
import fs from 'fs';
import { pb } from '../../core/pocketbase';
import { saveModToDatabase } from './saveModsToDatabase';

const baseUrl = 'https://forums.civfanatics.com';
const resourcesUrl = `${baseUrl}/resources/categories/civilization-vii-downloads.181/`;

export interface SyncModVersion {
  version: string;
  date?: string;
  downloadUrl: string;
  downloadCount: string;
  rating: string;
}

export interface SyncMod {
  modName: string;
  modPageUrl: string;
  modAuthor: string;
  updatedAt?: string;
  downloadsCount: string;
  rating: string;
  shortDescription?: string;
  iconUrl?: string;
  versions?: SyncModVersion[];
}

async function getModsFromPage(url: string): Promise<SyncMod[]> {
  const mods: SyncMod[] = [];

  const { data, headers } = await axios.get(url, {
    headers: { 'User-Agent': 'CivMods/1.0' },
  });
  const $ = cheerio.load(data);

  $('.structItem--resource').each((_, element) => {
    const el = $(element);

    const modName = el
      .find('.structItem-title a')
      .text()
      .replace(/\s+/g, ' ')
      .trim();
    const modPageRelativeUrl = el.find('.structItem-title a').attr('href');
    const modPageUrl = baseUrl + modPageRelativeUrl;
    const modAuthor = el.find('.username').first().text().trim();
    const iconUrl = el.find('.structItem-cell--icon a img')?.attr('src');
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
    const updatedAt = el
      .find('.structItem-metaItem--lastUpdate time')
      .attr('datetime');
    const downloadsCount = el
      .find('.structItem-metaItem--downloads dd')
      .text()
      .trim();

    mods.push({
      modName,
      modPageUrl,
      modAuthor,
      rating,
      shortDescription,
      updatedAt,
      downloadsCount,
      iconUrl,
    });
  });

  return mods;
}

async function getModVersions(historyUrl: string): Promise<SyncModVersion[]> {
  const versions: SyncModVersion[] = [];

  try {
    const { data } = await axios.get(historyUrl, {
      headers: { 'User-Agent': 'CivMods/v0.1.0' },
    });
    const $ = cheerio.load(data);

    $('.dataList-table tbody tr')
      .slice(1)
      .each((_, element) => {
        const el = $(element);

        const version = el.find('td:nth-child(1)').text().trim();
        const date = el.find('td:nth-child(2) time').attr('datetime');
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
async function getModDetails(mod: SyncMod): Promise<SyncMod> {
  return mod;
}

export interface ScrapeModsOptions {
  firstPage?: number;
  maxPages?: number;
  stopAfterLastModVersion?: boolean;
  /** For debugging */
  stopAfterFirstMod?: boolean;
  skipSaveToDatabase?: boolean;
  skipExtractAndStore?: boolean;
  forceExtractAndStore?: boolean;
}

export async function scrapeMods(
  options: ScrapeModsOptions
): Promise<SyncMod[]> {
  const {
    maxPages = 15,
    stopAfterFirstMod,
    stopAfterLastModVersion,
    firstPage = 1,
  } = options;

  // limit to avoid long scraping
  const mods: SyncMod[] = [];

  let firstModUrlOnLastPage: string | null = null;

  for (let page = 0; page < maxPages; page++) {
    const pageNumber = page + firstPage;
    const pageUrl =
      pageNumber === 1 ? resourcesUrl : `${resourcesUrl}?page=${pageNumber}`;
    console.log(`Scraping page: ${pageUrl}`);

    const modsOnPage = await getModsFromPage(pageUrl);

    if (modsOnPage[0]?.modPageUrl === firstModUrlOnLastPage) {
      console.log(`Reached last page, stopping scraping`);
      break;
    }

    firstModUrlOnLastPage = modsOnPage[0]?.modPageUrl;

    for (const mod of modsOnPage) {
      console.log(`Fetching versions for mod: ${mod.modName}`);
      const historyUrl = mod.modPageUrl + '/history';
      mod.versions = await getModVersions(historyUrl);
      mods.push(mod);

      console.log(`Mod JSON:`, JSON.stringify(mod, null, 2));

      if (stopAfterFirstMod) {
        process.exit(0); // Exit after first mod for testing
      }

      // Save mod
      await saveModToDatabase(options, mod);

      const sleepTime = Math.floor(Math.random() * (200 + 1)) + 100; // Random sleep 100-300 ms
      console.log(`Sleeping for ${sleepTime} ms`);
      await sleep(sleepTime);
    }
  }

  return mods;
}
