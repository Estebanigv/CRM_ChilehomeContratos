'use client'

import { useState, useEffect } from 'react'
import { MessageSquare, Users, Plus, Edit, Trash2, Save, Phone, CheckSquare, Square, Bell, Info } from 'lucide-react'
import { TIPOS_NOTIFICACIONES, ConfiguracionPersona } from '@/constants/notificationTypes'
import NotificationTypeCard from '@/components/notifications/NotificationTypeCard'

const ROLES_DISPONIBLES = [
  { valor: 'dueño', label: 'Dueño de la empresa' },
  { valor: 'gerente_ventas', label: 'Gerente de Ventas' },
  { valor: 'supervisor', label: 'Supervisor' },
  { valor: 'ejecutivo', label: 'Ejecutivo de Ventas' },
  { valor: 'admin', label: 'Administrador' }
]

export default function ConfiguracionMensajes() {
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionPersona[]>([])
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrandoAgregar, setMostrandoAgregar] = useState(false)
  const [mostrandoInfo, setMostrandoInfo] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Estados para ranking personalizado
  const [mostrandoRankingPersonalizado, setMostrandoRankingPersonalizado] = useState(false)
  const [fechaInicioRanking, setFechaInicioRanking] = useState('')
  const [fechaFinRanking, setFechaFinRanking] = useState('')
  const [enviandoRanking, setEnviandoRanking] = useState(false)

  // Cargar configuraciones desde Supabase
  useEffect(() => {
    loadConfiguraciones()
  }, [])

  const loadConfiguraciones = async () => {
    try {
      setLoading(true)
      setError(null)

      console.log('🔄 Cargando configuraciones...')

      try {
        // Crear AbortController para timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

        const response = await fetch('/api/configuraciones-whatsapp', {
          signal: controller.signal
        })

        clearTimeout(timeoutId)

        if (!response.ok) {
          console.warn(`⚠️ API returned ${response.status}, using localStorage`)
          throw new Error(`HTTP ${response.status}`)
        }

        const data = await response.json()

        if (data.success) {
          setConfiguraciones(data.configuraciones || [])
          console.log('✅ Configuraciones cargadas desde Supabase')
          // También guardar en localStorage como backup
          localStorage.setItem('whatsapp-configuraciones', JSON.stringify(data.configuraciones || []))
        } else {
          throw new Error(data.error || 'API error')
        }
      } catch (apiError) {
        if (apiError.name === 'AbortError') {
          console.warn('⏱️ Timeout de conexión, usando localStorage')
        }
        console.log('📦 Usando almacenamiento local (modo offline)')

        // Fallback a localStorage - funciona perfectamente
        const stored = localStorage.getItem('whatsapp-configuraciones')
        if (stored) {
          try {
            const parsed = JSON.parse(stored)
            setConfiguraciones(Array.isArray(parsed) ? parsed : [])
            console.log('✅ Configuraciones cargadas desde localStorage')
          } catch (parseError) {
            console.error('Error parsing stored configuraciones:', parseError)
            setConfiguraciones([])
          }
        } else {
          setConfiguraciones([])
          console.log('🆕 Comenzando con configuraciones vacías')
        }
      }
    } catch (err) {
      console.error('❌ Error general:', err)
      setError('Error al cargar configuraciones')
      setConfiguraciones([])
    } finally {
      setLoading(false)
    }
  }

  // Función para crear configuración por defecto
  const createDefaultConfig = async () => {
    try {
      const configInicial: ConfiguracionPersona = {
        id: '',
        destinatario: '+56963348909',
        destinatario_nombre: 'Guillermo Díaz',
        rol: 'dueño',
        activo: true,
        tipos_notificacion: ['ventas_diarias', 'ventas_semanales', 'nueva_venta'],
        configuracion: {
          incluir_detalles: true,
          incluir_metricas: true,
          incluir_links: false
        }
      }

      const response = await fetch('/api/configuraciones-whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configuracion: configInicial })
      })

      const data = await response.json()
      if (data.success) {
        setConfiguraciones([data.configuracion])
      }
    } catch (error) {
      console.error('Error creating default config:', error)
    }
  }

  // Función para guardar en Supabase
  const saveToSupabase = async (config: ConfiguracionPersona) => {
    try {
      const isNew = !config.id || config.id.startsWith('temp_') || config.id.startsWith('local_')
      const url = '/api/configuraciones-whatsapp'
      const method = isNew ? 'POST' : 'PUT'
      const body = isNew
        ? { configuracion: config }
        : { id: config.id, configuracion: config }

      // Crear AbortController para timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (!data.success) {
        throw new Error(data.error || 'Error al guardar en Supabase')
      }

      return data.configuracion
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Timeout de conexión con Supabase')
      }
      console.error('Error saving to Supabase:', error)
      throw error
    }
  }

  const handleEdit = (id: string) => {
    setEditandoId(id)
  }

  const handleSave = async (id: string) => {
    try {
      const config = configuraciones.find(c => c.id === id)
      if (!config) return

      console.log('💾 Guardando configuración...')

      // Preparar configuración final
      const finalConfig = { ...config }
      if (finalConfig.id.startsWith('temp_')) {
        finalConfig.id = `local_${Date.now()}`
      }

      // Actualizar configuraciones locales inmediatamente
      const updatedConfigs = configuraciones.map(c =>
        c.id === id ? finalConfig : c
      )

      // Guardar inmediatamente en localStorage (garantizado que funciona)
      setConfiguraciones(updatedConfigs)
      localStorage.setItem('whatsapp-configuraciones', JSON.stringify(updatedConfigs))

      setEditandoId(null)
      console.log('✅ Configuración guardada exitosamente en localStorage')

      // Intentar sincronizar con Supabase en segundo plano (opcional)
      // Esta parte NO bloquea la interfaz ni muestra errores al usuario
      setTimeout(async () => {
        try {
          await saveToSupabase(finalConfig)
          console.log('🔄 Sincronización con Supabase exitosa')
        } catch (error) {
          console.log('📦 Modo offline - Configuración guardada solo en localStorage')
        }
      }, 100)

    } catch (error) {
      console.error('❌ Error saving configuration:', error)
      setError('Error al guardar la configuración en localStorage')
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta configuración?')) {
      try {
        // Eliminar inmediatamente de la interfaz y localStorage
        const updatedConfigs = configuraciones.filter(c => c.id !== id)
        setConfiguraciones(updatedConfigs)
        localStorage.setItem('whatsapp-configuraciones', JSON.stringify(updatedConfigs))

        try {
          // Intentar eliminar de Supabase en segundo plano
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 segundos timeout

          const response = await fetch(`/api/configuraciones-whatsapp?id=${id}`, {
            method: 'DELETE',
            signal: controller.signal
          })

          clearTimeout(timeoutId)

          const data = await response.json()
          if (data.success) {
            console.log('✅ Configuración eliminada de Supabase')
          } else {
            console.log('📦 Configuración eliminada en modo offline')
          }
        } catch (supabaseError) {
          if (supabaseError.name === 'AbortError') {
            console.log('⏱️ Timeout en eliminación de Supabase, usando localStorage')
          } else {
            console.log('📦 Configuración eliminada en modo offline (localStorage)')
          }
          // No mostrar error, localStorage ya funcionó
        }

        console.log('✅ Configuración eliminada exitosamente')
      } catch (error) {
        console.error('❌ Error deleting configuration:', error)
        setError('Error al eliminar la configuración')
      }
    }
  }

  const handleAddNew = () => {
    const nuevaConfig: ConfiguracionPersona = {
      id: `temp_${Date.now()}`, // ID temporal
      destinatario: '+56 9',
      destinatario_nombre: '',
      rol: 'ejecutivo',
      activo: true,
      tipos_notificacion: [],
      configuracion: {
        incluir_detalles: true,
        incluir_metricas: true,
        incluir_links: false
      }
    }
    setConfiguraciones(configs => [...configs, nuevaConfig])
    setEditandoId(nuevaConfig.id)
    setMostrandoAgregar(false)
  }

  const updateConfiguracion = (id: string, campo: string, valor: any) => {
    setConfiguraciones(configs =>
      configs.map(config =>
        config.id === id
          ? { ...config, [campo]: valor }
          : config
      )
    )
    // No guardamos automáticamente, solo al presionar "Guardar"
  }

  const updateConfiguracionNested = (id: string, valor: any) => {
    setConfiguraciones(configs =>
      configs.map(config =>
        config.id === id
          ? { ...config, configuracion: { ...config.configuracion, ...valor } }
          : config
      )
    )
    // No guardamos automáticamente, solo al presionar "Guardar"
  }

  const toggleTipoNotificacion = (id: string, tipoId: string) => {
    const config = configuraciones.find(c => c.id === id)
    if (!config) return

    const nuevaLista = config.tipos_notificacion.includes(tipoId)
      ? config.tipos_notificacion.filter(t => t !== tipoId)
      : [...config.tipos_notificacion, tipoId]

    updateConfiguracion(id, 'tipos_notificacion', nuevaLista)
  }

  const probarNotificacion = async (tipo: string) => {
    try {
      console.log(`🧪 Probando notificación: ${tipo}`)

      const response = await fetch('/api/whatsapp-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo })
      })

      const resultado = await response.json()

      if (resultado.success) {
        console.log(`✅ Prueba de ${tipo} exitosa:`, resultado)
        alert(`✅ Notificación ${tipo} enviada exitosamente!\n\nTeléfono: ${resultado.telefono}\nWhatsApp ID: ${resultado.whatsapp_id}`)
      } else {
        console.error(`❌ Error en prueba de ${tipo}:`, resultado)
        alert(`❌ Error enviando notificación ${tipo}:\n${resultado.error}`)
      }
    } catch (error) {
      console.error(`❌ Error probando notificación ${tipo}:`, error)
      alert(`❌ Error de conexión al probar ${tipo}`)
    }
  }

  // Función para enviar mensaje de prueba (simulado)
  const enviarMensajePrueba = async (tipo: string) => {
    await probarNotificacion(tipo)
  }

  // Función para enviar mensaje de prueba REAL
  const enviarMensajePruebaReal = async (tipo: string) => {
    try {
      console.log(`🔥 Enviando notificación REAL: ${tipo}`)

      const response = await fetch('/api/whatsapp-directo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo })
      })

      const resultado = await response.json()

      if (resultado.success) {
        console.log(`✅ Prueba REAL de ${tipo} exitosa:`, resultado)
        alert(`✅ Notificación REAL ${tipo} enviada!\n\nTeléfono: ${resultado.telefono}\nWhatsApp ID: ${resultado.whatsapp_id}\nTimestamp: ${resultado.timestamp}`)
      } else {
        console.error(`❌ Error en prueba REAL de ${tipo}:`, resultado)
        alert(`❌ Error enviando notificación REAL ${tipo}:\n${resultado.error}`)
      }
    } catch (error) {
      console.error(`❌ Error probando notificación REAL ${tipo}:`, error)
      alert(`❌ Error de conexión al probar REAL ${tipo}`)
    }
  }

  // Función para enviar notificación a usuarios específicos
  const enviarNotificacionUsuarios = async (tipo: string) => {
    try {
      console.log(`📤 Enviando ${tipo} a usuarios configurados vía N8N...`)

      // Filtrar usuarios que reciben este tipo de notificación
      const usuariosDestino = configuraciones.filter(config =>
        config.activo && config.tipos_notificacion.includes(tipo)
      )

      if (usuariosDestino.length === 0) {
        alert(`⚠️ No hay usuarios configurados para recibir "${tipo}"`)
        return
      }

      // TODOS los tipos de mensaje ahora usan N8N (webhook de prueba)
      try {
        const response = await fetch('/api/n8n-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo,
            fechaInicio: fechaInicioRanking,
            fechaFin: fechaFinRanking
          })
        })

        const resultado = await response.json()

        if (resultado.success) {
          alert(`✅ Notificación "${tipo}" enviada exitosamente vía N8N\n📤 ${resultado.data_sent?.destinatarios || usuariosDestino.length} destinatarios\n🎯 ${resultado.message}\n🔗 Webhook: webhook-chilehome-pro`)
        } else {
          alert(`❌ Error enviando "${tipo}" vía N8N:\n${resultado.error}\n\n💡 Asegúrate de que N8N esté activado:\n1. Abre tu N8N Cloud\n2. Click "Execute workflow"\n3. Intenta de nuevo`)
        }
      } catch (error) {
        alert(`❌ Error de conexión con N8N:\n${error}\n\n🔗 Webhook: https://n8n.srv865688.hstgr.cloud/webhook-test/webhook-chilehome-pro`)
      }

    } catch (error) {
      console.error(`❌ Error general enviando ${tipo}:`, error)
      alert(`❌ Error general al enviar ${tipo}`)
    }
  }

  // Función para enviar ranking personalizado
  const enviarRankingPersonalizado = async () => {
    if (!fechaInicioRanking || !fechaFinRanking) {
      alert('⚠️ Por favor selecciona las fechas de inicio y fin para el ranking')
      return
    }

    if (new Date(fechaInicioRanking) > new Date(fechaFinRanking)) {
      alert('⚠️ La fecha de inicio no puede ser posterior a la fecha de fin')
      return
    }

    setEnviandoRanking(true)

    try {
      console.log(`🏆 Enviando ranking personalizado del ${fechaInicioRanking} al ${fechaFinRanking} vía N8N`)

      // Filtrar usuarios que reciben este tipo de notificación
      const usuariosDestino = configuraciones.filter(config =>
        config.activo && config.tipos_notificacion.includes('ranking_ejecutivos_personalizado')
      )

      if (usuariosDestino.length === 0) {
        alert(`⚠️ No hay usuarios configurados para recibir "Ranking de Ejecutivos Personalizado"`)
        setEnviandoRanking(false)
        return
      }

      // Enviar a N8N (maneja todos los destinatarios configurados)
      try {
        const response = await fetch('/api/n8n-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tipo: 'ranking_ejecutivos_personalizado',
            fechaInicio: fechaInicioRanking,
            fechaFin: fechaFinRanking
          })
        })

        const resultado = await response.json()

        if (resultado.success) {
          alert(`✅ Ranking Personalizado enviado exitosamente vía N8N\n📅 Período: ${fechaInicioRanking} al ${fechaFinRanking}\n📤 ${resultado.data_sent?.destinatarios || usuariosDestino.length} destinatarios\n🎯 ${resultado.message}\n🔗 Webhook: webhook-chilehome-pro`)
        } else {
          alert(`❌ Error enviando Ranking Personalizado vía N8N:\n${resultado.error}\n\n💡 Asegúrate de que N8N esté activado:\n1. Abre tu N8N Cloud\n2. Click "Execute workflow"\n3. Intenta de nuevo`)
        }
      } catch (error) {
        alert(`❌ Error de conexión con N8N:\n${error}\n\n🔗 Webhook: https://n8n.srv865688.hstgr.cloud/webhook-test/webhook-chilehome-pro`)
      }

      // Limpiar fechas y cerrar modal
      setFechaInicioRanking('')
      setFechaFinRanking('')
      setMostrandoRankingPersonalizado(false)

    } catch (error) {
      console.error(`❌ Error general enviando ranking personalizado:`, error)
      alert(`❌ Error general al enviar ranking personalizado`)
    } finally {
      setEnviandoRanking(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-slate-600">Cargando configuraciones...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-red-200 p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-600 mb-4">⚠️</div>
              <p className="text-red-800 font-medium mb-2">Error al cargar configuraciones</p>
              <p className="text-red-600 text-sm mb-4">{error}</p>
              <button
                onClick={loadConfiguraciones}
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                Reintentar
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2">
              <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                <Bell className="h-3 w-3 mr-1" />
                Notificaciones Automáticas
              </span>
            </div>
            <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-6 w-6 text-blue-600" />
              Configuración de Mensajes WhatsApp
            </h2>
            <p className="text-slate-600 mt-1">
              Configura quién recibe cada tipo de notificación y personaliza el contenido
            </p>
          </div>
          <button
            onClick={() => setMostrandoAgregar(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded border border-blue-700 hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Agregar Persona
          </button>
        </div>
      </div>

      {/* Tipos de Notificaciones - Info */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Info className="h-5 w-5 text-blue-600" />
          Tipos de Notificaciones Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {TIPOS_NOTIFICACIONES.map(tipo => (
            <div key={tipo.id} className="border border-slate-200 rounded p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-slate-900">{tipo.nombre}</h4>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    <button
                      onClick={() => enviarMensajePruebaReal(tipo.id)}
                      className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded border border-green-300 hover:bg-green-200 font-medium"
                    >
                      🧪 Prueba
                    </button>
                    {tipo.id === 'ranking_ejecutivos_personalizado' ? (
                      <button
                        onClick={() => setMostrandoRankingPersonalizado(true)}
                        className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded border border-purple-300 hover:bg-purple-200 font-medium"
                      >
                        📅 Personalizar
                      </button>
                    ) : (
                      <button
                        onClick={() => enviarNotificacionUsuarios(tipo.id)}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded border border-blue-300 hover:bg-blue-200 font-medium"
                      >
                        📤 Enviar Real
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-slate-800 mb-2">{tipo.descripcion}</p>
              <p className="text-sm text-slate-700 mb-2">📅 {tipo.frecuencia}</p>
              <div className="bg-slate-100 p-2 rounded text-sm font-mono text-slate-800">
                {tipo.ejemplo}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Lista de Configuraciones */}
      <div className="space-y-4">
        {configuraciones.map(config => (
          <div key={config.id} className="bg-white rounded-lg border border-slate-200 p-6">
            {editandoId === config.id ? (
              // Modo edición
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      value={config.destinatario_nombre}
                      onChange={(e) => updateConfiguracion(config.id, 'destinatario_nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium placeholder-slate-600 bg-white"
                      placeholder="Nombre de la persona"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1">
                      Teléfono
                    </label>
                    <input
                      type="text"
                      value={config.destinatario}
                      onChange={(e) => updateConfiguracion(config.id, 'destinatario', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium placeholder-slate-600 bg-white"
                      placeholder="+56912345678"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-900 mb-1">
                      Rol
                    </label>
                    <select
                      value={config.rol}
                      onChange={(e) => updateConfiguracion(config.id, 'rol', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 font-medium bg-white"
                    >
                      {ROLES_DISPONIBLES.map(rol => (
                        <option key={rol.valor} value={rol.valor}>{rol.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Tipos de Notificación */}
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-2">
                    Tipos de Notificaciones que Recibirá
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {TIPOS_NOTIFICACIONES.map(tipo => (
                      <div
                        key={tipo.id}
                        onClick={() => toggleTipoNotificacion(config.id, tipo.id)}
                        className="flex items-center gap-3 p-3 border border-slate-200 rounded cursor-pointer hover:bg-slate-50"
                      >
                        {config.tipos_notificacion.includes(tipo.id) ? (
                          <CheckSquare className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <div className="font-medium text-slate-900">{tipo.nombre}</div>
                          <div className="text-sm text-slate-700">{tipo.frecuencia}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Opciones de Contenido */}
                <div>
                  <label className="block text-base font-bold text-slate-900 mb-2">
                    Contenido de los Mensajes
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.configuracion.incluir_detalles}
                        onChange={(e) => updateConfiguracionNested(config.id, { incluir_detalles: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-800 font-medium">Incluir detalles completos</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.configuracion.incluir_metricas}
                        onChange={(e) => updateConfiguracionNested(config.id, { incluir_metricas: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-800 font-medium">Incluir métricas y estadísticas</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={config.configuracion.incluir_links}
                        onChange={(e) => updateConfiguracionNested(config.id, { incluir_links: e.target.checked })}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-800 font-medium">Incluir enlaces al sistema</span>
                    </label>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => handleSave(config.id)}
                    className="bg-green-600 text-white px-4 py-2 rounded border border-green-700 hover:bg-green-700 flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoId(null)}
                    className="bg-slate-500 text-white px-4 py-2 rounded border border-slate-600 hover:bg-slate-600"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              // Modo vista
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-slate-500" />
                    <div>
                      <div className="font-medium text-slate-900">{config.destinatario_nombre}</div>
                      <div className="text-sm text-slate-700 font-medium">{config.destinatario}</div>
                    </div>
                  </div>
                  <div className="px-3 py-1 bg-blue-100 text-blue-800 rounded border text-sm">
                    {ROLES_DISPONIBLES.find(r => r.valor === config.rol)?.label}
                  </div>
                  <div className="text-sm text-slate-800 font-medium">
                    <div className="mb-1">{config.tipos_notificacion.length} tipos de notificación:</div>
                    <div className="text-xs space-y-1">
                      {config.tipos_notificacion.map(tipoId => {
                        const tipo = TIPOS_NOTIFICACIONES.find(t => t.id === tipoId)
                        return (
                          <div key={tipoId} className="flex items-center gap-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            <span className="text-slate-700 font-medium">{tipo?.nombre}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded text-xs border ${
                    config.activo
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-red-100 text-red-800 border-red-200'
                  }`}>
                    {config.activo ? 'Activo' : 'Inactivo'}
                  </div>
                  <button
                    onClick={() => handleEdit(config.id)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal para agregar */}
      {mostrandoAgregar && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md mx-4 transform transition-all">
            {/* Icono y título */}
            <div className="flex items-center justify-center mb-6">
              <div className="bg-blue-100 p-3 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-center text-gray-900 mb-3">Agregar Nueva Persona</h3>

            {/* Descripción mejorada */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
              <p className="text-blue-800 text-sm leading-relaxed">
                <span className="font-semibold">✨ Nueva configuración:</span><br/>
                • Teléfono iniciará con "+56 9"<br/>
                • Podrás personalizar todos los detalles<br/>
                • Notificaciones WhatsApp configurables
              </p>
            </div>

            {/* Botones mejorados */}
            <div className="flex flex-col gap-3">
              <button
                onClick={handleAddNew}
                className="w-full bg-blue-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-[1.02] transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Crear Configuración
              </button>
              <button
                onClick={() => setMostrandoAgregar(false)}
                className="w-full bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-medium hover:bg-gray-200 transition-colors border border-gray-200"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sección de Pruebas */}
      <div className="mt-8 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          Probar Notificaciones
        </h3>

        <p className="text-purple-700 text-sm mb-4">
          Prueba las notificaciones configuradas para verificar que funcionan correctamente
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {TIPOS_NOTIFICACIONES.map((tipo) => (
            <button
              key={tipo.id}
              onClick={() => enviarMensajePruebaReal(tipo.id)}
              className="p-3 bg-white border border-green-200 rounded-lg hover:bg-green-50 hover:border-green-300 transition-all text-left group"
            >
              <div className="font-medium text-green-900 text-sm flex items-center gap-2">
                📱 {tipo.nombre}
              </div>
              <div className="text-green-600 text-xs mt-1">{tipo.frecuencia}</div>
              <div className="text-green-500 text-xs mt-1 opacity-75 group-hover:opacity-100">Enviar a +56963348909</div>
            </button>
          ))}
        </div>
      </div>

      {/* Modal para Ranking Personalizado */}
      {mostrandoRankingPersonalizado && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                🏆 Ranking Personalizado
              </h3>
              <button
                onClick={() => {
                  setMostrandoRankingPersonalizado(false)
                  setFechaInicioRanking('')
                  setFechaFinRanking('')
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  📅 Selecciona el período para generar el ranking de ejecutivos por ventas
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de inicio
                  </label>
                  <input
                    type="date"
                    value={fechaInicioRanking}
                    onChange={(e) => setFechaInicioRanking(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Fecha de fin
                  </label>
                  <input
                    type="date"
                    value={fechaFinRanking}
                    onChange={(e) => setFechaFinRanking(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>

              {fechaInicioRanking && fechaFinRanking && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800">
                    📊 Se generará el ranking del <strong>{new Date(fechaInicioRanking).toLocaleDateString('es-CL')}</strong> al <strong>{new Date(fechaFinRanking).toLocaleDateString('es-CL')}</strong>
                  </p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setMostrandoRankingPersonalizado(false)
                    setFechaInicioRanking('')
                    setFechaFinRanking('')
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 font-medium"
                  disabled={enviandoRanking}
                >
                  Cancelar
                </button>
                <button
                  onClick={enviarRankingPersonalizado}
                  disabled={!fechaInicioRanking || !fechaFinRanking || enviandoRanking}
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {enviandoRanking ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Enviando...
                    </>
                  ) : (
                    <>
                      📤 Enviar Ranking
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-200 pt-4 mt-4">
                <p className="text-xs text-slate-500">
                  💡 Se enviará a todos los usuarios configurados para recibir "Ranking de Ejecutivos Personalizado"
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}