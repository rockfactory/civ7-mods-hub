import path from 'path';
import { parseXmlArray } from './parseXml';
import { XMLParser } from 'fast-xml-parser';
import fs from 'fs/promises';

interface ModInfoLocalizedNamesInput {
  modInfoXml: any;
  modInfoAbsolutePath: string;
}

export async function getModInfoLocalizedNames(
  input: ModInfoLocalizedNamesInput
) {
  const name = input.modInfoXml?.Mod?.Properties?.Name;
  const description = input.modInfoXml?.Mod?.Properties?.Description;

  const localizedTexts = await getLocalizedTexts(input);

  const localizedNames = Object.entries(localizedTexts).reduce(
    (acc, [locale, texts]) => {
      acc[locale] = {
        name: texts[name],
        description: texts[description],
      };
      return acc;
    },
    {} as Record<string, { name: string; description: string }>
  );

  if (Object.keys(localizedNames).length === 0) {
    localizedNames['en_US'] = {
      name,
      description,
    };
  }

  return localizedNames;
}

async function getLocalizedTexts(input: ModInfoLocalizedNamesInput) {
  const localizedTextFiles = parseXmlArray(
    input.modInfoXml?.Mod?.LocalizedText?.File
  )
    .map((file) => {
      if (typeof file === 'string') return { file, locale: undefined };
      if (typeof file === 'object') {
        return { file: file['#text'], locale: file['@_locale'] };
      }
      return null;
    })
    .filter((file) => file != null) as Array<{
    file: string;
    locale: string | undefined;
  }>;

  const localizedTexts: Record<string, Record<string, string>> = {};
  const modInfoDir = path.dirname(input.modInfoAbsolutePath);
  const xmlParser = new XMLParser({ ignoreAttributes: false });

  console.log(
    `Found ${localizedTextFiles.length} localized text files in ${modInfoDir}`,
    localizedTextFiles,
    input.modInfoXml?.Mod?.LocalizedText
  );

  for (const file of localizedTextFiles) {
    const filePath = path.resolve(modInfoDir, file?.file);
    try {
      const fileContent = await fs.readFile(filePath, 'utf8');
      console.log(
        `Reading localized text file: ${filePath}`,
        fileContent.length
      );

      const parsedContent = xmlParser.parse(fileContent);
      const isEnglishText = parsedContent?.Database?.EnglishText != null;

      console.log(
        `Parsed localized text file: ${filePath}`,
        parsedContent,
        isEnglishText
      );
      const rows = parseXmlArray(
        parsedContent?.Database?.LocalizedText?.Row ??
          parsedContent?.Database?.EnglishText?.Row
      );

      for (const row of rows) {
        if (!row?.['@_Tag']) {
          console.warn(
            `Missing @Tag in localized text row: ${JSON.stringify(row)}`
          );
          continue;
        }

        const rowLocale = row?.['@_Locale'] || file.locale || 'en_US';
        if (!localizedTexts[rowLocale]) {
          localizedTexts[rowLocale] = {};
        }

        localizedTexts[rowLocale][row?.['@_Tag']] = row?.Text;
      }
      console.log(`Parsed localized text file: ${filePath}`, localizedTexts);
    } catch (error) {
      console.error(`Error reading localized text file: ${filePath}`, error);
      continue;
    }
  }

  return localizedTexts;
}
