import { type CalbySound } from '../features/settings/sound-catalog'

export class CalbySoundPlayer {
  private static instance: CalbySoundPlayer | null = null
  private activeAudioElement: HTMLAudioElement | null = null
  private activeAudioContext: AudioContext | null = null
  private alarmTimeoutId: ReturnType<typeof setTimeout> | null = null
  private currentPlayingId: string | null = null

  public static getInstance(): CalbySoundPlayer {
    if (!CalbySoundPlayer.instance) {
      CalbySoundPlayer.instance = new CalbySoundPlayer()
    }
    return CalbySoundPlayer.instance
  }

  /**
   * Stop any currently playing sound preview or alarm immediately.
   */
  public stopAll(): void {
    this.currentPlayingId = null

    if (this.activeAudioElement) {
      try {
        this.activeAudioElement.pause()
        this.activeAudioElement.currentTime = 0
      } catch {
        // ignore
      }
      this.activeAudioElement = null
    }

    if (this.activeAudioContext) {
      try {
        void this.activeAudioContext.close()
      } catch {
        // ignore
      }
      this.activeAudioContext = null
    }

    if (this.alarmTimeoutId) {
      clearTimeout(this.alarmTimeoutId)
      this.alarmTimeoutId = null
    }
  }

  public getCurrentPlayingId(): string | null {
    return this.currentPlayingId
  }

  /**
   * Plays a preview of a specified sound ONCE and stops upon completion.
   */
  public async playPreview(sound: CalbySound): Promise<void> {
    this.stopAll()
    this.currentPlayingId = sound.id

    // 1. Attempt to play local audio asset (non-looping)
    const playedFile = await this.tryPlayAudioFile(sound.id, sound.localAssetPath, false)
    if (playedFile) return

    // 2. Fallback to Web Audio synthesis notes if asset could not be played
    if (this.currentPlayingId === sound.id) {
      this.playSynthesizedSound(sound)
    }
  }

  /**
   * Plays the notification sound at least `targetRepeats` times (default 2)
   * and stays audible for at least `minDurationMs` (default 5000ms).
   * Stops automatically after both conditions are met, without requiring user interaction.
   */
  public async playNotification(
    sound: CalbySound,
    targetRepeats = 2,
    minDurationMs = 5000
  ): Promise<void> {
    this.stopAll()
    this.currentPlayingId = sound.id
    const sessionId = sound.id

    const startTime = Date.now()
    let repeatsDone = 0

    const playCycleOnce = (): Promise<boolean> => {
      return new Promise((resolve) => {
        if (this.currentPlayingId !== sessionId) {
          resolve(false)
          return
        }
        try {
          const formattedPath = this.getSoundUrl(sound.localAssetPath)
          const audio = new Audio(formattedPath)
          this.activeAudioElement = audio

          const cleanup = () => {
            audio.oncanplaythrough = null
            audio.onerror = null
            audio.onended = null
          }

          audio.oncanplaythrough = () => {
            if (this.currentPlayingId !== sessionId) {
              audio.pause()
              cleanup()
              if (this.activeAudioElement === audio) this.activeAudioElement = null
              resolve(false)
              return
            }
            audio.play()
              .then(() => {
                // Resolve true after the sound *finishes* playing
                audio.onended = () => {
                  cleanup()
                  if (this.activeAudioElement === audio) this.activeAudioElement = null
                  resolve(true)
                }
              })
              .catch(() => {
                cleanup()
                if (this.activeAudioElement === audio) this.activeAudioElement = null
                resolve(false)
              })
          }

          audio.onerror = () => {
            cleanup()
            if (this.activeAudioElement === audio) this.activeAudioElement = null
            resolve(false)
          }
        } catch {
          resolve(false)
        }
      })
    }

    const playSynthOnce = (): Promise<void> => {
      return new Promise((resolve) => {
        if (this.currentPlayingId !== sessionId) {
          resolve()
          return
        }
        this.playSynthesizedSound(sound, () => resolve())
      })
    }

    // Main repeat loop: keep playing until BOTH conditions met
    while (this.currentPlayingId === sessionId) {
      const played = await playCycleOnce()
      if (!played && this.currentPlayingId === sessionId) {
        // Fallback: synthesized sound
        await playSynthOnce()
      }

      repeatsDone++
      const elapsed = Date.now() - startTime

      // Stop once we've met BOTH: minimum repeats AND minimum duration
      if (repeatsDone >= targetRepeats && elapsed >= minDurationMs) {
        break
      }

      // Short gap between repeats for clarity
      if (this.currentPlayingId === sessionId) {
        await new Promise((resolve) => setTimeout(resolve, 300))
      }
    }

    if (this.currentPlayingId === sessionId) {
      this.stopAll()
    }
  }

