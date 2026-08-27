import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

export function useAhorros() {
  const [ahorros, setAhorros] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { user } = useAuth()
  const { perfil, esFamiliar } = useProfile()

  const fetchAhorros = useCallback(async () => {
    if (!user || !supabase || perfil === undefined) return
    setLoading(true)
    setError(null)

    try {
      let query = supabase
        .from('ahorros')
        .select('*')
        .order('created_at', { ascending: false })

      if (esFamiliar && perfil?.familia_id) {
        query = query.eq('familia_id', perfil.familia_id)
      } else {
        query = query.eq('user_id', user.id).is('familia_id', null)
      }

      const { data, error } = await query
      if (error) throw error
      setAhorros(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user, perfil, esFamiliar])

  useEffect(() => {
    fetchAhorros()
  }, [fetchAhorros])

  const agregarAhorro = async (ahorro) => {
    const payload = {
      ...ahorro,
      moneda: ahorro.moneda || 'ARS',
      moneda_meta: ahorro.moneda_meta || ahorro.moneda || 'ARS',
      tipo: 'deposito',
      user_id: user.id,
      ...(esFamiliar && perfil?.familia_id && { familia_id: perfil.familia_id }),
    }
    const { data, error } = await supabase
      .from('ahorros')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    setAhorros(prev => [data, ...prev])
    return data
  }

  const actualizarAhorro = async (id, cambios) => {
    const { data, error } = await supabase
      .from('ahorros')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()
    if (error) throw error
    setAhorros(prev => prev.map(a => a.id === id ? data : a))
    return data
  }

  const eliminarAhorro = async (id) => {
    const { error } = await supabase.from('ahorros').delete().eq('id', id)
    if (error) throw error
    setAhorros(prev => prev.filter(a => a.id !== id))
  }

  const agregarRetiro = async (retiro) => {
    const payload = {
      monto: retiro.monto,
      moneda: retiro.moneda || 'ARS',
      objetivo: retiro.objetivo,
      emoji: retiro.emoji || '🎯',
      descripcion: retiro.descripcion || '',
      fecha: retiro.fecha,
      tipo: 'retiro',
      user_id: user.id,
      ...(esFamiliar && perfil?.familia_id && { familia_id: perfil.familia_id }),
    }
    const { data, error } = await supabase
      .from('ahorros')
      .insert([payload])
      .select()
      .single()
    if (error) throw error
    setAhorros(prev => [data, ...prev])
    return data
  }

  const actualizarProyeccionObjetivo = async (nombreObjetivo, nuevoMonto) => {
    let query = supabase
      .from('ahorros')
      .update({ ahorro_mensual_proyectado: nuevoMonto })
      .eq('objetivo', nombreObjetivo)

    if (esFamiliar && perfil?.familia_id) {
      query = query.eq('familia_id', perfil.familia_id)
    } else {
      query = query.eq('user_id', user.id).is('familia_id', null)
    }

    const { error } = await query
    if (error) throw error

    setAhorros(prev => prev.map(a => 
      a.objetivo === nombreObjetivo ? { ...a, ahorro_mensual_proyectado: nuevoMonto } : a
    ))
  }

  const actualizarObjetivo = async (nombreAntiguo, nuevosDatos) => {
    let query = supabase
      .from('ahorros')
      .update({
        objetivo: nuevosDatos.nombre,
        emoji: nuevosDatos.emoji,
        meta: nuevosDatos.meta,
        moneda_meta: nuevosDatos.moneda_meta
      })
      .eq('objetivo', nombreAntiguo)

    if (esFamiliar && perfil?.familia_id) {
      query = query.eq('familia_id', perfil.familia_id)
    } else {
      query = query.eq('user_id', user.id).is('familia_id', null)
    }

    const { error } = await query
    if (error) throw error
    
    // Refrescar para que agrupe correctamente con el nuevo nombre y actualice UI
    await fetchAhorros()
  }

  // Agrupar por objetivo — incluye info de moneda de depositos y meta
  // Los retiros (tipo='retiro') descuentan del total
  const objetivos = Object.values(
    ahorros.reduce((acc, ahorro) => {
      const key = ahorro.objetivo
      if (!acc[key]) {
        acc[key] = {
          nombre: key,
          emoji: ahorro.emoji || '🎯',
          meta: ahorro.meta || 0,
          moneda_meta: ahorro.moneda_meta || 'ARS',
          ahorro_mensual_proyectado: ahorro.ahorro_mensual_proyectado || 0,
          depositos: [],
          totalAhorrado: 0,
          totalAhorradoARS: 0,
          totalAhorradoUSD: 0,
        }
      }
      acc[key].depositos.push(ahorro)
      // Los retiros restan, los depositos suman
      const signo = ahorro.tipo === 'retiro' ? -1 : 1
      acc[key].totalAhorrado += signo * Number(ahorro.monto)
      if ((ahorro.moneda || 'ARS') === 'ARS') {
        acc[key].totalAhorradoARS += signo * Number(ahorro.monto)
      } else {
        acc[key].totalAhorradoUSD += signo * Number(ahorro.monto)
      }
      if (ahorro.meta) acc[key].meta = Number(ahorro.meta)
      if (ahorro.moneda_meta) acc[key].moneda_meta = ahorro.moneda_meta
      if (ahorro.ahorro_mensual_proyectado) acc[key].ahorro_mensual_proyectado = Number(ahorro.ahorro_mensual_proyectado)
      return acc
    }, {})
  )

  // Totales globales — solo depositos (los retiros no cuentan como ahorro real)
  const soloDepositos = ahorros.filter(a => a.tipo !== 'retiro')
  const totalAhorrado = soloDepositos.reduce((sum, a) => sum + Number(a.monto), 0)
  const totalAhorradoARS = soloDepositos.filter(a => (a.moneda || 'ARS') === 'ARS').reduce((sum, a) => sum + Number(a.monto), 0)
  const totalAhorradoUSD = soloDepositos.filter(a => a.moneda === 'USD').reduce((sum, a) => sum + Number(a.monto), 0)

  return {
    ahorros, objetivos, loading, error,
    totalAhorrado, totalAhorradoARS, totalAhorradoUSD,
    agregarAhorro, actualizarAhorro, eliminarAhorro, agregarRetiro, actualizarProyeccionObjetivo, actualizarObjetivo, refetch: fetchAhorros
  }
}
