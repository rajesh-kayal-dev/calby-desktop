export type PlatformId = 'windows' | 'macos' | 'linux';
export type OptionId = 'windows' | 'apple-silicon' | 'intel' | 'appimage' | 'deb';

export interface DownloadOption {
  id: OptionId;
  label: string;
  note?: string;
  fileName: string;
}

export interface Platform {
  id: PlatformId;
  label: string;
  options: DownloadOption[];
}

/** Release page shown when no option is selected yet. */
export const RELEASE_URL =
  'https://github.com/rajesh-kayal-dev/calby-desktop/releases/tag/v1.0.0';

const DOWNLOAD_BASE =
  'https://github.com/rajesh-kayal-dev/calby-desktop/releases/download/v1.0.0';

export const PLATFORMS: Platform[] = [
  {
    id: 'windows',
    label: 'Windows',
    options: [
      { id: 'windows', label: 'Windows installer', fileName: 'Calby-1.0.0-x64.msi' }
    ]
  },
  {
    id: 'macos',
    label: 'macOS',
    options: [
      {
        id: 'apple-silicon',
        label: 'Apple Silicon',
        note: 'M1 / M2 / M3 / M4',
        fileName: 'Calby-1.0.0-arm64.dmg'
      },
      {
        id: 'intel',
        label: 'Intel',
        note: 'Intel Chip',
        fileName: 'Calby-1.0.0-x64.dmg'
      }
    ]
  },
  {
    id: 'linux',
    label: 'Linux',
    options: [
      {
        id: 'appimage',
        label: 'AppImage',
        note: 'Recommended',
        fileName: 'Calby-1.0.0-x86_64.AppImage'
      },
      {
        id: 'deb',
        label: 'Debian (.deb)',
        fileName: 'Calby-1.0.0-amd64.deb'
      }
    ]
  }
];

export function assetUrl(fileName: string): string {
  return `${DOWNLOAD_BASE}/${fileName}`;
}
