'use client'

import React from 'react'
import {
  BarChart3, FileText, Home, Truck, Users, MessageSquare, Settings,
  LogOut, Menu, ChevronLeft
} from 'lucide-react'
import { getRoleDisplay } from '@/utils/contractHelpers'

interface SidebarProps {
  activeSection: string
  setActiveSection: (section: string) => void
  user: any
  collapsed: boolean
  onToggleCollapsed: () => void
}

const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ activeSection, setActiveSection, user, collapsed, onToggleCollapsed }, ref) => (
    <div ref={ref} className={`fixed inset-y-0 left-0 ${collapsed ? 'w-16' : 'w-72'} shadow-lg z-30 transition-all duration-300 flex flex-col`} style={{ backgroundColor: '#1E2A3B' }}>
      <div className={`h-20 flex items-center ${collapsed ? 'justify-center px-2' : 'justify-between px-6'} border-b border-slate-700/50`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 flex items-center justify-center">
              <span className="text-white font-bold text-lg">CH</span>
            </div>
            <div>
              <span className="text-xl font-bold text-white">ChileHome</span>
              <p className="text-xs text-slate-300">Sales Dashboard</p>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapsed}
          className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
        >
          {collapsed ? <Menu className="h-5 w-5 text-slate-300" /> : <ChevronLeft className="h-5 w-5 text-slate-300" />}
        </button>
      </div>

      <nav className="mt-6 overflow-y-auto flex-1">
        <div className="px-3 space-y-2">
          <button
            onClick={() => setActiveSection('dashboard')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'dashboard'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Dashboard' : ''}
          >
            <BarChart3 className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Dashboard'}
          </button>

          <button
            onClick={() => setActiveSection('contratos')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'contratos'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Contratos' : ''}
          >
            <FileText className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Contratos'}
          </button>

          <button
            onClick={() => setActiveSection('planos')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'planos'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Planos' : ''}
          >
            <Home className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Planos'}
          </button>

          <button
            onClick={() => setActiveSection('logistica')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'logistica'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Logística CRM' : ''}
          >
            <Truck className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Logística CRM'}
          </button>

          <button
            onClick={() => setActiveSection('equipo')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'equipo'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Equipo' : ''}
          >
            <Users className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Equipo'}
          </button>

          <button
            onClick={() => setActiveSection('mensajes')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'mensajes'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Mensajes' : ''}
          >
            <MessageSquare className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Mensajes'}
          </button>

          <button
            onClick={() => setActiveSection('configuracion')}
            className={`w-full flex items-center ${collapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'} text-sm font-medium rounded-xl transition-all duration-200 ${
              activeSection === 'configuracion'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-700'
            }`}
            title={collapsed ? 'Configuración' : ''}
          >
            <Settings className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Configuración'}
          </button>
        </div>
      </nav>

      <div className="absolute bottom-0 w-full border-t border-slate-700/50">
        {/* Usuario Conectado */}
        <div className={`${collapsed ? 'p-2' : 'p-4'} border-b border-slate-700/50`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
            <div className="w-10 h-10 bg-green-600 flex items-center justify-center" title={collapsed ? user?.nombre || 'Usuario' : ''}>
              <span className="text-white font-semibold text-sm">{(user?.nombre || user?.email?.split('@')[0] || 'U').charAt(0).toUpperCase()}</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{user?.nombre || user?.email?.split('@')[0] || 'Usuario'}</div>
                  <div className="text-xs text-slate-400 truncate">{getRoleDisplay(user)}</div>
                </div>
                <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-sm"></div>
              </>
            )}
          </div>
        </div>

        <div className={collapsed ? 'p-2' : 'p-4'}>
          <button className={`w-full flex items-center ${collapsed ? 'justify-center px-2 py-3' : 'px-4 py-3'} text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-xl transition-all duration-200`} title={collapsed ? 'Cerrar Sesión' : ''}>
            <LogOut className={`h-5 w-5 ${collapsed ? '' : 'mr-3'}`} />
            {!collapsed && 'Cerrar Sesión'}
          </button>
        </div>
      </div>
    </div>
  )
)

Sidebar.displayName = 'Sidebar'

export default Sidebar