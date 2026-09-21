const zlib = require('zlib')
const fs = require('fs')
const path = require('path')

function createPng(width, height) {
  // RGBA buffer
  const rgba = Buffer.alloc(width * height * 4)

  // Draw a dark rounded rectangle with cyan bars
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4

      // Background: dark #101725 (16, 23, 37)
      let r = 16, g = 23, b = 37, a = 255

      // Waveform bars:
      // Bar 1: x 36..64, y 96..160
      // Bar 2: x 76..104, y 64..192
      // Bar 3: x 116..144, y 44..212
      // Bar 4: x 156..184, y 76..180
      // Bar 5: x 196..224, y 104..152
      const bars = [
        { x0: 36, x1: 64, y0: 96, y1: 160, color: [56, 189, 248] },
        { x0: 76, x1: 104, y0: 64, y1: 192, color: [56, 189, 248] },
        { x0: 116, x1: 144, y0: 44, y1: 212, color: [2, 132, 199] },
        { x0: 156, x1: 184, y0: 76, y1: 180, color: [56, 189, 248] },
        { x0: 196, x1: 224, y0: 104, y1: 152, color: [56, 189, 248] }
      ]

      for (const bar of bars) {
        if (x >= bar.x0 && x <= bar.x1 && y >= bar.y0 && y <= bar.y1) {
          r = bar.color[0]
          g = bar.color[1]
          b = bar.color[2]
          a = 255
          break
        }
      }

      rgba[idx] = r
      rgba[idx + 1] = g
      rgba[idx + 2] = b
      rgba[idx + 3] = a
    }
  }

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1))
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (width * 4 + 1)
    scanlines[rowOffset] = 0 // Filter type None
    rgba.copy(scanlines, rowOffset + 1, y * width * 4, (y + 1) * width * 4)
  }

  const idatData = zlib.deflateSync(scanlines)

  function crc32(buf) {
    let c = ~0
    for (let i = 0; i < buf.length; i++) {
      c ^= buf[i]
      for (let j = 0; j < 8; j++) {
        c = (c >>> 1) ^ (0xedb88320 & -(c & 1))
      }
    }
    return ~c
  }

  function makeChunk(type, data) {
    const len = Buffer.alloc(4)
    len.writeUInt32BE(data.length, 0)
    const typeBuf = Buffer.from(type, 'ascii')
    const crcBuf = Buffer.alloc(4)
    const toCrc = Buffer.concat([typeBuf, data])
    crcBuf.writeInt32BE(crc32(toCrc), 0)
    return Buffer.concat([len, toCrc, crcBuf])
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // color type RGBA
  ihdr[10] = 0 // compression
  ihdr[11] = 0 // filter
  ihdr[12] = 0 // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr)
  const idatChunk = makeChunk('IDAT', idatData)
  const iendChunk = makeChunk('IEND', Buffer.alloc(0))

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk])
}

const png = createPng(256, 256)
const outPath = path.join(__dirname, '../assets/icon.png')
fs.writeFileSync(outPath, png)
console.log('Successfully written icon.png, bytes:', png.length)
