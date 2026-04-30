'use client'
import { useRef, useState, useEffect, useCallback } from 'react'

interface Props {
  imageSrc: string
  onDone: (dataUrl: string) => void
  onCancel: () => void
}

export function ImageCropModal({ imageSrc, onDone, onCancel }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)
  const [loaded, setLoaded] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0, size: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, cx: 0, cy: 0 })
  const [scale, setScale] = useState(1)

  const PREVIEW = 320 // canvas display size

  useEffect(() => {
    const img = new Image()
    img.onload = () => {
      imgRef.current = img
      const s = Math.min(PREVIEW / img.width, PREVIEW / img.height)
      setScale(s)
      const dispW = img.width * s
      const dispH = img.height * s
      const size = Math.min(dispW, dispH) * 0.8
      setCrop({ x: (dispW - size) / 2, y: (dispH - size) / 2, size })
      setLoaded(true)
    }
    img.src = imageSrc
  }, [imageSrc])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')!
    const dispW = img.width * scale
    const dispH = img.height * scale
    canvas.width = dispW
    canvas.height = dispH
    ctx.drawImage(img, 0, 0, dispW, dispH)
    // Dim outside crop
    ctx.fillStyle = 'rgba(38,37,30,0.5)'
    ctx.fillRect(0, 0, dispW, dispH)
    // Clear crop area
    ctx.clearRect(crop.x, crop.y, crop.size, crop.size)
    ctx.drawImage(img, crop.x / scale, crop.y / scale, crop.size / scale, crop.size / scale, crop.x, crop.y, crop.size, crop.size)
    // Crop border
    ctx.strokeStyle = '#f54e00'
    ctx.lineWidth = 2
    ctx.strokeRect(crop.x, crop.y, crop.size, crop.size)
    // Corner handles
    const h = 10
    ctx.fillStyle = '#f54e00'
    ;[[crop.x, crop.y], [crop.x + crop.size - h, crop.y], [crop.x, crop.y + crop.size - h], [crop.x + crop.size - h, crop.y + crop.size - h]].forEach(([hx, hy]) => {
      ctx.fillRect(hx, hy, h, h)
    })
  }, [crop, scale])

  useEffect(() => { if (loaded) draw() }, [loaded, draw])

  function onMouseDown(e: React.MouseEvent<HTMLCanvasElement>) {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    if (mx >= crop.x && mx <= crop.x + crop.size && my >= crop.y && my <= crop.y + crop.size) {
      setDragging(true)
      setDragStart({ mx, my, cx: crop.x, cy: crop.y })
    }
  }

  function onMouseMove(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!dragging || !imgRef.current) return
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const mx = e.clientX - rect.left
    const my = e.clientY - rect.top
    const dx = mx - dragStart.mx
    const dy = my - dragStart.my
    const dispW = imgRef.current.width * scale
    const dispH = imgRef.current.height * scale
    const newX = Math.max(0, Math.min(dispW - crop.size, dragStart.cx + dx))
    const newY = Math.max(0, Math.min(dispH - crop.size, dragStart.cy + dy))
    setCrop(c => ({ ...c, x: newX, y: newY }))
  }

  function onMouseUp() { setDragging(false) }

  function changeSize(delta: number) {
    if (!imgRef.current) return
    const dispW = imgRef.current.width * scale
    const dispH = imgRef.current.height * scale
    const newSize = Math.max(40, Math.min(Math.min(dispW, dispH), crop.size + delta))
    const newX = Math.max(0, Math.min(dispW - newSize, crop.x))
    const newY = Math.max(0, Math.min(dispH - newSize, crop.y))
    setCrop({ x: newX, y: newY, size: newSize })
  }

  function applyCrop() {
    const img = imgRef.current
    if (!img) return
    const out = document.createElement('canvas')
    out.width = 1000; out.height = 1000
    const ctx = out.getContext('2d')!
    ctx.clearRect(0, 0, 1000, 1000)
    // Source rect in original image coords
    const sx = crop.x / scale
    const sy = crop.y / scale
    const sw = crop.size / scale
    ctx.drawImage(img, sx, sy, sw, sw, 0, 0, 1000, 1000)
    onDone(out.toDataURL('image/png'))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(38,37,30,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}>
      <div className="card" style={{ padding: '24px', maxWidth: '420px', width: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <p style={{ fontSize: '15px', fontWeight: '600', color: 'var(--ink)', margin: 0 }}>Crop logo</p>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: '20px' }}>×</button>
        </div>
        <p style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '12px' }}>Drag the orange square to position. Output will be 1000×1000px.</p>

        <div style={{ background: 'var(--canvas-soft)', borderRadius: '8px', overflow: 'hidden', display: 'inline-block', width: '100%' }}>
          <canvas
            ref={canvasRef}
            style={{ display: 'block', width: '100%', cursor: dragging ? 'grabbing' : 'grab', imageRendering: 'auto' }}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', marginBottom: '16px' }}>
          <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Crop size</span>
          <button onClick={() => changeSize(-20)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '14px' }}>−</button>
          <button onClick={() => changeSize(20)} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '14px' }}>+</button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onCancel} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
          <button onClick={applyCrop} className="btn-primary" style={{ flex: 2 }}>Apply crop (1000×1000)</button>
        </div>
      </div>
    </div>
  )
}
