"use client"

import { motion } from "framer-motion"
import {
  ChangeEvent,
  FormEvent,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useTheme } from "next-themes"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { LogoLoader } from "@/components/layout/logo-loader"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import { isValidEmail } from "@/lib/validation"
import {
  AlertTriangle,
  Bell,
  Camera,
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
  Upload,
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
  emailVerificationDeadline?: string | null
}

interface BackendUser {
  id: number
  fullName: string
  email: string
  avatarUrl?: string | null
  university?: string | null
  major?: string | null
  roles: string[]
}

interface MessageResponse {
  message: string
}

type SectionFeedbackState = Record<string, {
  type: "success" | "error"
  message: string
}>

const tabIds = ["account", "notifications", "appearance", "billing", "help"]
const legacyTabs: Record<string, string> = {
  profile: "account",
  security: "account",
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}

const item = {
  hidden: { opacity: 0, y: 14 },
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

function splitName(value?: string | null) {
  const parts = value?.trim().split(/\s+/).filter(Boolean) || []
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  }
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
  const [feedback, setFeedback] = useState<SectionFeedbackState>({})
  const [newEmail, setNewEmail] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    major: "",
    university: "",
  })
  const [googleReady, setGoogleReady] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement | null>(null)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const { theme, setTheme } = useTheme()
  const { user, updateUser } = useAuth()
  const updateUserRef = useRef(updateUser)
  const { t } = useLanguage()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  const tabs = [
    { id: "account", label: "Account & Security", icon: ShieldCheck },
    { id: "notifications", label: t("notifications"), icon: Bell },
    { id: "appearance", label: t("appearance"), icon: Palette },
    { id: "billing", label: t("billing"), icon: CreditCard },
    { id: "help", label: t("help"), icon: HelpCircle },
  ]

  useEffect(() => {
    updateUserRef.current = updateUser
  }, [updateUser])

  const setSectionFeedback = (section: string, type: "success" | "error", message: string) => {
    setFeedback((current) => ({ ...current, [section]: { type, message } }))
  }

  const clearSectionFeedback = (section: string) => {
    setFeedback((current) => {
      const next = { ...current }
      delete next[section]
      return next
    })
  }

  const clearAllFeedback = () => setFeedback({})

  useEffect(() => {
    const nextName = splitName(user?.name)
    setProfileForm({
      firstName: nextName.firstName,
      lastName: nextName.lastName,
      major: user?.major || "",
      university: user?.university || "",
    })
  }, [user?.id, user?.major, user?.name, user?.university])

  const loadAccount = useCallback(async () => {
    if (!user?.id) return
    setIsAccountLoading(true)
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/account/security?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load account security")
      }
      const security = body as AccountSecurity
      setAccount(security)
      setNewEmail(security.email)
      const fallbackDeadline = security.createdAt
        ? new Date(new Date(security.createdAt).getTime() + 24 * 60 * 60 * 1000).toISOString()
        : null
      updateUserRef.current({
        email: security.email,
        emailVerified: security.emailVerified,
        emailVerificationDeadline: security.emailVerificationDeadline || fallbackDeadline,
      })
    } catch (err) {
      setSectionFeedback("account", "error", getNetworkErrorMessage(err))
    } finally {
      setIsAccountLoading(false)
    }
  }, [user?.email, user?.id])

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!user?.id || !response.credential) {
      setSectionFeedback("google", "error", "Google did not return a login token.")
      return
    }

    setActionLoading("google")
    clearSectionFeedback("google")
    try {
      const linked = await postJson<AccountSecurity>("/api/auth/account/link-google", {
        userId: Number(user.id),
        credential: response.credential,
      })
      setAccount(linked)
      setSectionFeedback("google", "success", "Google account linked successfully.")
    } catch (err) {
      setSectionFeedback("google", "error", getNetworkErrorMessage(err))
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
    script.onerror = () => setSectionFeedback("google", "error", "Could not load Google sign-in.")
    document.head.appendChild(script)
  }, [account?.googleLinked, activeTab, googleClientId, handleGoogleCredential])

  const selectTab = (tab: string) => {
    setActiveTab(tab)
    clearAllFeedback()
    const nextUrl = tab === "account" ? "/settings" : `/settings?tab=${tab}`
    window.history.replaceState(null, "", nextUrl)
  }

  const runAction = async (key: string, action: () => Promise<MessageResponse>) => {
    setActionLoading(key)
    clearSectionFeedback(key)
    try {
      const response = await action()
      setSectionFeedback(key, "success", response.message)
      await loadAccount()
      return true
    } catch (err) {
      setSectionFeedback(key, "error", getNetworkErrorMessage(err))
      return false
    } finally {
      setActionLoading("")
    }
  }

  const uploadAvatar = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.id) return

    const formData = new FormData()
    formData.append("file", file)
    setActionLoading("avatar")
    clearSectionFeedback("avatar")
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/users/${user.id}/avatar`, {
        method: "POST",
        body: formData,
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not upload avatar")
      }
      const nextUser = body as BackendUser
      updateUser({ avatarUrl: nextUser.avatarUrl })
      setSectionFeedback("avatar", "success", "Profile picture updated.")
    } catch (err) {
      setSectionFeedback("avatar", "error", getNetworkErrorMessage(err))
    } finally {
      setActionLoading("")
      event.target.value = ""
    }
  }

  const deleteAvatar = async () => {
    if (!user?.id) return
    setActionLoading("avatar-delete")
    clearSectionFeedback("avatar")
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/users/${user.id}/avatar`, {
        method: "DELETE",
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not delete avatar")
      }
      updateUser({ avatarUrl: null })
      setSectionFeedback("avatar", "success", "Profile picture removed.")
    } catch (err) {
      setSectionFeedback("avatar", "error", getNetworkErrorMessage(err))
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

  const resetProfileForm = () => {
    const nextName = splitName(user?.name)
    setProfileForm({
      firstName: nextName.firstName,
      lastName: nextName.lastName,
      major: user?.major || "",
      university: user?.university || "",
    })
    clearSectionFeedback("profile")
  }

  const saveProfile = async (event: FormEvent) => {
    event.preventDefault()
    if (!user?.id) return

    const fullName = `${profileForm.firstName} ${profileForm.lastName}`.replace(/\s+/g, " ").trim()
    if (!fullName) {
      setSectionFeedback("profile", "error", "Please enter your name.")
      return
    }

    setActionLoading("profile")
    clearSectionFeedback("profile")
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/users/${user.id}/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          university: profileForm.university.trim() || null,
          major: profileForm.major.trim() || null,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not update profile")
      }

      const nextUser = body as BackendUser
      updateUser({
        name: nextUser.fullName,
        avatarUrl: nextUser.avatarUrl,
        university: nextUser.university,
        major: nextUser.major,
      })
      setSectionFeedback("profile", "success", "Personal information updated.")
    } catch (err) {
      setSectionFeedback("profile", "error", getNetworkErrorMessage(err))
    } finally {
      setActionLoading("")
    }
  }

  const requestEmailChange = (event: FormEvent) => {
    event.preventDefault()
    if (!user?.id) return
    const email = newEmail.trim()
    if (!isValidEmail(email)) {
      setSectionFeedback("change-email", "error", "Please enter a valid email address.")
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
      setSectionFeedback("password", "error", "New password must be at least 6 characters.")
      return
    }
    if (newPassword !== confirmPassword) {
      setSectionFeedback("password", "error", "New password confirmation does not match.")
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
      setSectionFeedback("delete", "error", "Type your current email exactly to request account deletion.")
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
      setSectionFeedback("google", "error", "Google login is not configured yet.")
      return
    }
    window.google?.accounts.id.prompt()
  }

  const selectedTheme = mounted ? theme : "dark"
  const { firstName, lastName } = splitName(user?.name)
  const initials = [firstName, lastName].filter(Boolean).map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "AI"

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-7xl space-y-8">
      <motion.header variants={item} className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold tracking-normal text-foreground">Settings</h1>
        <p className="text-base text-muted-foreground">Manage and secure your account</p>
      </motion.header>

      <div className="grid gap-10 lg:grid-cols-[230px_minmax(0,1fr)]">
        <motion.aside variants={item} className="lg:sticky lg:top-6 lg:h-fit">
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => selectTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  activeTab === tab.id
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </motion.aside>

        <motion.main variants={item} className="min-w-0">
          {activeTab === "account" && (
            <div className="divide-y divide-border/70">
              <SettingRow
                title="Profile picture"
                description="Accepted files JPG, PNG, SVG"
              >
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      onChange={uploadAvatar}
                      className="hidden"
                    />
                    <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-primary/15 text-lg font-semibold text-primary">
                      {user?.avatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      disabled={actionLoading === "avatar"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-secondary disabled:opacity-60"
                    >
                      {actionLoading === "avatar" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Upload
                    </button>
                    <button
                      type="button"
                      onClick={deleteAvatar}
                      disabled={!user?.avatarUrl || actionLoading === "avatar-delete"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl border border-destructive/30 bg-background px-4 text-sm font-medium text-destructive shadow-sm hover:bg-destructive/10 disabled:opacity-50"
                    >
                      {actionLoading === "avatar-delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      Delete
                    </button>
                  </div>
                  <SectionFeedback feedback={feedback.avatar} />
                </div>
              </SettingRow>

              <SettingRow
                title="Personal Information"
                description="Shown on your public profile"
              >
                <form onSubmit={saveProfile} className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="First name"
                      value={profileForm.firstName}
                      onChange={(value) => setProfileForm((current) => ({ ...current, firstName: value }))}
                    />
                    <Field
                      label="Last name"
                      value={profileForm.lastName}
                      placeholder="Last name"
                      onChange={(value) => setProfileForm((current) => ({ ...current, lastName: value }))}
                    />
                    <Field
                      label="Email Address"
                      value={account?.email || user?.email || ""}
                      readOnly
                      className="md:col-span-2"
                    />
                    <Field
                      label="Major"
                      value={profileForm.major}
                      placeholder="Not set"
                      onChange={(value) => setProfileForm((current) => ({ ...current, major: value }))}
                    />
                    <Field
                      label="University"
                      value={profileForm.university}
                      placeholder="Not set"
                      onChange={(value) => setProfileForm((current) => ({ ...current, university: value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={resetProfileForm}
                      className="inline-flex h-10 items-center rounded-xl border border-border bg-background px-5 text-sm font-medium text-muted-foreground shadow-sm hover:bg-secondary hover:text-foreground"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading === "profile"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background disabled:opacity-60"
                    >
                      {actionLoading === "profile" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Save
                    </button>
                  </div>
                  <SectionFeedback feedback={feedback.profile} />
                </form>
              </SettingRow>

              <SettingRow
                title="Email verification"
                description={account?.emailVerified ? `Verified on ${formatDate(account.emailVerifiedAt)}` : "Confirm your email before sensitive account changes"}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusPill active={Boolean(account?.emailVerified)} activeText="Verified" inactiveText="Not verified" />
                  <button
                    type="button"
                    onClick={requestEmailVerification}
                    disabled={account?.emailVerified || actionLoading === "verify-email"}
                    className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-50"
                  >
                    {actionLoading === "verify-email" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Send email
                  </button>
                </div>
                <SectionFeedback feedback={feedback["verify-email"]} />
              </SettingRow>

              <SettingRow
                title="Change email"
                description="A confirmation link will be sent to the new email"
              >
                <form onSubmit={requestEmailChange} className="space-y-3">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="email"
                      value={newEmail}
                      onChange={(event) => setNewEmail(event.target.value)}
                      className="h-10 min-w-0 flex-1 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={actionLoading === "change-email"}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-foreground px-4 text-sm font-medium text-background disabled:opacity-60"
                    >
                      {actionLoading === "change-email" && <Loader2 className="h-4 w-4 animate-spin" />}
                      Confirm
                    </button>
                  </div>
                  <SectionFeedback feedback={feedback["change-email"]} />
                </form>
              </SettingRow>

              <SettingRow
                title="Google account"
                description="Use Google sign-in with your AI Study Hub account"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <StatusPill active={Boolean(account?.googleLinked)} activeText="Linked" inactiveText="Not linked" />
                  {account?.googleLinked ? (
                    <div className="inline-flex h-10 items-center gap-2 rounded-xl border border-border bg-secondary/50 px-4 text-sm font-medium text-foreground">
                      <GoogleIcon />
                      Google
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={linkGoogle}
                      disabled={actionLoading === "google"}
                      className="relative inline-flex h-10 min-w-44 items-center justify-center gap-2 overflow-hidden rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm hover:bg-secondary disabled:opacity-60"
                    >
                      {googleClientId && <div ref={googleButtonRef} className="absolute inset-0 z-10 opacity-0" />}
                      {actionLoading === "google" ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleIcon />}
                      <span>{googleReady || !googleClientId ? "Link Google" : "Loading Google"}</span>
                    </button>
                  )}
                </div>
                <SectionFeedback feedback={feedback.google} />
              </SettingRow>

              <SettingRow
                title="Password"
                description="Secure your account"
              >
                <form onSubmit={changePassword} className="grid gap-3">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    placeholder="Current password"
                    className="h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                  />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(event) => setNewPassword(event.target.value)}
                      placeholder="New password"
                      className="h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Confirm new password"
                      className="h-10 rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading === "password"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-foreground px-5 text-sm font-medium text-background disabled:opacity-60"
                    >
                      {actionLoading === "password" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                      Reset Password
                    </button>
                  </div>
                  <SectionFeedback feedback={feedback.password} />
                </form>
              </SettingRow>

              <SettingRow
                title="Delete account"
                description="Requires confirmation from your current email"
                danger
              >
                <form onSubmit={requestDeleteAccount} className="grid gap-3">
                  <input
                    type="email"
                    value={deleteConfirmation}
                    onChange={(event) => setDeleteConfirmation(event.target.value)}
                    placeholder={account?.email || "Type your email"}
                    className="h-10 rounded-xl border border-destructive/30 bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-destructive/20"
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={actionLoading === "delete"}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-destructive px-5 text-sm font-medium text-destructive-foreground disabled:opacity-60"
                    >
                      {actionLoading === "delete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                      Send delete link
                    </button>
                  </div>
                  <SectionFeedback feedback={feedback.delete} />
                </form>
              </SettingRow>

              {isAccountLoading && (
                <LogoLoader compact label="AI Study Hub" sublabel="Loading account details..." />
              )}
              <SectionFeedback feedback={feedback.account} />
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="divide-y divide-border/70">
              {[
                { title: t("emailNotifications"), description: t("emailNotificationsDesc") },
                { title: t("pushNotifications"), description: t("pushNotificationsDesc") },
                { title: t("studyReminders"), description: t("studyRemindersDesc") },
                { title: t("weeklySummary"), description: t("weeklySummaryDesc") },
              ].map((notification) => (
                <SettingRow key={notification.title} title={notification.title} description={notification.description}>
                  <div className="flex justify-end">
                    <button type="button" className="relative h-7 w-12 rounded-full bg-primary/20">
                      <motion.span className="absolute left-1 top-1 h-5 w-5 rounded-full bg-primary" layout />
                    </button>
                  </div>
                </SettingRow>
              ))}
            </div>
          )}

          {activeTab === "appearance" && (
            <div className="divide-y divide-border/70">
              <SettingRow title="Theme" description="Choose how AI Study Hub looks on this device">
                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    { id: "light", label: t("light"), icon: Sun },
                    { id: "dark", label: t("dark"), icon: Moon },
                    { id: "system", label: t("system"), icon: Smartphone },
                  ].map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setTheme(option.id)}
                      className={`flex h-24 flex-col items-center justify-center gap-2 rounded-xl border text-sm font-medium transition-colors ${
                        selectedTheme === option.id
                          ? "border-primary/40 bg-primary/10 text-primary"
                          : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <option.icon className="h-5 w-5" />
                      {option.label}
                    </button>
                  ))}
                </div>
              </SettingRow>
            </div>
          )}

          {(activeTab === "billing" || activeTab === "help") && (
            <div className="divide-y divide-border/70">
              <SettingRow
                title={activeTab === "billing" ? t("billingSubscription") : t("helpSupport")}
                description={t("comingSoon")}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  {["Account", "Documents", "AI Assistant", "Workspace"].map((label) => (
                    <div key={label} className="rounded-xl border border-border bg-background px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="mt-1 text-xs text-muted-foreground">Ready for setup.</p>
                    </div>
                  ))}
                </div>
              </SettingRow>
            </div>
          )}
        </motion.main>
      </div>
    </motion.div>
  )
}

function SettingRow({
  title,
  description,
  children,
  danger = false,
}: {
  title: string
  description: string
  children: ReactNode
  danger?: boolean
}) {
  return (
    <section className="grid gap-5 py-9 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.25fr)] lg:items-start">
      <div>
        <h2 className={`text-lg font-semibold ${danger ? "text-destructive" : "text-foreground"}`}>{title}</h2>
        <p className="mt-1 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <div>{children}</div>
    </section>
  )
}

function Field({
  label,
  value,
  placeholder,
  readOnly,
  onChange,
  className = "",
}: {
  label: string
  value: string
  placeholder?: string
  readOnly?: boolean
  onChange?: (value: string) => void
  className?: string
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(event) => onChange?.(event.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/20 read-only:text-muted-foreground"
      />
    </label>
  )
}

function SectionFeedback({ feedback }: { feedback?: { type: "success" | "error"; message: string } }) {
  if (!feedback) {
    return null
  }

  const isError = feedback.type === "error"
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-xl border px-3 py-2 text-sm ${
        isError
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-primary/30 bg-primary/10 text-primary"
      }`}
    >
      {feedback.message}
    </motion.div>
  )
}

function StatusPill({
  active,
  activeText,
  inactiveText,
}: {
  active: boolean
  activeText: string
  inactiveText: string
}) {
  return (
    <span
      className={`inline-flex h-9 items-center gap-2 rounded-full px-3 text-sm font-medium ${
        active ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"
      }`}
    >
      {active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      {active ? activeText : inactiveText}
    </span>
  )
}
