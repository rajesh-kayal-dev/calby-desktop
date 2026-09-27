import type { PlatformId } from '@/lib/constants/downloads';

/** Best-effort, synchronous guess used before the browser can confirm. */
export function guessPlatform(): PlatformId | null {
  if (typeof navigator === 'undefined') return null;
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux') || ua.includes('ubuntu')) return 'linux';
  return null;
}

// Apple Silicon vs Intel is not visible in the user agent, so ask the browser
// when it can and keep the Apple Silicon default otherwise.
export async function guessMacOption(): Promise<'apple-silicon' | 'intel'> {
  const nav = navigator as Navigator & {
    userAgentData?: {
      getHighValues?: (hints: string[]) => Promise<Record<string, string>>;
    };
  };
  try {
    const values = await nav.userAgentData?.getHighValues?.(['architecture']);
    const arch = (values?.architecture ?? '').toLowerCase();
    if (arch && !arch.includes('arm') && !arch.includes('silicon')) return 'intel';
  } catch {
    /* keep the default */
  }
  return 'apple-silicon';
}
