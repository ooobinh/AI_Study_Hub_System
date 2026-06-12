"use client"

import { motion } from "framer-motion"
import type { FormEvent } from "react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Bell, User, Command, CheckCheck, Megaphone, MessageSquare, Send, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { LogoLoader } from "@/components/layout/logo-loader"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { apiFetch, getApiUrl, getNetworkErrorMessage } from "@/lib/api"
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
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false)
  const [feedbackTitle, setFeedbackTitle] = useState("")
  const [feedbackContent, setFeedbackContent] = useState("")
  const [feedbackMessage, setFeedbackMessage] = useState("")
  const [feedbackError, setFeedbackError] = useState("")
  const [isSendingFeedback, setIsSendingFeedback] = useState(false)

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
      const response = await apiFetch(`${getApiUrl()}/api/notifications?userId=${user.id}`)
      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message || "Could not load notifications")
      }
      const data = await response.json() as NotificationItem[]
      setNotifications(data)
    } catch (err) {
      const message = getNetworkErrorMessage(err)
      setNotificationError(
        message.includes("No static resource api/notifications")
          ? "Notification API is not deployed on the current backend yet. Redeploy the Render backend, then refresh."
          : message
      )
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
      await apiFetch(`${getApiUrl()}/api/notifications/${notification.id}/read?userId=${user.id}`, {
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
      await apiFetch(`${getApiUrl()}/api/notifications/read-all?userId=${user.id}`, {
        method: "PATCH",
      })
    } catch (err) {
      setNotificationError(getNetworkErrorMessage(err))
    }
  }

  const handleSendFeedback = async (event: FormEvent) => {
    event.preventDefault()
    setFeedbackMessage("")
    setFeedbackError("")

    if (!user?.id) {
      setFeedbackError("Please log in again before sending feedback.")
      return
    }

    if (!feedbackTitle.trim() || !feedbackContent.trim()) {
      setFeedbackError("Title and message are required.")
      return
    }

    setIsSendingFeedback(true)
    try {
      const response = await apiFetch(`${getApiUrl()}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: Number(user.id),
          title: feedbackTitle.trim(),
          content: feedbackContent.trim(),
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not send feedback")
      }
      setFeedbackMessage(body?.message || "Feedback sent to admin.")
      setFeedbackTitle("")
      setFeedbackContent("")
    } catch (err) {
      setFeedbackError(getNetworkErrorMessage(err))
    } finally {
      setIsSendingFeedback(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace("/login")
  }

  return (
    <>
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
                <LogoLoader compact label="AI Study Hub" sublabel="Loading notifications..." />
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
            <div className="border-t border-border/50 p-2">
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(true)}
                className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
              >
                <MessageSquare className="h-4 w-4" />
                Send feedback to admin
              </button>
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
              <div className="w-8 h-8 overflow-hidden rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 flex items-center justify-center">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <User className="w-4 h-4 text-white" />
                )}
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
            <DropdownMenuItem
              onClick={() => router.push("/profile")}
              className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer"
            >
              {t("profile")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings")}
              className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer"
            >
              {t("settings")}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/settings?tab=billing")}
              className="text-muted-foreground hover:text-foreground focus:text-foreground cursor-pointer"
            >
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
    {isFeedbackOpen && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 p-4 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-card w-full max-w-lg rounded-xl p-5 shadow-2xl"
        >
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Feedback to admin</h2>
                <p className="text-sm text-muted-foreground">Send a private message to the admin team.</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(false)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={handleSendFeedback} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
              <input
                value={feedbackTitle}
                onChange={(event) => setFeedbackTitle(event.target.value)}
                maxLength={255}
                placeholder="I need help with my account"
                className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={feedbackContent}
                onChange={(event) => setFeedbackContent(event.target.value)}
                rows={5}
                placeholder="Write your message..."
                className="min-h-32 w-full resize-y rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {feedbackMessage && (
              <div className="rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-accent">
                {feedbackMessage}
              </div>
            )}
            {feedbackError && (
              <div className="rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {feedbackError}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsFeedbackOpen(false)}
                className="rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSendingFeedback}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Send className="h-4 w-4" />
                {isSendingFeedback ? "Sending..." : "Send feedback"}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    )}
    </>
  )
}
