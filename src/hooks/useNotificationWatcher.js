import { useState, useEffect, useCallback } from 'react'

// Sintetizador de sonido sutil para alertas (Doble Beep)
function reproducirSonidoNotificacion() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    // Primer Beep
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(800, ctx.currentTime);
    gain1.gain.setValueAtTime(0.5, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start();
    osc1.stop(ctx.currentTime + 0.1);

    // Segundo Beep
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'square';
    osc2.frequency.setValueAtTime(1200, ctx.currentTime + 0.15);
    gain2.gain.setValueAtTime(0.5, ctx.currentTime + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.15);
    osc2.stop(ctx.currentTime + 0.25);
  } catch (e) {
    console.warn('No se pudo reproducir el sonido de notificación:', e);
  }
}

export function useNotificationWatcher(pendientes = [], marcarNotificado) {
  const [permission, setPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window
      ? Notification.permission
      : 'unsupported'
  )
  const [alertaActiva, setAlertaActiva] = useState(null)
  const [mostrarGuiaBloqueo, setMostrarGuiaBloqueo] = useState(false)

  // Actualizar permiso si cambia en el navegador
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission)
    }
  }, [])

  // Helper para enviar notificaciones compatibles con Android (requiere Service Worker)
  const enviarNotificacion = useCallback(async (titulo, opciones) => {
    if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          await registration.showNotification(titulo, opciones);
          return;
        }
      }
    } catch (err) {
      console.warn('Error con Service Worker Notification:', err);
    }

    // Fallback tradicional (falla en Android Chrome)
    try {
      new Notification(titulo, opciones);
    } catch (err) {
      console.error('Error disparando Notification (fallback):', err);
    }
  }, []);

  const probarNotificacion = useCallback(() => {
    reproducirSonidoNotificacion()
    enviarNotificacion('🔔 ¡Notificaciones de Mi Economía activas!', {
      body: 'Esta es una notificación de prueba. Te avisaremos puntualmente de tus recordatorios prioritarios.',
      icon: '/favicon.ico',
    })
  }, [enviarNotificacion])

  const solicitarPermiso = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported'
    }

    try {
      const res = await Notification.requestPermission()
      setPermission(res)

      if (res === 'granted') {
        probarNotificacion()
      } else if (res === 'denied') {
        setMostrarGuiaBloqueo(true)
      }

      return res
    } catch (e) {
      console.error('Error al solicitar permiso de notificaciones:', e)
      setMostrarGuiaBloqueo(true)
      return 'denied'
    }
  }, [probarNotificacion])

  // Chequeo periódico de pendientes prioritarios vencidos o para el momento actual
  useEffect(() => {
    if (!pendientes || pendientes.length === 0 || !marcarNotificado) return

    const revisarRecordatorios = () => {
      const ahora = new Date()

      const aNotificar = pendientes.filter(p => {
        if (!p.es_prioritario || p.completado || p.notificado || !p.fecha_recordatorio) {
          return false
        }
        const fechaHora = new Date(p.fecha_recordatorio)
        return fechaHora <= ahora
      })

      if (aNotificar.length > 0) {
        aNotificar.forEach(item => {
          // 1. Marcar como notificado en BD
          marcarNotificado(item.id)

          // 2. Disparar notificación nativa si hay permiso
          const titulo = item.tipo === 'compra' ? `🛒 Compra pendiente: ${item.titulo}` : `📝 Recordatorio: ${item.titulo}`
          const cuerpo = item.monto_estimado 
            ? `Monto estimado: ${item.moneda || 'ARS'} $${Number(item.monto_estimado).toLocaleString()}` 
            : (item.notas || 'Tienes un recordatorio prioritario marcado para este momento.')

          enviarNotificacion(titulo, {
            body: cuerpo,
            icon: '/favicon.ico',
            tag: `recordatorio-${item.id}`,
          })

          // 3. Reproducir sonido y activar alerta visual en app
          reproducirSonidoNotificacion()
          setAlertaActiva(item)
        })
      }
    }

    // Revisar al montar o cuando cambian los pendientes
    revisarRecordatorios()

    // Revisar cada 20 segundos
    const interval = setInterval(revisarRecordatorios, 20000)
    return () => clearInterval(interval)
  }, [pendientes, marcarNotificado])

  const cerrarAlerta = () => setAlertaActiva(null)

  return {
    permission,
    solicitarPermiso,
    probarNotificacion,
    alertaActiva,
    cerrarAlerta,
    mostrarGuiaBloqueo,
    setMostrarGuiaBloqueo,
  }
}


