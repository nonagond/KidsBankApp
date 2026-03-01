import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <main className="flex-1 pb-20 max-w-md mx-auto w-full">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
