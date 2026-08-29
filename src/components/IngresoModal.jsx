import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { CATEGORIAS_INGRESOS } from '../lib/constants'
import { useCurrency } from '../contexts/CurrencyContext'

const hoy = new Date().toISOString().split('T')[0]

function CurrencyToggle({ value, onChange, formatPreview, monto, accentColor = 'emerald' }) {
  const active = accentColor === 'emerald'
    ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300'
    : 'border-indigo-500 bg-indigo-500/20 text-indigo-300'

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          id="ingreso-moneda-ars"
          onClick={() => onChange('ARS')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            value === 'ARS'
              ? 'border-sky-500 bg-sky-500/20 text-sky-300'
              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          🇦🇷 ARS
        </button>
        <button
          type="button"
          id="ingreso-moneda-usd"
          onClick={() => onChange('USD')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            value === 'USD' ? active : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          🇺🇸 USD
        </button>
      </div>
      {value === 'USD' && monto > 0 && formatPreview && (
        <p className="text-xs text-slate-400 pl-1">
          ≈ {formatPreview(monto)} ARS <span className="text-slate-500">(al dólar MEP)</span>
        </p>
      )}
    </div>
  )
}

export default function IngresoModal({ ingreso, miembros = [], miembroDefault = null, onSave, onClose }) {
  const { tasaVentaMEP, formatARS } = useCurrency()

  const parseMonto = (val) => {
    if (!val) return 0
    return Number(val.toString().replace(/\./g, '').replace(/,/g, '.'))
  }

  const [form, setForm] = useState({
    monto: ingreso?.monto ? Number(ingreso.monto).toLocaleString('es-AR') : '',
    moneda: ingreso?.moneda || 'ARS',
    categoria: ingreso?.categoria || 'salario',
    descripcion: ingreso?.descripcion || '',
    fecha: ingreso?.fecha || hoy,
    // Al editar: respetar el valor guardado aunque sea null (= Familia)
    // Al crear: usar el miembro por defecto del usuario actual
    miembro_id: ingreso ? ingreso.miembro_id : (miembroDefault?.id ?? null),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const esFamiliar = miembros.length > 0

  const previewARS = (montoInput) => {
    if (!tasaVentaMEP) return '—'
    return formatARS(parseMonto(montoInput) * tasaVentaMEP)
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
      const payload = { ...form, monto: numericMonto }
      if (!esFamiliar) delete payload.miembro_id
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
          <h2 className="text-lg font-bold text-white">{ingreso ? 'Editar ingreso' : 'Nuevo ingreso'}</h2>
          <button id="close-ingreso-modal" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Monto + Moneda */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Monto</label>
            <input id="ingreso-monto" type="text" inputMode="decimal"
              value={form.monto} onChange={handleMontoChange}
              placeholder="0" required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all mb-2"
            />
            <CurrencyToggle
              value={form.moneda}
              onChange={(m) => setForm({ ...form, moneda: m })}
              formatPreview={previewARS}
              monto={parseMonto(form.monto)}
              accentColor="emerald"
            />
          </div>

          {/* Selector de miembro (solo en modo familiar) */}
          {esFamiliar && (
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1.5">¿De quién es este ingreso?</label>
              <div className="flex flex-wrap gap-2">
                {miembros.map(m => (
                  <button
                    key={m.id} type="button" id={`miembro-ingreso-${m.id}`}
                    onClick={() => setForm({ ...form, miembro_id: m.id })}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all border-2 ${
                      form.miembro_id === m.id
                        ? 'border-emerald-500 bg-emerald-500/20 text-white scale-105'
                        : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
                    }`}
                  >
                    <span className="text-base">{m.avatar_emoji}</span>
                    <span>{m.nombre_display}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Categoría */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Categoría</label>
            <div className="grid grid-cols-5 gap-2">
              {CATEGORIAS_INGRESOS.map(cat => (
                <button key={cat.id} type="button" id={`incat-${cat.id}`}
                  onClick={() => setForm({ ...form, categoria: cat.id })} title={cat.label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl text-xs transition-all ${
                    form.categoria === cat.id ? 'border-2 scale-105' : 'bg-slate-800/40 border border-slate-700/30 text-slate-400 hover:text-white hover:border-slate-600'
                  }`}
                  style={form.categoria === cat.id ? { background: cat.color + '20', borderColor: cat.color } : {}}>
                  <span className="text-lg">{cat.emoji}</span>
                </button>
              ))}
            </div>
            <p className="text-slate-500 text-xs mt-1.5">{CATEGORIAS_INGRESOS.find(c => c.id === form.categoria)?.label}</p>
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción <span className="text-slate-500">(opcional)</span></label>
            <input id="ingreso-descripcion" type="text" value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Sueldo de agosto" maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
            <input id="ingreso-fecha" type="date" value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })} required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">Cancelar</button>
            <button id="save-ingreso" type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl gradient-green text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
