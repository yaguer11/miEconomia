import { useState } from 'react'
import { X, Save, Lock, User } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

export default function ProfileModal({ onClose }) {
  const { user, updatePassword } = useAuth()
  const { perfil, esFamiliar, familia, actualizarPerfil } = useProfile()

  const nombreBase = perfil?.nombre || user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'

  const [form, setForm] = useState({
    nombre: nombreBase,
    password: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    setLoading(true)
    try {
      let actualizado = false;

      // Actualizar nombre si cambió
      if (form.nombre.trim() !== nombreBase) {
        if (!form.nombre.trim()) throw new Error('El nombre no puede estar vacío')
        await actualizarPerfil(form.nombre.trim())
        actualizado = true;
      }

      // Actualizar contraseña si se escribió algo
      if (form.password) {
        if (form.password.length < 6) throw new Error('La contraseña debe tener al menos 6 caracteres')
        if (form.password !== form.confirmPassword) throw new Error('Las contraseñas no coinciden')
        
        const { error: updateError } = await updatePassword(form.password)
        if (updateError) throw updateError
        actualizado = true;
      }

      if (actualizado) {
        setSuccess('Perfil actualizado correctamente')
        setForm(prev => ({ ...prev, password: '', confirmPassword: '' }))
      } else {
        onClose() // Si no cambió nada y guardó, simplemente cerramos
      }
    } catch (err) {
      setError(err.message || 'Error al actualizar el perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <User size={20} className="text-indigo-400" />
            Mi Perfil
          </h2>
          <button id="close-profile-modal" onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Info de Perfil */}
        <div className="mb-6 p-4 rounded-xl bg-slate-800/30 border border-slate-700/30 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full gradient-purple flex items-center justify-center text-white text-xl font-bold shadow-md shrink-0">
            {nombreBase[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-slate-400 text-sm truncate mb-1">{user?.email}</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                esFamiliar 
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                  : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
              }`}>
                {esFamiliar ? '👨‍👩‍👧 Cuenta Familiar' : '👤 Cuenta Personal'}
              </span>
              {esFamiliar && familia && (
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                  {familia.nombre}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
            {success}
          </div>
        )}

        {/* Formulario de Edición */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <User size={14} /> Nombre
            </label>
            <input 
              id="profile-nombre" 
              type="text" 
              value={form.nombre}
              onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Tu nombre"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="pt-2">
            <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
              <Lock size={14} /> Cambiar Contraseña <span className="text-slate-500 font-normal text-xs">(Opcional)</span>
            </label>
            <input 
              id="profile-password" 
              type="password" 
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Confirmar Contraseña
            </label>
            <input 
              id="profile-confirm-password" 
              type="password" 
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repite la nueva contraseña"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-300 hover:text-white hover:border-slate-600 text-sm font-medium transition-all">
              Cancelar
            </button>
            <button id="save-profile" type="submit" disabled={loading}
              className="flex-1 py-3 rounded-xl gradient-purple text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Save size={15} /> Guardar Cambios</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
