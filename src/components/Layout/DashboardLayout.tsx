import Navigation from './Navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="h-screen flex overflow-hidden bg-[#0A0F1C]">
      <Navigation />
      <div className="flex flex-col flex-1 overflow-hidden lg:ml-[240px]">
        <main className="flex-1 relative overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
