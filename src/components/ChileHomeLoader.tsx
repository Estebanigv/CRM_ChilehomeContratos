'use client'

import { useEffect, useState } from 'react'

interface ChileHomeLoaderProps {
  isLoading: boolean
  onComplete?: () => void
}

interface Particle {
  id: number
  x: number
  y: number
  size: number
  color: string
  velocity: { x: number; y: number }
  opacity: number
}

export default function ChileHomeLoader({ isLoading, onComplete }: ChileHomeLoaderProps) {
  const [progress, setProgress] = useState(0)
  const [particles, setParticles] = useState<Particle[]>([])

  // Generar partículas
  useEffect(() => {
    if (!isLoading) return

    const generateParticles = () => {
      const newParticles: Particle[] = []
      for (let i = 0; i < 20; i++) {
        newParticles.push({
          id: i,
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          size: Math.random() * 8 + 4,
          color: ['#3B82F6', '#60A5FA', '#93C5FD', '#DBEAFE'][Math.floor(Math.random() * 4)],
          velocity: {
            x: (Math.random() - 0.5) * 2,
            y: (Math.random() - 0.5) * 2
          },
          opacity: Math.random() * 0.6 + 0.2
        })
      }
      setParticles(newParticles)
    }

    generateParticles()
  }, [isLoading])

  // Animar partículas
  useEffect(() => {
    if (!isLoading) return

    const animateParticles = () => {
      setParticles(prev => prev.map(particle => ({
        ...particle,
        x: (particle.x + particle.velocity.x + window.innerWidth) % window.innerWidth,
        y: (particle.y + particle.velocity.y + window.innerHeight) % window.innerHeight,
        opacity: 0.2 + Math.sin(Date.now() * 0.002 + particle.id) * 0.3
      })))
    }

    const particleInterval = setInterval(animateParticles, 50)
    return () => clearInterval(particleInterval)
  }, [isLoading])

  // Progreso de carga
  useEffect(() => {
    if (!isLoading) return

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer)
          setTimeout(() => onComplete?.(), 500)
          return 100
        }
        return prev + 1.5
      })
    }, 60)

    return () => clearInterval(timer)
  }, [isLoading, onComplete])

  if (!isLoading) return null

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-white to-blue-50 z-50 flex items-center justify-center overflow-hidden">
      {/* Partículas flotantes */}
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full blur-sm animate-pulse"
          style={{
            left: `${particle.x}px`,
            top: `${particle.y}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color,
            opacity: particle.opacity,
            transform: 'translate(-50%, -50%)',
            animation: `float-${particle.id} ${3 + Math.random() * 4}s ease-in-out infinite`
          }}
        />
      ))}

      <div className="relative flex flex-col items-center z-10">
        {/* Logo principal con glassmorphism */}
        <div className="relative mb-8">
          {/* Efecto de sombra suave */}
          <div className="absolute inset-0 w-32 h-32 bg-blue-400 rounded-full opacity-20 blur-xl animate-pulse-slow"></div>
          
          {/* Logo con efecto glassmorphism */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl border border-white/20 backdrop-blur-sm">
            <span className="text-white font-bold text-3xl tracking-wider drop-shadow-lg">CH</span>
            
            {/* Brillo interno */}
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-white/30 to-transparent"></div>
          </div>
          
          {/* Partículas orbitales */}
          <div className="absolute inset-0 w-24 h-24">
            <div className="absolute w-2 h-2 bg-blue-400 rounded-full top-0 left-1/2 transform -translate-x-1/2 animate-orbit"></div>
            <div className="absolute w-1.5 h-1.5 bg-blue-300 rounded-full bottom-0 right-1/2 transform translate-x-1/2 animate-orbit-reverse"></div>
            <div className="absolute w-1 h-1 bg-blue-500 rounded-full top-1/2 right-0 transform -translate-y-1/2 animate-orbit-slow"></div>
          </div>
        </div>
        
        {/* Información de carga */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 tracking-wide">ChileHome</h2>
          <p className="text-gray-600 text-sm font-medium">Plataforma profesional de contratos</p>
          
          {/* Barra de progreso moderna */}
          <div className="w-80 h-1 bg-gray-200 rounded-full overflow-hidden shadow-inner">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-full transition-all duration-500 ease-out shadow-sm"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          
          {/* Porcentaje destacado */}
          <div className="text-blue-600 font-bold text-xl tracking-wider">
            {Math.round(progress)}%
          </div>
        </div>
      </div>
      
      {/* Estilos de animación */}
      <style jsx>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes orbit {
          from { transform: rotate(0deg) translateX(50px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(50px) rotate(-360deg); }
        }
        @keyframes orbit-reverse {
          from { transform: rotate(0deg) translateX(-50px) rotate(0deg); }
          to { transform: rotate(-360deg) translateX(-50px) rotate(360deg); }
        }
        @keyframes orbit-slow {
          from { transform: rotate(0deg) translateX(40px) rotate(0deg); }
          to { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-orbit {
          animation: orbit 4s linear infinite;
        }
        .animate-orbit-reverse {
          animation: orbit-reverse 6s linear infinite;
        }
        .animate-orbit-slow {
          animation: orbit-slow 8s linear infinite;
        }
      `}</style>
    </div>
  )
}