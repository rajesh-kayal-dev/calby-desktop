import { ipcMain } from 'electron'
import type { IpcResult } from '../../preload/index.d'
import { ONBOARDING_CHANNELS } from '../../preload/api/onboarding.api'
import { ConfigService } from '../services/config.service'

export const registerOnboardingIpcHandlers = (): void => {
  const configService = ConfigService.getInstance()

  ipcMain.handle(ONBOARDING_CHANNELS.COMPLETE, async (): Promise<IpcResult<void>> => {
    try {
      configService.setOnboarded(true)
      return {
        ok: true,
        data: undefined
      }
    } catch (error) {
      return {
        ok: false,
        error: {
          code: 'ONBOARDING_COMPLETE_ERROR',
          message: error instanceof Error ? error.message : 'Failed to complete onboarding'
        }
      }
    }
  })
}
