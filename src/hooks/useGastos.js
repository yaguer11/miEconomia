import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

const SELECT_BASE = `
  *,
  categoria_obj:categorias_gasto(id, nombre, emoji, color),
  subcategoria_obj:subcategorias_gasto(id, nombre)
`

const SELECT_FAMILIAR = `
  *,
  miembro:familia_miembros(id, nombre_display, avatar_emoji),
  categoria_obj:categorias_gasto(id, nombre, emoji, color),
  subcategoria_obj:subcategorias_gasto(id, nombre)
`

export function useGastos(mes, anio) {
  const [gastos, setGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { perfil, esFamiliar } = useProfile()

  const selectClause = esFamiliar ? SELECT_FAMILIAR : SELECT_BASE

  const fetchGastos = useCallback(async () => {
    if (!user || !supabase || perfil === undefined) return
    setLoading(true)
    setError(null)

    try {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`
      const endDate = new Date(anio, mes, 0).toISOString().split('T')[0]

      let query = supabase
        .from('gastos')
        .select(selectClause)
        .gte('fecha', startDate)
        .lte('fecha', endDate)
        .order('fecha', { ascending: false })

      if (esFamiliar && perfil?.familia_id) {
        query = query.eq('familia_id', perfil.familia_id)
      } else {
        query = query.eq('user_id', user.id).is('familia_id', null)
      }

      const { data, error } = await query
      if (error) {
        console.error('Error fetching gastos:', error)
        throw error
      }
      setGastos(data || [])
    } catch (err) {
      console.error('Error en catch de fetchGastos:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, mes, anio, perfil, esFamiliar])

  useEffect(() => { fetchGastos() }, [fetchGastos])

  const agregarGasto = async (gasto) => {
    const payload = {
      ...gasto,
      moneda: gasto.moneda || 'ARS',
      user_id: user.id,
      ...(esFamiliar && perfil?.familia_id && { familia_id: perfil.familia_id }),
    }
    const { data, error } = await supabase
      .from('gastos')
      .insert([payload])
      .select(selectClause)
      .single()
    if (error) throw error
    setGastos(prev => [data, ...prev])
    return data
  }

  const actualizarGasto = async (id, cambios) => {
    const { data, error } = await supabase
      .from('gastos')
      .update(cambios)
      .eq('id', id)
      .select(selectClause)
      .single()
    if (error) throw error
    setGastos(prev => prev.map(g => g.id === id ? data : g))
    return data
  }

  const eliminarGasto = async (id) => {
    const { error } = await supabase.from('gastos').delete().eq('id', id)
    if (error) throw error
    setGastos(prev => prev.filter(g => g.id !== id))
  }

  const total = gastos.reduce((sum, g) => sum + Number(g.monto), 0)
  const totalARS = gastos.filter(g => (g.moneda || 'ARS') === 'ARS').reduce((sum, g) => sum + Number(g.monto), 0)
  const totalUSD = gastos.filter(g => g.moneda === 'USD').reduce((sum, g) => sum + Number(g.monto), 0)

  return { gastos, loading, error, total, totalARS, totalUSD, agregarGasto, actualizarGasto, eliminarGasto, refetch: fetchGastos }
}
