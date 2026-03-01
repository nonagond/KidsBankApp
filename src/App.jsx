import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { FamilyProvider } from './context/FamilyContext'
import AppRouter from './router/AppRouter'

export default function App() {
  return (
    <AuthProvider>
      <FamilyProvider>
        <AppRouter />
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
      </FamilyProvider>
    </AuthProvider>
  )
}
