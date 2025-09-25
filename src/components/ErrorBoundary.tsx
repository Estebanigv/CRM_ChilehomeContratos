'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  pageName: string
}

interface State {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`🚨 Error en ${this.props.pageName}:`, error, errorInfo)

    // Log específico por página para debugging
    console.group(`🔍 Debug Info - ${this.props.pageName}`)
    console.error('Error:', error.message)
    console.error('Stack:', error.stack)
    console.error('Component Stack:', errorInfo.componentStack)
    console.groupEnd()
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="mb-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 19c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>

            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error en {this.props.pageName}
            </h3>

            <p className="text-sm text-gray-500 mb-4">
              Ha ocurrido un error en esta página, pero las demás páginas siguen funcionando normalmente.
            </p>

            <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
              <p className="text-xs text-red-800 font-mono">
                {this.state.error?.message || 'Error desconocido'}
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: undefined })
                  if (typeof window !== 'undefined') {
                    window.location.reload()
                  }
                }}
                className="w-full bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🔄 Recargar página
              </button>

              <button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/dashboard'
                  }
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
              >
                🏠 Ir al Dashboard
              </button>

            </div>

            <p className="text-xs text-gray-400 mt-4">
              Las otras páginas no se han visto afectadas por este error
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}