export function compressLogoForEmail(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      // Max 300px wide, proportional height - tiny for email
      const maxW = 300
      const scale = Math.min(1, maxW / img.width)
      canvas.width = Math.round(img.width * scale)
      canvas.height = Math.round(img.height * scale)
      const ctx = canvas.getContext('2d')!
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
      // JPEG at 65% quality - typically <10KB for a logo
      resolve(canvas.toDataURL('image/jpeg', 0.65))
    }
    img.onerror = () => resolve(dataUrl) // fallback to original on error
    img.src = dataUrl
  })
}
