import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, TrendingDown, TrendingUp, PiggyBank, Users, LogOut, Menu, X, Wallet, Tags } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfile } from '../contexts/ProfileContext'

const BASE_NAV = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Resumen' },
  { to: '/ingresos',   icon: TrendingUp,      label: 'Ingresos' },
  { to: '/gastos',     icon: TrendingDown,    label: 'Gastos' },
  { to: '/ahorros',   icon: PiggyBank,       label: 'Ahorros' },
  { to: '/categorias', icon: Tags,            label: 'Categorías' },
]

const FAMILIA_NAV = { to: '/familia', icon: Users, label: 'Mi Familia' }

export default function Sidebar() {
  const [open, setOpen] = useState(false)
  const { signOut, user } = useAuth()
  const { esFamiliar, perfil, familia } = useProfile()
  const navigate = useNavigate()

  const navItems = esFamiliar ? [...BASE_NAV, FAMILIA_NAV] : BASE_NAV

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const nombre = perfil?.nombre || user?.user_metadata?.nombre || user?.email?.split('@')[0] || 'Usuario'

  const NavItems = () => (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          id={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
          onClick={() => setOpen(false)}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive
                ? 'gradient-purple text-white shadow-md shadow-indigo-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`
          }
        >
          <Icon size={18} />
          {label}
          {label === 'Mi Familia' && familia && (
            <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              {familia.nombre.slice(0, 8)}
            </span>
          )}
        </NavLink>
      ))}
    </nav>
  )

  return (
    <>
      {/* Mobile hamburger */}
      <button
        id="sidebar-toggle"
        className="md:hidden fixed top-4 left-4 z-50 p-2 glass rounded-xl text-white"
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Overlay mobile */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed md:sticky top-0 left-0 z-40 h-screen w-60 bg-[#0d1425] border-r border-slate-800/60 flex flex-col transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800/60">
          <div className="w-8 h-8 rounded-lg gradient-purple flex items-center justify-center shadow-md">
            <Wallet size={16} className="text-white" />
          </div>
          <div>
            <span className="text-white font-bold text-sm">Mi Economía</span>
            {esFamiliar && (
              <p className="text-xs text-emerald-400 leading-none mt-0.5">👨‍👩‍👧 Familiar</p>
            )}
          </div>
        </div>

        <NavItems />

        {/* Footer usuario */}
        <div className="px-3 py-4 border-t border-slate-800/60">
          <NavLink
            id="btn-profile"
            to="/perfil"
            onClick={() => setOpen(false)}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2 mb-1 rounded-xl transition-colors text-left ${
                isActive ? 'bg-white/8' : 'hover:bg-white/5'
              }`
            }
          >
            <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white text-sm font-bold shrink-0">
              {nombre[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-xs font-medium truncate">{nombre}</p>
              <p className="text-slate-500 text-xs truncate">{user?.email}</p>
            </div>
          </NavLink>
          <button
            id="btn-signout"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/5 text-sm font-medium transition-all duration-200"
          >
            <LogOut size={16} />
            Cerrar sesión
          </button>
        </div>
      </aside>
    </>
  )
}
