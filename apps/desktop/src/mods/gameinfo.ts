export const LatestGameUpdate = await getLatestGameUpdate()

async function getLatestGameUpdate() {
  const appId = "1295660"
  const apiUrl = "https://api.steamcmd.net/v1/info/"+appId;
  const response = await fetch(apiUrl);

  if (!response.ok) {
    throw new Error(`SteamCMD API error: ${response.status}`);
  }

  const gameInfo = await response.json();
  return gameInfo.data[appId]?.depots?.branches?.public?.timeupdated
}