  /**
   * Rings the alarm for a reminder trigger.
   */
  public async ringAlarm(sound: CalbySound, durationSetting: string = 'until_stopped'): Promise<void> {
    this.stopAll()
    this.currentPlayingId = sound.id

    // Setup auto-stop duration timeout if specified
    if (durationSetting !== 'until_stopped') {
      let durationMs = 60 * 1000 // default 1 min
      if (durationSetting === '5_min') durationMs = 5 * 60 * 1000
      if (durationSetting === '10_min') durationMs = 10 * 60 * 1000

      this.alarmTimeoutId = setTimeout(() => {
        this.stopAll()
      }, durationMs)
    }

    // Attempt file or synthesized loop
    const playedFile = await this.tryPlayAudioFile(sound.id, sound.localAssetPath, true)
    if (!playedFile && this.currentPlayingId === sound.id) {
      this.playSynthesizedLoop(sound)
    }
  }

  private getSoundUrl(assetPath: string): string {
    const cleanPath = assetPath.replace(/^[/\\]+/, '')
    if (window.location.protocol === 'file:') {
      return new URL(cleanPath, window.location.href).href
    }
    return '/' + cleanPath
  }

  private tryPlayAudioFile(soundId: string, assetPath: string, loop = false): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const formattedPath = this.getSoundUrl(assetPath)
        const audio = new Audio(formattedPath)
        audio.loop = loop
        this.activeAudioElement = audio

        const cleanup = () => {
          audio.oncanplaythrough = null
          audio.onerror = null
          audio.onended = null
        }

        audio.oncanplaythrough = () => {
          // If sound was stopped or changed before audio finished loading, do not play!
          if (this.currentPlayingId !== soundId) {
            audio.pause()
            cleanup()
            if (this.activeAudioElement === audio) {
              this.activeAudioElement = null
            }
            resolve(false)
            return
          }

          audio.play()
            .then(() => resolve(true))
            .catch(() => {
              cleanup()
              if (this.activeAudioElement === audio) {
                this.activeAudioElement = null
              }
              resolve(false)
            })
        }

        audio.onerror = () => {
          cleanup()
          if (this.activeAudioElement === audio) {
            this.activeAudioElement = null
          }
          resolve(false)
        }

        audio.onended = () => {
          cleanup()
          if (this.currentPlayingId === soundId) {
            this.currentPlayingId = null
          }
          if (this.activeAudioElement === audio) {
            this.activeAudioElement = null
          }
          resolve(true)
        }
      } catch {
        resolve(false)
      }
    })
  }

  private playSynthesizedSound(sound: CalbySound, onEnded?: () => void): void {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioCtx()
      this.activeAudioContext = ctx

      let maxEndTime = 0

      for (const note of sound.notes) {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()

        osc.type = note.type || 'sine'
        const startTime = ctx.currentTime + (note.delay || 0)
        const endTime = startTime + note.duration

        osc.frequency.setValueAtTime(note.freq, startTime)

        gain.gain.setValueAtTime(0.001, startTime)
        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.001, endTime)

        osc.connect(gain)
        gain.connect(ctx.destination)

        osc.start(startTime)
        osc.stop(endTime)

        if (endTime > maxEndTime) {
          maxEndTime = endTime
        }
      }

      const totalDurationMs = Math.max(500, (maxEndTime - ctx.currentTime) * 1000 + 100)
      setTimeout(() => {
        if (this.activeAudioContext === ctx) {
          if (this.currentPlayingId === sound.id) {
            this.currentPlayingId = null
          }
          void ctx.close()
          this.activeAudioContext = null
          if (onEnded) onEnded()
        }
      }, totalDurationMs)
    } catch {
      this.currentPlayingId = null
      if (onEnded) onEnded()
    }
  }

  private playSynthesizedLoop(sound: CalbySound): void {
    const loopStep = () => {
      if (this.currentPlayingId !== sound.id) return
      this.playSynthesizedSound(sound, () => {
        if (this.currentPlayingId === sound.id) {
          setTimeout(() => loopStep(), 800)
        }
      })
    }
    loopStep()
  }
}
