import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { generarCodigo } from '../lib/utils'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false)
      return
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    return { data, error }
  }

  /**
   * Registro unificado que crea el perfil y (opcionalmente) la familia.
   * @param {string} email
   * @param {string} password
   * @param {string} nombre
   * @param {object} familiaOpts  { tipo, modo?, nombreFamilia?, codigo? }
   *   tipo: 'personal' | 'familiar'
   *   modo: 'crear' | 'unirse'  (solo si tipo === 'familiar')
   *   nombreFamilia: nombre del grupo (solo si modo === 'crear')
   *   codigo: código de invitación (solo si modo === 'unirse')
   */
  const signUp = async (email, password, nombre, familiaOpts = {}) => {
    const { tipo = 'personal', modo, nombreFamilia, codigo } = familiaOpts

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { nombre, tipo, modo, nombreFamilia, codigo } 
      },
    })
    
    // La creación real del perfil y familia se hará en ProfileContext
    // cuando el usuario inicie sesión por primera vez (útil si hay confirmación por email)
    return { data, error }
  }

  const updatePassword = async (newPassword) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword })
    return { data, error }
  }

  const updateEmail = async (newEmail) => {
    const { data, error } = await supabase.auth.updateUser({ email: newEmail })
    return { data, error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut, updatePassword, updateEmail }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider')
  return context
}

// ─── Helpers internos ────────────────────────────────────────────────────────

async function _crearFamilia(userId, nombreUsuario, nombreFamilia) {
  const codigo = generarCodigo(nombreFamilia)

  const { data: fam, error: famError } = await supabase
    .from('familias')
    .insert([{ nombre: nombreFamilia, codigo_invitacion: codigo, created_by: userId }])
    .select()
    .single()
  if (famError) throw famError

  // Actualizar perfil con familia_id
  await supabase
    .from('perfiles')
    .update({ familia_id: fam.id, tipo: 'familiar' })
    .eq('id', userId)

  // Agregar como miembro admin
  await supabase
    .from('familia_miembros')
    .insert([{
      familia_id: fam.id,
      user_id: userId,
      nombre_display: nombreUsuario,
      rol: 'admin',
      avatar_emoji: '👑',
    }])

  // Guardar familia_id en user_metadata para RLS
  await supabase.auth.updateUser({ data: { familia_id: fam.id, tipo: 'familiar' } })

  return fam
}

async function _unirseAFamilia(userId, nombreUsuario, codigoInput) {
  const codNormalizado = codigoInput.trim().toUpperCase()

  const { data: fam, error: famError } = await supabase
    .from('familias')
    .select('*')
    .eq('codigo_invitacion', codNormalizado)
    .maybeSingle()

  if (famError || !fam) {
    return new Error('Código inválido. Verificá que esté escrito correctamente.')
  }

  await supabase
    .from('perfiles')
    .update({ familia_id: fam.id, tipo: 'familiar' })
    .eq('id', userId)

  await supabase
    .from('familia_miembros')
    .insert([{
      familia_id: fam.id,
      user_id: userId,
      nombre_display: nombreUsuario,
      rol: 'miembro',
      avatar_emoji: '👤',
    }])

  await supabase.auth.updateUser({ data: { familia_id: fam.id, tipo: 'familiar' } })

  return null // sin error
}
