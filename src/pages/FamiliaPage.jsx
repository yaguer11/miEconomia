import { useState } from 'react'
import { Users, UserPlus, Copy, Check, Shield, Trash2, X } from 'lucide-react'
import { useProfile } from '../contexts/ProfileContext'
import { copiarAlPortapapeles } from '../lib/utils'

const EMOJIS = ['👨', '👩', '👦', '👧', '👴', '👵', '👶', '🐱', '🐶', '🤖', '👻', '👤']

export default function FamiliaPage() {
  const { familia, miembros, loading, esAdmin, agregarMiembroVirtual, eliminarMiembro } = useProfile()
  const [copiado, setCopiado] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoEmoji, setNuevoEmoji] = useState('👦')
  const [agregando, setAgregando] = useState(false)
  const [error, setError] = useState('')
  const [eliminando, setEliminando] = useState(null)

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!familia) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
          <Users size={32} className="text-slate-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No pertenecés a ninguna familia</h2>
        <p className="text-slate-400">
          Tu cuenta es de tipo personal. Si querés usar la funcionalidad familiar, deberás crear una nueva cuenta.
        </p>
      </div>
    )
  }

  const handleCopiar = async () => {
    if (await copiarAlPortapapeles(familia.codigo_invitacion)) {
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2000)
    }
  }

  const handleAgregar = async (e) => {
    e.preventDefault()
    setError('')
    if (!nuevoNombre.trim()) {
      setError('Ingresá un nombre')
      return
    }
    setAgregando(true)
    try {
      await agregarMiembroVirtual({ nombre_display: nuevoNombre, avatar_emoji: nuevoEmoji })
      setModalOpen(false)
      setNuevoNombre('')
      setNuevoEmoji('👦')
    } catch (err) {
      setError(err.message)
    } finally {
      setAgregando(false)
    }
  }

  const handleEliminar = async (id) => {
    if (eliminando === id) {
      try {
        await eliminarMiembro(id)
      } catch (err) {
        console.error('Error al eliminar', err)
      } finally {
        setEliminando(null)
      }
    } else {
      setEliminando(id)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Mi Familia</h1>
          <p className="text-slate-400 text-sm">{familia.nombre}</p>
        </div>
        {esAdmin && (
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-green text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-emerald-500/30 transition-all"
          >
            <UserPlus size={16} />
            Agregar miembro
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Lista de Miembros */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-white mb-4">Integrantes ({miembros.length})</h2>
          
          <div className="space-y-3">
            {miembros.map((m) => (
              <div key={m.id} className="glass rounded-2xl p-4 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-2xl border border-slate-700/50">
                    {m.avatar_emoji}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-white font-medium">{m.nombre_display}</p>
                      {m.rol === 'admin' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                          <Shield size={10} /> Admin
                        </span>
                      )}
                      {m.es_virtual && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                          Sin cuenta
                        </span>
                      )}
                    </div>
                    <p className="text-slate-500 text-xs mt-0.5">
                      Unido el {new Date(m.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {esAdmin && m.rol !== 'admin' && (
                  <button
                    onClick={() => handleEliminar(m.id)}
                    className={`p-2 rounded-xl transition-all ${
                      eliminando === m.id
                        ? 'bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse'
                        : 'text-slate-500 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100'
                    }`}
                    title={eliminando === m.id ? 'Click de nuevo para confirmar' : 'Eliminar'}
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          <div className="glass rounded-2xl p-5">
            <h2 className="text-white font-semibold mb-2 flex items-center gap-2">
              <Users size={18} className="text-indigo-400" />
              Código de invitación
            </h2>
            <p className="text-slate-400 text-sm mb-4">
              Compartí este código para que tus familiares se unan a la cuenta.
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 font-mono text-center tracking-wider text-emerald-400 text-lg">
                {familia.codigo_invitacion}
              </div>
              <button
                onClick={handleCopiar}
                className="w-12 h-12 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 flex items-center justify-center text-slate-300 transition-colors"
                title="Copiar código"
              >
                {copiado ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
          
          <div className="glass rounded-2xl p-5 border border-amber-500/20 bg-amber-500/5">
            <h3 className="text-amber-400 font-semibold text-sm mb-2">Información</h3>
            <ul className="text-slate-400 text-xs space-y-2 list-disc pl-4">
              <li>Todos los miembros pueden ver y registrar gastos e ingresos.</li>
              <li>Podés agregar "miembros sin cuenta" (ej: hijos pequeños) para asignarles gastos sin que tengan que registrarse.</li>
              <li>Los ahorros son compartidos por toda la familia.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Modal agregar miembro */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">Agregar miembro sin cuenta</h2>
              <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
                <X size={18} />
              </button>
            </div>

            {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm mb-4">{error}</div>}

            <form onSubmit={handleAgregar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
                <input
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  placeholder="Ej: Pedro"
                  className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-sm"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Avatar</label>
                <div className="grid grid-cols-4 gap-2">
                  {EMOJIS.map(e => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setNuevoEmoji(e)}
                      className={`text-2xl p-2 rounded-xl transition-all ${nuevoEmoji === e ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-slate-800/40 border border-transparent hover:border-slate-600'}`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={agregando} className="flex-1 py-3 rounded-xl gradient-green text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
                  {agregando ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Agregar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
