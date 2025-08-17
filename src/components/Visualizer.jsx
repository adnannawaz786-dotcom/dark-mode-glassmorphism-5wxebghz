import { useEffect, useRef } from 'react'
import { useAudioContext } from '../utils/audioContext'

export default function Visualizer({ className = "" }) {
  const canvasRef = useRef(null)
  const animationRef = useRef(null)
  const { audioContext, analyser, isPlaying } = useAudioContext()

  useEffect(() => {
    if (!canvasRef.current || !analyser || !isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    const draw = () => {
      if (!isPlaying) return

      analyser.getByteFrequencyData(dataArray)
      
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio
      
      // Clear canvas with gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(17, 24, 39, 0.1)')
      gradient.addColorStop(1, 'rgba(17, 24, 39, 0.3)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Draw frequency bars
      const barWidth = width / bufferLength * 2.5
      let barHeight
      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        barHeight = (dataArray[i] / 255) * height * 0.8

        // Create gradient for each bar
        const barGradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
        const hue = (i / bufferLength) * 360
        barGradient.addColorStop(0, `hsla(${hue}, 70%, 60%, 0.8)`)
        barGradient.addColorStop(1, `hsla(${hue}, 70%, 40%, 0.6)`)

        ctx.fillStyle = barGradient
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)

        // Add glow effect
        ctx.shadowColor = `hsla(${hue}, 70%, 60%, 0.5)`
        ctx.shadowBlur = 10
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
        ctx.shadowBlur = 0

        x += barWidth + 1
      }

      // Draw waveform overlay
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      
      const sliceWidth = width / bufferLength
      let waveX = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const waveY = v * height / 2

        if (i === 0) {
          ctx.moveTo(waveX, waveY)
        } else {
          ctx.lineTo(waveX, waveY)
        }

        waveX += sliceWidth
      }

      ctx.stroke()

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [analyser, isPlaying])

  // Static visualization when not playing
  useEffect(() => {
    if (!canvasRef.current || isPlaying) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    
    const drawStatic = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
      
      const width = rect.width
      const height = rect.height

      // Clear with dark gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, 'rgba(17, 24, 39, 0.2)')
      gradient.addColorStop(1, 'rgba(17, 24, 39, 0.4)')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Draw static bars
      const barCount = 64
      const barWidth = width / barCount * 0.8
      
      for (let i = 0; i < barCount; i++) {
        const x = (i * width) / barCount
        const barHeight = Math.random() * height * 0.3 + 10
        
        ctx.fillStyle = 'rgba(100, 116, 139, 0.3)'
        ctx.fillRect(x, height - barHeight, barWidth, barHeight)
      }

      // Add center line
      ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(0, height / 2)
      ctx.lineTo(width, height / 2)
      ctx.stroke()
    }

    drawStatic()
  }, [isPlaying])

  return (
    <div className={`relative overflow-hidden rounded-xl bg-gray-900/20 backdrop-blur-sm border border-white/10 ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full"
        style={{ minHeight: '120px' }}
      />
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-gray-400 text-sm font-medium opacity-60">
            Play music to see visualization
          </div>
        </div>
      )}
    </div>
  )
}