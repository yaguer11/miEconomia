import { useState } from 'react'
import { X, Save, Plus, ChevronLeft } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'
import { useCategorias } from '../contexts/CategoriasContext'

const hoy = new Date().toISOString().split('T')[0]

function CurrencyToggle({ value, onChange, formatPreview, monto }) {
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button type="button" id="gasto-moneda-ars" onClick={() => onChange('ARS')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            value === 'ARS'
              ? 'border-sky-500 bg-sky-500/20 text-sky-300'
              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
          }`}>
          🇦🇷 ARS
        </button>
        <button type="button" id="gasto-moneda-usd" onClick={() => onChange('USD')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            value === 'USD'
              ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
          }`}>
          🇺🇸 USD
        </button>
      </div>
      {value === 'USD' && Number(monto) > 0 && formatPreview && (
        <p className="text-xs text-slate-400 pl-1">
          ≈ {formatPreview(monto)} ARS <span className="text-slate-500">(al dólar MEP)</span>
        </p>
      )}
    </div>
  )
}

// ── Selector de categoría en dos pasos ───────────────────────────
function CategoriaSelector({ categorias, categoriaId, subcategoriaId, onChange, loading }) {
  const [paso, setPaso] = useState(categoriaId ? 2 : 1)
  const [nuevaSub, setNuevaSub] = useState('')

  const catActual = categorias.find(c => c.id === categoriaId)

  const seleccionarCategoria = (cat) => {
    onChange({ categoriaId: cat.id, subcategoriaId: null })
    setPaso(2)
  }

  const seleccionarSubcategoria = (subId) => {
    onChange({ categoriaId, subcategoriaId: subId })
  }

  const volver = () => {
    setPaso(1)
    onChange({ categoriaId: null, subcategoriaId: null })
  }

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  // ── PASO 1: elegir categoría ──
  if (paso === 1 || !catActual) {
    return (
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">Categoría</label>
        <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto pr-1">
          {categorias.map(cat => (
            <button
              key={cat.id}
              type="button"
              id={`cat-nuevo-${cat.id}`}
              onClick={() => seleccionarCategoria(cat)}
              className="flex flex-col items-center gap-1.5 p-2.5 rounded-xl transition-all text-center border-2
                bg-slate-800/40 border-slate-700/30 text-slate-300 hover:text-white hover:border-slate-600 hover:scale-105"
            >
              <span className="text-2xl">{cat.emoji}</span>
              <span className="text-xs leading-tight">{cat.nombre}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // ── PASO 2: elegir subcategoría ──
  const subs = catActual.subcategorias || []

  return (
    <div>
      {/* Header con botón volver */}
      <div className="flex items-center gap-2 mb-2">
        <button type="button" onClick={volver}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
          <ChevronLeft size={16} />
        </button>
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xl">{catActual.emoji}</span>
          <span className="text-sm font-medium text-white">{catActual.nombre}</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium text-white"
            style={{ background: catActual.color + '40', border: `1px solid ${catActual.color}60` }}>
            seleccionada ✓
          </span>
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-300 mb-2">
        Subcategoría <span className="text-slate-500">(opcional)</span>
      </label>

      <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto pr-1">
        {/* Sin subcategoría */}
        <button type="button" id="subcat-ninguna"
          onClick={() => seleccionarSubcategoria(null)}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
            subcategoriaId === null
              ? 'border-slate-500 bg-slate-700 text-white'
              : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white hover:border-slate-600'
          }`}>
          Sin subcategoría
        </button>

        {subs.map(sub => (
          <button key={sub.id} type="button" id={`subcat-${sub.id}`}
            onClick={() => seleccionarSubcategoria(sub.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
              subcategoriaId === sub.id
                ? 'text-white'
                : 'border-slate-700/50 bg-slate-800/30 text-slate-400 hover:text-white hover:border-slate-600'
            }`}
            style={subcategoriaId === sub.id
              ? { background: catActual.color + '30', borderColor: catActual.color, color: '#fff' }
              : {}}
          >
            {sub.nombre}
          </button>
        ))}
      </div>

      {/* Info: la subcategoría se puede gestionar en Categorías */}
      <p className="text-slate-600 text-xs mt-2">
        Gestioná subcategorías desde la sección Categorías →
      </p>
    </div>
  )
}

