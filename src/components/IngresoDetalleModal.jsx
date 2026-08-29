import { Pencil, Trash2, X } from 'lucide-react'
import { getCategIngresosById, formatDate } from '../lib/constants'

export default function IngresoDetalleModal({ 
  ingreso, 
  onClose, 
  onEdit, 
  onDelete, 
  esFamiliar, 
  formatARS, 
  formatUSD, 
  cotizacionMEP 
}) {
  if (!ingreso) return null

  const cat = getCategIngresosById(ingreso.categoria)

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 shadow-2xl"
        style={{ animation: 'slideUpSheet 0.25s cubic-bezier(0.32,0.72,0,1)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle bar móvil */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
            style={{ background: cat.color + '25', border: `1.5px solid ${cat.color}50` }}
          >
            {cat.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-base leading-tight">
              {ingreso.descripcion || cat.label}
            </p>
            <p className="text-slate-400 text-sm mt-0.5">{cat.label}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Monto */}
          <div className="col-span-2 bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
            <span className="text-slate-400 text-xs">Monto</span>
            <div className="flex items-center gap-2">
              <span className="text-emerald-400 font-bold text-lg">
                {ingreso.moneda === 'USD' ? formatUSD(ingreso.monto) : formatARS(ingreso.monto)}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${
                (ingreso.moneda || 'ARS') === 'USD' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-sky-500/20 text-sky-400'
              }`}>
                {ingreso.moneda || 'ARS'}
              </span>
            </div>
          </div>

          {/* Equivalente ARS si USD */}
          {ingreso.moneda === 'USD' && cotizacionMEP && (
            <div className="col-span-2 bg-slate-800/40 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400 text-xs">Equivalente ARS</span>
              <span className="text-slate-300 font-medium text-sm">
                ≈ {formatARS(Number(ingreso.monto) * cotizacionMEP.venta)}
              </span>
            </div>
          )}

          {/* Fecha */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Fecha</p>
            <p className="text-white text-sm font-medium">{formatDate(ingreso.fecha)}</p>
          </div>

          {/* Categoría */}
          <div className="bg-slate-800/60 rounded-xl p-3">
            <p className="text-slate-400 text-xs mb-1">Categoría</p>
            <span
              className="text-xs px-2 py-0.5 rounded-full font-medium"
              style={{ background: cat.color + '20', color: cat.color }}
            >
              {cat.emoji} {cat.label}
            </span>
          </div>

          {/* Miembro */}
          {esFamiliar && ingreso.miembro && (
            <div className="col-span-2 bg-slate-800/60 rounded-xl p-3">
              <p className="text-slate-400 text-xs mb-1">Miembro</p>
              <div className="flex items-center gap-1.5">
                <span>{ingreso.miembro.avatar_emoji}</span>
                <span className="text-white text-sm truncate">{ingreso.miembro.nombre_display}</span>
              </div>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(ingreso)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all text-sm font-medium"
          >
            <Pencil size={14} /> Editar
          </button>
          <button
            onClick={() => onDelete(ingreso.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-sm font-medium"
          >
            <Trash2 size={14} /> Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}
