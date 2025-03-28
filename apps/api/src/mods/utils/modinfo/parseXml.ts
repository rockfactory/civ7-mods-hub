export function parseXmlArray(xml: any) {
  if (!xml) return [];
  if (Array.isArray(xml)) return xml;
  return [xml];
}
