import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Filter, Search, X } from 'lucide-react'
import { useGastos } from '../hooks/useGastos'
import { useProfile } from '../contexts/ProfileContext'
import { useCurrency, VIEW_MODES } from '../contexts/CurrencyContext'
import { useCategorias } from '../contexts/CategoriasContext'
import GastoModal from '../components/GastoModal'
import { formatDate, MESES, getCategoriaById } from '../lib/constants'

export default function GastosPage() {
  const now = new Date()
  const [mes, setMes] = useState(now.getMonth() + 1)
  const [anio, setAnio] = useState(now.getFullYear())
  const [filtroCategoriaId, setFiltroCategoriaId] = useState('todas')
  const [busqueda, setBusqueda] = useState('')
  const [visibles, setVisibles] = useState(10)
  const [modal, setModal] = useState(null)
  const [eliminando, setEliminando] = useState(null)

  const { gastos, loading, agregarGasto, actualizarGasto, eliminarGasto } = useGastos(mes, anio)
  const { esFamiliar, miembros, miMiembro } = useProfile()
  const { viewMode, setViewMode, sumInMode, formatInMode, formatARS, formatUSD, cotizacionMEP, tiempoActualizacion } = useCurrency()
  const { categorias } = useCategorias()

  const prevMes = () => {
    if (mes === 1) { setMes(12); setAnio(a => a - 1) }
    else setMes(m => m - 1)
  }

  const nextMes = () => {
    if (mes === 12) { setMes(1); setAnio(a => a + 1) }
    else setMes(m => m + 1)
  }

  // Filtro: por categoria_id (nuevo) o sin categoría ('sin_cat') + búsqueda
  const gastosFiltrados = useMemo(() => {
    let lista = gastos
    // Ordenar del más reciente al más antiguo (ya viene del hook, pero garantizamos)
    lista = [...lista].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
    // Filtro por categoría
    if (filtroCategoriaId !== 'todas') {
      lista = filtroCategoriaId === 'sin_cat'
        ? lista.filter(g => !g.categoria_id)
        : lista.filter(g => g.categoria_id === filtroCategoriaId)
    }
    // Filtro por búsqueda
    if (busqueda.trim()) {
      const q = busqueda.toLowerCase().trim()
      lista = lista.filter(g => {
        const desc = (g.descripcion || '').toLowerCase()
        const catNombre = (g.categoria_obj?.nombre || g.categoria || '').toLowerCase()
        const subcatNombre = (g.subcategoria_obj?.nombre || '').toLowerCase()
        return desc.includes(q) || catNombre.includes(q) || subcatNombre.includes(q)
      })
    }
    return lista
  }, [gastos, filtroCategoriaId, busqueda])

  // Reset visibles al cambiar filtros
  const handleSetFiltroCategoria = (id) => {
    setFiltroCategoriaId(id)
    setVisibles(10)
  }
  const handleBusqueda = (val) => {
    setBusqueda(val)
    setVisibles(10)
  }

  const gastosVisibles = gastosFiltrados.slice(0, visibles)
  const hayMas = gastosFiltrados.length > visibles

  // Las métricas siempre reflejan el total real del mes, sin importar búsqueda o filtro de categoría
  const totalEnModo = sumInMode(gastos.map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' })))

  const handleEliminar = async (id) => {
    if (eliminando === id) {
      await eliminarGasto(id)
      setEliminando(null)
    } else {
      setEliminando(id)
    }
  }

  // Totales por categoría (para el filtro)
  const totalesCat = gastos.reduce((acc, g) => {
    const key = g.categoria_id || 'sin_cat'
    const val = sumInMode([{ monto: g.monto, moneda: g.moneda || 'ARS' }])
    acc[key] = (acc[key] || 0) + val
    return acc
  }, {})

  const topCategoriaEntry = Object.entries(totalesCat)
    .filter(([k]) => k !== 'sin_cat')
    .sort((a, b) => b[1] - a[1])[0]

  const topCategoria = topCategoriaEntry
    ? categorias.find(c => c.id === topCategoriaEntry[0])
    : null

  // Categorías presentes en los gastos de este mes
  const categoriasPresentes = categorias.filter(cat =>
    gastos.some(g => g.categoria_id === cat.id)
  )
  const haySinCategoria = gastos.some(g => !g.categoria_id)

  // Resolución de categoría por gasto (nuevo sistema o legacy)
  const getCatDisplay = (gasto) => {
    if (gasto.categoria) return gasto.categoria   // objeto del join
    return null
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Gastos</h1>
          <p className="text-slate-400 text-sm">Control de tus gastos diarios</p>
        </div>
        <button id="nuevo-gasto-btn" onClick={() => setModal({ mode: 'crear' })}
          className="flex-shrink-0 flex items-center gap-2 px-3 py-2 md:px-5 md:py-2.5 rounded-xl gradient-purple text-white font-semibold text-sm hover:opacity-90 shadow-lg shadow-indigo-500/20 md:shadow-indigo-500/30 transition-all">
          <Plus size={18} className="md:w-4 md:h-4" />
          <span className="hidden sm:inline">Nuevo gasto</span>
        </button>
      </div>

      {/* Navegador de mes + ViewMode selector */}
      <div className="glass rounded-2xl p-4 sm:p-5 mb-6 space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <button id="prev-mes" onClick={prevMes}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronLeft size={20} />
          </button>
          <div className="text-center">
            <p className="text-white font-bold text-lg">{MESES[mes - 1]} {anio}</p>
            <p className="text-slate-400 text-sm hidden sm:block">{gastos.length} gastos registrados</p>
          </div>
          <button id="next-mes" onClick={nextMes}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex gap-2">
          {VIEW_MODES.map(mode => (
            <button key={mode.id} id={`view-mode-gastos-${mode.id}`}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center ${
                viewMode === mode.id
                  ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white'
              }`}>
              <span className="md:hidden text-base leading-none">{mode.emoji}</span>
              <span className="hidden md:inline">{mode.emoji} {mode.label}</span>
            </button>
          ))}
        </div>
        
        {/* Descripción del modo activo en móvil */}
        <p className="md:hidden text-center text-xs text-slate-400 mt-3">
          Vista: <span className="text-white font-medium">{VIEW_MODES.find(m => m.id === viewMode)?.label}</span>
        </p>

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
          <p className="text-red-400 font-bold text-xl truncate" title={formatInMode(totalEnModo)}>{formatInMode(totalEnModo)}</p>
        </div>
        <div className="glass rounded-2xl p-4 overflow-hidden">
          <p className="text-slate-400 text-xs mb-1 truncate">Promedio diario</p>
          <p className="text-white font-bold text-xl truncate" title={formatInMode(gastos.length > 0 ? totalEnModo / new Date(anio, mes, 0).getDate() : 0)}>
            {formatInMode(gastos.length > 0 ? totalEnModo / new Date(anio, mes, 0).getDate() : 0)}
          </p>
        </div>
        {topCategoria && (
          <div className="hidden md:block glass rounded-2xl p-4 col-span-2 md:col-span-1">
            <p className="text-slate-400 text-xs mb-1">Mayor categoría</p>
            <div className="flex items-center gap-2">
              <span className="text-lg">{topCategoria.emoji}</span>
              <div>
                <p className="text-white font-bold text-sm leading-none">{topCategoria.nombre}</p>
                <p className="text-slate-400 text-xs">{formatInMode(topCategoriaEntry[1])}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Buscador */}
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          id="buscador-gastos"
          type="text"
          placeholder="Buscar por descripción o categoría…"
          value={busqueda}
          onChange={e => handleBusqueda(e.target.value)}
          className="w-full bg-slate-800/60 border border-slate-700/50 rounded-xl pl-9 pr-9 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:bg-slate-800/80 transition-all"
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
        <button id="filtro-todas" onClick={() => handleSetFiltroCategoria('todas')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all ${
            filtroCategoriaId === 'todas' ? 'gradient-purple text-white' : 'glass-light text-slate-400 hover:text-white'
          }`}>
          Todas
        </button>

        {categoriasPresentes.map(cat => (
          <button key={cat.id} id={`filtro-${cat.id}`}
            onClick={() => handleSetFiltroCategoria(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all flex items-center gap-1 ${
              filtroCategoriaId === cat.id ? 'text-white border border-current' : 'glass-light text-slate-400 hover:text-white'
            }`}
            style={filtroCategoriaId === cat.id ? { borderColor: cat.color, color: cat.color, background: cat.color + '20' } : {}}>
            {cat.emoji} {cat.nombre}
          </button>
        ))}

        {haySinCategoria && (
          <button id="filtro-sin-cat" onClick={() => handleSetFiltroCategoria('sin_cat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium flex-shrink-0 transition-all flex items-center gap-1 ${
              filtroCategoriaId === 'sin_cat' ? 'bg-slate-700 text-slate-200 border border-slate-500' : 'glass-light text-slate-500 hover:text-white'
            }`}>
            📦 Sin categoría
          </button>
        )}
      </div>

      {/* Lista de gastos */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gastosFiltrados.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">{busqueda ? '🔍' : '💸'}</p>
          <p className="text-slate-300 font-medium">
            {busqueda ? `Sin resultados para "${busqueda}"` : 'No hay gastos registrados'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {busqueda
              ? 'Probá con otra descripción o categoría'
              : filtroCategoriaId !== 'todas' ? 'Probá con otra categoría' : 'Agregá tu primer gasto del mes'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {gastosVisibles.map((gasto) => {
            const cat = gasto.categoria_obj  // del join (puede ser null para históricos)
            // Fallback para gastos históricos con campo texto
            const legacyCat = !cat && gasto.categoria
              ? getCategoriaById(gasto.categoria)
              : null
            const displayCat = cat || legacyCat

            return (
              <div key={gasto.id}
                className="glass rounded-2xl p-3 md:p-4 card-hover flex items-center gap-3 md:gap-4 group">
                {/* Icono categoría */}
                <div className="w-9 h-9 md:w-11 md:h-11 rounded-xl flex items-center justify-center text-lg md:text-xl flex-shrink-0"
                  style={displayCat
                    ? { background: displayCat.color + '20', border: `1px solid ${displayCat.color}40` }
                    : { background: '#64748b20', border: '1px solid #64748b40' }
                  }>
                  {displayCat ? displayCat.emoji : '📦'}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {gasto.descripcion || displayCat?.nombre || 'Sin categoría'}
                  </p>
                  <div className="hidden md:flex flex-wrap items-center gap-2 mt-0.5">
                    {/* Badge categoría */}
                    {displayCat && (
                      <span className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap"
                        style={{ background: displayCat.color + '20', color: displayCat.color }}>
                        {displayCat.nombre || displayCat.label}
                      </span>
                    )}
                    {/* Badge subcategoría */}
                    {gasto.subcategoria_obj && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 whitespace-nowrap">
                        {gasto.subcategoria_obj.nombre}
                      </span>
                    )}
                    {/* Badge miembro */}
                    {esFamiliar && gasto.miembro && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1 max-w-[160px]">
                        <span className="flex-shrink-0">{gasto.miembro.avatar_emoji}</span>
                        <span className="truncate">{gasto.miembro.nombre_display}</span>
                      </span>
                    )}
                    <span className="text-slate-500 text-xs whitespace-nowrap">{formatDate(gasto.fecha)}</span>
                  </div>
                </div>

                {/* Monto + moneda badge + acciones */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className="text-red-400 font-bold text-sm">
                      {gasto.moneda === 'USD' ? formatUSD(gasto.monto) : formatARS(gasto.monto)}
                    </p>
                    {(viewMode === 'unified_ARS' || viewMode === 'unified_USD') && gasto.moneda === 'USD' && cotizacionMEP && (
                      <p className="text-slate-500 text-xs">≈ {formatARS(Number(gasto.monto) * cotizacionMEP.venta)}</p>
                    )}
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                    (gasto.moneda || 'ARS') === 'USD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
                  }`}>
                    {gasto.moneda || 'ARS'}
                  </span>
                  <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button id={`edit-gasto-${gasto.id}`} onClick={() => setModal({ mode: 'editar', gasto })}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
                      <Pencil size={14} />
                    </button>
                    <button id={`delete-gasto-${gasto.id}`} onClick={() => handleEliminar(gasto.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        eliminando === gasto.id
                          ? 'text-red-400 bg-red-500/10 animate-pulse'
                          : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
                      }`}
                      title={eliminando === gasto.id ? 'Hacé clic de nuevo para confirmar' : 'Eliminar'}>
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
              id="cargar-mas-gastos"
              onClick={() => setVisibles(v => v + 10)}
              className="w-full mt-2 py-3 rounded-2xl glass border border-slate-700/40 text-slate-400 hover:text-white hover:border-indigo-500/40 hover:bg-indigo-500/5 text-sm font-medium transition-all flex items-center justify-center gap-2"
            >
              <span>Cargar más</span>
              <span className="text-xs text-slate-500">({gastosFiltrados.length - visibles} restantes)</span>
            </button>
          )}

          {/* Indicador total */}
          {gastosFiltrados.length > 0 && (
            <p className="text-center text-xs text-slate-600 pt-1">
              Mostrando {Math.min(visibles, gastosFiltrados.length)} de {gastosFiltrados.length} gastos
            </p>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <GastoModal
          gasto={modal.gasto}
          miembros={esFamiliar ? miembros : []}
          miembroDefault={miMiembro}
          onSave={modal.mode === 'crear'
            ? (data) => agregarGasto(data)
            : (data) => actualizarGasto(modal.gasto.id, data)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}
