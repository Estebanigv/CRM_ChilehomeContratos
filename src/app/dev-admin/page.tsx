'use client'

import { useState } from 'react'
import {
  Settings,
  Database,
  MessageSquare,
  BarChart3,
  Users,
  Shield,
  Terminal,
  Smartphone,
  Mail,
  Calendar,
  FileText,
  Zap
} from 'lucide-react'

export default function DevAdminPage() {
  const [activeTab, setActiveTab] = useState('sistema')

  const tabs = [
    { id: 'sistema', label: 'Sistema', icon: Settings },
    { id: 'database', label: 'Base de Datos', icon: Database },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'reportes', label: 'Reportes', icon: BarChart3 },
    { id: 'usuarios', label: 'Usuarios', icon: Users },
    { id: 'logs', label: 'Logs', icon: Terminal }
  ]

  return (
    <div className="min-h-screen bg-base-100">
      {/* Header */}
      <div className="navbar bg-primary text-primary-content">
        <div className="flex-1">
          <span className="text-xl font-bold">🛠️ Panel de Desarrollador - Esteban</span>
        </div>
        <div className="flex-none">
          <div className="badge badge-accent">DEVELOPER ACCESS</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-bordered bg-base-200 px-6">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <a
              key={tab.id}
              className={`tab tab-lg ${activeTab === tab.id ? 'tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4 mr-2" />
              {tab.label}
            </a>
          )
        })}
      </div>

      {/* Content */}
      <div className="container mx-auto p-6">
        {activeTab === 'sistema' && <SistemaPanel />}
        {activeTab === 'database' && <DatabasePanel />}
        {activeTab === 'whatsapp' && <WhatsAppPanel />}
        {activeTab === 'reportes' && <ReportesPanel />}
        {activeTab === 'usuarios' && <UsuariosPanel />}
        {activeTab === 'logs' && <LogsPanel />}
      </div>
    </div>
  )
}

function SistemaPanel() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Settings className="w-5 h-5" />
            Estado del Sistema
          </h2>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Servidor</div>
              <div className="stat-value text-success">Activo</div>
              <div className="stat-desc">Puerto 3002</div>
            </div>
          </div>
          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Configurar</button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Shield className="w-5 h-5" />
            Seguridad
          </h2>
          <ul className="list-disc list-inside text-sm">
            <li>✅ JWT configurado</li>
            <li>✅ CORS habilitado</li>
            <li>✅ Rate limiting activo</li>
            <li>✅ Encriptación SSL</li>
          </ul>
          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Ver Logs</button>
          </div>
        </div>
      </div>

      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Zap className="w-5 h-5" />
            Performance
          </h2>
          <div className="stats shadow">
            <div className="stat">
              <div className="stat-title">Memoria</div>
              <div className="stat-value">85%</div>
              <div className="stat-desc">512MB disponibles</div>
            </div>
          </div>
          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Optimizar</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function DatabasePanel() {
  return (
    <div className="space-y-6">
      <div className="alert alert-info">
        <Database className="w-6 h-6" />
        <span>Conexión a Supabase: Activa</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Tablas Principales</h2>
            <ul className="space-y-2">
              <li className="flex justify-between">
                <span>contratos</span>
                <span className="badge badge-success">Activa</span>
              </li>
              <li className="flex justify-between">
                <span>clientes</span>
                <span className="badge badge-success">Activa</span>
              </li>
              <li className="flex justify-between">
                <span>usuarios</span>
                <span className="badge badge-success">Activa</span>
              </li>
              <li className="flex justify-between">
                <span>formas_pago</span>
                <span className="badge badge-warning">Nueva</span>
              </li>
              <li className="flex justify-between">
                <span>planos_adjuntos</span>
                <span className="badge badge-warning">Nueva</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Acciones Rápidas</h2>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline w-full">Backup Base de Datos</button>
              <button className="btn btn-sm btn-outline w-full">Ejecutar Migraciones</button>
              <button className="btn btn-sm btn-outline w-full">Limpiar Logs</button>
              <button className="btn btn-sm btn-warning w-full">Reset Desarrollo</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatsAppPanel() {
  return (
    <div className="space-y-6">
      <div className="alert alert-success">
        <Smartphone className="w-6 h-6" />
        <span>WhatsApp Business API: Configurado y Activo</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Configuración</h2>
            <ul className="text-sm space-y-1">
              <li>📱 Número: +56 9 4487 8554</li>
              <li>🔑 Token: Válido hasta 14/11/25</li>
              <li>📞 Pruebas: +56 9 6334 8909</li>
              <li>✅ Registro completado</li>
            </ul>
            <div className="card-actions justify-end">
              <button className="btn btn-primary btn-sm">Test WhatsApp</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Estadísticas</h2>
            <div className="stats">
              <div className="stat">
                <div className="stat-title">Mensajes Enviados</div>
                <div className="stat-value">47</div>
                <div className="stat-desc">Este mes</div>
              </div>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Acciones</h2>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline w-full">Enviar Prueba</button>
              <button className="btn btn-sm btn-outline w-full">Ver Logs</button>
              <button className="btn btn-sm btn-outline w-full">Renovar Token</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ReportesPanel() {
  return (
    <div className="space-y-6">
      <div className="alert alert-info">
        <BarChart3 className="w-6 h-6" />
        <span>Sistema de Reportes Automáticos para Guillermo Díaz</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Reportes Programados</h2>
            <ul className="space-y-2 text-sm">
              <li>📊 Semanal: Domingos 19:00</li>
              <li>📈 Diario: 20:00 hrs</li>
              <li>💰 Mensual: Primer lunes 09:00</li>
            </ul>
            <div className="card-actions justify-end">
              <button className="btn btn-primary btn-sm">Configurar</button>
            </div>
          </div>
        </div>

        <div className="card bg-base-200 shadow-xl">
          <div className="card-body">
            <h2 className="card-title">Acciones</h2>
            <div className="space-y-2">
              <button className="btn btn-sm btn-outline w-full">Enviar Reporte Test</button>
              <button className="btn btn-sm btn-outline w-full">Ejecutar Programados</button>
              <button className="btn btn-sm btn-outline w-full">Ver Configuración</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function UsuariosPanel() {
  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Gestión de Usuarios</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Esteban</td>
                  <td><span className="badge badge-primary">Developer</span></td>
                  <td><span className="badge badge-success">Activo</span></td>
                  <td>
                    <button className="btn btn-xs">Editar</button>
                  </td>
                </tr>
                <tr>
                  <td>Guillermo Díaz</td>
                  <td><span className="badge badge-secondary">Admin</span></td>
                  <td><span className="badge badge-success">Activo</span></td>
                  <td>
                    <button className="btn btn-xs">Editar</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function LogsPanel() {
  return (
    <div className="space-y-6">
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">
            <Terminal className="w-5 h-5" />
            Logs del Sistema
          </h2>
          <div className="mockup-code">
            <pre data-prefix="$"><code>2025-09-15 19:34 - WhatsApp message sent successfully</code></pre>
            <pre data-prefix=">" className="text-warning"><code>2025-09-15 19:30 - Token expiration check</code></pre>
            <pre data-prefix=">" className="text-success"><code>2025-09-15 19:25 - Report generated for Guillermo</code></pre>
            <pre data-prefix="$"><code>2025-09-15 19:20 - Database connection established</code></pre>
            <pre data-prefix=">" className="text-info"><code>2025-09-15 19:15 - System startup complete</code></pre>
          </div>
          <div className="card-actions justify-end">
            <button className="btn btn-primary btn-sm">Descargar Logs</button>
            <button className="btn btn-warning btn-sm">Limpiar Logs</button>
          </div>
        </div>
      </div>
    </div>
  )
}