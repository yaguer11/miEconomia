import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, Lock, ChevronDown, ChevronUp, ArrowLeft, Save, CheckCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

// ─── Componente de alerta inline ─────────────────────────────────────────────
function Alert({ type, message }) {
  if (!message) return null
  const styles = type === 'success'
    ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    : 'bg-red-500/10 border-red-500/20 text-red-400'
  const Icon = type === 'success' ? CheckCircle : AlertCircle
  return (
    <div className={`flex items-start gap-2 p-3 rounded-xl border text-sm ${styles}`}>
      <Icon size={16} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// ─── Sección: Información Personal ───────────────────────────────────────────
function SeccionInfoPersonal({ nombre, email, onSaveNombre, onSaveEmail }) {
  const [formNombre, setFormNombre] = useState(nombre)
  const [formEmail, setFormEmail] = useState(email)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const nombreCambio = formNombre.trim() !== nombre
    const emailCambio = formEmail.trim() !== email

    if (!nombreCambio && !emailCambio) {
      setError('No hay cambios para guardar.')
      return
    }
    if (!formNombre.trim()) { setError('El nombre no puede estar vacío.'); return }
    if (!formEmail.trim()) { setError('El email no puede estar vacío.'); return }

    setLoading(true)
    try {
      if (nombreCambio) await onSaveNombre(formNombre.trim())
      if (emailCambio) {
        const { error: emailError } = await onSaveEmail(formEmail.trim())
        if (emailError) throw emailError
        setSuccess('Nombre actualizado. Te enviamos un email de verificación a la nueva dirección para confirmar el cambio.')
      } else {
        setSuccess('Nombre actualizado correctamente.')
      }
    } catch (err) {
      setError(err.message || 'Error al guardar los cambios.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
          <User size={14} className="text-indigo-400" />
        </div>
        <h3 className="text-white font-semibold">Información Personal</h3>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5">Nombre</label>
          <input
            id="perfil-nombre"
            type="text"
            value={formNombre}
            onChange={e => setFormNombre(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Mail size={13} /> Email
          </label>
          <input
            id="perfil-email"
            type="email"
            value={formEmail}
            onChange={e => setFormEmail(e.target.value)}
            className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
          />
          <p className="text-xs text-slate-500 mt-1.5">
            Al cambiar el email, recibirás un enlace de verificación en la nueva dirección.
          </p>
        </div>

        <Alert type="error" message={error} />
        <Alert type="success" message={success} />

        <div className="flex justify-end pt-1">
          <button
            id="save-info-personal"
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-purple text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : <><Save size={14} /> Guardar cambios</>}
          </button>
        </div>
      </form>
    </div>
  )
}

// ─── Sección: Seguridad / Contraseña ─────────────────────────────────────────
function SeccionSeguridad({ onSavePassword }) {
  const [expandida, setExpandida] = useState(false)
  const [form, setForm] = useState({ password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleToggle = () => {
    setExpandida(prev => !prev)
    setError('')
    setSuccess('')
    setForm({ password: '', confirmPassword: '' })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (form.password !== form.confirmPassword) { setError('Las contraseñas no coinciden.'); return }

    setLoading(true)
    try {
      const { error: pwError } = await onSavePassword(form.password)
      if (pwError) throw pwError
      setSuccess('Contraseña actualizada correctamente.')
      setForm({ password: '', confirmPassword: '' })
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Botón toggle */}
      <button
        id="toggle-cambiar-password"
        type="button"
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-6 text-left group transition-colors hover:bg-white/3"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
            <Lock size={14} className="text-violet-400" />
          </div>
          <div>
            <h3 className="text-white font-semibold group-hover:text-indigo-300 transition-colors">Seguridad</h3>
            <p className="text-xs text-slate-500 mt-0.5">Cambiar contraseña de acceso</p>
          </div>
        </div>
        <div className={`text-slate-400 transition-transform duration-300 ${expandida ? 'rotate-0' : '-rotate-90'}`}>
          {expandida ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {/* Formulario expandible */}
      <div
        className={`transition-all duration-300 ease-in-out overflow-hidden ${
          expandida ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4 border-t border-slate-800/60 pt-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nueva contraseña</label>
            <input
              id="perfil-password"
              type="password"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="Mínimo 6 caracteres"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmar contraseña</label>
            <input
              id="perfil-confirm-password"
              type="password"
              value={form.confirmPassword}
              onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
              placeholder="Repetí la nueva contraseña"
              className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
            />
          </div>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <div className="flex justify-end pt-1">
            <button
              id="save-password"
              type="submit"
              disabled={loading || !form.password || !form.confirmPassword}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <><Lock size={14} /> Actualizar contraseña</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function PerfilPage() {
  const { user, updatePassword, updateEmail } = useAuth()
  const { perfil, esFamiliar, familia, actualizarPerfil } = useProfile()
  const navigate = useNavigate()

  const nombre = perfil?.nombre || user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'
  const email = user?.email || ''

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header con botón volver */}
      <div className="flex items-center gap-3 mb-8">
        <button
          id="btn-volver-perfil"
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">Mi Perfil</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gestioná tu información personal y seguridad</p>
        </div>
      </div>

      {/* Tarjeta de presentación del usuario */}
      <div className="glass rounded-2xl p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full gradient-purple flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-indigo-500/20 shrink-0">
          {nombre[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-white truncate">{nombre}</h2>
          <p className="text-slate-400 text-sm truncate mt-0.5">{email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
              esFamiliar
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}>
              {esFamiliar ? '👨‍👩‍👧 Cuenta Familiar' : '👤 Cuenta Personal'}
            </span>
            {esFamiliar && familia && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-700/50 text-slate-300 border border-slate-600/50">
                {familia.nombre}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Secciones de edición */}
      <div className="space-y-4">
        <SeccionInfoPersonal
          nombre={nombre}
          email={email}
          onSaveNombre={actualizarPerfil}
          onSaveEmail={updateEmail}
        />
        <SeccionSeguridad onSavePassword={updatePassword} />
      </div>
    </div>
  )
}
