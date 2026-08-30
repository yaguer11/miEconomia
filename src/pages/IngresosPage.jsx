import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ChevronDown, Filter, TrendingUp, Search, X } from 'lucide-react'
import { useIngresos } from '../hooks/useIngresos'
import { useProfile } from '../contexts/ProfileContext'
import { useCurrency, VIEW_MODES } from '../contexts/CurrencyContext'
import IngresoModal from '../components/IngresoModal'
import IngresoDetalleModal from '../components/IngresoDetalleModal'
import { CATEGORIAS_INGRESOS, getCategIngresosById, formatDate, MESES } from '../lib/constants'

export default function IngresosPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())
  const [filtroCategoria, setFiltroCategoria] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [visibles, setVisibles] = useState(10)
  const [vistaAbierta, setVistaAbierta] = useState(false)
  const [modal, setModal] = useState(null)
  const [detalle, setDetalle] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const { ingresos, loading, agregarIngreso, actualizarIngreso, eliminarIngreso } = useIngresos(mes, anio)
  const { esFamiliar, miembros, miMiembro } = useProfile()
  const { viewMode, setViewMode, sumInMode, formatInMode, formatARS, formatUSD, cotizacionMEP, tiempoActualizacion } = useCurrency()

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1) }
    else setMes(m => m - 1)
  }
  const nextMes = () => {
    if (mes === 12) { setMes(1); setAnio(a => a + 1) }
    else setMes(m => m + 1)
  }

  const ingresosFiltrados = useMemo(() => {
    let lista = ingresos
    if (filtroCategoria !== 'todas')
      lista = lista.filter(i => i.categoria === filtroCategoria)
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      lista = lista.filter(i => {
        const desc = (i.descripcion || '').toLowerCase()
        const catLabel = getCategIngresosById(i.categoria).label.toLowerCase()
        return desc.includes(q) || catLabel.includes(q)
      })
    }
    return lista
  }, [ingresos, filtroCategoria, busqueda])

  const ingresosVisibles = ingresosFiltrados.slice(0, visibles)
  const hayMas = ingresosFiltrados.length > visibles

  // Reset visibles al cambiar filtros
  const handleSetFiltroCategoria = (id) => { setFiltroCategoria(id); setVisibles(10) }
  const handleBusqueda = (val) => { setBusqueda(val); setVisibles(10) }
  const handleSetViewMode = (id) => { setViewMode(id); setVistaAbierta(false) }

  const totalEnModo = sumInMode(ingresosFiltrados.map(i => ({ monto: i.monto, moneda: i.moneda || 'ARS' })))

  const handleEliminar = async (id) => {
    if (eliminando === id) {
      await eliminarIngreso(id)
      setEliminando(null)
    } else {
      setEliminando(id)
    }
  }

  // Top categoría por monto (según modo)
  const totalesCat = ingresosFiltrados.reduce((acc, i) => {
    const val = sumInMode([{ monto: i.monto, moneda: i.moneda || 'ARS' }])
    acc[i.categoria] = (acc[i.categoria] || 0) + val
    return acc
  }, {})
  const topCategoria = Object.entries(totalesCat).sort((a, b) => b[1] - a[1])[0]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Ingresos</h1>
          <p className="text-slate-400 text-sm">Registrá tus entradas de dinero</p>
        </div>
        <button
          id="nuevo-ingreso-btn"
          onClick={() => setModal({ mode: 'crear' })}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl gradient-green text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-emerald-500/20 md:shadow-emerald-500/30 transition-all"
        >
          <Plus size={18} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">Nuevo ingreso</span>
        </button>
      </div>

      {/* Navegador de mes + ViewMode */}
      <div className="glass rounded-2xl p-3 sm:p-5 mb-4 md:mb-6 space-y-2 sm:space-y-4">
        <div className="flex items-center justify-between">
          <button id="prev-mes-ingresos" onClick={prevMes} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{MESES[mes - 1]} {anio}</p>
            <p className="text-slate-400 text-sm hidden sm:block">{ingresos.length} ingresos registrados</p>
          </div>
          <button id="next-mes-ingresos" onClick={nextMes} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>
        {/* Trigger compacto — solo mobile */}
        <button
          id="toggle-vista-ingresos"
          onClick={() => setVistaAbierta(v => !v)}
          className="md:hidden w-full flex items-center justify-center gap-1.5 py-0.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <span>Vista:</span>
          <span className="text-white font-medium">{VIEW_MODES.find(m => m.id === viewMode)?.label}</span>
          <ChevronDown
            size={13}
            className={`transition-transform duration-200 ${vistaAbierta ? 'rotate-180' : ''}`}
          />
        </button>

        {/* Fila de botones: siempre en desktop, condicional en mobile */}
        <div className={`gap-2 ${vistaAbierta ? 'flex' : 'hidden'} md:flex`}>
          {VIEW_MODES.map(mode => (
            <button key={mode.id} id={`view-mode-ingresos-${mode.id}`}
              onClick={() => handleSetViewMode(mode.id)}
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
        {cotizacionMEP && (
          <p className="text-xs text-slate-500 text-center hidden sm:block">
            💹 MEP: {formatARS(cotizacionMEP.venta)}
            {tiempoActualizacion !== null && <span className="ml-2">(hace {tiempoActualizacion} min)</span>}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="glass rounded-2xl p-4 overflow-hidden">
          <p className="text-slate-400 text-xs mb-1 truncate">Total del mes</p>
          <p className="text-emerald-400 font-bold text-xl truncate" title={formatInMode(totalEnModo)}>{formatInMode(totalEnModo)}</p>
        </div>
        <div className="glass rounded-2xl p-4 overflow-hidden">
          <p className="text-slate-400 text-xs mb-1 truncate">Promedio por ingreso</p>
          <p className="text-white font-bold text-xl truncate" title={formatInMode(ingresosFiltrados.length > 0 ? totalEnModo / ingresosFiltrados.length : 0)}>
            {formatInMode(ingresosFiltrados.length > 0 ? totalEnModo / ingresosFiltrados.length : 0)}
          </p>
        </div>
        {topCategoria && (
          <div className="hidden md:block glass rounded-2xl p-4 col-span-2 md:col-span-1">
            <p className="text-slate-400 text-xs mb-1">Mayor fuente</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCategIngresosById(topCategoria[0]).emoji}</span>
              <div>
                <p className="text-white font-bold text-sm leading-none">
                  {getCategIngresosById(topCategoria[0]).label}
                </p>
                <p className="text-slate-400 text-xs">{formatInMode(topCategoria[1])}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id="buscador-ingresos"
          type="text"
          placeholder="Buscar por descripción o categoría…"
          value={busqueda}
          onChange={e => handleBusqueda(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 focus:bg-slate-800/80 transition-all"
        />
        {busqueda && (
          <button
            onClick={() => handleBusqueda('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            aria-label="Limpiar búsqueda"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Filtro categorías */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
        <Filter size={14} className="text-slate-400 flex-shrink-0" />
        <button
          id="filtro-ingresos-todas"
          onClick={() => handleSetFiltroCategoria('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
            filtroCategoria === 'todas'
              ? 'gradient-green text-white'
              : 'glass-light text-slate-400 hover:text-white'
          }`}
        >
          Todas
        </button>
        {CATEGORIAS_INGRESOS.filter(cat => ingresos.some(i => i.categoria === cat.id)).map(cat => (
          <button
            key={cat.id}
            id={`filtro-ingreso-${cat.id}`}
            onClick={() => handleSetFiltroCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all flex items-center gap-1 ${
              filtroCategoria === cat.id
                ? 'text-white border border-current'
                : 'glass-light text-slate-400 hover:text-white'
            }`}
            style={filtroCategoria === cat.id ? { borderColor: cat.color, color: cat.color, background: cat.color + '20' } : {}}
          >
            {cat.emoji} {cat.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : ingresosFiltrados.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">{busqueda ? '🔍' : '💵'}</p>
          <p className="text-slate-300 font-medium">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay ingresos registrados'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {busqueda
              ? 'Probá con otra descripción o categoría'
              : filtroCategoria !== 'todas' ? 'Probá con otra categoría' : 'Agregá tu primer ingreso del mes'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {ingresosVisibles.map((ingreso) => {
            const cat = getCategIngresosById(ingreso.categoria)
            return (
              <div
                key={ingreso.id}
                className="glass rounded-2xl p-3 md:p-4 card-hover flex items-center gap-3 md:gap-4 group cursor-pointer"
                onClick={(e) => { if (!e.target.closest('button')) setDetalle(ingreso) }}
              >
                <div
                  className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-lg md:text-xl flex-shrink-0"
                  style={{ background: cat.color + '20', border: `1px solid ${cat.color}40` }}
                >
                  {cat.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {ingreso.descripcion || cat.label}
                  </p>
                  <div className="hidden md:flex flex-wrap items-center gap-2 mt-0.5">
                    <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: cat.color + '20', color: cat.color }}>
                      {cat.label}
                    </span>
                    {esFamiliar && ingreso.miembro && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 max-w-[160px]">
                        <span className="flex-shrink-0">{ingreso.miembro.avatar_emoji}</span>
                        <span className="truncate">{ingreso.miembro.nombre_display}</span>
                      </span>
                    )}
                    <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(ingreso.fecha)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold text-sm">
                      {ingreso.moneda === 'USD' ? formatUSD(ingreso.monto) : formatARS(ingreso.monto)}
                    </p>
                    {(viewMode === 'unified_ARS' || viewMode === 'unified_USD') && ingreso.moneda === 'USD' && cotizacionMEP && (
                      <p className="text-slate-500 text-xs">≈ {formatARS(Number(ingreso.monto) * cotizacionMEP.venta)}</p>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    (ingreso.moneda || 'ARS') === 'USD'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {ingreso.moneda || 'ARS'}
                  </span>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      id={`edit-ingreso-${ingreso.id}`}
                      onClick={() => setModal({ mode: 'editar', ingreso })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      id={`delete-ingreso-${ingreso.id}`}
                      onClick={() => handleEliminar(ingreso.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        eliminando === ingreso.id
                          ? 'text-red-400 bg-red-500/10 animate-pulse'
                          : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={eliminando === ingreso.id ? 'Clic para confirmar' : 'Eliminar'}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}

          {/* Botón cargar más */}
          {hayMas && (
            <button
              id="cargar-mas-ingresos"
              onClick={() => setVisibles(v => v + 10)}
              className="w-full mt-2 py-3 rounded-2xl glass border border-slate-700/40 text-slate-400 hover:text-white hover:border-emerald-500/40 hover:bg-emerald-500/5 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <span>Cargar más</span>
              <span className="text-xs text-slate-500">({ingresosFiltrados.length - visibles} restantes)</span>
            </button>
          )}

          {/* Indicador total */}
          {ingresosFiltrados.length > 0 && (
            <p className="text-center text-xs text-slate-600 pt-1">
              Mostrando {Math.min(visibles, ingresosFiltrados.length)} de {ingresosFiltrados.length} ingresos
            </p>
          )}
        </div>
      )}

      {/* Modal editar/crear */}
      {modal && (
        <IngresoModal
          ingreso={modal.ingreso}
          miembros={esFamiliar ? miembros : []}
          miembroDefault={miMiembro}
          onSave={modal.mode === 'crear'
            ? (data) => agregarIngreso(data)
            : (data) => actualizarIngreso(modal.ingreso.id, data)
          }
          onClose={() => setModal(null)}
        />
      )}

      {/* Panel detalle ingreso */}
      <IngresoDetalleModal
        ingreso={detalle}
        onClose={() => setDetalle(null)}
        onEdit={(i) => { setDetalle(null); setModal({ mode: 'editar', ingreso: i }) }}
        onDelete={(id) => { setDetalle(null); handleEliminar(id) }}
        esFamiliar={esFamiliar}
        formatARS={formatARS}
        formatUSD={formatUSD}
        cotizacionMEP={cotizacionMEP}
      />
    </div>
  )
}
