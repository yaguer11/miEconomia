import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

export function useIngresos(mes, anio) {
  const [ingresos, setIngresos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { perfil, esFamiliar } = useProfile()

  const fetchIngresos = useCallback(async () => {
    if (!user || !supabase || perfil === undefined) return
    setLoading(true)
    setError(null)

    try {
      const startDate = `${anio}-${String(mes).padStart(2, '0')}-01`
      const endDate = new Date(anio, mes, 0).toISOString().split('T')[0]

      const selectClause = esFamiliar
        ? '*, miembro:familia_miembros(id, nombre_display, avatar_emoji)'
        : '*'

      let query = supabase
        .from('ingresos')
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
      if (error) throw error
      setIngresos(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, mes, anio, perfil, esFamiliar])

  useEffect(() => {
    fetchIngresos()
  }, [fetchIngresos])

  const agregarIngreso = async (ingreso) => {
    const payload = {
      ...ingreso,
      moneda: ingreso.moneda || 'ARS',
      user_id: user.id,
      ...(esFamiliar && perfil?.familia_id && { familia_id: perfil.familia_id }),
    }
    const { data, error } = await supabase
      .from('ingresos')
      .insert([payload])
      .select(esFamiliar ? '*, miembro:familia_miembros(id, nombre_display, avatar_emoji)' : '*')
      .single()
    if (error) throw error
    setIngresos(prev => [data, ...prev])
    return data
  }

  const actualizarIngreso = async (id, cambios) => {
    const { data, error } = await supabase
      .from('ingresos')
      .update(cambios)
      .eq('id', id)
      .select(esFamiliar ? '*, miembro:familia_miembros(id, nombre_display, avatar_emoji)' : '*')
      .single()
    if (error) throw error
    setIngresos(prev => prev.map(i => i.id === id ? data : i))
    return data
  }

  const eliminarIngreso = async (id) => {
    const { error } = await supabase.from('ingresos').delete().eq('id', id)
    if (error) throw error
    setIngresos(prev => prev.filter(i => i.id !== id))
  }

  const total = ingresos.reduce((sum, i) => sum + Number(i.monto), 0)
  const totalARS = ingresos.filter(i => (i.moneda || 'ARS') === 'ARS').reduce((sum, i) => sum + Number(i.monto), 0)
  const totalUSD = ingresos.filter(i => i.moneda === 'USD').reduce((sum, i) => sum + Number(i.monto), 0)

  return { ingresos, loading, error, total, totalARS, totalUSD, agregarIngreso, actualizarIngreso, eliminarIngreso, refetch: fetchIngresos }
}
