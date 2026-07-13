import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { clsx } from 'clsx'
import { Sidebar } from '@/components/Sidebar'
import { LegalDisclaimer } from '@/components/LegalDisclaimer'
import { NotificationBell } from '@/components/NotificationBell'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen dashboard-bg flex flex-col">
      {/* Global legal disclaimer banner */}
      <LegalDisclaimer variant="banner" />

      <div className="flex flex-1">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar */}
        <div
          className={clsx(
            'lg:hidden fixed inset-y-0 start-0 z-40 transition-transform duration-300',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full [dir=rtl]:translate-x-full',
          )}
        >
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </div>

        {/* Main Content */}
        <div className="flex-1 lg:ms-[260px] min-w-0 flex flex-col">
          {/* Mobile Top Bar */}
          <header className="lg:hidden sticky top-0 z-20 flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)]/90 backdrop-blur-md border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/5 transition-colors"
              >
                {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <span className="font-display text-lg font-semibold text-gold-400">Remote Legal</span>
            </div>
            <NotificationBell />
          </header>

          {/* Desktop top-right notification bell */}
          <div className="hidden lg:flex absolute top-4 end-6 z-20">
            <NotificationBell />
          </div>

          {/* Page content */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 animate-fade-in">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default DashboardLayout
