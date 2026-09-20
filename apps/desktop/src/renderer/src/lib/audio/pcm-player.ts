import { base64ToUint8Array } from './audio-resampler'

export class PcmPlayer {
  private audioContext: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private nextStartTime: number = 0
  private activeNodes: AudioBufferSourceNode[] = []
  private isPlayingState: boolean = false
  private onPlaybackEndCallback?: () => void

  constructor(onPlaybackEnd?: () => void) {
    this.onPlaybackEndCallback = onPlaybackEnd
  }

  private initAudioContext(): AudioContext {
    if (!this.audioContext || this.audioContext.state === 'closed') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.audioContext = new AudioCtx()
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 64
      this.analyser.smoothingTimeConstant = 0.8
      this.analyser.connect(this.audioContext.destination)
    }

    if (this.audioContext.state === 'suspended') {
      void this.audioContext.resume()
    }

    return this.audioContext
  }

  public getAnalyser(): AnalyserNode | null {
    return this.analyser
  }

  public playChunk(base64Data: string): void {
    const ctx = this.initAudioContext()
    const uint8 = base64ToUint8Array(base64Data)

    // Convert 16-bit PCM (little-endian) to Float32Array
    const dataView = new DataView(uint8.buffer, uint8.byteOffset, uint8.byteLength)
    const sampleCount = Math.floor(uint8.byteLength / 2)
    const float32 = new Float32Array(sampleCount)

    for (let i = 0; i < sampleCount; i++) {
      const int16 = dataView.getInt16(i * 2, true)
      float32[i] = int16 < 0 ? int16 / 32768 : int16 / 32767
    }

    // Gemini Live audio output is 24000 Hz mono
    const audioBuffer = ctx.createBuffer(1, sampleCount, 24000)
    audioBuffer.copyToChannel(float32, 0)

    const sourceNode = ctx.createBufferSource()
    sourceNode.buffer = audioBuffer

    if (this.analyser) {
      sourceNode.connect(this.analyser)
    } else {
      sourceNode.connect(ctx.destination)
    }

    const currentTime = ctx.currentTime
    const startTime = Math.max(currentTime, this.nextStartTime)
    this.nextStartTime = startTime + audioBuffer.duration
    this.isPlayingState = true

    sourceNode.onended = (): void => {
      const idx = this.activeNodes.indexOf(sourceNode)
      if (idx !== -1) {
        this.activeNodes.splice(idx, 1)
      }
      if (this.activeNodes.length === 0 && ctx.currentTime >= this.nextStartTime - 0.05) {
        this.isPlayingState = false
        if (this.onPlaybackEndCallback) {
          this.onPlaybackEndCallback()
        }
      }
    }

    sourceNode.start(startTime)
    this.activeNodes.push(sourceNode)
  }

  public interrupt(): void {
    // Stop and clear all currently playing and scheduled nodes
    for (const node of this.activeNodes) {
      try {
        node.stop()
        node.disconnect()
      } catch {
        // Node might have already finished
      }
    }
    this.activeNodes = []
    if (this.audioContext) {
      this.nextStartTime = this.audioContext.currentTime
    } else {
      this.nextStartTime = 0
    }
    this.isPlayingState = false
  }

  public isPlaying(): boolean {
    return this.isPlayingState
  }

  public close(): void {
    this.interrupt()
    if (this.audioContext && this.audioContext.state !== 'closed') {
      void this.audioContext.close()
      this.audioContext = null
    }
  }
}
