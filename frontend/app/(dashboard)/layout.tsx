"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { SidebarProvider } from "@/components/providers/sidebar-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { LogoLoader } from "@/components/layout/logo-loader"
import { getApiUrl } from "@/lib/api"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace("/login")
    }
  }, [isLoading, router, user])

  useEffect(() => {
    if (!user?.id) {
      return
    }

    const sendHeartbeat = () => {
      fetch(`${getApiUrl()}/api/forum/presence?userId=${user.id}`, { method: "POST" }).catch(() => undefined)
    }

    sendHeartbeat()
    const interval = window.setInterval(sendHeartbeat, 60000)
    return () => window.clearInterval(interval)
  }, [user?.id])

  if (isLoading || !user) {
    return (
      <LogoLoader
        fullScreen
        label="AI Study Hub"
        sublabel="Checking your session"
      />
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background gradient-mesh">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
