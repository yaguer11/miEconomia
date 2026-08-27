import { useState } from 'react'
import { X, TrendingDown } from 'lucide-react'
import { useCurrency } from '../contexts/CurrencyContext'

const hoy = new Date().toISOString().split('T')[0]

function CurrencyToggle({ value, onChange, idPrefix }) {
  return (
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
  )
}

/**
 * RetiroModal — registra un retiro (uso del ahorro) de un objetivo especifico.
 */
export default function RetiroModal({ objetivo, onSave, onClose }) {
  const { tasaVentaMEP, formatARS, formatUSD, cotizacionMEP } = useCurrency()

  const [form, setForm] = useState({
    monto: '',
    moneda: 'ARS',
    descripcion: '',
    fecha: hoy,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const saldoDisponible = () => {
    if (form.moneda === 'ARS') {
      if (cotizacionMEP) return objetivo.totalAhorradoARS + objetivo.totalAhorradoUSD * cotizacionMEP.venta
      return objetivo.totalAhorradoARS
    } else {
      if (cotizacionMEP) return objetivo.totalAhorradoUSD + objetivo.totalAhorradoARS / cotizacionMEP.venta
      return objetivo.totalAhorradoUSD
    }
  }

  const saldo = saldoDisponible()
  const montoNum = Number(form.monto)
  const excedeSaldo = montoNum > 0 && montoNum > saldo

  const previewARS = () => {
    if (form.moneda !== 'USD' || !form.monto || !tasaVentaMEP) return null
    return formatARS(montoNum * tasaVentaMEP)
  }
  const previewUSD = () => {
    if (form.moneda !== 'ARS' || !form.monto || !tasaVentaMEP) return null
    return formatUSD(montoNum / tasaVentaMEP)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.monto || montoNum <= 0) { setError('El monto debe ser mayor a 0'); return }
    if (excedeSaldo) {
      setError(`No podes retirar mas de ${form.moneda === 'ARS' ? formatARS(saldo) : formatUSD(saldo)} (saldo disponible)`)
      return
    }
    setLoading(true)
    try {
      await onSave({
        monto: montoNum,
        moneda: form.moneda,
        descripcion: form.descripcion,
        fecha: form.fecha,
        objetivo: objetivo.nombre,
        emoji: objetivo.emoji,
        tipo: 'retiro',
      })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const porcentajeRetiro = saldo > 0 && montoNum > 0 ? Math.min(100, (montoNum / saldo) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-xl">
              {objetivo.emoji}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Usar ahorro</h2>
              <p className="text-xs text-slate-400">{objetivo.nombre}</p>
            </div>
          </div>
          <button id="close-retiro-modal" onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/40 rounded-xl p-3 mb-5">
          <p className="text-xs text-slate-400 mb-1">Saldo disponible</p>
          <div className="flex items-baseline gap-2">
            <p className="text-emerald-400 font-bold text-lg">
              {form.moneda === 'ARS' ? formatARS(saldo) : formatUSD(saldo)}
            </p>
            {cotizacionMEP && objetivo.totalAhorradoARS > 0 && objetivo.totalAhorradoUSD > 0 && (
              <p className="text-xs text-slate-500">
                ({formatARS(objetivo.totalAhorradoARS)} + {formatUSD(objetivo.totalAhorradoUSD)})
              </p>
            )}
          </div>
          {montoNum > 0 && (
            <div className="mt-2">
              <div className="w-full h-1.5 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${excedeSaldo ? 'bg-red-500' : 'bg-amber-500'}`}
                  style={{ width: `${porcentajeRetiro}%` }}
                />
              </div>
              <p className={`text-xs mt-1 ${excedeSaldo ? 'text-red-400' : 'text-amber-400'}`}>
                {excedeSaldo ? 'Supera el saldo disponible' : `Usaras el ${porcentajeRetiro.toFixed(0)}% del saldo`}
              </p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Monto a retirar</label>
            <input
              id="retiro-monto"
              type="number" min="0.01" step="0.01"
              value={form.monto}
              onChange={e => setForm({ ...form, monto: e.target.value })}
              placeholder="0" required
              className={`w-full px-4 py-3 rounded-xl bg-slate-800/60 border text-white placeholder-slate-500 focus:outline-none focus:ring-1 text-sm transition-all ${
                excedeSaldo ? 'border-red-500/60 focus:border-red-500 focus:ring-red-500/30' : 'border-slate-700/50 focus:border-red-400 focus:ring-red-400/30'
              }`}
            />
            <CurrencyToggle value={form.moneda} onChange={m => setForm({ ...form, moneda: m })} idPrefix="retiro-moneda" />
            {form.monto > 0 && (
              <p className="text-xs text-slate-400 pl-1">
                {previewARS() && <>{`\u2248 ${previewARS()} ARS`}</>}
                {previewUSD() && <>{`\u2248 ${previewUSD()} USD`}</>}
                {(previewARS() || previewUSD()) && <span className="text-slate-500"> (al dolar MEP)</span>}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Para que lo usaste? <span className="text-slate-500">(opcional)</span>
            </label>
            <input
              id="retiro-descripcion" type="text"
              value={form.descripcion}
              onChange={e => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Ej: Compre el pasaje de avion" maxLength={200}
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Fecha</label>
            <input
              id="retiro-fecha" type="date"
              value={form.fecha}
              onChange={e => setForm({ ...form, fecha: e.target.value })}
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white focus:outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/30 text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button id="save-retiro" type="submit" disabled={loading || excedeSaldo}
              className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><TrendingDown size={15} />{'  '}Registrar retiro</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
