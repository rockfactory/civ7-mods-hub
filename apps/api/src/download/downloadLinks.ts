// File patterns based on the latest naming convention
const PLATFORM_PATTERNS = {
  windows: /CivMods_.*_x64.*\.msi$/,
  macos_intel: /CivMods_.*_x64\.dmg$/,
  macos_arm: /CivMods_.*_aarch64\.dmg$/,
  linux: /CivMods_.*_amd64\.AppImage$/,
};

interface DownloadLinks {
  version: string;
  release_url: string;
  downloads: {
    windows?: string;
    macos_intel?: string;
    macos_arm?: string;
    linux?: string;
  };
}

let cachedDownloadLinksAt: number = 0;
let cachedDownloadLinks: DownloadLinks | null = null;

/**
 * Keep a cached in-memory copy of the latest download links for 5 minutes.
 */
export async function getCachedLatestDownloadLinks(): Promise<DownloadLinks | null> {
  const now = Date.now();

  if (now - cachedDownloadLinksAt < 300000 && cachedDownloadLinks) {
    return cachedDownloadLinks;
  }

  const downloadLinks = await getLatestDownloadLinks();
  if (downloadLinks) {
    cachedDownloadLinks = downloadLinks;
    cachedDownloadLinksAt = now;
  }

  return downloadLinks;
}

export async function getLatestDownloadLinks(): Promise<DownloadLinks | null> {
  const apiUrl = `https://api.github.com/repos/${
    process.env.GITHUB_REPO || 'rockfactory/civ7-mods-hub'
  }/releases/latest`;

  try {
    // Fetch the latest release metadata
    const response = await fetch(apiUrl, {
      headers: process.env.GITHUB_API_TOKEN
        ? { Authorization: `Bearer ${process.env.GITHUB_API_TOKEN}` }
        : {},
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const releaseData = await response.json();
    console.log('Latest release data:', JSON.stringify(releaseData, null, 2));
    const assets = releaseData.assets || [];

    // Prepare the result object
    const downloads: DownloadLinks = {
      version: releaseData.tag_name,
      release_url: releaseData.html_url,
      downloads: {},
    };

    // Iterate over assets and match them using our regex patterns
    for (const asset of assets) {
      const fileName = asset.name;
      const downloadUrl = asset.browser_download_url;

      if (PLATFORM_PATTERNS.windows.test(fileName)) {
        downloads.downloads.windows = downloadUrl;
      } else if (PLATFORM_PATTERNS.macos_intel.test(fileName)) {
        downloads.downloads.macos_intel = downloadUrl;
      } else if (PLATFORM_PATTERNS.macos_arm.test(fileName)) {
        downloads.downloads.macos_arm = downloadUrl;
      } else if (PLATFORM_PATTERNS.linux.test(fileName)) {
        downloads.downloads.linux = downloadUrl;
      }
    }

    return downloads;
  } catch (error) {
    console.error('Error fetching latest download links:', error);
    return null;
  }
}
