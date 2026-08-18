import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil } from 'lucide-react'
import { useAhorros } from '../hooks/useAhorros'
import { useCurrency, VIEW_MODES } from '../contexts/CurrencyContext'
import AhorroModal from '../components/AhorroModal'
import { formatDate } from '../lib/constants'

function ProgressBar({ porcentaje, color = '#10b981' }) {
  const pct = Math.min(100, Math.max(0, porcentaje))
  return (
    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${color}aa, ${color})` }}
      />
    </div>
  )
}

function ObjetivoCard({ objetivo, onAgregar, onEliminar, onEditar, currency }) {
  const [expanded, setExpanded] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const { formatARS, formatUSD, formatInMode, convertToARS, convertToUSD, viewMode, cotizacionMEP } = currency

  const handleEliminar = async (id) => {
    if (eliminando === id) {
      await onEliminar(id)
      setEliminando(null)
    } else {
      setEliminando(id)
    }
  }

  // Calcular el total ahorrado en la moneda de la meta (para la barra de progreso)
  const calcularTotalEnMonedaMeta = () => {
    if (!cotizacionMEP) return null
    const { totalAhorradoARS, totalAhorradoUSD, moneda_meta } = objetivo
    if (moneda_meta === 'USD') {
      // Convertir ARS a USD y sumar con los USD directos
      const arsEnUSD = totalAhorradoARS / cotizacionMEP.venta
      return arsEnUSD + totalAhorradoUSD
    } else {
      // Convertir USD a ARS y sumar con los ARS directos
      const usdEnARS = totalAhorradoUSD * cotizacionMEP.venta
      return totalAhorradoARS + usdEnARS
    }
  }

  const totalEnMonedaMeta = calcularTotalEnMonedaMeta()
  const porcentaje = objetivo.meta > 0 && totalEnMonedaMeta !== null
    ? (totalEnMonedaMeta / objetivo.meta) * 100
    : null

  // Formato del total ahorrado según viewMode
  const formatTotal = (monto, moneda) => {
    if (viewMode === 'ARS') return moneda === 'ARS' ? formatARS(monto) : null
    if (viewMode === 'USD') return moneda === 'USD' ? formatUSD(monto) : null
    if (viewMode === 'unified_ARS') return formatARS(convertToARS(monto, moneda) ?? 0)
    if (viewMode === 'unified_USD') return formatUSD(convertToUSD(monto, moneda) ?? 0)
    return formatARS(monto)
  }

  // Mostrar total del objetivo según modo
  const mostrarTotalObjetivo = () => {
    if (viewMode === 'unified_ARS' && cotizacionMEP) {
      const total = objetivo.totalAhorradoARS + objetivo.totalAhorradoUSD * cotizacionMEP.venta
      return formatARS(total)
    }
    if (viewMode === 'unified_USD' && cotizacionMEP) {
      const total = objetivo.totalAhorradoUSD + objetivo.totalAhorradoARS / cotizacionMEP.venta
      return formatUSD(total)
    }
    if (viewMode === 'ARS') return formatARS(objetivo.totalAhorradoARS)
    if (viewMode === 'USD') return formatUSD(objetivo.totalAhorradoUSD)
    return formatARS(objetivo.totalAhorrado)
  }

  const mostrarMeta = () => {
    if (!objetivo.meta) return null
    return objetivo.moneda_meta === 'USD' ? formatUSD(objetivo.meta) : formatARS(objetivo.meta)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden card-hover">
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-2xl">
              {objetivo.emoji || '🎯'}
            </div>
            <div>
              <h3 className="text-white font-bold text-base">{objetivo.nombre}</h3>
              <div className="flex items-center gap-1.5">
                <p className="text-slate-400 text-xs">{objetivo.depositos.length} depósito{objetivo.depositos.length !== 1 ? 's' : ''}</p>
                {objetivo.totalAhorradoARS > 0 && objetivo.totalAhorradoUSD > 0 && (
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 font-medium">mixto</span>
                )}
              </div>
            </div>
          </div>
          <button
            id={`agregar-deposito-${objetivo.nombre}`}
            onClick={() => onAgregar(objetivo)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium gradient-green text-white hover:opacity-90 transition-opacity"
          >
            <Plus size={12} /> Depositar
          </button>
        </div>

        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-emerald-400 font-bold text-2xl">{mostrarTotalObjetivo()}</p>
            {/* Desglose ARS + USD si hay mixto */}
            {objetivo.totalAhorradoARS > 0 && objetivo.totalAhorradoUSD > 0 && (
              <p className="text-slate-500 text-xs mt-0.5">
                {formatARS(objetivo.totalAhorradoARS)} + {formatUSD(objetivo.totalAhorradoUSD)}
              </p>
            )}
            {objetivo.meta > 0 && (
              <p className="text-slate-400 text-xs">
                de {mostrarMeta()}
                {/* Si la meta es cross-currency, mostrar equivalente */}
                {cotizacionMEP && objetivo.moneda_meta === 'USD' && (
                  <span className="text-slate-500 ml-1">≈ {formatARS(objetivo.meta * cotizacionMEP.venta)}</span>
                )}
                {cotizacionMEP && objetivo.moneda_meta === 'ARS' && objetivo.meta > 0 && (
                  <span className="text-slate-500 ml-1">≈ {formatUSD(objetivo.meta / cotizacionMEP.venta)}</span>
                )}
              </p>
            )}
          </div>
          <div className="text-right">
            {porcentaje !== null && (
              <p className={`text-sm font-bold ${porcentaje >= 100 ? 'text-emerald-400' : 'text-slate-300'}`}>
                {porcentaje >= 100 ? '🎉 ¡Meta!' : `${Math.min(100, porcentaje).toFixed(0)}%`}
              </p>
            )}
            {objetivo.meta > 0 && objetivo.moneda_meta !== (objetivo.totalAhorradoARS > 0 && objetivo.totalAhorradoUSD === 0 ? 'ARS' : objetivo.totalAhorradoUSD > 0 && objetivo.totalAhorradoARS === 0 ? 'USD' : null) && (
              <p className="text-xs text-indigo-400">meta en {objetivo.moneda_meta}</p>
            )}
          </div>
        </div>

        {porcentaje !== null && <ProgressBar porcentaje={porcentaje} />}
      </div>

      {/* Historial */}
      {objetivo.depositos.length > 0 && (
        <div className="border-t border-white/5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full flex items-center justify-between px-5 py-3 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <span>Ver historial</span>
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>

          {expanded && (
            <div className="px-4 pb-4 space-y-2">
              {objetivo.depositos.map(dep => (
                <div key={dep.id} className="glass-light rounded-xl p-3 flex items-center gap-3 group">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">
                      {dep.descripcion || 'Depósito'}
                    </p>
                    <p className="text-slate-500 text-xs">{formatDate(dep.fecha)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-sm">
                      {dep.moneda === 'USD' ? formatUSD(dep.monto) : formatARS(dep.monto)}
                    </p>
                    {dep.moneda === 'USD' && cotizacionMEP && (
                      <p className="text-slate-500 text-xs">≈ {formatARS(dep.monto * cotizacionMEP.venta)}</p>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${
                    (dep.moneda || 'ARS') === 'USD'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {dep.moneda || 'ARS'}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button id={`edit-ahorro-${dep.id}`} onClick={() => onEditar(dep)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                      <Pencil size={13} />
                    </button>
                    <button id={`delete-ahorro-${dep.id}`} onClick={() => handleEliminar(dep.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        eliminando === dep.id
                          ? 'text-red-400 bg-red-500/10 animate-pulse'
                          : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={eliminando === dep.id ? 'Clic para confirmar' : 'Eliminar'}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AhorrosPage() {
  const { ahorros, objetivos, loading, totalAhorradoARS, totalAhorradoUSD, agregarAhorro, actualizarAhorro, eliminarAhorro } = useAhorros()
  const [modal, setModal] = useState(null)
  const currency = useCurrency()
  const { viewMode, setViewMode, formatARS, formatUSD, formatInMode, sumInMode, cotizacionMEP, tiempoActualizacion } = currency

  const handleAgregarDeposito = (objetivo) => {
    setModal({
      mode: 'crear',
      ahorro: {
        objetivo: objetivo.nombre,
        emoji: objetivo.emoji,
        meta: objetivo.meta,
        moneda_meta: objetivo.moneda_meta || 'ARS',
      }
    })
  }

  // Total unificado según modo
  const totalEnModo = (() => {
    if (viewMode === 'unified_ARS' && cotizacionMEP) {
      return totalAhorradoARS + totalAhorradoUSD * cotizacionMEP.venta
    }
    if (viewMode === 'unified_USD' && cotizacionMEP) {
      return totalAhorradoUSD + totalAhorradoARS / cotizacionMEP.venta
    }
    if (viewMode === 'ARS') return totalAhorradoARS
    if (viewMode === 'USD') return totalAhorradoUSD
    return totalAhorradoARS + totalAhorradoUSD * (cotizacionMEP?.venta || 0)
  })()

  const formatTotal = () => {
    if (viewMode === 'USD' || viewMode === 'unified_USD') return formatUSD(totalEnModo)
    return formatARS(totalEnModo)
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ahorros</h1>
          <p className="text-slate-400 text-sm">Seguí el progreso de tus objetivos</p>
        </div>
        <button
          id="nuevo-ahorro-btn"
          onClick={() => setModal({ mode: 'crear' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-green text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
        >
          <Plus size={16} />
          Nuevo ahorro
        </button>
      </div>

      {/* Total general + ViewMode */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
            🐷
          </div>
          <div>
            <p className="text-slate-400 text-sm">Total ahorrado</p>
            <p className="text-emerald-400 font-bold text-3xl">{formatTotal()}</p>
            {/* Desglose si hay ambas monedas */}
            {totalAhorradoARS > 0 && totalAhorradoUSD > 0 && (
              <p className="text-slate-500 text-xs mt-0.5">
                {formatARS(totalAhorradoARS)} ARS + {formatUSD(totalAhorradoUSD)} USD
              </p>
            )}
            <p className="text-slate-500 text-xs mt-0.5">{objetivos.length} objetivo{objetivos.length !== 1 ? 's' : ''} activo{objetivos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-2 mb-2">
          {VIEW_MODES.map(mode => (
            <button key={mode.id} id={`view-mode-ahorros-${mode.id}`}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode.id
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white'
              }`}>
              {mode.emoji} {mode.label}
            </button>
          ))}
        </div>

        {cotizacionMEP && (
          <p className="text-xs text-slate-500 text-center">
            💹 MEP: {formatARS(cotizacionMEP.venta)}
            {tiempoActualizacion !== null && <span className="ml-2">(hace {tiempoActualizacion} min)</span>}
          </p>
        )}
      </div>

      {/* Lista de objetivos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : objetivos.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🐷</p>
          <p className="text-slate-300 font-medium">No tenés ahorros todavía</p>
          <p className="text-slate-500 text-sm mt-1">Creá tu primer objetivo de ahorro</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {objetivos.map((objetivo) => (
            <ObjetivoCard
              key={objetivo.nombre}
              objetivo={objetivo}
              onAgregar={handleAgregarDeposito}
              onEliminar={eliminarAhorro}
              onEditar={(dep) => setModal({ mode: 'editar', ahorro: dep })}
              currency={currency}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <AhorroModal
          ahorro={modal.ahorro}
          objetivosExistentes={objetivos}
          onSave={modal.mode === 'crear'
            ? (data) => agregarAhorro(data)
            : (data) => actualizarAhorro(modal.ahorro.id, data)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
