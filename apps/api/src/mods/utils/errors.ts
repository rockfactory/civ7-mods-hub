/**
 * If this error is thrown, the mod version will be skipped and not processed further
 * again, as it's impossible to install it.
 */
export class SkipInstallError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SkipInstallError';
  }
}

export class DownloadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DownloadError';
  }
}
