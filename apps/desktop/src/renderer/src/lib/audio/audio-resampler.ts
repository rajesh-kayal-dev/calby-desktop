/**
 * Resamples Float32 audio samples from source sample rate to 16000 Hz,
 * and converts to 16-bit mono Linear PCM (Int16Array).
 */
export function resampleTo16kMonoPcm(
  inputData: Float32Array,
  sourceSampleRate: number
): { pcmInt16: Int16Array; uint8Buffer: Uint8Array } {
  const targetSampleRate = 16000

  if (sourceSampleRate === targetSampleRate) {
    const pcmInt16 = new Int16Array(inputData.length)
    for (let i = 0; i < inputData.length; i++) {
      const s = Math.max(-1, Math.min(1, inputData[i]))
      pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return {
      pcmInt16,
      uint8Buffer: new Uint8Array(pcmInt16.buffer, pcmInt16.byteOffset, pcmInt16.byteLength)
    }
  }

  // Linear interpolation resampling
  const ratio = sourceSampleRate / targetSampleRate
  const outputLength = Math.round(inputData.length / ratio)
  const pcmInt16 = new Int16Array(outputLength)

  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio
    const indexFloor = Math.floor(srcIndex)
    const indexCeil = Math.min(indexFloor + 1, inputData.length - 1)
    const weight = srcIndex - indexFloor

    const interpolated = inputData[indexFloor] * (1 - weight) + inputData[indexCeil] * weight
    const s = Math.max(-1, Math.min(1, interpolated))
    pcmInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
  }

  return {
    pcmInt16,
    uint8Buffer: new Uint8Array(pcmInt16.buffer, pcmInt16.byteOffset, pcmInt16.byteLength)
  }
}

/**
 * Converts a Uint8Array buffer into a Base64 encoded string.
 */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = ''
  const len = bytes.byteLength
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return window.btoa(binary)
}

/**
 * Decodes a Base64 string into a Uint8Array buffer.
 */
export function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = window.atob(base64)
  const len = binaryString.length
  const bytes = new Uint8Array(len)
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes
}
