import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase, isSupabaseConfigured } from '../lib/supabase'
import { generarCodigo } from '../lib/utils'
import { useAuth } from './AuthContext'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  // undefined = todavía cargando | null = no existe perfil | object = perfil cargado
  const [perfil, setPerfil] = useState(undefined)
  const [familia, setFamilia] = useState(null)
  const [miembros, setMiembros] = useState([])
  const [loading, setLoading] = useState(true)

  const loadPerfil = useCallback(async () => {
    if (!user || !isSupabaseConfigured) {
      setPerfil(null)
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      let { data: perfilData } = await supabase
        .from('perfiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      // SETUP INICIAL: Si el usuario inició sesión y no tiene perfil, lo creamos
      // leyendo los datos que guardamos en user_metadata durante el signUp.
      if (!perfilData) {
        perfilData = await _ejecutarSetupInicial(user)
      }

      setPerfil(perfilData ?? null)

      if (perfilData?.familia_id) {
        const [{ data: familiaData }, { data: miembrosData }] = await Promise.all([
          supabase.from('familias').select('*').eq('id', perfilData.familia_id).single(),
          supabase
            .from('familia_miembros')
            .select('*')
            .eq('familia_id', perfilData.familia_id)
            .order('created_at'),
        ])
        setFamilia(familiaData ?? null)
        setMiembros(miembrosData ?? [])
      } else {
        setFamilia(null)
        setMiembros([])
      }
    } catch (err) {
      console.error('Error cargando perfil:', err)
      setPerfil(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadPerfil()
  }, [loadPerfil])

  // ── Computed ──────────────────────────────────────────────────
  const esFamiliar = perfil?.tipo === 'familiar' && !!perfil?.familia_id
  const esAdmin = !!familia && familia.created_by === user?.id
  // Entrada del usuario actual en familia_miembros
  const miMiembro = miembros.find(m => m.user_id === user?.id) ?? null

  // ── Actions ──────────────────────────────────────────────────

  /** Crea el perfil base (se llama desde AuthContext.signUp) */
  const crearPerfil = async (userId, { nombre, tipo }) => {
    const { data, error } = await supabase
      .from('perfiles')
      .insert([{ id: userId, nombre, tipo }])
      .select()
      .single()
    if (error) throw error
    return data
  }

  /** Admin agrega un miembro virtual (hijo sin cuenta) */
  const agregarMiembroVirtual = async ({ nombre_display, avatar_emoji }) => {
    if (!esAdmin || !familia) throw new Error('Solo el admin puede agregar miembros')
    const { data, error } = await supabase
      .from('familia_miembros')
      .insert([{
        familia_id: familia.id,
        user_id: null,
        nombre_display,
        rol: 'miembro',
        avatar_emoji,
        es_virtual: true,
      }])
      .select()
      .single()
    if (error) throw error
    setMiembros(prev => [...prev, data])
    return data
  }

  /** Admin elimina un miembro */
  const eliminarMiembro = async (miembroId) => {
    if (!esAdmin) throw new Error('Solo el admin puede eliminar miembros')
    const { error } = await supabase
      .from('familia_miembros')
      .delete()
      .eq('id', miembroId)
    if (error) throw error
    setMiembros(prev => prev.filter(m => m.id !== miembroId))
  }

  return (
    <ProfileContext.Provider value={{
      perfil,
      familia,
      miembros,
      loading,
      esFamiliar,
      esAdmin,
      miMiembro,
      crearPerfil,
      agregarMiembroVirtual,
      eliminarMiembro,
      refetch: loadPerfil,
    }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (!context) throw new Error('useProfile debe usarse dentro de ProfileProvider')
  return context
}

// ─── Helpers de Setup ────────────────────────────────────────────────────────

async function _ejecutarSetupInicial(user) {
  const userId = user.id
  const { nombre, tipo = 'personal', modo, nombreFamilia, codigo } = user.user_metadata

  // 1. Crear perfil base
  const { error: perfilError } = await supabase
    .from('perfiles')
    .insert([{ id: userId, nombre, tipo }])
  
  if (perfilError) throw perfilError

  // 2. Configurar familia
  if (tipo === 'familiar') {
    if (modo === 'crear' && nombreFamilia) {
      await _crearFamilia(userId, nombre, nombreFamilia)
    } else if (modo === 'unirse' && codigo) {
      await _unirseAFamilia(userId, nombre, codigo)
    }
  }

  // 3. Devolver perfil actualizado
  const { data } = await supabase.from('perfiles').select('*').eq('id', userId).single()
  return data
}

async function _crearFamilia(userId, nombreUsuario, nombreFamilia) {
  const codigo = generarCodigo(nombreFamilia)

  const { data: fam, error: famError } = await supabase
    .from('familias')
    .insert([{ nombre: nombreFamilia, codigo_invitacion: codigo, created_by: userId }])
    .select()
    .single()
  if (famError) throw famError

  await supabase.from('perfiles').update({ familia_id: fam.id, tipo: 'familiar' }).eq('id', userId)

  await supabase.from('familia_miembros').insert([{
    familia_id: fam.id,
    user_id: userId,
    nombre_display: nombreUsuario,
    rol: 'admin',
    avatar_emoji: '👑',
  }])

  await supabase.auth.updateUser({ data: { familia_id: fam.id, tipo: 'familiar' } })
}

async function _unirseAFamilia(userId, nombreUsuario, codigoInput) {
  const codNormalizado = codigoInput.trim().toUpperCase()

  const { data: fam, error: famError } = await supabase
    .from('familias')
    .select('*')
    .eq('codigo_invitacion', codNormalizado)
    .maybeSingle()

  if (famError || !fam) throw new Error('Código inválido.')

  await supabase.from('perfiles').update({ familia_id: fam.id, tipo: 'familiar' }).eq('id', userId)

  await supabase.from('familia_miembros').insert([{
    familia_id: fam.id,
    user_id: userId,
    nombre_display: nombreUsuario,
    rol: 'miembro',
    avatar_emoji: '👤',
  }])

  await supabase.auth.updateUser({ data: { familia_id: fam.id, tipo: 'familiar' } })
}
