"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, User, Command, CheckCheck, Loader2, Megaphone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface NotificationItem {
  id: number
  userId: number
  title: string
  content?: string | null
  read: boolean
  createdAt: string
}

function formatNotificationTime(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ""
  }

  const diffMs = Date.now() - date.getTime()
  const diffMinutes = Math.max(0, Math.floor(diffMs / 60000))
  if (diffMinutes < 1) {
    return "Just now"
  }
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(date)
}

export function TopNav() {
  const { user, logout } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(false)
  const [notificationError, setNotificationError] = useState("")

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.read).length,
    [notifications]
  )

  const loadNotifications = useCallback(async () => {
    if (!user?.id) {
      setNotifications([])
      return
    }

    setIsLoadingNotifications(true)
    setNotificationError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/notifications?userId=${user.id}`)
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || "Could not load notifications")
      }
      const data = await response.json() as NotificationItem[]
      setNotifications(data)
    } catch (err) {
      setNotificationError(getNetworkErrorMessage(err))
    } finally {
      setIsLoadingNotifications(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadNotifications()
    const interval = window.setInterval(loadNotifications, 30000)
    return () => window.clearInterval(interval)
  }, [loadNotifications])

  const markNotificationRead = async (notification: NotificationItem) => {
    if (!user?.id || notification.read) {
      return
    }

    setNotifications((current) =>
      current.map((item) => item.id === notification.id ? { ...item, read: true } : item)
    )

    try {
      await fetch(`${getApiUrl()}/api/notifications/${notification.id}/read?userId=${user.id}`, {
        method: "PATCH",
      })
    } catch (err) {
      setNotificationError(getNetworkErrorMessage(err))
    }
  }

  const markAllRead = async () => {
    if (!user?.id || unreadCount === 0) {
      return
    }

    setNotifications((current) => current.map((item) => ({ ...item, read: true })))
    try {
      await fetch(`${getApiUrl()}/api/notifications/read-all?userId=${user.id}`, {
        method: "PATCH",
      })
    } catch (err) {
      setNotificationError(getNetworkErrorMessage(err))
    }
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 md:px-6 py-3 glass border-b border-border/50"
    >
      {/* Search Bar */}
      <div className="flex-1 max-w-xl">
        <motion.div
          className="relative group"
          whileHover={{ scale: 1.01 }}
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder={t("searchGlobal")}
            className="w-full pl-10 pr-16 py-2.5 rounded-xl bg-secondary/50 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-muted/50 border border-border/50">
            <Command className="w-3 h-3 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">K</span>
          </div>
        </motion.div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Language Switcher */}
        <LanguageSwitcher position="top" />

        {/* Notifications */}
        <DropdownMenu onOpenChange={(open) => open && loadNotifications()}>
          <DropdownMenuTrigger asChild>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button variant="ghost" size="icon" className="relative rounded-xl hover:bg-secondary">
                <Bell className="w-5 h-5 text-muted-foreground" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full border border-background bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Button>
            </motion.div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-w-[calc(100vw-2rem)] glass-card border-border/50 p-0">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{t("notifications")}</p>
                <p className="text-xs text-muted-foreground">{unreadCount} unread</p>
              </div>
              <button
                type="button"
                onClick={markAllRead}
                disabled={unreadCount === 0}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark read
              </button>
            </div>
            <div className="max-h-[360px] overflow-y-auto p-2">
              {isLoadingNotifications && (
                <div className="flex items-center justify-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading notifications...
                </div>
              )}

              {!isLoadingNotifications && notificationError && (
                <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-3 text-sm text-destructive">
                  {notificationError}
                </div>
              )}

              {!isLoadingNotifications && !notificationError && notifications.length === 0 && (
                <div className="px-4 py-8 text-center">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/70 text-muted-foreground">
                    <Bell className="h-5 w-5" />
                  </div>
                  <p className="text-sm font-medium text-foreground">No notifications yet</p>
                  <p className="mt-1 text-xs text-muted-foreground">Admin messages will appear here.</p>
                </div>
              )}

              {!isLoadingNotifications && !notificationError && notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => markNotificationRead(notification)}
                  className={`mb-2 flex w-full gap-3 rounded-xl border px-3 py-3 text-left transition-colors ${
                    notification.read
                      ? "border-border/40 bg-secondary/25 hover:bg-secondary/40"
                      : "border-primary/25 bg-primary/10 hover:bg-primary/15"
                  }`}
                >
                  <div className={`mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                    notification.read ? "bg-secondary text-muted-foreground" : "bg-primary/15 text-primary"
                  }`}>
                    <Megaphone className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="line-clamp-1 text-sm font-medium text-foreground">{notification.title}</p>
                      {!notification.read && <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary" />}
                    </div>
                    {notification.content && (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{notification.content}</p>
                    )}
                    <p className="mt-2 text-[11px] text-muted-foreground/80">{formatNotificationTime(notification.createdAt)}</p>
                  </div>
                </button>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <motion.button
              className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-secondary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium text-foreground">{user?.name || t("student")}</span>
                <span className="text-xs text-muted-foreground">{user?.email || t("signedIn")}</span>
              </div>
            </motion.button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 glass-card border-border/50">
            <DropdownMenuLabel className="text-foreground">{t("myAccount")}</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer">
              {t("billing")}
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border/50" />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive cursor-pointer"
            >
              {t("logOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.header>
  )
}
