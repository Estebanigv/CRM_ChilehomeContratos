'use client'

import React, { Suspense, lazy, ComponentType } from 'react'
import ChileHomeLoader from './ChileHomeLoader'

interface LazyLoadWrapperProps {
  component: () => Promise<{ default: ComponentType<any> }>
  fallback?: React.ReactNode
  delay?: number
  [key: string]: any
}

// Cache de componentes ya cargados
const loadedComponents = new Map<string, ComponentType<any>>()

export const LazyLoadWrapper: React.FC<LazyLoadWrapperProps> = ({
  component,
  fallback,
  delay = 200,
  ...props
}) => {
  const [Component, setComponent] = React.useState<ComponentType<any> | null>(null)
  const [showLoader, setShowLoader] = React.useState(false)

  React.useEffect(() => {
    const componentKey = component.toString()

    // Si ya está cargado, usar del cache
    if (loadedComponents.has(componentKey)) {
      setComponent(() => loadedComponents.get(componentKey)!)
      return
    }

    // Timer para mostrar loader solo si tarda más del delay
    const timer = setTimeout(() => {
      setShowLoader(true)
    }, delay)

    // Cargar componente
    component().then(module => {
      clearTimeout(timer)
      const LoadedComponent = module.default
      loadedComponents.set(componentKey, LoadedComponent)
      setComponent(() => LoadedComponent)
      setShowLoader(false)
    })

    return () => clearTimeout(timer)
  }, [component, delay])

  if (!Component) {
    return showLoader ? (fallback || <ChileHomeLoader />) : null
  }

  return (
    <Suspense fallback={fallback || <ChileHomeLoader />}>
      <Component {...props} />
    </Suspense>
  )
}

// Helper para precargar componentes en background
export const preloadComponent = (
  component: () => Promise<{ default: ComponentType<any> }>
): void => {
  const componentKey = component.toString()

  if (!loadedComponents.has(componentKey)) {
    component().then(module => {
      loadedComponents.set(componentKey, module.default)
    })
  }
}

// Hook para precargar múltiples componentes
export const usePreloadComponents = (
  components: Array<() => Promise<{ default: ComponentType<any> }>>
): void => {
  React.useEffect(() => {
    components.forEach(preloadComponent)
  }, [])
}

// Componente de intersección para lazy loading basado en scroll
interface IntersectionLazyLoadProps {
  children: React.ReactNode
  rootMargin?: string
  threshold?: number
  fallback?: React.ReactNode
  once?: boolean
}

export const IntersectionLazyLoad: React.FC<IntersectionLazyLoadProps> = ({
  children,
  rootMargin = '100px',
  threshold = 0.1,
  fallback = <div className="h-64 bg-gray-50 animate-pulse rounded-lg" />,
  once = true
}) => {
  const [isVisible, setIsVisible] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            if (once && element) {
              observer.unobserve(element)
            }
          } else if (!once) {
            setIsVisible(false)
          }
        })
      },
      { rootMargin, threshold }
    )

    observer.observe(element)

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [rootMargin, threshold, once])

  return (
    <div ref={ref}>
      {isVisible ? children : fallback}
    </div>
  )
}