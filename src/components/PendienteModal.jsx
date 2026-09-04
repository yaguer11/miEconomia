import { useState } from 'react'
import { X, Save, Bell, BellOff, ShoppingCart, CheckSquare, Sparkles } from 'lucide-react'

export default function PendienteModal({
  pendiente,
  onSave,
  onClose,
  notificationPermission = 'default',
  onRequestPermission,
}) {

  // Formato inicial de fecha/hora si existe
  const obtenerFechaHoraInicial = () => {
    if (pendiente?.fecha_recordatorio) {
      const d = new Date(pendiente.fecha_recordatorio)
      const pad = (n) => String(n).padStart(2, '0')
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
    }
    // Default: mañana a las 09:00
    const d = new Date()
    d.setDate(d.getDate() + 1)
    d.setHours(9, 0, 0, 0)
    const pad = (n) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const [tipo, setTipo] = useState(pendiente?.tipo || 'compra')
  const [titulo, setTitulo] = useState(pendiente?.titulo || '')
  const [esPrioritario, setEsPrioritario] = useState(pendiente?.es_prioritario || false)
  const [fechaRecordatorio, setFechaRecordatorio] = useState(obtenerFechaHoraInicial())
  const [notas, setNotas] = useState(pendiente?.notas || '')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const handleTogglePrioritario = async () => {
    const nuevoEstado = !esPrioritario
    setEsPrioritario(nuevoEstado)
    if (nuevoEstado && notificationPermission === 'default' && onRequestPermission) {
      await onRequestPermission()
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!titulo.trim()) {
      setError('Por favor ingresa un título para el recordatorio')
      return
    }

    if (esPrioritario && !fechaRecordatorio) {
      setError('Por favor indica una fecha y hora para el recordatorio prioritario')
      return
    }

    setGuardando(true)
    try {
      const payload = {
        titulo: titulo.trim(),
        tipo,
        monto_estimado: null,
        moneda: 'ARS',
        categoria_id: null,
        subcategoria_id: null,
        es_prioritario: esPrioritario,
        fecha_recordatorio: esPrioritario && fechaRecordatorio ? new Date(fechaRecordatorio).toISOString() : null,
        notas: notas.trim() || null,
      }

      await onSave(payload)
      onClose()
    } catch (err) {
      console.error('Error al guardar pendiente:', err)
      setError('Hubo un error al guardar. Revisa los datos e intenta nuevamente.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center text-white">
              {tipo === 'compra' ? <ShoppingCart size={16} /> : <CheckSquare size={16} />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {pendiente ? 'Editar Recordatorio' : 'Nuevo Recordatorio'}
              </h2>
              <p className="text-xs text-slate-400">
                Organiza tus compras previstas y tareas financieras
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              {error}
            </div>
          )}

          {/* Selector de Tipo */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Tipo de Registro
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800">
              <button
                type="button"
                id="btn-tipo-compra"
                onClick={() => setTipo('compra')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  tipo === 'compra'
                    ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>🛒</span>
                <span>Compra</span>
              </button>
              <button
                type="button"
                id="btn-tipo-tarea"
                onClick={() => setTipo('tarea')}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold transition-all ${
                  tipo === 'tarea'
                    ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/50 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 border border-transparent'
                }`}
              >
                <span>📝</span>
                <span>Tarea</span>
              </button>
            </div>
          </div>

          {/* Título */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              {tipo === 'compra' ? '¿Qué quieres comprar?' : '¿Qué necesitas recordar?'} *
            </label>
            <input
              type="text"
              id="input-pendiente-titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder={tipo === 'compra' ? 'Ej: Ingredientes para tarta de jamón y queso' : 'Ej: Pagar seguro del auto, Cancelar suscripción...'}
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              required
            />
          </div>

          {/* Notas adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Notas adicionales <span className="text-slate-500 font-normal">(Opcional)</span>
            </label>
            <textarea
              id="input-pendiente-notas"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              rows={tipo === 'compra' ? 5 : 2}
              placeholder={tipo === 'compra' ? 'Ej:\n- tapas de tarta\n- jamón\n- queso crema\n- huevos' : 'Ej: Vence el día 10.'}
              className="w-full px-3.5 py-2 bg-slate-900/80 border border-slate-700/80 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* SECCIÓN PRIORIDAD & NOTIFICACIÓN (REQUERIMIENTO CLAVE) */}
          <div
            className={`rounded-xl border p-4 transition-all duration-300 ${
              esPrioritario
                ? 'border-amber-500/40 bg-amber-500/5 shadow-lg shadow-amber-500/5'
                : 'border-slate-800 bg-slate-900/20'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    esPrioritario ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {esPrioritario ? <Bell size={15} /> : <BellOff size={15} />}
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">
                    {esPrioritario ? '⭐ Recordatorio Prioritario (Con Notificación)' : 'Recordatorio Normal (Sin Notificación)'}
                  </span>
                  <p className="text-[11px] text-slate-400">
                    {esPrioritario
                      ? 'Te avisaremos en tu dispositivo cuando llegue la fecha y hora'
                      : 'Quedará en tu lista sin enviarte alarmas'}
                  </p>
                </div>
              </div>

              {/* Switch Toggle */}
              <button
                type="button"
                id="toggle-prioritario"
                onClick={handleTogglePrioritario}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  esPrioritario ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    esPrioritario ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Configuración de Fecha y Hora si es Prioritario */}
            {esPrioritario && (
              <div className="mt-4 pt-3 border-t border-amber-500/20 space-y-3 animate-fadeIn">
                <div>
                  <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-1.5">
                    ¿Cuándo quieres que te lo recordemos? *
                  </label>
                  <input
                    type="datetime-local"
                    id="input-fecha-recordatorio"
                    value={fechaRecordatorio}
                    onChange={(e) => setFechaRecordatorio(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-900 border border-amber-500/40 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
                    required={esPrioritario}
                  />
                </div>

                {/* Aviso sobre permisos de notificación del navegador (solo si están bloqueadas o pendientes) */}
                {notificationPermission === 'denied' ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300">
                    <span>⚠️ Notificaciones bloqueadas en tu navegador para este sitio.</span>
                    <button
                      type="button"
                      onClick={onRequestPermission}
                      className="ml-2 px-2.5 py-1 rounded-md bg-red-500/20 text-red-300 font-bold hover:bg-red-500/30 transition-colors shrink-0"
                    >
                      Ver ayuda
                    </button>
                  </div>
                ) : notificationPermission === 'default' ? (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
                    <span>🔔 Para recibir avisos en tu navegador, activa los permisos:</span>
                    <button
                      type="button"
                      onClick={onRequestPermission}
                      className="ml-2 px-2.5 py-1 rounded-md bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 transition-colors shrink-0"
                    >
                      Permitir
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-800 bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            id="btn-guardar-pendiente"
            onClick={handleSubmit}
            disabled={guardando}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold text-white gradient-purple hover:opacity-90 transition-all shadow-md shadow-indigo-500/20 disabled:opacity-50"
          >
            <Save size={14} />
            {guardando ? 'Guardando...' : pendiente ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
