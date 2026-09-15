import { createContext, useContext, useEffect } from 'react'
import { usePendientes } from '../hooks/usePendientes'
import { useNotificationWatcher } from '../hooks/useNotificationWatcher'

const PendientesContext = createContext(null)

export function PendientesProvider({ children }) {
  const pendientesData = usePendientes()
  const {
    pendientes,
    marcarNotificado,
  } = pendientesData

  const notifData = useNotificationWatcher(pendientes, marcarNotificado)

  // ── App Badging API ──────────────────────────────────────────────────────────
  // Calcula cuantos pendientes prioritarios tienen recordatorio vencido sin notificar
  useEffect(() => {
    if (!('setAppBadge' in navigator)) return

    const ahora = new Date()
    const pendientesBadge = pendientes.filter(p => {
      if (!p.es_prioritario || p.completado || p.notificado || !p.fecha_recordatorio) return false
      return new Date(p.fecha_recordatorio) <= ahora
    })

    try {
      if (pendientesBadge.length > 0) {
        navigator.setAppBadge(pendientesBadge.length)
      } else {
        navigator.clearAppBadge()
      }
    } catch (e) {
      // App Badging API no disponible en este dispositivo/navegador
    }
  }, [pendientes])

  // Cuenta de prioritarios vencidos para el badge del Sidebar
  const ahora = new Date()
  const prioritariosVencidosBadge = pendientes.filter(p => {
    if (!p.es_prioritario || p.completado || !p.fecha_recordatorio) return false
    return new Date(p.fecha_recordatorio) <= ahora
  }).length

  return (
    <PendientesContext.Provider value={{
      ...pendientesData,
      ...notifData,
      prioritariosVencidosBadge,
    }}>
      {children}
    </PendientesContext.Provider>
  )
}

export function usePendientesContext() {
  const ctx = useContext(PendientesContext)
  if (!ctx) throw new Error('usePendientesContext debe usarse dentro de PendientesProvider')
  return ctx
}
