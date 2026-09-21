import { app } from 'electron'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

/**
 * Resolves an asset sound path safely across development and packaged builds.
 * Example input: 'assets/sounds/notifications/mixkit-bell-notification-933.wav'
 */
export function resolveSoundPath(relativeAssetPath: string): string | null {
  if (!relativeAssetPath) return null

  // Normalize path separators
  const cleanPath = relativeAssetPath.replace(/^[/\\]+/, '').replace(/[/\\]/g, '/')
  const subPath = cleanPath.replace(/^assets\/sounds\//, '')

  const candidateLocations: string[] = [
    // 1. Packaged extraResources: resources/assets/sounds/...
    join(process.resourcesPath, cleanPath),
    join(process.resourcesPath, 'assets/sounds', subPath),

    // 2. Local workspace assets root
    resolve(process.cwd(), cleanPath),
    resolve(process.cwd(), 'assets/sounds', subPath),
    resolve(process.cwd(), '../../', cleanPath),

    // 3. Renderer public assets directory
    resolve(process.cwd(), 'apps/desktop/src/renderer/public', cleanPath),
    resolve(process.cwd(), 'src/renderer/public', cleanPath),
    resolve(process.cwd(), 'out/renderer', cleanPath),

    // 4. Relative to appPath
    join(app.getAppPath(), cleanPath),
    join(app.getAppPath(), 'out/renderer', cleanPath),
    join(app.getAppPath(), 'src/renderer/public', cleanPath),
    join(app.getAppPath(), '../../', cleanPath),

    // 5. Relative to __dirname (out/main or src/main)
    resolve(__dirname, '../../', cleanPath),
    resolve(__dirname, '../../../', cleanPath),
    resolve(__dirname, '../../../../', cleanPath)
  ]

  for (const candidate of candidateLocations) {
    try {
      if (existsSync(candidate)) {
        return candidate
      }
    } catch {
      // Ignore filesystem permission errors during check
    }
  }

  console.warn(`[SoundResolver] Could not locate sound asset "${relativeAssetPath}". Checked ${candidateLocations.length} locations.`)
  return null
}

export function resolveAssetPath(relativeAssetPath: string): string | null {
  if (!relativeAssetPath) return null
  const cleanPath = relativeAssetPath.replace(/^[/\\]+/, '').replace(/[/\\]/g, '/')

  const candidateLocations: string[] = [
    join(process.resourcesPath, cleanPath),
    join(process.resourcesPath, 'assets', cleanPath),
    resolve(process.cwd(), cleanPath),
    resolve(process.cwd(), 'assets', cleanPath),
    resolve(process.cwd(), '../../', cleanPath),
    resolve(process.cwd(), '../../assets', cleanPath),
    join(app.getAppPath(), cleanPath),
    join(app.getAppPath(), 'assets', cleanPath),
    join(app.getAppPath(), '../../assets', cleanPath),
    resolve(__dirname, '../../assets', cleanPath),
    resolve(__dirname, '../../../assets', cleanPath)
  ]

  for (const candidate of candidateLocations) {
    try {
      if (existsSync(candidate)) {
        return candidate
      }
    } catch {
      // ignore
    }
  }

  return null
}

