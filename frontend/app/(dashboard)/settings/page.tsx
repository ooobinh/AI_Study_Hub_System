"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import { isValidEmail } from "@/lib/validation"
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  CreditCard,
  HelpCircle,
  KeyRound,
  Link2,
  Loader2,
  Mail,
  Moon,
  Palette,
  Send,
  ShieldCheck,
  Smartphone,
  Sun,
  Trash2,
  User,
  XCircle,
} from "lucide-react"

type GoogleCredentialResponse = {
  credential?: string
}

type GoogleAccounts = {
  id: {
    initialize: (options: {
      client_id: string
      callback: (response: GoogleCredentialResponse) => void
    }) => void
    renderButton: (
      element: HTMLElement,
      options: {
        theme: "outline" | "filled_blue" | "filled_black"
        size: "large" | "medium" | "small"
        type: "standard" | "icon"
        shape: "rectangular" | "pill" | "circle" | "square"
        text: "signin_with" | "signup_with" | "continue_with" | "signin"
        width?: number
      }
    ) => void
    prompt: () => void
  }
}

declare global {
  interface Window {
    google?: {
      accounts: GoogleAccounts
    }
  }
}

interface AccountSecurity {
  userId: number
  email: string
  emailVerified: boolean
  emailVerifiedAt?: string | null
  googleLinked: boolean
  createdAt?: string | null
}

interface MessageResponse {
  message: string
}

const tabIds = ["account", "notifications", "appearance", "billing", "help"]
const legacyTabs: Record<string, string> = {
  profile: "account",
  security: "account",
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

function GoogleIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

async function postJson<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(data?.message || "Request failed")
  }
  return data as T
}

