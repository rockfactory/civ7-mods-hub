import { parseXmlArray } from './parseXml';

export function getModInfoDependencies(modInfo: any) {
  const dependencies = parseXmlArray(modInfo?.Mod?.Dependencies?.Mod).map(
    (dep: any) => {
      return {
        id: dep?.['@_id'] || null,
      };
    }
  );

  return dependencies;
}
