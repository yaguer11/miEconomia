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

export function usePendientes() {
  const [pendientes, setPendientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { perfil, esFamiliar } = useProfile()

  const selectClause = esFamiliar ? SELECT_FAMILIAR : SELECT_BASE

  const fetchPendientes = useCallback(async () => {
    if (!user || !supabase || perfil === undefined) return
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('pendientes')
        .select(selectClause)
        .order('completado', { ascending: true })
        .order('es_prioritario', { ascending: false })
        .order('fecha_recordatorio', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false })

      if (esFamiliar && perfil?.familia_id) {
        query = query.eq('familia_id', perfil.familia_id)
      } else {
        query = query.eq('user_id', user.id).is('familia_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      setPendientes(data || [])
    } catch (err) {
      console.error('Error fetching pendientes:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, perfil, esFamiliar, selectClause])

  useEffect(() => {
    fetchPendientes()
  }, [fetchPendientes])

  const agregarPendiente = async (item) => {
    const payload = {
      ...item,
      tipo: item.tipo || 'compra',
      moneda: item.moneda || 'ARS',
      monto_estimado: item.monto_estimado ? Number(item.monto_estimado) : null,
      es_prioritario: Boolean(item.es_prioritario),
      fecha_recordatorio: item.es_prioritario && item.fecha_recordatorio ? item.fecha_recordatorio : null,
      notificado: false,
      completado: false,
      user_id: user.id,
      ...(esFamiliar && perfil?.familia_id && { familia_id: perfil.familia_id }),
    }

    const { data, error } = await supabase
      .from('pendientes')
      .insert([payload])
      .select(selectClause)
      .single()

    if (error) throw error
    setPendientes(prev => [data, ...prev])
    return data
  }

  const actualizarPendiente = async (id, cambios) => {
    const payload = { ...cambios }
    if (cambios.monto_estimado !== undefined) {
      payload.monto_estimado = cambios.monto_estimado ? Number(cambios.monto_estimado) : null
    }
    if (cambios.es_prioritario === false) {
      payload.fecha_recordatorio = null
      payload.notificado = false
    }

    const { data, error } = await supabase
      .from('pendientes')
      .update(payload)
      .eq('id', id)
      .select(selectClause)
      .single()

    if (error) throw error
    setPendientes(prev => prev.map(p => p.id === id ? data : p))
    return data
  }

  const toggleCompletado = async (id, actual) => {
    return actualizarPendiente(id, { completado: !actual })
  }

  const marcarNotificado = async (id) => {
    const { error } = await supabase
      .from('pendientes')
      .update({ notificado: true })
      .eq('id', id)

    if (!error) {
      setPendientes(prev => prev.map(p => p.id === id ? { ...p, notificado: true } : p))
    }
  }

  const eliminarPendiente = async (id) => {
    const { error } = await supabase.from('pendientes').delete().eq('id', id)
    if (error) throw error
    setPendientes(prev => prev.filter(p => p.id !== id))
  }

  // Cálculos estadísticos
  const ahora = new Date()
  const noCompletados = pendientes.filter(p => !p.completado)
  const totalPendientes = noCompletados.length
  const totalCompletados = pendientes.filter(p => p.completado).length
  const totalPrioritarios = noCompletados.filter(p => p.es_prioritario).length
  
  const prioritariosVencidosOHoy = noCompletados.filter(p => {
    if (!p.es_prioritario || !p.fecha_recordatorio) return false
    return new Date(p.fecha_recordatorio) <= ahora
  }).length

  const totalEstimadoARS = noCompletados
    .filter(p => p.tipo === 'compra' && (p.moneda || 'ARS') === 'ARS' && p.monto_estimado)
    .reduce((sum, p) => sum + Number(p.monto_estimado), 0)

  const totalEstimadoUSD = noCompletados
    .filter(p => p.tipo === 'compra' && p.moneda === 'USD' && p.monto_estimado)
    .reduce((sum, p) => sum + Number(p.monto_estimado), 0)

  return {
    pendientes,
    loading,
    error,
    totalPendientes,
    totalCompletados,
    totalPrioritarios,
    prioritariosVencidosOHoy,
    totalEstimadoARS,
    totalEstimadoUSD,
    agregarPendiente,
    actualizarPendiente,
    toggleCompletado,
    marcarNotificado,
    eliminarPendiente,
    refetch: fetchPendientes,
  }
}