function formatDate(value?: string | null) {
  if (!value) return "Not available"
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(new Date(value))
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("account")
  const [mounted, setMounted] = useState(false)
  const [account, setAccount] = useState<AccountSecurity | null>(null)
  const [isAccountLoading, setIsAccountLoading] = useState(false)
  const [actionLoading, setActionLoading] = useState("")
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [googleReady, setGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const { theme, setTheme } = useTheme()
  const { user } = useAuth()
  const { t } = useLanguage()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const tabs = [
    { id: "account", label: "Account & Security", icon: ShieldCheck },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "billing", label: t("billing"), icon: CreditCard },
    { id: "help", label: t("help"), icon: HelpCircle },
  ]

  const loadAccount = useCallback(async () => {
    if (!user?.id) return
    setIsAccountLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/account/security?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load account security")
      }
      setAccount(body as AccountSecurity)
      setNewEmail((body as AccountSecurity).email)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsAccountLoading(false)
    }
  }, [user?.id])

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!user?.id || !response.credential) {
      setError("Google did not return a login token.")
      return
    }

    setActionLoading("google")
    setError("")
    setNotice("")
    try {
      const linked = await postJson<AccountSecurity>("/api/auth/account/link-google", {
        userId: Number(user.id),
        credential: response.credential,
      })
      setAccount(linked)
      setNotice("Google account linked successfully.")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setActionLoading("")
    }
  }, [user?.id])

  useEffect(() => {
    setMounted(true)
    const rawTab = new URLSearchParams(window.location.search).get("tab")
    const tab = rawTab ? legacyTabs[rawTab] || rawTab : null
    if (tab && tabIds.includes(tab)) {
      setActiveTab(tab)
    }
  }, [])

  useEffect(() => {
    loadAccount()
  }, [loadAccount])

  useEffect(() => {
    if (activeTab !== "account" || !googleClientId || account?.googleLinked) {
      return
    }

    const renderGoogleButton = () => {
      const target = googleButtonRef.current
      if (!target || !window.google?.accounts.id) return

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      })

      target.innerHTML = ""
      window.google.accounts.id.renderButton(target, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: "continue_with",
        width: 220,
      })
      setGoogleReady(true)
    }

    if (window.google?.accounts.id) {
      renderGoogleButton()
      return
    }

    const existingScript = document.getElementById("google-identity-services")
    if (existingScript) {
      existingScript.addEventListener("load", renderGoogleButton, { once: true })
      return () => existingScript.removeEventListener("load", renderGoogleButton)
    }

    const script = document.createElement("script")
    script.id = "google-identity-services"
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = renderGoogleButton
    script.onerror = () => setError("Could not load Google sign-in.")
    document.head.appendChild(script)
  }, [account?.googleLinked, activeTab, googleClientId, handleGoogleCredential])

  const selectTab = (tab: string) => {
    setActiveTab(tab)
    const nextUrl = tab === "account" ? "/settings" : `/settings?tab=${tab}`
    window.history.replaceState(null, "", nextUrl)
  }

  const runAction = async (key: string, action: () => Promise<MessageResponse>) => {
    setActionLoading(key)
    setError("")
    setNotice("")
    try {
      const response = await action()
      setNotice(response.message)
      await loadAccount()
      return true
    } catch (err) {
      setError(getNetworkErrorMessage(err))
      return false
    } finally {
      setActionLoading("")
    }
  }

  const requestEmailVerification = () => {
    if (!user?.id) return
    runAction("verify-email", () => postJson<MessageResponse>("/api/auth/account/send-email-verification", {
      userId: Number(user.id),
    }))
  }

  const requestEmailChange = (event: FormEvent) => {
    event.preventDefault()
    if (!user?.id) return
    const email = newEmail.trim()
    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }
    runAction("change-email", () => postJson<MessageResponse>("/api/auth/account/change-email", {
      userId: Number(user.id),
      newEmail: email,
    }))
  }

  const changePassword = (event: FormEvent) => {
    event.preventDefault()
    if (!user?.id) return
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("New password confirmation does not match.")
      return
    }
    runAction("password", () => postJson<MessageResponse>("/api/auth/account/change-password", {
      userId: Number(user.id),
      currentPassword,
      newPassword,
    })).then((ok) => {
      if (ok) {
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
      }
    })
  }

  const requestDeleteAccount = (event: FormEvent) => {
    event.preventDefault()
    if (!user?.id || !account) return
    if (deleteConfirmation.trim().toLowerCase() !== account.email.toLowerCase()) {
      setError("Type your current email exactly to request account deletion.")
      return
    }
    runAction("delete", () => postJson<MessageResponse>("/api/auth/account/delete-request", {
      userId: Number(user.id),
    })).then((ok) => {
      if (ok) {
        setDeleteConfirmation("")
      }
    })
  }

  const linkGoogle = () => {
    if (!googleClientId) {
      setError("Google login is not configured yet.")
      return
    }
    window.google?.accounts.id.prompt()
  }

  const selectedTheme = mounted ? theme : "dark"
  const nameParts = user?.name?.trim().split(/\s+/) || []
  const initials = nameParts.map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AI"
  const completionItems = [
    Boolean(account?.emailVerified),
    Boolean(account?.googleLinked),
    Boolean(user?.avatarUrl),
    Boolean(user?.university || user?.major),
  ]
  const completion = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("settings")}</h1>
          <p className="mt-1 text-muted-foreground">{t("managePreferences")}</p>
        </div>
        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border/50 bg-card/60 p-2">
          {[
            { label: "Verified", value: account?.emailVerified ? "Yes" : "No" },
            { label: "Google", value: account?.googleLinked ? "Linked" : "Off" },
            { label: "Profile", value: `${completion}%` },
          ].map((stat) => (
            <div key={stat.label} className="min-w-24 rounded-lg bg-secondary/40 px-3 py-2 text-center">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-sm font-semibold text-foreground">{stat.value}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
        <motion.aside variants={item}>
          <div className="glass-card sticky top-6 rounded-xl p-3">
            {tabs.map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => selectTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                  activeTab === tab.id
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                }`}
                whileHover={{ x: 4 }}
              >
                <tab.icon className="h-4 w-4" />
                <span className="text-sm font-medium">{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.aside>

        <motion.main variants={item} className="min-w-0">
          {activeTab === "account" && (
            <div className="grid gap-5 2xl:grid-cols-[1.05fr_1.4fr]">
              <section className="glass-card rounded-xl p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-xl font-bold text-primary shadow-sm">
                      {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" className="h-full w-full rounded-2xl object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-foreground">{user?.name || t("student")}</p>
                      <p className="text-sm text-muted-foreground">{account?.email || user?.email}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill active={Boolean(account?.emailVerified)} activeText="Email verified" inactiveText="Email unverified" />
                        <StatusPill active={Boolean(account?.googleLinked)} activeText="Google linked" inactiveText="Google not linked" />
                      </div>
                    </div>
                  </div>
                  {isAccountLoading && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <InfoTile label="University" value={user?.university || "Not set"} />
                  <InfoTile label="Major" value={user?.major || "Not set"} />
                  <InfoTile label="Role" value={user?.role === "admin" ? "Admin" : "User"} />
                  <InfoTile label="Joined" value={formatDate(account?.createdAt)} />
                </div>

                <div className="mt-6 rounded-xl border border-border/50 bg-secondary/25 p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">Account readiness</p>
                      <p className="text-xs text-muted-foreground">Identity, recovery and sign-in coverage.</p>
                    </div>
                    <span className="text-sm font-semibold text-primary">{completion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${completion}%` }}
                    />
                  </div>
                </div>
              </section>

              <section className="grid gap-5">
                {(notice || error) && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`rounded-xl border px-4 py-3 text-sm ${
                      error
                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                        : "border-primary/30 bg-primary/10 text-primary"
                    }`}
                  >
                    {error || notice}
                  </motion.div>
                )}

                <div className="grid gap-5 lg:grid-cols-2">
                  <ActionPanel
                    icon={<Mail className="h-5 w-5" />}
                    title="Email verification"
                    description={account?.emailVerified ? `Verified on ${formatDate(account.emailVerifiedAt)}` : "Confirm your email to protect account recovery."}
                  >
                    <button
                      type="button"
                      disabled={account?.emailVerified || actionLoading === "verify-email"}
                      onClick={requestEmailVerification}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-55"
                    >
                      {actionLoading === "verify-email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {account?.emailVerified ? "Verified" : "Send verification"}
                    </button>
                  </ActionPanel>

                  <ActionPanel
                    icon={<Link2 className="h-5 w-5" />}
                    title="Google account"
                    description={account?.googleLinked ? "Google sign-in is connected to this account." : "Link Google for faster sign-in with the same email."}
                  >
                    {account?.googleLinked ? (
                      <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-primary/25 bg-primary/10 px-4 text-sm font-medium text-primary">
                        <GoogleIcon />
                        Linked
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={linkGoogle}
                        disabled={actionLoading === "google"}
                        className="relative inline-flex h-10 min-w-44 items-center justify-center gap-2 overflow-hidden rounded-xl border border-border/50 bg-card px-4 text-sm font-medium text-foreground hover:bg-secondary/60 disabled:opacity-60"
                      >
                        {googleClientId && <div ref={googleButtonRef} className="absolute inset-0 z-10 opacity-0" />}
                        {actionLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                        <span>{googleReady || !googleClientId ? "Link Google" : "Loading Google"}</span>
                      </button>
                    )}
                  </ActionPanel>
                </div>

                <div className="grid gap-5 xl:grid-cols-2">
                  <form onSubmit={requestEmailChange} className="glass-card rounded-xl p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Change email</h2>
                        <p className="text-sm text-muted-foreground">A confirmation link will be sent to the new email.</p>
                      </div>
                    </div>
                    <label className="mb-2 block text-sm font-medium text-foreground">New email</label>
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      className="w-full rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading === "change-email"}
                      className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                      {actionLoading === "change-email" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Send confirmation
                    </button>
                  </form>

                  <form onSubmit={changePassword} className="glass-card rounded-xl p-5">
                    <div className="mb-4 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <KeyRound className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="text-base font-semibold text-foreground">Password</h2>
                        <p className="text-sm text-muted-foreground">Update your password using the current one.</p>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <input
                        type="password"
                        value={currentPassword}
                        onChange={(event) => setCurrentPassword(event.target.value)}
                        placeholder="Current password"
                        className="w-full rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                      />
                      <div className="grid gap-3 sm:grid-cols-2">
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(event) => setNewPassword(event.target.value)}
                          placeholder="New password"
                          className="w-full rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Confirm new password"
                          className="w-full rounded-xl border border-border/50 bg-secondary/40 px-4 py-2.5 text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/20"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={actionLoading === "password"}
                      className="mt-4 inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-60"
                    >
                      {actionLoading === "password" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Update password
                    </button>
                  </form>
                </div>

                <form onSubmit={requestDeleteAccount} className="rounded-xl border border-destructive/25 bg-destructive/10 p-5">
                  <div className="grid gap-4 lg:grid-cols-[1fr_360px] lg:items-end">
                    <div>
                      <div className="mb-3 flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/15 text-destructive">
                          <Trash2 className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-semibold text-foreground">Delete account</h2>
                          <p className="text-sm text-muted-foreground">A final confirmation link will be sent to your current email.</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">Type your current email to request the deletion email.</p>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={deleteConfirmation}
                        onChange={(event) => setDeleteConfirmation(event.target.value)}
                        placeholder={account?.email || "current email"}
                        className="min-w-0 flex-1 rounded-xl border border-destructive/30 bg-background/60 px-4 py-2.5 text-foreground outline-none focus:ring-2 focus:ring-destructive/20"
                      />
                      <button
                        type="submit"
                        disabled={actionLoading === "delete"}
                        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-destructive px-4 text-sm font-medium text-destructive-foreground disabled:opacity-60"
                      >
                        {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                        Request
                      </button>
                    </div>
                  </div>
                </form>
              </section>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="grid gap-5 lg:grid-cols-2">
              {[
                { title: t("emailNotifications"), description: t("emailNotificationsDesc") },
                { title: t("pushNotifications"), description: t("pushNotificationsDesc") },
                { title: t("studyReminders"), description: t("studyRemindersDesc") },
                { title: t("weeklySummary"), description: t("weeklySummaryDesc") },
              ].map((notification) => (
                <div key={notification.title} className="glass-card rounded-xl p-5">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-medium text-foreground">{notification.title}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                    </div>
                    <button type="button" className="relative h-7 w-12 rounded-full bg-primary/20">
                      <motion.span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-primary" layout />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground">{t("appearance")}</h2>
              <div className="mt-5 grid gap-4 md:grid-cols-3">
                {[
                  { id: "light", label: t("light"), icon: Sun },
                  { id: "dark", label: t("dark"), icon: Moon },
                  { id: "system", label: t("system"), icon: Smartphone },
                ].map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setTheme(option.id)}
                    className={`rounded-xl border p-5 text-left transition-all ${
                      selectedTheme === option.id
                        ? "border-primary/35 bg-primary/15 text-primary"
                        : "border-border/50 bg-secondary/25 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <option.icon className="mb-4 h-6 w-6" />
                    <span className="text-sm font-semibold">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {(activeTab === "billing" || activeTab === "help") && (
            <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="glass-card rounded-xl p-6">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/15 text-primary">
                  {activeTab === "billing" ? <CreditCard className="h-6 w-6" /> : <HelpCircle className="h-6 w-6" />}
                </div>
                <h2 className="mt-5 text-lg font-semibold text-foreground">
                  {activeTab === "billing" ? t("billingSubscription") : t("helpSupport")}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{t("comingSoon")}</p>
              </div>
              <div className="grid gap-3">
                {["Account", "Documents", "AI Assistant"].map((label) => (
                  <div key={label} className="rounded-xl border border-border/50 bg-card/60 p-4">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">Ready for the next setup step.</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.main>
      </div>
    </motion.div>
  )
}

function StatusPill({ active, activeText, inactiveText }: { active: boolean; activeText: string; inactiveText: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        active ? "bg-primary/15 text-primary" : "bg-secondary/60 text-muted-foreground"
      }`}
    >
      {active ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
      {active ? activeText : inactiveText}
    </span>
  )
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-medium text-foreground">{value}</p>
    </div>
  )
}

function ActionPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div className="glass-card rounded-xl p-5">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
          {icon}
        </div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-foreground">{title}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}
