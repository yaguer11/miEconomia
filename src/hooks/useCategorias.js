import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'
import { CATEGORIAS_DEFAULT } from '../lib/constants'

/**
 * Hook para gestionar categorías y subcategorías de gastos.
 *
 * Estrategia de scoping:
 * - Familia: todas las categorías se vinculan a familia_id (user_id = creador)
 * - Personal: categorías vinculadas a user_id (sin familia_id)
 *
 * Al primer uso (0 categorías encontradas) se hace el seed automático
 * desde CATEGORIAS_DEFAULT.
 */
export function useCategorias() {
  const { user } = useAuth()
  const { esFamiliar, perfil } = useProfile()
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [seeding, setSeeding] = useState(false)
  const [error, setError] = useState(null)
  const seedingRef = useRef(false)   // ref para evitar doble seed en StrictMode

  // ─────────────────────────────────────────────
  // FETCH
  // ─────────────────────────────────────────────
  const fetchCategorias = useCallback(async () => {
    // Esperamos a que ProfileContext termine de cargar (perfil === undefined mientras carga).
    // Si no esperamos, esta función corre primero con esFamiliar=false (perfil todavía no
    // llegó) y siembra categorías personales; después, cuando el perfil carga como
    // familiar, vuelve a correr y siembra otra vez para la familia. Con StrictMode/renders
    // extra esto puede duplicar el seed dentro del mismo scope.
    if (!user || !supabase || perfil === undefined) return
    setLoading(true)
    setError(null)
    try {
      let query = supabase
        .from('categorias_gasto')
        .select('*, subcategorias:subcategorias_gasto(id, nombre, orden, activa)')
        .eq('activa', true)
        .order('orden', { ascending: true })

      if (esFamiliar && perfil?.familia_id) {
        query = query.eq('familia_id', perfil.familia_id)
      } else {
        query = query.eq('user_id', user.id).is('familia_id', null)
      }

      const { data, error: err } = await query

      if (err) throw err

      const cats = (data || []).map(c => ({
        ...c,
        subcategorias: (c.subcategorias || [])
          .filter(s => s.activa)
          .sort((a, b) => a.orden - b.orden),
      }))

      if (cats.length === 0 && !seedingRef.current) {
        // Primer uso: hacer seed
        await seedCategorias()
      } else {
        setCategorias(cats)
      }
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [user, esFamiliar, perfil?.familia_id])

  useEffect(() => { fetchCategorias() }, [fetchCategorias])

  // ─────────────────────────────────────────────
  // SEED AUTOMÁTICO (primer uso)
  // ─────────────────────────────────────────────
  const seedCategorias = async () => {
    if (!user || seedingRef.current) return
    seedingRef.current = true
    setSeeding(true)
    try {
      const familia_id = esFamiliar && perfil?.familia_id ? perfil.familia_id : null

      // Doble chequeo justo antes de insertar: protege contra la ventana de carrera
      // entre el SELECT original (arriba, en fetchCategorias) y este INSERT, en caso de
      // que otra llamada concurrente (StrictMode, doble render, etc.) haya alcanzado a
      // sembrar primero para el mismo scope (mismo user_id/familia_id).
      let checkQuery = supabase
        .from('categorias_gasto')
        .select('id', { count: 'exact', head: true })
        .eq('activa', true)
      checkQuery = familia_id
        ? checkQuery.eq('familia_id', familia_id)
        : checkQuery.eq('user_id', user.id).is('familia_id', null)
      const { count, error: checkErr } = await checkQuery
      if (checkErr) throw checkErr
      if (count > 0) {
        // Ya hay categorías para este scope (las sembró otra llamada en paralelo): no dupliques.
        await fetchCategorias()
        return
      }

      for (const cat of CATEGORIAS_DEFAULT) {
        // Insertar categoría
        const { data: catData, error: catErr } = await supabase
          .from('categorias_gasto')
          .insert({
            nombre: cat.nombre,
            emoji: cat.emoji,
            color: cat.color,
            orden: cat.orden,
            user_id: user.id,
            familia_id,
          })
          .select()
          .single()

        if (catErr) throw catErr

        // Insertar subcategorías
        if (cat.subcategorias.length > 0) {
          const subs = cat.subcategorias.map((nombre, i) => ({
            categoria_id: catData.id,
            nombre,
            orden: i,
          }))
          const { error: subErr } = await supabase
            .from('subcategorias_gasto')
            .insert(subs)
          if (subErr) throw subErr
        }
      }

      // Re-fetch tras seed
      await fetchCategorias()
    } catch (e) {
      setError('Error al inicializar categorías: ' + e.message)
    } finally {
      setSeeding(false)
    }
  }

  // ─────────────────────────────────────────────
  // CRUD: CATEGORÍAS
  // ─────────────────────────────────────────────
  const agregarCategoria = async ({ nombre, emoji, color }) => {
    if (!user) return
    const familia_id = esFamiliar && perfil?.familia_id ? perfil.familia_id : null
    const maxOrden = categorias.reduce((m, c) => Math.max(m, c.orden), 0)

    const { data, error: err } = await supabase
      .from('categorias_gasto')
      .insert({ nombre, emoji: emoji || '📦', color: color || '#94a3b8', user_id: user.id, familia_id, orden: maxOrden + 1 })
      .select()
      .single()

    if (err) throw err
    setCategorias(prev => [...prev, { ...data, subcategorias: [] }])
    return data
  }

  const editarCategoria = async (id, cambios) => {
    const { data, error: err } = await supabase
      .from('categorias_gasto')
      .update(cambios)
      .eq('id', id)
      .select()
      .single()

    if (err) throw err
    setCategorias(prev => prev.map(c =>
      c.id === id ? { ...c, ...data } : c
    ))
  }

  const eliminarCategoria = async (id) => {
    // 1. Chequear si hay gastos usando esta categoría
    const { count, error: countErr } = await supabase
      .from('gastos')
      .select('id', { count: 'exact', head: true })
      .eq('categoria_id', id)

    if (countErr) throw countErr
    if (count > 0) {
      throw new Error(`No podés eliminar esta categoría porque hay ${count} gasto(s) usándola.`)
    }

    // 2. Si no hay gastos, archivarla
    const { error: err } = await supabase
      .from('categorias_gasto')
      .update({ activa: false })
      .eq('id', id)

    if (err) throw err
    setCategorias(prev => prev.filter(c => c.id !== id))
  }

  // ─────────────────────────────────────────────
  // CRUD: SUBCATEGORÍAS
  // ─────────────────────────────────────────────
  const agregarSubcategoria = async (categoriaId, nombre) => {
    const cat = categorias.find(c => c.id === categoriaId)
    const maxOrden = cat ? cat.subcategorias.reduce((m, s) => Math.max(m, s.orden), -1) : -1

    const { data, error: err } = await supabase
      .from('subcategorias_gasto')
      .insert({ categoria_id: categoriaId, nombre, orden: maxOrden + 1 })
      .select()
      .single()

    if (err) throw err
    setCategorias(prev => prev.map(c =>
      c.id === categoriaId
        ? { ...c, subcategorias: [...c.subcategorias, data] }
        : c
    ))
    return data
  }

  const editarSubcategoria = async (categoriaId, subcategoriaId, nombre) => {
    const { data, error: err } = await supabase
      .from('subcategorias_gasto')
      .update({ nombre })
      .eq('id', subcategoriaId)
      .select()
      .single()

    if (err) throw err
    setCategorias(prev => prev.map(c =>
      c.id === categoriaId
        ? { ...c, subcategorias: c.subcategorias.map(s => s.id === subcategoriaId ? data : s) }
        : c
    ))
  }

  const eliminarSubcategoria = async (catId, subId) => {
    // 1. Chequear si hay gastos usando esta subcategoría
    const { count, error: countErr } = await supabase
      .from('gastos')
      .select('id', { count: 'exact', head: true })
      .eq('subcategoria_id', subId)

    if (countErr) throw countErr
    if (count > 0) {
      throw new Error(`No podés eliminar esta subcategoría porque hay ${count} gasto(s) usándola.`)
    }

    // 2. Si no hay gastos, archivarla
    const { error: err } = await supabase
      .from('subcategorias_gasto')
      .update({ activa: false })
      .eq('id', subId)

    if (err) throw err
    setCategorias(prev => prev.map(c =>
      c.id === catId
        ? { ...c, subcategorias: c.subcategorias.filter(s => s.id !== subId) }
        : c
    ))
  }

  // Helper: subcategorías de una categoría específica
  const getSubcategorias = (categoriaId) =>
    categorias.find(c => c.id === categoriaId)?.subcategorias || []

  // Helper: buscar categoría por id
  const getCategoriaById = (id) =>
    categorias.find(c => c.id === id) || null

  // Helper: buscar subcategoría por id (busca en todas las categorías)
  const getSubcategoriaById = (id) => {
    for (const cat of categorias) {
      const sub = cat.subcategorias.find(s => s.id === id)
      if (sub) return { ...sub, categoria: cat }
    }
    return null
  }

  return {
    categorias,
    loading: loading || seeding,
    seeding,
    error,
    // CRUD Categorías
    agregarCategoria,
    editarCategoria,
    eliminarCategoria,
    // CRUD Subcategorías
    agregarSubcategoria,
    editarSubcategoria,
    eliminarSubcategoria,
    // Helpers
    getSubcategorias,
    getCategoriaById,
    getSubcategoriaById,
    refetch: fetchCategorias,
  }
}
