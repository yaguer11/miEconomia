import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isSupabaseConfigured } from '../lib/supabase'
import {
  Wallet, Mail, Lock, User, Eye, EyeOff,
  AlertCircle, Settings, Users, UserCircle, ChevronLeft,
} from 'lucide-react'

const STEP = { CREDENCIALES: 1, TIPO: 2, FAMILIA: 3 }

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [step, setStep] = useState(STEP.CREDENCIALES)

  // Credenciales
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombre, setNombre] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  // Tipo de cuenta
  const [tipo, setTipo] = useState('personal') // 'personal' | 'familiar'

  // Familia
  const [familyMode, setFamilyMode] = useState('crear') // 'crear' | 'unirse'
  const [nombreFamilia, setNombreFamilia] = useState('')
  const [codigoFamilia, setCodigoFamilia] = useState('')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()

  const resetRegistro = () => {
    setStep(STEP.CREDENCIALES)
    setTipo('personal')
    setFamilyMode('crear')
    setNombreFamilia('')
    setCodigoFamilia('')
    setError('')
    setMessage('')
  }

  const handleLoginSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error } = await signIn(email, password)
      if (error) throw error
      navigate('/dashboard')
    } catch (err) {
      const msgs = {
        'Invalid login credentials': 'Email o contraseña incorrectos',
        'Email not confirmed': 'Confirmá tu email antes de ingresar',
      }
      setError(msgs[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  // Paso 1 → 2 (solo registro)
  const handleCredencialesNext = (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres'); return }
    setStep(STEP.TIPO)
  }

  // Paso 2 → siguiente
  const handleTipoNext = () => {
    setError('')
    if (tipo === 'personal') {
      handleRegistroFinal()
    } else {
      setStep(STEP.FAMILIA)
    }
  }

  // Submit final de registro
  const handleRegistroFinal = async () => {
    setError('')
    setLoading(true)
    try {
      const familiaOpts = {
        tipo,
        ...(tipo === 'familiar' && familyMode === 'crear' && { modo: 'crear', nombreFamilia }),
        ...(tipo === 'familiar' && familyMode === 'unirse' && { modo: 'unirse', codigo: codigoFamilia }),
      }
      const { data, error } = await signUp(email, password, nombre, familiaOpts)
      if (error) throw error

      if (data.session) {
        navigate('/dashboard')
      } else {
        setMessage('¡Registro exitoso! Revisá tu email para confirmar tu cuenta.')
        setMode('login')
        resetRegistro()
      }
    } catch (err) {
      const msgs = {
        'User already registered': 'Este email ya está registrado',
      }
      setError(msgs[err.message] || err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleFamiliaSubmit = (e) => {
    e.preventDefault()
    if (familyMode === 'crear' && !nombreFamilia.trim()) { setError('Ingresá el nombre de tu familia'); return }
    if (familyMode === 'unirse' && !codigoFamilia.trim()) { setError('Ingresá el código de invitación'); return }
    handleRegistroFinal()
  }

  return (
    <div className="min-h-screen bg-[#0a0f1e] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-purple shadow-2xl shadow-indigo-500/40 mb-4">
            <Wallet size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-bold gradient-text mb-1">Mi Economía</h1>
          <p className="text-slate-400 text-sm">Tu control financiero personal</p>
        </div>

        <div className="glass rounded-2xl p-8">
          {/* Supabase warning */}
          {!isSupabaseConfigured && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 mb-5 text-amber-300 text-sm">
              <Settings size={16} className="flex-shrink-0 mt-0.5 text-amber-400" />
              <div>
                <p className="font-semibold mb-1">⚙️ Configuración requerida</p>
                <p className="text-amber-400/80 text-xs leading-relaxed">
                  Editá <code className="bg-amber-500/20 px-1 rounded">.env.local</code> con tus credenciales de Supabase.
                </p>
              </div>
            </div>
          )}

          {/* Tabs */}
          {(mode === 'login' || step === STEP.CREDENCIALES) && (
            <div className="flex rounded-xl bg-slate-800/50 p-1 mb-6">
              <button
                id="tab-login"
                type="button"
                onClick={() => { setMode('login'); setError(''); setMessage('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'login' ? 'gradient-purple text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Ingresar
              </button>
              <button
                id="tab-register"
                type="button"
                onClick={() => { setMode('register'); setError(''); setMessage('') }}
                className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${mode === 'register' ? 'gradient-purple text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                Registrarse
              </button>
            </div>
          )}

          {/* Alerts */}
          {error && (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 mb-4 text-red-400 text-sm">
              <AlertCircle size={16} className="flex-shrink-0" />
              {error}
            </div>
          )}
          {message && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-4 text-emerald-400 text-sm">
              {message}
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <InputField id="email" type="email" label="Email" value={email} onChange={setEmail} placeholder="tu@email.com" icon={<Mail size={16} />} />
              <PasswordField id="password" label="Contraseña" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} />
              <SubmitBtn loading={loading} label="Ingresar" loadingLabel="Ingresando..." />
            </form>
          )}

          {/* ── REGISTRO PASO 1: Credenciales ── */}
          {mode === 'register' && step === STEP.CREDENCIALES && (
            <form onSubmit={handleCredencialesNext} className="space-y-4">
              <InputField id="nombre" type="text" label="Nombre" value={nombre} onChange={setNombre} placeholder="Tu nombre" icon={<User size={16} />} required />
              <InputField id="email" type="email" label="Email" value={email} onChange={setEmail} placeholder="tu@email.com" icon={<Mail size={16} />} />
              <PasswordField id="password" label="Contraseña" value={password} onChange={setPassword} show={showPassword} onToggle={() => setShowPassword(!showPassword)} placeholder="Mínimo 6 caracteres" />
              <button id="next-tipo" type="submit" className="w-full py-3 rounded-xl gradient-purple text-white font-semibold text-sm hover:opacity-90 transition-all mt-2">
                Siguiente →
              </button>
            </form>
          )}

          {/* ── REGISTRO PASO 2: Tipo de cuenta ── */}
          {mode === 'register' && step === STEP.TIPO && (
            <div>
              <button onClick={() => setStep(STEP.CREDENCIALES)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-5 transition-colors">
                <ChevronLeft size={16} /> Volver
              </button>
              <p className="text-white font-semibold mb-1 text-center">¿Qué tipo de cuenta querés?</p>
              <p className="text-slate-400 text-xs text-center mb-5">Podés cambiar esto más adelante</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Personal */}
                <button
                  id="tipo-personal"
                  type="button"
                  onClick={() => setTipo('personal')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${tipo === 'personal' ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tipo === 'personal' ? 'gradient-purple' : 'bg-slate-800'}`}>
                    <UserCircle size={22} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Personal</p>
                    <p className="text-slate-400 text-xs mt-0.5">Solo para vos</p>
                  </div>
                </button>
                {/* Familiar */}
                <button
                  id="tipo-familiar"
                  type="button"
                  onClick={() => setTipo('familiar')}
                  className={`flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${tipo === 'familiar' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600'}`}
                >
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${tipo === 'familiar' ? 'gradient-green' : 'bg-slate-800'}`}>
                    <Users size={22} className="text-white" />
                  </div>
                  <div className="text-center">
                    <p className="text-white font-semibold text-sm">Familiar</p>
                    <p className="text-slate-400 text-xs mt-0.5">Compartida</p>
                  </div>
                </button>
              </div>
              <button
                id="confirmar-tipo"
                type="button"
                onClick={handleTipoNext}
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-purple text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {tipo === 'personal' ? 'Crear cuenta personal' : 'Siguiente →'}
              </button>
            </div>
          )}

          {/* ── REGISTRO PASO 3: Configuración familia ── */}
          {mode === 'register' && step === STEP.FAMILIA && (
            <form onSubmit={handleFamiliaSubmit} className="space-y-4">
              <button type="button" onClick={() => setStep(STEP.TIPO)} className="flex items-center gap-1 text-slate-400 hover:text-white text-sm mb-1 transition-colors">
                <ChevronLeft size={16} /> Volver
              </button>

              {/* Toggle crear / unirse */}
              <div className="flex rounded-xl bg-slate-800/50 p-1">
                <button
                  id="familia-crear"
                  type="button"
                  onClick={() => setFamilyMode('crear')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${familyMode === 'crear' ? 'gradient-green text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Crear familia
                </button>
                <button
                  id="familia-unirse"
                  type="button"
                  onClick={() => setFamilyMode('unirse')}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${familyMode === 'unirse' ? 'gradient-green text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  Tengo un código
                </button>
              </div>

              {familyMode === 'crear' ? (
                <InputField
                  id="nombre-familia"
                  type="text"
                  label="Nombre de tu familia"
                  value={nombreFamilia}
                  onChange={setNombreFamilia}
                  placeholder="Ej: Familia García"
                  icon={<Users size={16} />}
                  required
                />
              ) : (
                <InputField
                  id="codigo-familia"
                  type="text"
                  label="Código de invitación"
                  value={codigoFamilia}
                  onChange={v => setCodigoFamilia(v.toUpperCase())}
                  placeholder="Ej: GARCIA-4X7K"
                  icon={<Users size={16} />}
                  required
                />
              )}

              <button
                id="submit-familia"
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl gradient-green text-white font-semibold text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  familyMode === 'crear' ? '🏠 Crear mi familia' : '🤝 Unirme a la familia'
                )}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Tus datos están protegidos con cifrado de extremo a extremo
        </p>
      </div>
    </div>
  )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function InputField({ id, type, label, value, onChange, placeholder, icon, required }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{icon}</span>
        <input
          id={id}
          type={type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
        />
      </div>
    </div>
  )
}

function PasswordField({ id, label, value, onChange, show, onToggle, placeholder = '••••••••' }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-300 mb-1.5">{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          required
          className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all text-sm"
        />
        <button type="button" id="toggle-password" onClick={onToggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300">
          {show ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      </div>
    </div>
  )
}

function SubmitBtn({ loading, label, loadingLabel }) {
  return (
    <button
      id="submit-auth"
      type="submit"
      disabled={loading}
      className="w-full py-3 rounded-xl gradient-purple text-white font-semibold text-sm transition-all hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
    >
      {loading ? (
        <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{loadingLabel}</>
      ) : label}
    </button>
  )
}
