import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

export default function AppLayout() {
  return (
    <div className="flex min-h-screen bg-[#0a0f1e]">
      <Sidebar />
      <main className="flex-1 p-6 md:p-8 min-h-screen min-w-0">
        <Outlet />
      </main>
    </div>
  )
}
