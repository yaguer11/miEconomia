import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProfileProvider } from './contexts/ProfileContext'
import { CurrencyProvider } from './contexts/CurrencyContext'
import { CategoriasProvider } from './contexts/CategoriasContext'
import ProtectedRoute from './components/ProtectedRoute'
import AppLayout from './components/AppLayout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import GastosPage from './pages/GastosPage'
import AhorrosPage from './pages/AhorrosPage'
import IngresosPage from './pages/IngresosPage'
import FamiliaPage from './pages/FamiliaPage'
import CategoriasPage from './pages/CategoriasPage'
import PerfilPage from './pages/PerfilPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProfileProvider>
          <CurrencyProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <CategoriasProvider>
                      <AppLayout />
                    </CategoriasProvider>
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="dashboard" element={<DashboardPage />} />
                <Route path="ingresos" element={<IngresosPage />} />
                <Route path="gastos" element={<GastosPage />} />
                <Route path="ahorros" element={<AhorrosPage />} />
                <Route path="categorias" element={<CategoriasPage />} />
                <Route path="familia" element={<FamiliaPage />} />
                <Route path="perfil" element={<PerfilPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </CurrencyProvider>
        </ProfileProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
