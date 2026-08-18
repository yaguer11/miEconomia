import { useState } from 'react'
import { X, Save } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

const hoy = new Date().toISOString().split('T')[0]
const EMOJIS_OBJETIVO = ['🏖️', '🚗', '🏠', '💻', '✈️', '🎓', '💍', '🏋️', '📱', '🎯', '🌟', '💰']

function CurrencyToggle({ value, onChange, idPrefix, label }) {
  return (
    <div>
      {label && <p className="text-xs text-slate-400 mb-1.5">{label}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          id={`${idPrefix}-ars`}
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
          id={`${idPrefix}-usd`}
          onClick={() => onChange('USD')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all border-2 ${
            value === 'USD'
              ? 'border-indigo-500 bg-indigo-500/20 text-indigo-300'
              : 'border-slate-700/50 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
          }`}
        >
          🇺🇸 USD
        </button>
      </div>
    </div>
  )
}

export default function AhorroModal({ ahorro, objetivosExistentes, onSave, onClose }) {
  const { tasaVentaMEP, formatARS, formatUSD } = useCurrency()

  const [form, setForm] = useState({
    monto: ahorro?.monto || '',
    moneda: ahorro?.moneda || 'ARS',
    objetivo: ahorro?.objetivo || '',
    meta: ahorro?.meta || '',
    moneda_meta: ahorro?.moneda_meta || 'ARS',
    descripcion: ahorro?.descripcion || '',
    fecha: ahorro?.fecha || hoy,
    emoji: ahorro?.emoji || '🎯',
  })
  const [nuevoObjetivo, setNuevoObjetivo] = useState(!ahorro && objetivosExistentes.length === 0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.monto || Number(form.monto) <= 0) { setError('El monto debe ser mayor a 0'); return }
    if (!form.objetivo.trim()) { setError('Ingresá un nombre para el objetivo'); return }
    setLoading(true)
    try {
      await onSave({
        ...form,
        monto: Number(form.monto),
        meta: form.meta ? Number(form.meta) : null,
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Preview de conversión del monto depositado
  const previewDepositoARS = () => {
    if (form.moneda !== 'USD' || !form.monto || !tasaVentaMEP) return null
    return formatARS(Number(form.monto) * tasaVentaMEP)
  }
  const previewDepositoUSD = () => {
    if (form.moneda !== 'ARS' || !form.monto || !tasaVentaMEP) return null
    return formatUSD(Number(form.monto) / tasaVentaMEP)
  }

  // Preview de conversión de la meta
  const previewMetaARS = () => {
    if (form.moneda_meta !== 'USD' || !form.meta || !tasaVentaMEP) return null
    return formatARS(Number(form.meta) * tasaVentaMEP)
  }
  const previewMetaUSD = () => {
    if (form.moneda_meta !== 'ARS' || !form.meta || !tasaVentaMEP) return null
    return formatUSD(Number(form.meta) / tasaVentaMEP)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white">{ahorro ? 'Editar ahorro' : 'Nuevo ahorro'}</h2>
          <button id="close-ahorro-modal" onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Objetivo */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-slate-300">Objetivo de ahorro</label>
              {objetivosExistentes.length > 0 && (
                <button type="button" onClick={() => setNuevoObjetivo(!nuevoObjetivo)} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                  {nuevoObjetivo ? '← Elegir existente' : '+ Nuevo objetivo'}
                </button>
              )}
            </div>

            {nuevoObjetivo || objetivosExistentes.length === 0 ? (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {EMOJIS_OBJETIVO.map(emoji => (
                    <button key={emoji} type="button" onClick={() => setForm({ ...form, emoji })}
                      className={`w-10 h-10 rounded-xl text-xl transition-all ${form.emoji === emoji ? 'bg-indigo-500/20 border-2 border-indigo-500 scale-110' : 'bg-slate-800/40 border border-slate-700/30 hover:border-slate-600'}`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <input id="ahorro-objetivo-nuevo" type="text" value={form.objetivo} onChange={e => setForm({ ...form, objetivo: e.target.value })}
                  placeholder="Ej: Vacaciones en Brasil" required maxLength={100}
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all" />

                {/* Meta de ahorro con moneda */}
                <div className="space-y-2">
                  <label className="block text-xs text-slate-400">Meta de ahorro <span className="text-slate-500">(opcional)</span></label>
                  <input id="ahorro-meta" type="number" min="0" value={form.meta} onChange={e => setForm({ ...form, meta: e.target.value })}
                    placeholder="Ej: 5000"
                    className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all" />
                  <CurrencyToggle
                    value={form.moneda_meta}
                    onChange={(m) => setForm({ ...form, moneda_meta: m })}
                    idPrefix="ahorro-meta-moneda"
                    label="Moneda de la meta"
                  />
                  {form.meta > 0 && (
                    <p className="text-xs text-slate-400 pl-1">
                      {previewMetaARS() && <>≈ {previewMetaARS()} ARS</>}
                      {previewMetaUSD() && <>≈ {previewMetaUSD()} USD</>}
                      {(previewMetaARS() || previewMetaUSD()) && <span className="text-slate-500"> (al dólar MEP)</span>}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <select id="ahorro-objetivo-select" value={form.objetivo}
                onChange={e => {
                  const obj = objetivosExistentes.find(o => o.nombre === e.target.value)
                  setForm({ ...form, objetivo: e.target.value, emoji: obj?.emoji || '🎯', meta: obj?.meta || '', moneda_meta: obj?.moneda_meta || 'ARS' })
                }}
                required className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all">
                <option value="">Seleccioná un objetivo...</option>
                {objetivosExistentes.map(o => <option key={o.nombre} value={o.nombre}>{o.emoji} {o.nombre}</option>)}
              </select>
            )}
          </div>

          {/* Monto a depositar + moneda */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Monto a depositar</label>
            <input id="ahorro-monto" type="number" min="0" step="0.01" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="0" required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all" />
            <CurrencyToggle
              value={form.moneda}
              onChange={(m) => setForm({ ...form, moneda: m })}
              idPrefix="ahorro-deposito-moneda"
              label="Moneda del depósito"
            />
            {form.monto > 0 && (
              <p className="text-xs text-slate-400 pl-1">
                {previewDepositoARS() && <>≈ {previewDepositoARS()} ARS</>}
                {previewDepositoUSD() && <>≈ {previewDepositoUSD()} USD</>}
                {(previewDepositoARS() || previewDepositoUSD()) && <span className="text-slate-500"> (al dólar MEP)</span>}
              </p>
            )}
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Descripción <span className="text-slate-500">(opcional)</span></label>
            <input id="ahorro-descripcion" type="text" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Depósito de la quincena" maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all" />
          </div>

          {/* Fecha */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
            <input id="ahorro-fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all" />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">Cancelar</button>
            <button id="save-ahorro" type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl gradient-green text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={15} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
