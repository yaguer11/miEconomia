import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronUp, X, Save, Tags } from 'lucide-react'
import { useCategorias } from '../contexts/CategoriasContext'
import { COLORES_CATEGORIA, EMOJIS_CATEGORIA } from '../lib/constants'

// ── Mini picker de emoji ──────────────────────────────────────────
function EmojiPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5">Emoji</p>
      <div className="flex flex-wrap gap-1.5">
        {EMOJIS_CATEGORIA.map(e => (
          <button key={e} type="button" onClick={() => onChange(e)}
            className={`w-9 h-9 rounded-lg text-xl transition-all ${
              value === e
                ? 'bg-indigo-500/30 border-2 border-indigo-500 scale-110'
                : 'bg-slate-800/60 border border-slate-700/40 hover:border-slate-500'
            }`}>
            {e}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Mini picker de color ──────────────────────────────────────────
function ColorPicker({ value, onChange }) {
  return (
    <div>
      <p className="text-xs text-slate-400 mb-1.5">Color</p>
      <div className="flex flex-wrap gap-2">
        {COLORES_CATEGORIA.map(c => (
          <button key={c} type="button" onClick={() => onChange(c)}
            className={`w-7 h-7 rounded-full border-2 transition-all ${
              value === c ? 'border-white scale-110' : 'border-transparent hover:border-slate-400'
            }`}
            style={{ background: c }} />
        ))}
      </div>
    </div>
  )
}

// ── Modal crear/editar categoría ─────────────────────────────────
function CategoriaModal({ cat, onSave, onClose }) {
  const [form, setForm] = useState({
    nombre: cat?.nombre || '',
    emoji: cat?.emoji || '📦',
    color: cat?.color || '#6366f1',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre no puede estar vacío'); return }
    setLoading(true)
    try {
      await onSave(form)
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-white">{cat ? 'Editar categoría' : 'Nueva categoría'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 border border-slate-700/30">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: form.color + '25', border: `2px solid ${form.color}60` }}>
              {form.emoji}
            </div>
            <span className="text-white font-medium text-sm">{form.nombre || 'Nombre de categoría'}</span>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-1.5">Nombre</label>
            <input id="cat-nombre" type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Mascotas" maxLength={50} autoFocus
              className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          </div>

          <EmojiPicker value={form.emoji} onChange={e => setForm({ ...form, emoji: e })} />
          <ColorPicker value={form.color} onChange={c => setForm({ ...form, color: c })} />

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-all">
              Cancelar
            </button>
            <button id="save-cat" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl gradient-purple text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Modal crear/editar subcategoría ──────────────────────────────
function SubcategoriaModal({ sub, catColor, onSave, onClose }) {
  const [nombre, setNombre] = useState(sub?.nombre || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!nombre.trim()) { setError('El nombre no puede estar vacío'); return }
    setLoading(true)
    try {
      await onSave(nombre.trim())
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass rounded-2xl p-5 w-full max-w-xs shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white">{sub ? 'Editar subcategoría' : 'Nueva subcategoría'}</h3>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            <X size={16} />
          </button>
        </div>
        {error && <p className="text-red-400 text-sm mb-3 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <input id="subcat-nombre" type="text" value={nombre} onChange={e => setNombre(e.target.value)}
            placeholder="Ej: Supermercado" maxLength={60} autoFocus
            className="w-full px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-sm transition-all" />
          <div className="flex gap-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:text-white text-sm font-medium transition-all">
              Cancelar
            </button>
            <button id="save-subcat" type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
              style={{ background: catColor + 'cc' }}>
              {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Save size={14} /> Guardar</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Card de categoría con subcategorías ──────────────────────────
function CategoriaCard({ cat, onEdit, onDelete, onAddSub, onEditSub, onDeleteSub }) {
  const [expanded, setExpanded] = useState(false)
  const [elimCat, setElimCat] = useState(false)
  const [elimSubId, setElimSubId] = useState(null)

  const handleElimCat = async () => {
    if (elimCat) { await onDelete(cat.id); setElimCat(false) }
    else setElimCat(true)
  }

  const handleElimSub = async (subId) => {
    if (elimSubId === subId) { await onDeleteSub(cat.id, subId); setElimSubId(null) }
    else setElimSubId(subId)
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header de categoría */}
      <div className="p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ background: cat.color + '25', border: `2px solid ${cat.color}60` }}>
          {cat.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm">{cat.nombre}</p>
          <p className="text-slate-500 text-xs">{cat.subcategorias.length} subcategoría{cat.subcategorias.length !== 1 ? 's' : ''}</p>
        </div>
        {/* Acciones */}
        <div className="flex items-center gap-1">
          <button id={`edit-cat-${cat.id}`} onClick={() => onEdit(cat)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors">
            <Pencil size={14} />
          </button>
          <button id={`del-cat-${cat.id}`} onClick={handleElimCat}
            className={`p-1.5 rounded-lg transition-colors ${
              elimCat ? 'text-red-400 bg-red-500/10 animate-pulse' : 'text-slate-400 hover:text-red-400 hover:bg-red-500/10'
            }`}
            title={elimCat ? 'Clic para confirmar' : 'Eliminar categoría'}>
            <Trash2 size={14} />
          </button>
          <button onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors">
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {/* Lista de subcategorías */}
      {expanded && (
        <div className="border-t border-white/5 px-4 pb-4 pt-3">
          <div className="flex flex-wrap gap-2 mb-3">
            {cat.subcategorias.map(sub => (
              <div key={sub.id} className="group flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-slate-300 bg-slate-800/50 border border-slate-700/40">
                <span>{sub.nombre}</span>
                <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                  <button id={`edit-sub-${sub.id}`} onClick={() => onEditSub(cat, sub)}
                    className="text-slate-500 hover:text-indigo-400 transition-colors p-0.5">
                    <Pencil size={10} />
                  </button>
                  <button id={`del-sub-${sub.id}`} onClick={() => handleElimSub(sub.id)}
                    className={`transition-colors p-0.5 ${elimSubId === sub.id ? 'text-red-400 animate-pulse' : 'text-slate-500 hover:text-red-400'}`}
                    title={elimSubId === sub.id ? 'Clic para confirmar' : 'Eliminar'}>
                    <Trash2 size={10} />
                  </button>
                </div>
              </div>
            ))}

            {/* Botón agregar subcategoría */}
            <button id={`add-sub-${cat.id}`} onClick={() => onAddSub(cat)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 hover:bg-indigo-500/20 transition-colors">
              <Plus size={10} /> Subcategoría
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Página principal ─────────────────────────────────────────────
export default function CategoriasPage() {
  const {
    categorias, loading, seeding,
    agregarCategoria, editarCategoria, eliminarCategoria,
    agregarSubcategoria, editarSubcategoria, eliminarSubcategoria,
  } = useCategorias()

  const [modalCat, setModalCat] = useState(null)   // null | { mode: 'crear' | 'editar', cat? }
  const [modalSub, setModalSub] = useState(null)   // null | { mode, cat, sub? }
  const [busqueda, setBusqueda] = useState('')

  const categoriasFiltradas = busqueda.trim()
    ? categorias.filter(c =>
        c.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.subcategorias.some(s => s.nombre.toLowerCase().includes(busqueda.toLowerCase()))
      )
    : categorias

  const handleSaveCat = async (form) => {
    if (modalCat.mode === 'crear') {
      await agregarCategoria(form)
    } else {
      await editarCategoria(modalCat.cat.id, form)
    }
  }

  const handleSaveSub = async (nombre) => {
    if (modalSub.mode === 'crear') {
      await agregarSubcategoria(modalSub.cat.id, nombre)
    } else {
      await editarSubcategoria(modalSub.cat.id, modalSub.sub.id, nombre)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Categorías</h1>
          <p className="text-slate-400 text-sm">Gestioná tus categorías y subcategorías de gastos</p>
        </div>
        <button id="nueva-categoria-btn" onClick={() => setModalCat({ mode: 'crear' })}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-purple text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg hover:shadow-indigo-500/30 transition-all">
          <Plus size={16} />
          Nueva categoría
        </button>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="glass rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Categorías activas</p>
          <p className="text-white font-bold text-2xl">{categorias.length}</p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-slate-400 text-xs mb-1">Subcategorías totales</p>
          <p className="text-white font-bold text-2xl">
            {categorias.reduce((sum, c) => sum + c.subcategorias.length, 0)}
          </p>
        </div>
      </div>

      {/* Búsqueda */}
      <div className="mb-4">
        <input id="buscar-categoria" type="text" value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar categoría o subcategoría..."
          className="w-full px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/50 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm transition-all"
        />
      </div>

      {/* Estado de carga / seeding */}
      {(loading || seeding) ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          {seeding && (
            <p className="text-slate-400 text-sm animate-pulse">
              Inicializando categorías por primera vez…
            </p>
          )}
        </div>
      ) : categoriasFiltradas.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="text-slate-300 font-medium">
            {busqueda ? 'No se encontraron categorías' : 'No hay categorías todavía'}
          </p>
          <p className="text-slate-500 text-sm mt-1">
            {busqueda ? 'Probá con otro término' : 'Creá tu primera categoría'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {categoriasFiltradas.map(cat => (
            <CategoriaCard
              key={cat.id}
              cat={cat}
              onEdit={(c) => setModalCat({ mode: 'editar', cat: c })}
              onDelete={eliminarCategoria}
              onAddSub={(c) => setModalSub({ mode: 'crear', cat: c })}
              onEditSub={(c, s) => setModalSub({ mode: 'editar', cat: c, sub: s })}
              onDeleteSub={eliminarSubcategoria}
            />
          ))}
        </div>
      )}

      {/* Modales */}
      {modalCat && (
        <CategoriaModal
          cat={modalCat.cat}
          onSave={handleSaveCat}
          onClose={() => setModalCat(null)}
        />
      )}
      {modalSub && (
        <SubcategoriaModal
          sub={modalSub.sub}
          catColor={modalSub.cat.color}
          onSave={handleSaveSub}
          onClose={() => setModalSub(null)}
        />
      )}
    </div>
  )
}
