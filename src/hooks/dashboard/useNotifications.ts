import { useState, useCallback } from 'react'

interface Notification {
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

export function useNotifications() {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = useCallback((
    type: Notification['type'],
    message: string,
    duration: number = 5000
  ) => {
    setNotification({ type, message, duration })

    if (duration > 0) {
      setTimeout(() => {
        setNotification(null)
      }, duration)
    }
  }, [])

  const showSuccess = useCallback((message: string, duration?: number) => {
    showNotification('success', message, duration)
  }, [showNotification])

  const showError = useCallback((message: string, duration?: number) => {
    showNotification('error', message, duration)
  }, [showNotification])

  const showWarning = useCallback((message: string, duration?: number) => {
    showNotification('warning', message, duration)
  }, [showNotification])

  const showInfo = useCallback((message: string, duration?: number) => {
    showNotification('info', message, duration)
  }, [showNotification])

  const hideNotification = useCallback(() => {
    setNotification(null)
  }, [])

  return {
    notification,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideNotification
  }
}