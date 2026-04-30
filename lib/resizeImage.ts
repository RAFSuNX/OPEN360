export function resizeImageTo1000(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const canvas = document.createElement('canvas')
      canvas.width = 1000
      canvas.height = 1000
      const ctx = canvas.getContext('2d')!
      // Transparent background - logo stays crisp on any bg color
      ctx.clearRect(0, 0, 1000, 1000)
      // Scale to fit within 1000x1000 keeping aspect ratio, centered
      const scale = Math.min(1000 / img.width, 1000 / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (1000 - w) / 2
      const y = (1000 - h) / 2
      ctx.drawImage(img, x, y, w, h)
      resolve(canvas.toDataURL('image/png'))
    }
    img.onerror = reject
    img.src = url
  })
}
