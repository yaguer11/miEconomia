import { useState } from 'react'
import { Plus, Trash2, ChevronDown, ChevronUp, Pencil, TrendingDown } from 'lucide-react'
import { useAhorros } from '../hooks/useAhorros'
import { useCurrency, VIEW_MODES } from '../contexts/CurrencyContext'
import AhorroModal from '../components/AhorroModal'
import RetiroModal from '../components/RetiroModal'
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

function ObjetivoCard({ objetivo, onAgregar, onUsarAhorro, onEliminar, onEditar, onActualizarProyeccion, currency }) {
  const [expanded, setExpanded] = useState(false)
  const [eliminando, setEliminando] = useState(null)
  const [editandoProy, setEditandoProy] = useState(false)
  const [expandedProy, setExpandedProy] = useState(false)
  const [inputProy, setInputProy] = useState(objetivo.ahorro_mensual_proyectado?.toString() || '')
  const [monedaProy, setMonedaProy] = useState(objetivo.moneda_proyeccion || 'ARS')
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
          <div className="flex items-center gap-1.5">
            <button
              id={`agregar-deposito-${objetivo.nombre}`}
              onClick={() => onAgregar(objetivo)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 md:px-3 rounded-lg text-xs font-medium gradient-green text-white hover:opacity-90 transition-opacity"
              title="Depositar"
            >
              <Plus size={13} />
              <span className="hidden md:inline">Depositar</span>
            </button>
            <button
              id={`usar-ahorro-${objetivo.nombre}`}
              onClick={() => onUsarAhorro(objetivo)}
              className="flex items-center justify-center gap-1 px-2.5 py-1.5 md:px-3 rounded-lg text-xs font-medium bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25 hover:text-red-300 transition-all"
              title="Usar ahorro"
            >
              <TrendingDown size={13} />
              <span className="hidden md:inline">Usar ahorro</span>
            </button>
          </div>
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
            <div className="px-4 pb-4 space-y-4">
              {/* Sección Simulador de Proyección */}
              {objetivo.meta > 0 && totalEnMonedaMeta < objetivo.meta && (
                <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/50">
                  <div className={`flex items-center justify-between ${expandedProy ? 'mb-3' : ''}`}>
                    <button 
                      onClick={() => setExpandedProy(!expandedProy)}
                      className="text-sm font-semibold text-white flex items-center gap-2 hover:text-indigo-300 transition-colors text-left"
                    >
                      <span>⏱️</span> Proyección a la meta
                      {expandedProy ? <ChevronUp size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronDown size={14} className="text-slate-500 flex-shrink-0" />}
                    </button>
                    {!editandoProy && (
                      <button onClick={() => { setExpandedProy(true); setEditandoProy(true); }} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium bg-indigo-500/10 px-2 py-1 rounded-md">
                        <Pencil size={12} /> Editar
                      </button>
                    )}
                  </div>
                  
                  {expandedProy && (
                    <div className="mt-3 border-t border-slate-700/50 pt-3 flex flex-col gap-3">
                      {editandoProy ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-slate-400 text-sm">Ahorro mensual:</span>
                          <div className="flex items-center">
                            <input 
                              type="number" 
                              value={inputProy} 
                              onChange={e => setInputProy(e.target.value)}
                              className="bg-slate-900 border border-slate-700 rounded-l-lg px-3 py-1.5 text-sm text-white w-28 focus:outline-none focus:border-indigo-500 transition-colors"
                              placeholder="Ej: 50000"
                              min="0"
                            />
                            <select
                              value={monedaProy}
                              onChange={e => setMonedaProy(e.target.value)}
                              className="bg-slate-800 border border-l-0 border-slate-700 rounded-r-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                            >
                              <option value="ARS">ARS</option>
                              <option value="USD">USD</option>
                            </select>
                          </div>
                        </div>
                      ) : (
                    <p className="text-slate-300 text-sm">
                      Ahorrando <strong className="text-white">{objetivo.moneda_proyeccion === 'USD' ? formatUSD(objetivo.ahorro_mensual_proyectado || 0) : formatARS(objetivo.ahorro_mensual_proyectado || 0)} {objetivo.moneda_proyeccion || 'ARS'}</strong> por mes:
                    </p>
                  )}

                  {(() => {
                    const montoMensual = editandoProy ? Number(inputProy) : objetivo.ahorro_mensual_proyectado;
                    const monedaMensual = editandoProy ? monedaProy : (objetivo.moneda_proyeccion || 'ARS');
                    if (!montoMensual || montoMensual <= 0) {
                      return <p className="text-xs text-slate-500 italic">Ingresá un ahorro mensual estimado para calcular cuándo alcanzarás la meta.</p>;
                    }
                    
                    const faltante = objetivo.meta - totalEnMonedaMeta;
                    
                    let montoMensualConvertido = montoMensual;
                    if (monedaMensual !== objetivo.moneda_meta && cotizacionMEP) {
                       if (monedaMensual === 'ARS' && objetivo.moneda_meta === 'USD') {
                           montoMensualConvertido = montoMensual / cotizacionMEP.venta;
                       } else if (monedaMensual === 'USD' && objetivo.moneda_meta === 'ARS') {
                           montoMensualConvertido = montoMensual * cotizacionMEP.venta;
                       }
                    }

                    const mesesFloat = faltante / montoMensualConvertido;
                    const meses = Math.floor(mesesFloat);
                    const dias = Math.round((mesesFloat - meses) * 30);
                    
                    if (meses === 0 && dias === 0) {
                       return (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2 inline-block">
                          <p className="text-emerald-400 text-sm font-medium">¡Estás a punto de alcanzarlo!</p>
                        </div>
                       )
                    }

                    return (
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-lg px-3 py-2 inline-block">
                        <p className="text-indigo-300 text-sm">
                          Alcanzarás tu objetivo en <strong className="text-indigo-200">{meses > 0 ? `${meses} mes${meses !== 1 ? 'es' : ''}` : ''}{meses > 0 && dias > 0 ? ' y ' : ''}{dias > 0 ? `${dias} día${dias !== 1 ? 's' : ''}` : ''}</strong>
                        </p>
                      </div>
                    )
                  })()}

                  {editandoProy && (
                    <div className="flex items-center gap-2 justify-end mt-1">
                      <button onClick={() => { setEditandoProy(false); setInputProy(objetivo.ahorro_mensual_proyectado?.toString() || ''); setMonedaProy(objetivo.moneda_proyeccion || 'ARS'); }} className="text-sm text-slate-400 hover:text-white px-3 py-1.5">Cancelar</button>
                      <button 
                        onClick={() => {
                          const val = Number(inputProy);
                          if (val >= 0) {
                            onActualizarProyeccion(objetivo.nombre, val, monedaProy);
                            setEditandoProy(false);
                          }
                        }} 
                        className="text-sm gradient-green text-white px-4 py-1.5 rounded-lg hover:opacity-90 font-medium shadow-lg">
                        Guardar
                      </button>
                    </div>
                  )}
                    </div>
                  )}
                </div>
              )}

              {/* Lista de depositos y retiros */}
              <div className="space-y-2">
                {objetivo.depositos.map(dep => {
                  const esRetiro = dep.tipo === 'retiro'
                  return (
                  <div key={dep.id} className="glass-light rounded-xl p-2.5 md:p-3 flex items-center gap-2.5 md:gap-3 group">
                    {/* Indicador deposito / retiro */}
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      esRetiro ? 'bg-red-500/15 text-red-400' : 'bg-emerald-500/15 text-emerald-400'
                    }`}>
                      {esRetiro ? '−' : '+'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm font-medium truncate">
                        {dep.descripcion || (esRetiro ? 'Retiro' : 'Deposito')}
                      </p>
                      <p className="text-slate-500 text-xs">{formatDate(dep.fecha)}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-sm ${esRetiro ? 'text-red-400' : 'text-emerald-400'}`}>
                        {esRetiro ? '− ' : '+ '}
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
                    <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      {!esRetiro && (
                        <button id={`edit-ahorro-${dep.id}`} onClick={() => onEditar(dep)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                          <Pencil size={13} />
                        </button>
                      )}
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
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AhorrosPage() {
  const { ahorros, objetivos, loading, totalAhorradoARS, totalAhorradoUSD, agregarAhorro, actualizarAhorro, eliminarAhorro, agregarRetiro, actualizarProyeccionObjetivo } = useAhorros()
  const [modal, setModal] = useState(null)
  const [retiroModal, setRetiroModal] = useState(null)
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

  const handleUsarAhorro = (objetivo) => {
    setRetiroModal(objetivo)
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
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ahorros</h1>
          <p className="text-slate-400 text-sm">Seguí el progreso de tus objetivos</p>
        </div>
        <button
          id="nuevo-ahorro-btn"
          onClick={() => setModal({ mode: 'crear' })}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl gradient-green text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-emerald-500/20 md:shadow-emerald-500/30 transition-all"
        >
          <Plus size={18} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">Nuevo ahorro</span>
        </button>
      </div>

      {/* Total general + ViewMode */}
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-3xl">
            🐷
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-sm truncate">Total ahorrado</p>
            <p className="text-emerald-400 font-bold text-2xl md:text-3xl truncate" title={formatTotal()}>{formatTotal()}</p>
            {/* Desglose si hay ambas monedas */}
            {totalAhorradoARS > 0 && totalAhorradoUSD > 0 && (
              <p className="text-slate-500 text-xs mt-0.5 truncate" title={`${formatARS(totalAhorradoARS)} ARS + ${formatUSD(totalAhorradoUSD)} USD`}>
                {formatARS(totalAhorradoARS)} ARS + {formatUSD(totalAhorradoUSD)} USD
              </p>
            )}
            <p className="text-slate-500 text-xs mt-0.5 truncate">{objetivos.length} objetivo{objetivos.length !== 1 ? 's' : ''} activo{objetivos.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {/* Selector de modo */}
        <div className="flex gap-2 mb-2">
          {VIEW_MODES.map(mode => (
            <button key={mode.id} id={`view-mode-ahorros-${mode.id}`}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                viewMode === mode.id
                  ? 'bg-emerald-500/20 border border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white'
              }`}>
              <span className="md:hidden text-base leading-none">{mode.emoji}</span>
              <span className="hidden md:inline">{mode.emoji} {mode.label}</span>
            </button>
          ))}
        </div>
        {/* Descripción del modo activo en móvil */}
        <p className="md:hidden text-center text-xs text-slate-400 mt-3 mb-2">
          Vista: <span className="text-white font-medium">{VIEW_MODES.find(m => m.id === viewMode)?.label}</span>
        </p>

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
              onUsarAhorro={handleUsarAhorro}
              onEliminar={eliminarAhorro}
              onEditar={(dep) => setModal({ mode: 'editar', ahorro: dep })}
              onActualizarProyeccion={actualizarProyeccionObjetivo}
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

      {retiroModal && (
        <RetiroModal
          objetivo={retiroModal}
          onSave={(data) => agregarRetiro(data)}
          onClose={() => setRetiroModal(null)}
        />
      )}
    </div>
  )
}
