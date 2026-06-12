"use client"

import { useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { AlertTriangle, Clock3 } from "lucide-react"
import { SidebarProvider } from "@/components/providers/sidebar-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { Sidebar } from "@/components/layout/sidebar"
import { TopNav } from "@/components/layout/top-nav"
import { LogoLoader } from "@/components/layout/logo-loader"
import { apiFetch, getApiUrl } from "@/lib/api"

function getHoursLeft(deadline?: string | null) {
  if (!deadline) {
    return null
  }

  const deadlineTime = new Date(deadline).getTime()
  if (Number.isNaN(deadlineTime)) {
    return null
  }

  const hours = Math.ceil((deadlineTime - Date.now()) / (60 * 60 * 1000))
  return Math.max(0, hours)
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const { t } = useLanguage()
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
      apiFetch(`${getApiUrl()}/api/forum/presence?userId=${user.id}`, { method: "POST" }).catch(() => undefined)
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

  const shouldShowEmailWarning = user.role !== "admin" && user.emailVerified === false
  const hoursLeft = getHoursLeft(user.emailVerificationDeadline)
  const timeLeft = hoursLeft == null
    ? t("aboutOneDay")
    : hoursLeft <= 1
      ? t("underOneHour")
      : `${hoursLeft} ${t("hoursUnit")}`

  return (
    <SidebarProvider>
      <div className="flex min-h-screen bg-background gradient-mesh">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav />
          {shouldShowEmailWarning && (
            <div className="px-4 pt-4 md:px-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-4 text-amber-950 shadow-sm backdrop-blur dark:text-amber-100 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-3">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-300">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t("emailVerificationPendingTitle")}</p>
                    <p className="mt-1 text-sm text-amber-900/80 dark:text-amber-100/75">
                      {t("emailVerificationPendingBody")}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-amber-400/30 bg-background/60 px-3 text-sm font-medium text-foreground">
                    <Clock3 className="h-4 w-4 text-amber-500" />
                    {timeLeft}
                  </div>
                  <Link
                    href="/settings"
                    className="inline-flex h-10 items-center justify-center rounded-xl bg-foreground px-4 text-sm font-medium text-background transition-colors hover:bg-foreground/90"
                  >
                    {t("verifyEmailInSettings")}
                  </Link>
                </div>
              </div>
            </div>
          )}
          <main className="flex-1 p-4 md:p-6 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}
