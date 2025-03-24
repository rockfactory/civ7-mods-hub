// File patterns based on the latest naming convention
const PLATFORM_PATTERNS = {
  windows: /CivMods_.*_x64.*\.msi$/,
  macos_intel: /CivMods_.*_x64\.dmg$/,
  macos_arm: /CivMods_.*_aarch64\.dmg$/,
  macos_universal: /CivMods_.*_universal\.dmg$/,
  linux: /CivMods_.*_amd64\.AppImage$/,
};

export interface Release {
  version: string;
  title: string;
  release_url: string;
  date_formatted?: string;
  body: string;
  downloads: {
    windows?: string;
    macos_intel?: string;
    macos_arm?: string;
    macos_universal?: string;
    linux?: string;
  };
}

let cachedReleases: {
  [key: string]: {
    data: Release;
    expiresAt: number;
  };
};

/**
 * Keep a cached in-memory copy of the latest download links for 5 minutes.
 */
export async function getCachedGithubRelease(
  tag: 'latest' | string = 'latest'
): Promise<Release | null> {
  const now = Date.now();

  // Check if we have a cached copy
  if (cachedReleases?.[tag] && cachedReleases[tag].expiresAt > now) {
    return cachedReleases[tag].data;
  }

  // Fetch the latest download links
  const release = await getGithubRelease(tag);
  if (release) {
    // Cache the result
    cachedReleases = {
      ...cachedReleases,
      [tag]: {
        data: release,
        expiresAt: now + 300000, // 5 minutes
      },
    };
  }

  return release;
}

export async function getGithubRelease(
  tag: 'latest' | string = 'latest'
): Promise<Release | null> {
  // tag should be latest or app-vx.x.x
  if (
    tag !== 'latest' &&
    !/^app-v\d+\.\d+\.\d+(-(?:alpha|beta)(?:\.\d+)?)?$/.test(tag)
  ) {
    throw new Error('Invalid version tag format');
  }

  const apiUrl = `https://api.github.com/repos/${
    process.env.GITHUB_REPO || 'rockfactory/civ7-mods-hub'
  }/releases/${tag === 'latest' ? 'latest' : `tags/${tag}`}`;

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
    console.log('Release data:', JSON.stringify(releaseData, null, 2));
    const assets = releaseData.assets || [];

    // Prepare the result object
    const release: Release = {
      version: releaseData.tag_name,
      title: releaseData.name,
      release_url: releaseData.html_url,
      date_formatted: new Date(releaseData.published_at).toLocaleDateString(),
      downloads: {},
      body: releaseData.body,
    };

    // Iterate over assets and match them using our regex patterns
    for (const asset of assets) {
      const fileName = asset.name;
      const downloadUrl = asset.browser_download_url;

      if (PLATFORM_PATTERNS.windows.test(fileName)) {
        release.downloads.windows = downloadUrl;
      } else if (PLATFORM_PATTERNS.macos_intel.test(fileName)) {
        release.downloads.macos_intel = downloadUrl;
      } else if (PLATFORM_PATTERNS.macos_arm.test(fileName)) {
        release.downloads.macos_arm = downloadUrl;
      } else if (PLATFORM_PATTERNS.linux.test(fileName)) {
        release.downloads.linux = downloadUrl;
      } else if (PLATFORM_PATTERNS.macos_universal.test(fileName)) {
        release.downloads.macos_universal = downloadUrl;
      }
    }

    return release;
  } catch (error) {
    console.error('Error fetching latest download links:', error);
    return null;
  }
}
