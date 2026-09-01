import { Pencil, Trash2, X, Bell, BellOff, ShoppingCart, CheckSquare, CreditCard, CheckCircle2, Circle } from 'lucide-react'

export default function PendienteDetalleModal({
  pendiente,
  onClose,
  onEdit,
  onDelete,
  onToggleCompletado,
  onConvertirGasto,
  formatARS,
  formatUSD,
  cotizacionMEP,
}) {
  if (!pendiente) return null

  const cat = pendiente.categoria_obj
  const subcat = pendiente.subcategoria_obj

  const formatFechaRecordatorio = (fechaIso) => {
    if (!fechaIso) return null
    const d = new Date(fechaIso)
    const hoy = new Date()
    const esHoy = d.toDateString() === hoy.toDateString()
    const maniana = new Date(hoy)
    maniana.setDate(maniana.getDate() + 1)
    const esManiana = d.toDateString() === maniana.toDateString()

    const hora = d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

    if (esHoy) return `Hoy a las ${hora}`
    if (esManiana) return `Mañana a las ${hora}`
    return `${d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}, ${hora}`
  }

  const estadoTiempo = (() => {
    if (!pendiente.fecha_recordatorio) return 'normal'
    const fecha = new Date(pendiente.fecha_recordatorio)
    const ahora = new Date()
    if (fecha < ahora) return 'vencido'
    const limiteHoy = new Date(ahora)
    limiteHoy.setHours(23, 59, 59, 999)
    if (fecha <= limiteHoy) return 'hoy'
    return 'futuro'
  })()

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-md bg-slate-900 border border-slate-700/60 rounded-t-3xl sm:rounded-2xl p-6 pb-8 sm:pb-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
        style={{ animation: 'slideUpSheet 0.25s cubic-bezier(0.32,0.72,0,1)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar móvil */}
        <div className="w-10 h-1 bg-slate-700 rounded-full mx-auto mb-5 sm:hidden" />

        {/* Header */}
        <div className="flex items-start gap-4 mb-5">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shrink-0"
            style={
              cat
                ? { background: `${cat.color}25`, border: `1.5px solid ${cat.color}50` }
                : { background: '#6366f120', border: '1.5px solid #6366f140' }
            }
          >
            {cat ? cat.emoji : pendiente.tipo === 'compra' ? '🛒' : '📝'}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`text-white font-bold text-base leading-tight ${
                pendiente.completado ? 'line-through text-slate-400' : ''
              }`}
            >
              {pendiente.titulo}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  pendiente.tipo === 'compra'
                    ? 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                    : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                }`}
              >
                {pendiente.tipo === 'compra' ? '🛒 Compra' : '📝 Tarea'}
              </span>
              <button
                type="button"
                onClick={() => onToggleCompletado(pendiente.id, pendiente.completado)}
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 border transition-all ${
                  pendiente.completado
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200'
                }`}
              >
                {pendiente.completado ? <CheckCircle2 size={11} /> : <Circle size={11} />}
                <span>{pendiente.completado ? 'Completado' : 'Pendiente'}</span>
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-5 text-xs">
          {/* Monto si existe */}
          {pendiente.monto_estimado && (
            <div className="col-span-2 bg-slate-800/60 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400">Monto Estimado</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-bold text-base">
                  {pendiente.moneda === 'USD'
                    ? formatUSD(pendiente.monto_estimado)
                    : formatARS(pendiente.monto_estimado)}
                </span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                    (pendiente.moneda || 'ARS') === 'USD'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}
                >
                  {pendiente.moneda || 'ARS'}
                </span>
              </div>
            </div>
          )}

          {/* Equivalente ARS si USD */}
          {pendiente.moneda === 'USD' && cotizacionMEP && pendiente.monto_estimado && (
            <div className="col-span-2 bg-slate-800/40 rounded-xl p-3 flex items-center justify-between">
              <span className="text-slate-400">Equivalente ARS</span>
              <span className="text-slate-300 font-medium">
                ≈ {formatARS(Number(pendiente.monto_estimado) * cotizacionMEP.venta)}
              </span>
            </div>
          )}

          {/* Recordatorio / Prioridad */}
          <div className="col-span-2 bg-slate-800/60 rounded-xl p-3">
            <p className="text-slate-400 mb-1">Recordatorio</p>
            {pendiente.es_prioritario && pendiente.fecha_recordatorio ? (
              <span
                className={`inline-flex items-center gap-1.5 font-semibold px-2 py-0.5 rounded-lg border ${
                  estadoTiempo === 'vencido'
                    ? 'bg-red-500/20 text-red-300 border-red-500/40'
                    : estadoTiempo === 'hoy'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30'
                }`}
              >
                <Bell size={13} />
                <span>{formatFechaRecordatorio(pendiente.fecha_recordatorio)}</span>
                {estadoTiempo === 'vencido' && !pendiente.completado && ' (Vencido)'}
              </span>
            ) : (
              <span className="text-slate-500 flex items-center gap-1">
                <BellOff size={13} /> Sin recordatorio prioritario
              </span>
            )}
          </div>

          {/* Categoría si existe */}
          {cat && (
            <div className="col-span-2 sm:col-span-1 bg-slate-800/60 rounded-xl p-3">
              <p className="text-slate-400 mb-1">Categoría</p>
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1"
                style={{
                  background: `${cat.color}20`,
                  color: cat.color,
                  border: `1px solid ${cat.color}40`,
                }}
              >
                <span>{cat.emoji}</span>
                <span>{cat.nombre}</span>
              </span>
            </div>
          )}

          {/* Subcategoría si existe */}
          {subcat && (
            <div className="col-span-2 sm:col-span-1 bg-slate-800/60 rounded-xl p-3">
              <p className="text-slate-400 mb-1">Subcategoría</p>
              <p className="text-white font-medium">{subcat.nombre}</p>
            </div>
          )}

          {/* Notas si existen */}
          {pendiente.notas && (
            <div className="col-span-2 bg-slate-800/60 rounded-xl p-3">
              <p className="text-slate-400 mb-1">Notas</p>
              <p className="text-slate-200 whitespace-pre-wrap leading-relaxed">
                {pendiente.notas}
              </p>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="space-y-2">
          {/* Botón Convertir a Gasto (si es compra no completada) */}
          {pendiente.tipo === 'compra' && !pendiente.completado && onConvertirGasto && (
            <button
              type="button"
              onClick={() => {
                onClose()
                onConvertirGasto(pendiente)
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/25 to-emerald-500/25 border border-indigo-500/40 text-emerald-300 hover:from-indigo-500/35 hover:to-emerald-500/35 transition-all text-xs font-bold shadow-md shadow-emerald-500/5"
            >
              <CreditCard size={15} />
              <span>Convertir en Gasto Real</span>
            </button>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                onClose()
                onEdit(pendiente)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25 transition-all text-xs font-semibold"
            >
              <Pencil size={14} />
              <span>Editar</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose()
                onDelete(pendiente.id)
              }}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all text-xs font-semibold"
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
