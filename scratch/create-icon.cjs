const { app, nativeImage } = require('electron')
const fs = require('fs')
const path = require('path')

app.whenReady().then(() => {
  // SVG of Calby brand sound-wave
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
    <rect width="256" height="256" rx="56" fill="#0C111C"/>
    <rect x="36" y="96" width="28" height="64" rx="14" fill="#38BDF8"/>
    <rect x="76" y="64" width="28" height="128" rx="14" fill="#38BDF8"/>
    <rect x="116" y="44" width="28" height="168" rx="14" fill="#0284C7"/>
    <rect x="156" y="76" width="28" height="104" rx="14" fill="#38BDF8"/>
    <rect x="196" y="104" width="28" height="48" rx="14" fill="#38BDF8"/>
  </svg>`

  const svgDataUrl = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
  const img = nativeImage.createFromDataURL(svgDataUrl)
  const pngBuffer = img.resize({ width: 256, height: 256 }).toPNG()

  const assetsDir = path.join(__dirname, '../assets')
  if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true })

  fs.writeFileSync(path.join(assetsDir, 'icon.png'), pngBuffer)
  console.log('Saved icon.png size:', pngBuffer.length)
  app.quit()
})