// ── Modal principal ───────────────────────────────────────────────
export default function GastoModal({ gasto, miembros = [], miembroDefault = null, onSave, onClose }) {
  const { tasaVentaMEP, formatARS } = useCurrency()
  const { categorias, loading: loadingCats } = useCategorias()

  const parseMonto = (val) => {
    if (!val) return 0
    return Number(val.toString().replace(/\./g, '').replace(/,/g, '.'))
  }

  const [form, setForm] = useState({
    monto: gasto?.monto ? Number(gasto.monto).toLocaleString('es-AR') : '',
    moneda: gasto?.moneda || 'ARS',
    categoria_id: gasto?.categoria_id || null,
    subcategoria_id: gasto?.subcategoria_id || null,
    descripcion: gasto?.descripcion || '',
    fecha: gasto?.fecha || hoy,
    miembro_id: gasto ? gasto.miembro_id : (miembroDefault?.id ?? null),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esFamiliar = miembros.length > 0

  const previewARS = (montoInput) => {
    if (!tasaVentaMEP) return '—'
    return formatARS(parseMonto(montoInput) * tasaVentaMEP)
  }

  const handleCategoriaChange = ({ categoriaId, subcategoriaId }) => {
    setForm(f => ({ ...f, categoria_id: categoriaId, subcategoria_id: subcategoriaId }))
  }

  const handleMontoChange = (e) => {
    let val = e.target.value.replace(/[^0-9,]/g, '')
    const parts = val.split(',')
    if (parts.length > 2) val = parts[0] + ',' + parts.slice(1).join('')
    const cleanInt = parts[0].replace(/\./g, '')
    if (cleanInt) parts[0] = Number(cleanInt).toLocaleString('es-AR')
    setForm({ ...form, monto: parts.join(',') })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const numericMonto = parseMonto(form.monto)
    if (!numericMonto || numericMonto <= 0) { setError('El monto debe ser mayor a 0'); return }
    setLoading(true)
    try {
      const payload = {
        monto: numericMonto,
        moneda: form.moneda,
        categoria_id: form.categoria_id || null,
        subcategoria_id: form.subcategoria_id || null,
        descripcion: form.descripcion,
        fecha: form.fecha,
      }
      if (esFamiliar) payload.miembro_id = form.miembro_id
      await onSave(payload)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{gasto ? 'Editar gasto' : 'Nuevo gasto'}</h2>
          <button id="close-gasto-modal" onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Monto + Moneda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Monto</label>
            <input id="gasto-monto" type="text" inputMode="decimal"
              value={form.monto} onChange={handleMontoChange}
              placeholder="0" required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all mb-2"
            />
            <CurrencyToggle value={form.moneda} onChange={(m) => setForm({ ...form, moneda: m })}
              formatPreview={previewARS} monto={parseMonto(form.monto)} />
          </div>

          {/* Categoría + Subcategoría */}
          <div className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/30">
            <CategoriaSelector
              categorias={categorias}
              categoriaId={form.categoria_id}
              subcategoriaId={form.subcategoria_id}
              onChange={handleCategoriaChange}
              loading={loadingCats}
            />
          </div>

          {/* Selector de miembro (solo en modo familiar) */}
          {esFamiliar && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">¿De quién es este gasto?</label>
              <div className="flex flex-wrap gap-2">
                <button type="button" id="miembro-gasto-familia"
                  onClick={() => setForm({ ...form, miembro_id: null })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                    form.miembro_id === null
                      ? 'border-teal-500 bg-teal-500/20 text-white scale-105'
                      : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}>
                  <span className="text-base">🏠</span>
                  <span>Familia</span>
                </button>
                {miembros.map(m => (
                  <button key={m.id} type="button" id={`miembro-gasto-${m.id}`}
                    onClick={() => setForm({ ...form, miembro_id: m.id })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      form.miembro_id === m.id
                        ? 'border-indigo-500 bg-indigo-500/20 text-white scale-105'
                        : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}>
                    <span className="text-base">{m.avatar_emoji}</span>
                    <span>{m.nombre_display}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Descripción <span className="text-slate-500">(opcional)</span>
            </label>
            <input id="gasto-descripcion" type="text" value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Almuerzo con compañeros" maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
            <input id="gasto-fecha" type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })} required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button id="save-gasto" type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl gradient-purple text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
