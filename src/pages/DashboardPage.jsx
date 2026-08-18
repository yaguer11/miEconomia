import { useState, useEffect } from 'react'
import { TrendingDown, PiggyBank, TrendingUp, Wallet, RefreshCw, ChevronLeft } from 'lucide-react'
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { useCurrency, VIEW_MODES } from '../contexts/CurrencyContext'
import { useGastos } from '../hooks/useGastos'
import { useAhorros } from '../hooks/useAhorros'
import { useIngresos } from '../hooks/useIngresos'
import { useCategorias } from '../contexts/CategoriasContext'
import { MESES } from '../lib/constants'

function StatCard({ icon: Icon, label, value, color, subtext }) {
  return (
    <div className="glass rounded-2xl p-5 card-hover">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '20', border: `1px solid ${color}30` }}>
          <Icon size={18} style={{ color }} />
        </div>
      </div>
      <p className="text-slate-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-2xl">{value}</p>
      {subtext && <p className="text-slate-500 text-xs mt-1">{subtext}</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, formatInMode }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-xl px-3 py-2 text-sm">
        <p className="text-white font-medium">{payload[0].name}</p>
        <p style={{ color: payload[0].fill || payload[0].stroke }}>{formatInMode(payload[0].value)}</p>
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const now = new Date()
  const mes = now.getMonth() + 1
  const anio = now.getFullYear()
  const { user } = useAuth()
  const { esFamiliar, perfil, familia } = useProfile()
  const {
    viewMode, setViewMode,
    sumInMode, formatInMode, formatARS, formatUSD,
    cotizacionMEP, tiempoActualizacion, loading: loadingDolar, error: errorDolar, refetch: refetchDolar,
  } = useCurrency()

  const { gastos } = useGastos(mes, anio)
  const { ingresos } = useIngresos(mes, anio)
  const { totalAhorradoARS, totalAhorradoUSD, objetivos } = useAhorros()
  const { categorias } = useCategorias()
  const [historial, setHistorial] = useState([])
  const [drillCatId, setDrillCatId] = useState(null) // ID categoría en drill-down

  // Totales según viewMode
  const totalGastos = sumInMode(gastos.map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' })))
  const totalIngresos = sumInMode(ingresos.map(i => ({ monto: i.monto, moneda: i.moneda || 'ARS' })))

  const totalAhorrado = (() => {
    if (viewMode === 'unified_ARS' && cotizacionMEP) return totalAhorradoARS + totalAhorradoUSD * cotizacionMEP.venta
    if (viewMode === 'unified_USD' && cotizacionMEP) return totalAhorradoUSD + totalAhorradoARS / cotizacionMEP.venta
    if (viewMode === 'ARS') return totalAhorradoARS
    if (viewMode === 'USD') return totalAhorradoUSD
    return totalAhorradoARS + totalAhorradoUSD * (cotizacionMEP?.venta || 0)
  })()

  // Datos para el pie chart de gastos por categoría (nuevo sistema + legacy)
  const dataCategoria = categorias
    .filter(cat => gastos.some(g => g.categoria_id === cat.id))
    .map(cat => {
      const items = gastos.filter(g => g.categoria_id === cat.id)
      const value = sumInMode(items.map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' })))
      return { id: cat.id, name: cat.nombre, value, color: cat.color, emoji: cat.emoji, subcategorias: cat.subcategorias }
    })
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value)

  // Drill-down: subcategorías de la categoría seleccionada
  const drillCat = drillCatId ? dataCategoria.find(c => c.id === drillCatId) : null
  const dataSubcat = drillCat
    ? (drillCat.subcategorias || []).map(sub => {
        const items = gastos.filter(g => g.subcategoria_id === sub.id)
        const value = sumInMode(items.map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' })))
        return { name: sub.nombre, value, color: drillCat.color }
      }).filter(d => d.value > 0).sort((a, b) => b.value - a.value)
    : []

  // Gastos de la cat seleccionada sin subcategoría asignada
  const sinSubcat = drillCat
    ? sumInMode(gastos
        .filter(g => g.categoria_id === drillCat.id && !g.subcategoria_id)
        .map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' })))
    : 0

  // Historial últimos 6 meses: ingresos vs gastos
  useEffect(() => {
    if (!user || !supabase) return
    const fetchHistorial = async () => {
      const results = []
      for (let i = 5; i >= 0; i--) {
        const d = new Date(anio, mes - 1 - i, 1)
        const m = d.getMonth() + 1
        const y = d.getFullYear()
        const startDate = `${y}-${String(m).padStart(2, '0')}-01`
        const endDate = new Date(y, m, 0).toISOString().split('T')[0]

        const queryGastos = supabase.from('gastos').select('monto, moneda').gte('fecha', startDate).lte('fecha', endDate)
        const queryIngresos = supabase.from('ingresos').select('monto, moneda').gte('fecha', startDate).lte('fecha', endDate)

        if (esFamiliar && perfil?.familia_id) {
          queryGastos.eq('familia_id', perfil.familia_id)
          queryIngresos.eq('familia_id', perfil.familia_id)
        } else {
          queryGastos.eq('user_id', user.id).is('familia_id', null)
          queryIngresos.eq('user_id', user.id).is('familia_id', null)
        }

        const [{ data: gastoData }, { data: ingresoData }] = await Promise.all([queryGastos, queryIngresos])

        results.push({
          mes: MESES[m - 1].slice(0, 3),
          _gastos: gastoData || [],
          _ingresos: ingresoData || [],
        })
      }
      setHistorial(results)
    }
    fetchHistorial()
  }, [user, mes, anio, esFamiliar, perfil])

  // Historial con conversión según viewMode actual
  const historialConvertido = historial.map(h => ({
    mes: h.mes,
    gastos: sumInMode((h._gastos || []).map(g => ({ monto: g.monto, moneda: g.moneda || 'ARS' }))),
    ingresos: sumInMode((h._ingresos || []).map(i => ({ monto: i.monto, moneda: i.moneda || 'ARS' }))),
  }))

  const balance = totalIngresos - totalGastos
  const nombre = perfil?.nombre || user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'

  const yTickFormatter = (v) => {
    if (viewMode === 'USD' || viewMode === 'unified_USD') return `$${v.toFixed(0)}`
    return `$${(v / 1000).toFixed(0)}k`
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Greeting */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">
          Hola, <span className="gradient-text">{nombre}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1">
          Resumen de {MESES[mes - 1]} {anio} {esFamiliar && familia ? `• Familia ${familia.nombre}` : ''}
        </p>
      </div>

      {/* Panel de tipo de cambio + selector de modo */}
      <div className="glass rounded-2xl p-4 mb-6">
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-slate-300 text-sm font-medium">💹 Dólar MEP</span>
            {loadingDolar && <span className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />}
            {errorDolar && <span className="text-red-400 text-xs">Error al obtener cotización</span>}
            {cotizacionMEP && !loadingDolar && (
              <span className="text-emerald-400 font-bold text-sm">
                {formatARS(cotizacionMEP.venta)}
              </span>
            )}
            {tiempoActualizacion !== null && (
              <span className="text-slate-500 text-xs">
                (hace {tiempoActualizacion === 0 ? 'menos de 1' : tiempoActualizacion} min)
              </span>
            )}
          </div>
          <button
            id="refetch-dolar"
            onClick={refetchDolar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            title="Actualizar cotización"
          >
            <RefreshCw size={14} />
          </button>
        </div>

        {/* Selector de modo de vista */}
        <div className="flex gap-2">
          {VIEW_MODES.map(mode => (
            <button
              key={mode.id}
              id={`dashboard-view-mode-${mode.id}`}
              onClick={() => setViewMode(mode.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${
                viewMode === mode.id
                  ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-300'
                  : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white'
              }`}
            >
              {mode.emoji} {mode.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={TrendingUp}
          label="Ingresos del mes"
          value={formatInMode(totalIngresos)}
          color="#10b981"
          subtext={`${ingresos.length} movimiento${ingresos.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          icon={TrendingDown}
          label="Gastos del mes"
          value={formatInMode(totalGastos)}
          color="#ef4444"
          subtext={`${gastos.length} movimiento${gastos.length !== 1 ? 's' : ''}`}
        />
        <StatCard
          icon={Wallet}
          label="Balance del mes"
          value={formatInMode(Math.abs(balance))}
          color={balance >= 0 ? '#10b981' : '#ef4444'}
          subtext={balance >= 0 ? '✅ Superávit' : '⚠️ Déficit'}
        />
        <StatCard
          icon={PiggyBank}
          label="Total ahorrado"
          value={formatInMode(totalAhorrado)}
          color="#6366f1"
          subtext={`${objetivos.length} objetivo${objetivos.length !== 1 ? 's' : ''}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Pie chart gastos por categoría — con drill-down a subcategorías */}
        <div className="glass rounded-2xl p-5">
          {/* Header con navegación drill-down */}
          <div className="flex items-center gap-2 mb-4">
            {drillCat && (
              <button onClick={() => setDrillCatId(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <ChevronLeft size={16} />
              </button>
            )}
            <h2 className="text-white font-semibold text-sm flex-1">
              {drillCat
                ? <span className="flex items-center gap-1.5">
                    <span>{drillCat.emoji}</span>
                    <span>{drillCat.name}</span>
                    <span className="text-slate-500 font-normal">— subcategorías</span>
                  </span>
                : 'Gastos por categoría'}
            </h2>
            {!drillCat && dataCategoria.length > 0 && (
              <span className="text-slate-500 text-xs">Hacé click para ver subcategorías</span>
            )}
          </div>

          {dataCategoria.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
              Sin gastos este mes
            </div>
          ) : drillCat ? (
            /* ── DRILL-DOWN: subcategorías ── */
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={[
                      ...dataSubcat,
                      ...(sinSubcat > 0 ? [{ name: 'Sin subcategoría', value: sinSubcat, color: '#475569' }] : []),
                    ]}
                    cx="50%" cy="50%"
                    innerRadius={45} outerRadius={72}
                    paddingAngle={3} dataKey="value"
                  >
                    {[...dataSubcat, ...(sinSubcat > 0 ? [{ name: 'Sin subcategoría', value: sinSubcat, color: '#475569' }] : [])].map((entry, i) => (
                      <Cell key={i} fill={entry.color + (i === dataSubcat.length ? 'aa' : `${Math.max(50, 255 - i * 20).toString(16)}`)} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatInMode={formatInMode} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2 max-h-36 overflow-y-auto pr-1">
                {dataSubcat.map((sub, i) => (
                  <div key={sub.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: drillCat.color, opacity: 1 - i * 0.08 }} />
                      <span className="text-slate-400 text-xs">{sub.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500 text-xs">
                        {drillCat.value > 0 ? `${((sub.value / drillCat.value) * 100).toFixed(0)}%` : '—'}
                      </span>
                      <span className="text-white text-xs font-medium">{formatInMode(sub.value)}</span>
                    </div>
                  </div>
                ))}
                {sinSubcat > 0 && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                      <span className="text-slate-500 text-xs italic">Sin subcategoría</span>
                    </div>
                    <span className="text-slate-500 text-xs">{formatInMode(sinSubcat)}</span>
                  </div>
                )}
                {dataSubcat.length === 0 && sinSubcat === 0 && (
                  <p className="text-slate-600 text-xs text-center py-4">No hay detalle de subcategorías</p>
                )}
              </div>
            </>
          ) : (
            /* ── VISTA NORMAL: categorías ── */
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={dataCategoria}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={75}
                    paddingAngle={3} dataKey="value"
                    onClick={(data) => data?.id && setDrillCatId(data.id)}
                    cursor="pointer"
                  >
                    {dataCategoria.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip formatInMode={formatInMode} />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 mt-2">
                {dataCategoria.slice(0, 5).map((cat) => (
                  <button key={cat.id || cat.name}
                    onClick={() => cat.id && setDrillCatId(cat.id)}
                    className="w-full flex items-center justify-between hover:bg-white/3 rounded-lg px-1 py-0.5 transition-colors group">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                      <span className="text-slate-400 text-xs group-hover:text-slate-300">{cat.emoji} {cat.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-xs font-medium">{formatInMode(cat.value)}</span>
                      {cat.id && <span className="text-slate-600 text-xs opacity-0 group-hover:opacity-100 transition-opacity">›</span>}
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Bar chart ingresos vs gastos últimos 6 meses */}
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-1">Ingresos vs Gastos</h2>
          <p className="text-slate-500 text-xs mb-4">Últimos 6 meses</p>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={historialConvertido} barSize={14} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="mes" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} />
              <Tooltip content={<CustomTooltip formatInMode={formatInMode} />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="url(#barGradientRed)" radius={[4, 4, 0, 0]} />
              <defs>
                <linearGradient id="barGradientRed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#dc2626" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
          {/* Leyenda manual */}
          <div className="flex items-center gap-4 mt-2 justify-center">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-400 text-xs">Ingresos</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-slate-400 text-xs">Gastos</span>
            </div>
          </div>
        </div>
      </div>

      {/* Objetivos de ahorro resumen */}
      {objetivos.length > 0 && (
        <div className="glass rounded-2xl p-5">
          <h2 className="text-white font-semibold mb-4">Progreso de objetivos</h2>
          <div className="space-y-4">
            {objetivos.map(obj => {
              // Calcular progreso en moneda de la meta
              let totalEnMeta = null
              if (cotizacionMEP) {
                if (obj.moneda_meta === 'USD') {
                  totalEnMeta = obj.totalAhorradoUSD + obj.totalAhorradoARS / cotizacionMEP.venta
                } else {
                  totalEnMeta = obj.totalAhorradoARS + obj.totalAhorradoUSD * cotizacionMEP.venta
                }
              }
              const pct = obj.meta > 0 && totalEnMeta !== null ? Math.min(100, (totalEnMeta / obj.meta) * 100) : null
              const formatMeta = obj.moneda_meta === 'USD' ? formatUSD : formatARS
              const formatTotalMeta = obj.moneda_meta === 'USD' ? formatUSD : formatARS

              return (
                <div key={obj.nombre}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span>{obj.emoji || '🎯'}</span>
                      <span className="text-sm text-white font-medium">{obj.nombre}</span>
                      {obj.totalAhorradoARS > 0 && obj.totalAhorradoUSD > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400">mixto</span>
                      )}
                    </div>
                    <div className="text-right">
                      {totalEnMeta !== null ? (
                        <span className="text-emerald-400 text-sm font-bold">{formatTotalMeta(totalEnMeta)}</span>
                      ) : (
                        <span className="text-emerald-400 text-sm font-bold">{formatARS(obj.totalAhorradoARS)}</span>
                      )}
                      {obj.meta > 0 && <span className="text-slate-500 text-xs"> / {formatMeta(obj.meta)}</span>}
                    </div>
                  </div>
                  {pct !== null && (
                    <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #10b981aa, #10b981)' }}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
