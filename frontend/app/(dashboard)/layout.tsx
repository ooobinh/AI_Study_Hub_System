"use client"

import { SidebarProvider } from "@/components/providers/sidebar-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { FloatingAssistant } from "@/components/layout/floating-assistant"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
        <FloatingAssistant />
      </div>
    </SidebarProvider>
  )
}
