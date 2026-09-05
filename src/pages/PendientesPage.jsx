import { useState, useMemo, useRef } from 'react'
import {
  Plus,
  Trash2,
  Pencil,
  CheckCircle2,
  Circle,
  Bell,
  BellOff,
  ShoppingCart,
  CheckSquare,
  Search,
  Sparkles,
  AlertCircle,
  X,
  CreditCard,
  Lock,
  RotateCcw,
} from 'lucide-react'
import { usePendientes } from '../hooks/usePendientes'
import { useNotificationWatcher } from '../hooks/useNotificationWatcher'
import { useGastos } from '../hooks/useGastos'
import { useProfile } from '../contexts/ProfileContext'
import { useCurrency } from '../contexts/CurrencyContext'
import { useCategorias } from '../contexts/CategoriasContext'
import PendienteModal from '../components/PendienteModal'
import GastoModal from '../components/GastoModal'
import PendienteDetalleModal from '../components/PendienteDetalleModal'

export default function PendientesPage() {
  const [tab, setTab] = useState('todas') // 'todas' | 'compras' | 'tareas' | 'prioritarias' | 'completadas'
  const [busqueda, setBusqueda] = useState('')
  const [modalPendiente, setModalPendiente] = useState(null) // null | { mode: 'crear' | 'editar', item?: object }
  const [modalGasto, setModalGasto] = useState(null) // null | { pendiente: object }
  const [detalle, setDetalle] = useState(null) // null | item
  const [visibles, setVisibles] = useState(10)

  // Quick Add State
  const [quickTitulo, setQuickTitulo] = useState('')
  const [quickTipo, setQuickTipo] = useState('compra')
  const [quickPrioritario, setQuickPrioritario] = useState(false)

  const obtenerFechaHoraInicial = () => {
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }
  const [quickFechaRecordatorio, setQuickFechaRecordatorio] = useState(obtenerFechaHoraInicial())
  const dateInputRef = useRef(null)

  const {
    pendientes,
    loading,
    totalPendientes,
    agregarPendiente,
    actualizarPendiente,
    toggleCompletado,
    marcarNotificado,
    eliminarPendiente,
  } = usePendientes()

  const {
    permission,
    solicitarPermiso,
    probarNotificacion,
    alertaActiva,
    cerrarAlerta,
    mostrarGuiaBloqueo,
    setMostrarGuiaBloqueo,
  } = useNotificationWatcher(pendientes, marcarNotificado)

  const now = new Date()
  const { agregarGasto } = useGastos(now.getMonth() + 1, now.getFullYear())
  const { esFamiliar, miembros, miMiembro } = useProfile()
  const { formatARS, formatUSD, formatInMode, cotizacionMEP } = useCurrency()
  const { categorias } = useCategorias()

  // Formato de fecha para recordatorios
  const formatFechaRecordatorio = (fechaIso) => {
    if (!fechaIso) return null
    const d = new Date(fechaIso)
    const hoy = new Date()
    const esHoy = d.toDateString() === hoy.toDateString()
    const maniana = new Date(hoy)
    maniana.setDate(maniana.getDate() + 1)
    const esManiana = d.toDateString() === maniana.toDateString()

    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    if (esHoy) return `Hoy a las ${hora}`
    if (esManiana) return `Mañana a las ${hora}`
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}, ${hora}`
  }

  // Comprobar estado de tiempo del recordatorio
  const getEstadoTiempo = (fechaIso) => {
    if (!fechaIso) return 'normal'
    const fecha = new Date(fechaIso)
    const ahora = new Date()
    if (fecha < ahora) return 'vencido'
    const limiteHoy = new Date(ahora)
    limiteHoy.setHours(23, 59, 59, 999)
    if (fecha <= limiteHoy) return 'hoy'
    return 'futuro'
  }

  // Filtrado de lista
  const pendientesFiltrados = useMemo(() => {
    return pendientes.filter((item) => {
      // Filtro por tab
      if (tab === 'compras' && (item.tipo !== 'compra' || item.completado)) return false
      if (tab === 'tareas' && (item.tipo !== 'tarea' || item.completado)) return false
      if (tab === 'prioritarias' && (!item.es_prioritario || item.completado)) return false
      if (tab === 'completadas' && !item.completado) return false
      if (tab === 'todas' && item.completado) return false // en 'todas' mostramos pendientes activos

      // Filtro por búsqueda
      if (busqueda.trim()) {
        const q = busqueda.toLowerCase().trim()
        const matchTitulo = (item.titulo || '').toLowerCase().includes(q)
        const matchNotas = (item.notas || '').toLowerCase().includes(q)
        const matchCat = (item.categoria_obj?.nombre || '').toLowerCase().includes(q)
        const matchSubcat = (item.subcategoria_obj?.nombre || '').toLowerCase().includes(q)
        if (!matchTitulo && !matchNotas && !matchCat && !matchSubcat) return false
      }

      return true
    })
  }, [pendientes, tab, busqueda])

  const pendientesVisibles = useMemo(() => {
    return pendientesFiltrados.slice(0, visibles)
  }, [pendientesFiltrados, visibles])

  const hayMas = pendientesFiltrados.length > visibles

  // Quick Add submit
  const handleQuickAdd = async (e) => {
    e.preventDefault()
    if (!quickTitulo.trim()) return

    // Si marcó rápido como prioritario, usamos la fecha seleccionada
    let fechaRec = null
    if (quickPrioritario) {
      fechaRec = quickFechaRecordatorio ? new Date(quickFechaRecordatorio).toISOString() : null
      if (permission === 'default') {
        await solicitarPermiso()
      }
    }

    await agregarPendiente({
      titulo: quickTitulo.trim(),
      tipo: quickTipo,
      es_prioritario: quickPrioritario,
      fecha_recordatorio: fechaRec,
      moneda: 'ARS',
    })

    setQuickTitulo('')
    setQuickPrioritario(false)
    setQuickFechaRecordatorio(obtenerFechaHoraInicial())
  }

  const handleEliminar = async (id) => {
    if (eliminandoId === id) {
      await eliminarPendiente(id)
      setEliminandoId(null)
    } else {
      setEliminandoId(id)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn pb-12">
      {/* Alerta flotante en caso de recordatorio cumplido */}
      {alertaActiva && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/20 via-indigo-500/20 to-purple-500/20 border border-amber-500/40 shadow-xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/30 text-amber-300 flex items-center justify-center shrink-0">
              <Bell size={20} className="animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-300 uppercase tracking-wider">
                🔔 ¡Recordatorio Prioritario!
              </p>
              <h4 className="text-sm font-semibold text-white">{alertaActiva.titulo}</h4>
              {alertaActiva.monto_estimado && (
                <p className="text-xs text-slate-300">
                  Estimado: {alertaActiva.moneda || 'ARS'} ${Number(alertaActiva.monto_estimado).toLocaleString('es-AR')}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                await toggleCompletado(alertaActiva.id, false)
                cerrarAlerta()
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 text-xs font-bold hover:bg-emerald-400 transition-colors"
            >
              ✓ Marcar Hecho
            </button>
            <button
              onClick={cerrarAlerta}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Barra Superior: Contador de Pendientes y Campana de Notificaciones */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-full gradient-purple text-white font-bold shadow-sm">
            {totalPendientes} {totalPendientes === 1 ? 'pendiente' : 'pendientes'}
          </span>
        </div>

        {/* Botón de estado de permisos de notificación (Campana) */}
        {permission === 'granted' ? (
          <button
            type="button"
            onClick={probarNotificacion}
            title="Notificaciones activadas. Haz clic para probar"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-all shrink-0 shadow-sm"
          >
            <Bell size={14} className="text-emerald-400" />
            <span className="hidden sm:inline">Notificaciones Activas</span>
          </button>
        ) : permission === 'denied' ? (
          <button
            type="button"
            onClick={solicitarPermiso}
            title="Notificaciones bloqueadas"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-red-500/10 border border-red-500/30 text-red-300 hover:bg-red-500/20 transition-all shrink-0 shadow-sm"
          >
            <AlertCircle size={14} className="text-red-400" />
            <span className="hidden sm:inline">Notificaciones Bloqueadas</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={solicitarPermiso}
            title="Activar notificaciones"
            className="flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20 transition-all shrink-0 shadow-sm"
          >
            <Bell size={14} />
            <span className="hidden sm:inline">Activar Notificaciones</span>
          </button>
        )}
      </div>

      {/* Header Principal: Título y Botón Nuevo (+) */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-2xl font-bold text-white tracking-tight leading-tight">
            Compras y Recordatorios
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Gestiona compras previstas y tareas con avisos inteligentes
          </p>
        </div>

        <button
          type="button"
          id="btn-nuevo-pendiente"
          onClick={() =>
            setModalPendiente({
              mode: 'crear',
              item: tab === 'tareas' ? { tipo: 'tarea' } : { tipo: 'compra' },
            })
          }
          className="flex items-center justify-center gap-1.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs font-bold text-white gradient-purple hover:opacity-90 transition-all shadow-md shadow-indigo-500/20 shrink-0"
          title="Nuevo Recordatorio"
        >
          <Plus size={16} />
          <span className="hidden sm:inline">Nuevo Recordatorio</span>
        </button>
      </div>

      {/* Barra de Carga Rápida (Quick Add) - Oculta en vista de celular */}
      <form
        onSubmit={handleQuickAdd}
        className="hidden md:flex glass rounded-2xl p-3 border border-slate-800/80 shadow-lg flex-col sm:flex-row items-stretch sm:items-center gap-2.5"
      >
        <div className="flex items-center gap-1.5 bg-slate-900/90 rounded-xl p-1 shrink-0 border border-slate-800">
          <button
            type="button"
            onClick={() => setQuickTipo('compra')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quickTipo === 'compra'
                ? 'bg-indigo-500/30 text-indigo-300 border border-indigo-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingCart size={13} />
            Compra
          </button>
          <button
            type="button"
            onClick={() => setQuickTipo('tarea')}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              quickTipo === 'tarea'
                ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CheckSquare size={13} />
            Tarea
          </button>
        </div>

        <div className="relative flex-1">
          <input
            type="text"
            id="quick-add-input"
            value={quickTitulo}
            onChange={(e) => setQuickTitulo(e.target.value)}
            placeholder={
              quickTipo === 'compra'
                ? 'Escribe una compra pendiente...'
                : 'Escribe una tarea o recordatorio...'
            }
            className="w-full px-3.5 py-2 bg-slate-900/70 border border-slate-800 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2 relative">
          <input
            type="datetime-local"
            ref={dateInputRef}
            value={quickFechaRecordatorio}
            onChange={(e) => setQuickFechaRecordatorio(e.target.value)}
            className="absolute opacity-0 pointer-events-none -z-10 w-0 h-0"
            tabIndex={-1}
            required={quickPrioritario}
          />
          <button
            type="button"
            title={quickPrioritario ? `Prioritario activo (${quickFechaRecordatorio.replace('T', ' ')})` : 'Marcar como prioritario'}
            onClick={() => {
              if (!quickPrioritario) {
                setQuickPrioritario(true)
                setTimeout(() => {
                  try {
                    dateInputRef.current?.showPicker()
                  } catch(e) {}
                }, 0)
              } else {
                setQuickPrioritario(false)
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${
              quickPrioritario
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Bell size={14} className={quickPrioritario ? 'text-amber-400' : ''} />
            <span className="hidden sm:inline">Prioritario</span>
          </button>

          <button
            type="submit"
            id="quick-add-submit"
            disabled={!quickTitulo.trim()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white gradient-purple hover:opacity-90 transition-all disabled:opacity-40 shrink-0 shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <Plus size={14} />
            <span>Agregar</span>
          </button>
        </div>
      </form>

      {/* Filtros & Búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        {/* Pestañas */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {[
            { id: 'todas', label: 'Todas Activas' },
            { id: 'compras', label: '🛒 Compras' },
            { id: 'tareas', label: '📝 Tareas' },
            { id: 'prioritarias', label: '⭐ Prioritarias' },
            { id: 'completadas', label: '✓ Completadas' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id)
                setVisibles(10)
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                tab === t.id
                  ? 'bg-white/10 text-white border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => {
              setBusqueda(e.target.value)
              setVisibles(10)
            }}
            placeholder="Buscar pendientes..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {busqueda && (
            <button
              onClick={() => {
                setBusqueda('')
                setVisibles(10)
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Lista de Pendientes */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-slate-500 space-y-2">
          <span className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-xs">Cargando tus recordatorios...</p>
        </div>
      ) : pendientesFiltrados.length === 0 ? (
        <div className="glass rounded-2xl p-12 border border-slate-800/60 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 flex items-center justify-center text-slate-400 mb-3">
            {tab === 'completadas' ? <CheckCircle2 size={28} className="text-emerald-400" /> : <Sparkles size={28} className="text-indigo-400" />}
          </div>
          <h3 className="text-base font-bold text-white">
            {tab === 'completadas' ? 'Aún no hay tareas completadas' : '¡Todo al día! No hay pendientes'}
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1">
            {tab === 'completadas'
              ? 'Las compras y tareas que vayas completando aparecerán registradas aquí.'
              : 'Agrega compras pendientes o tareas que quieras recordar usando el formulario o la barra rápida.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {pendientesVisibles.map((item) => {
            const estadoTiempo = getEstadoTiempo(item.fecha_recordatorio)
            const cat = item.categoria_obj

            return (
              <div
                key={item.id}
                onClick={() => setDetalle(item)}
                className={`glass rounded-2xl p-3.5 border transition-all duration-200 flex flex-row items-center justify-between gap-3 cursor-pointer card-hover ${
                  item.completado
                    ? 'border-slate-800/40 bg-slate-900/30 opacity-60'
                    : item.es_prioritario && estadoTiempo === 'vencido'
                    ? 'border-red-500/40 bg-red-500/5 shadow-md shadow-red-500/5'
                    : item.es_prioritario && estadoTiempo === 'hoy'
                    ? 'border-amber-500/40 bg-amber-500/5 shadow-md shadow-amber-500/5'
                    : 'border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                {/* Lado Izquierdo: Checkbox, Título, Categoría y Chips */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleCompletado(item.id, item.completado)
                    }}
                    className="text-slate-400 hover:text-emerald-400 transition-colors shrink-0"
                  >
                    {item.completado ? (
                      <CheckCircle2 size={20} className="text-emerald-400" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold text-white truncate ${
                          item.completado ? 'line-through text-slate-400' : ''
                        }`}
                      >
                        {item.titulo}
                      </span>

                      {/* Badge Tipo */}
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          item.tipo === 'compra'
                            ? 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        }`}
                      >
                        {item.tipo === 'compra' ? '🛒 Compra' : '📝 Tarea'}
                      </span>

                      {/* Badge Categoría */}
                      {cat && (
                        <span
                          className="text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0"
                          style={{
                            background: `${cat.color}20`,
                            color: cat.color,
                            border: `1px solid ${cat.color}40`,
                          }}
                        >
                          <span>{cat.emoji}</span>
                          <span>{cat.nombre}</span>
                        </span>
                      )}
                    </div>

                    {/* Chips de Fecha y Recordatorio */}
                    <div className="flex items-center gap-2 flex-wrap pt-0.5">
                      {item.es_prioritario && item.fecha_recordatorio ? (
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg flex items-center gap-1.5 border ${
                            estadoTiempo === 'vencido'
                              ? 'bg-red-500/20 text-red-300 border-red-500/40 animate-pulse'
                              : estadoTiempo === 'hoy'
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                          }`}
                        >
                          <Bell size={12} />
                          <span>{formatFechaRecordatorio(item.fecha_recordatorio)}</span>
                          {estadoTiempo === 'vencido' && !item.completado && ' (Vencido)'}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500 flex items-center gap-1">
                          <BellOff size={11} /> Sin notificación
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lado Derecho: Monto Estimado si existe */}
                {item.monto_estimado && (
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-white block">
                      {item.moneda === 'USD'
                        ? formatUSD(item.monto_estimado)
                        : formatARS(item.monto_estimado)}
                    </span>
                    {item.moneda === 'USD' && cotizacionMEP && (
                      <span className="text-[10px] text-slate-500">
                        ≈ {formatARS(Number(item.monto_estimado) * cotizacionMEP.venta)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Botón Cargar Más */}
          {hayMas && (
            <button
              id="cargar-mas-pendientes"
              onClick={() => setVisibles((v) => v + 10)}
              className="w-full mt-2 py-3 rounded-2xl glass border border-slate-700/40 text-slate-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 text-xs font-medium transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Cargar más</span>
              <span className="text-[11px] text-slate-500">
                ({pendientesFiltrados.length - visibles} restantes)
              </span>
            </button>
          )}

          {/* Indicador total */}
          {pendientesFiltrados.length > 0 && (
            <p className="text-center text-[11px] text-slate-500 pt-1">
              Mostrando {Math.min(visibles, pendientesFiltrados.length)} de {pendientesFiltrados.length} pendientes
            </p>
          )}
        </div>
      )}

      {/* Modal Detalle */}
      {detalle && (
        <PendienteDetalleModal
          pendiente={detalle}
          onClose={() => setDetalle(null)}
          onEdit={(item) => {
            setDetalle(null)
            setModalPendiente({ mode: 'editar', item })
          }}
          onDelete={async (id) => {
            await eliminarPendiente(id)
            setDetalle(null)
          }}
          onToggleCompletado={async (id, status) => {
            await toggleCompletado(id, status)
            setDetalle((prev) => (prev ? { ...prev, completado: !status } : null))
          }}
          onConvertirGasto={(item) => {
            setDetalle(null)
            setModalGasto({ pendiente: item })
          }}
          formatARS={formatARS}
          formatUSD={formatUSD}
          cotizacionMEP={cotizacionMEP}
        />
      )}

      {/* Modal Crear / Editar Pendiente */}
      {modalPendiente && (
        <PendienteModal
          pendiente={modalPendiente.item}
          notificationPermission={permission}
          onRequestPermission={solicitarPermiso}
          onSave={
            modalPendiente.mode === 'crear'
              ? (data) => agregarPendiente(data)
              : (data) => actualizarPendiente(modalPendiente.item.id, data)
          }
          onClose={() => setModalPendiente(null)}
        />
      )}

      {/* Modal Convertir en Gasto */}
      {modalGasto && (
        <GastoModal
          gasto={{
            descripcion: modalGasto.pendiente.titulo,
            monto: modalGasto.pendiente.monto_estimado ? String(modalGasto.pendiente.monto_estimado) : '',
            moneda: modalGasto.pendiente.moneda || 'ARS',
            categoria_id: modalGasto.pendiente.categoria_id,
            subcategoria_id: modalGasto.pendiente.subcategoria_id,
            fecha: new Date().toISOString().split('T')[0],
          }}
          miembros={esFamiliar ? miembros : []}
          miembroDefault={miMiembro}
          onSave={async (data) => {
            await agregarGasto(data)
            // Marcar el pendiente como completado
            await toggleCompletado(modalGasto.pendiente.id, false)
            setModalGasto(null)
          }}
          onClose={() => setModalGasto(null)}
        />
      )}

      {/* Modal Estilizado: Guía para Desbloquear Notificaciones */}
      {mostrarGuiaBloqueo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                  <BellOff size={16} />
                </div>
                <h3 className="text-sm font-bold text-white">Notificaciones Bloqueadas</h3>
              </div>
              <button
                onClick={() => setMostrarGuiaBloqueo(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-slate-300">
              <p className="text-slate-300 leading-relaxed">
                Tu navegador web tiene bloqueadas las notificaciones para este sitio. Para recibir avisos puntuales de tus tareas y compras prioritarias, sigue estos pasos:
              </p>

              <div className="space-y-2.5 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                    1
                  </div>
                  <p>
                    Haz clic en el icono del <strong className="text-white">candado</strong> o <strong className="text-white">ajustes del sitio</strong> en la barra de direcciones (arriba a la izquierda, junto a la URL).
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                    2
                  </div>
                  <p>
                    En la opción <strong className="text-white">«Notificaciones»</strong>, cambia la selección a <strong className="text-emerald-400">«Permitir»</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-md bg-indigo-500/20 text-indigo-300 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                    3
                  </div>
                  <p>
                    <strong className="text-white">Recarga la página</strong> (presiona F5 o el botón de actualizar del navegador).
                  </p>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => setMostrarGuiaBloqueo(false)}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white gradient-purple hover:opacity-90 transition-all shadow-md shadow-indigo-500/20"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
