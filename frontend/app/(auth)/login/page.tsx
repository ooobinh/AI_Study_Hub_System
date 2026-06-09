"use client"

import { AnimatePresence, motion } from "framer-motion"
import { useCallback, useEffect, useRef, useState } from "react"
import { Sparkles, Mail, Lock, User, Github, ArrowRight, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { LanguageSwitcher } from "@/components/layout/language-switcher"
import { LogoLoader } from "@/components/layout/logo-loader"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import { isValidPassword, passwordPolicyMessage } from "@/lib/validation"
import { isValidEmail } from "@/lib/validation"

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

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isForgotPassword, setIsForgotPassword] = useState(false)
  const [emailTouched, setEmailTouched] = useState(false)
  const [isGoogleReady, setIsGoogleReady] = useState(false)
  const googleButtonRef = useRef<HTMLDivElement | null>(null)
  const router = useRouter()
  const { login, loginWithGoogleCredential, register } = useAuth()
  const { t } = useLanguage()
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const githubClientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID
  const emailIsInvalid = emailTouched && email.trim().length > 0 && !isValidEmail(email)

  const handleGoogleCredential = useCallback(async (response: GoogleCredentialResponse) => {
    if (!response.credential) {
      setError(t("googleNoToken"))
      return
    }

    setError("")
    setMessage("")
    setIsSubmitting(true)
    try {
      await loginWithGoogleCredential(response.credential)
      router.push("/dashboard")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }, [loginWithGoogleCredential, router, t])

  const handleGoogleButtonClick = () => {
    if (!googleClientId) {
      setError(t("googleNotConfigured"))
      return
    }
    window.google?.accounts.id.prompt()
  }

  const handleGithubLogin = () => {
    if (!githubClientId) {
      setError("GitHub login is not configured. Add NEXT_PUBLIC_GITHUB_CLIENT_ID in frontend and GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET in backend.")
      return
    }

    const redirectUri = `${window.location.origin}/github/callback`
    const state = window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`
    localStorage.setItem("aiStudyHubGithubOAuthState", state)
    setError("")
    setMessage("")
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${encodeURIComponent(githubClientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent("read:user user:email")}&state=${encodeURIComponent(state)}`
  }

  useEffect(() => {
    if (isForgotPassword || !googleClientId) {
      return
    }

    const renderGoogleButton = () => {
      const buttonTarget = googleButtonRef.current
      if (!buttonTarget || !window.google?.accounts.id) {
        return
      }

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleCredential,
      })

      buttonTarget.innerHTML = ""
      window.google.accounts.id.renderButton(buttonTarget, {
        theme: "outline",
        size: "large",
        type: "standard",
        shape: "rectangular",
        text: isLogin ? "continue_with" : "signup_with",
        width: 128,
      })
      setIsGoogleReady(true)
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
    script.onerror = () => setError(t("googleLoadFailed"))
    document.head.appendChild(script)
  }, [googleClientId, handleGoogleCredential, isForgotPassword, isLogin, t])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setEmailTouched(true)

    if (isForgotPassword) {
      if (!email.trim()) {
        setError(t("pleaseEnterEmail"))
        return
      }
      if (!isValidEmail(email)) {
        setError(t("invalidEmailFormat"))
        return
      }

      setIsSubmitting(true)
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/forgot-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        })
        const body = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(body?.message || t("couldNotSendReset"))
        }
        setMessage(body?.message || t("resetEmailSent"))
      } catch (err) {
        setError(getNetworkErrorMessage(err))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError(isLogin ? t("pleaseEnterLogin") : t("pleaseEnterRegister"))
      return
    }
    if (!isValidEmail(email)) {
      setError(t("invalidEmailFormat"))
      return
    }
    if (!isLogin && !isValidPassword(password)) {
      setError(passwordPolicyMessage)
      return
    }

    setIsSubmitting(true)
    try {
      if (isLogin) {
        await login(email.trim(), password)
      } else {
        await register(name.trim(), email.trim(), password)
      }
      router.push("/dashboard")
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute right-4 top-4 z-30">
        <LanguageSwitcher position="top" />
      </div>

      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh" />

      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40 flex items-center justify-center bg-background/65 p-4 backdrop-blur-xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              className="glass-card rounded-2xl px-10 py-8 shadow-2xl"
            >
              <LogoLoader
                className="min-h-0 py-0"
                label="AI Study Hub"
                sublabel={isForgotPassword ? t("sendResetLink") : t("pleaseWait")}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating Orbs */}
      <motion.div
        className="absolute w-96 h-96 rounded-full bg-primary/20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        style={{ top: "10%", left: "10%" }}
      />
      <motion.div
        className="absolute w-80 h-80 rounded-full bg-accent/15 blur-3xl"
        animate={{
          x: [0, -80, 0],
          y: [0, 80, 0],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        style={{ bottom: "10%", right: "10%" }}
      />
      <motion.div
        className="absolute w-64 h-64 rounded-full bg-chart-3/10 blur-3xl"
        animate={{
          x: [0, 50, 0],
          y: [0, 100, 0],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: "linear" }}
        style={{ top: "50%", right: "30%" }}
      />

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="glass-card rounded-2xl p-8 backdrop-blur-xl">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <motion.div
              className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 glow-primary"
              whileHover={{ scale: 1.05, rotate: 4 }}
            >
              <span className="absolute inset-1 rounded-xl bg-gradient-to-br from-primary/25 via-accent/15 to-transparent" />
              <Sparkles className="relative w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Study Hub</h1>
              <p className="text-xs text-muted-foreground">{t("smartLearningPlatform")}</p>
            </div>
          </motion.div>

          {/* Toggle */}
          <div className="flex mb-6 p-1 rounded-xl bg-secondary/50">
            {[t("login"), t("register")].map((tab, i) => (
              <motion.button
                key={tab}
                onClick={() => { setIsLogin(i === 0); setIsForgotPassword(false); setError(""); setMessage(""); setEmailTouched(false) }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  (i === 0 ? isLogin : !isLogin)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                whileHover={{ scale: (i === 0 ? isLogin : !isLogin) ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {tab}
              </motion.button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isForgotPassword && (
              <div className="rounded-xl border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-muted-foreground">
                {t("forgotPasswordHelp")}
              </div>
            )}

            {/* Name Field (Register only) */}
            <motion.div
              initial={false}
              animate={{
                height: isLogin || isForgotPassword ? 0 : "auto",
                opacity: isLogin || isForgotPassword ? 0 : 1,
                marginBottom: isLogin || isForgotPassword ? 0 : 16
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-foreground mb-2">{t("fullName")}</label>
              <div className="relative group">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label className="block text-sm font-medium text-foreground mb-2">{t("emailAddress")}</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error === t("invalidEmailFormat")) {
                      setError("")
                    }
                  }}
                  onBlur={() => setEmailTouched(true)}
                  placeholder="you@university.edu"
                  required={!isForgotPassword}
                  aria-invalid={emailIsInvalid}
                  className={`w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/50 border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                    emailIsInvalid
                      ? "border-destructive/60 focus:border-destructive/60 focus:ring-destructive/20"
                      : "border-border/50 focus:border-primary/50 focus:ring-primary/30"
                  }`}
                />
              </div>
              {emailIsInvalid && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 rounded-lg border border-destructive/25 bg-destructive/10 px-3 py-2 text-xs text-destructive"
                >
                  {t("invalidEmailFormat")}
                </motion.p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{
                opacity: isForgotPassword ? 0 : 1,
                x: isForgotPassword ? -20 : 0,
                height: isForgotPassword ? 0 : "auto",
                marginBottom: isForgotPassword ? 0 : 16
              }}
              transition={{ delay: 0.3 }}
              className="overflow-hidden"
            >
              <label className="block text-sm font-medium text-foreground mb-2">{t("password")}</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("enterPassword")}
                  required
                  minLength={isLogin ? 1 : 8}
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </motion.div>

            {/* Forgot Password */}
            {isLogin && !isForgotPassword && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-right"
              >
                <button
                  type="button"
                  onClick={() => { setIsForgotPassword(true); setError(""); setMessage(""); setEmailTouched(false) }}
                  className="text-sm text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </button>
              </motion.div>
            )}

            {isForgotPassword && (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); setEmailTouched(false) }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                {t("backToSignIn")}
              </button>
            )}

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </motion.p>
            )}

            {message && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm text-primary"
              >
                {message}
              </motion.p>
            )}

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-medium flex items-center justify-center gap-2 glow-primary disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={isSubmitting ? {} : { scale: 1.02 }}
              whileTap={isSubmitting ? {} : { scale: 0.98 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              {isSubmitting ? t("pleaseWait") : isForgotPassword ? t("sendResetLink") : isLogin ? t("signIn") : t("createAccount")}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          {!isForgotPassword && (
            <>
              {/* Divider */}
              <div className="flex items-center gap-4 my-6">
                <div className="flex-1 h-px bg-border/50" />
                <span className="text-xs text-muted-foreground">{t("orContinueWith")}</span>
                <div className="flex-1 h-px bg-border/50" />
              </div>

              {/* Social Logins */}
              <div className="flex items-center justify-center gap-3">
                <motion.div
                  onClick={handleGoogleButtonClick}
                  className={`relative flex h-12 w-32 items-center justify-center overflow-hidden rounded-xl border border-border/50 bg-card/80 px-3 shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary/70 ${
                    isSubmitting ? "pointer-events-none opacity-60" : ""
                  }`}
                  title="Google"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {googleClientId ? (
                    <>
                      <div
                        ref={googleButtonRef}
                        className="absolute inset-0 z-20 flex items-center justify-center opacity-0"
                      />
                      <div className="pointer-events-none flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                        <span>Google</span>
                      </div>
                      {!isGoogleReady && (
                        <span className="absolute inset-x-3 bottom-1 h-px animate-pulse rounded bg-primary/30" />
                      )}
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setError(t("googleNotConfigured"))}
                      className="flex h-full w-full items-center justify-center gap-2 rounded-xl text-sm font-medium text-foreground hover:bg-secondary"
                      aria-label={t("googleNotConfigured")}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      Google
                    </button>
                  )}
                </motion.div>
                <motion.button
                  type="button"
                  onClick={handleGithubLogin}
                  disabled={isSubmitting}
                  className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/50 bg-card/70 text-foreground shadow-sm transition-colors hover:border-primary/30 hover:bg-secondary/70"
                  aria-label="Continue with GitHub"
                  title="Continue with GitHub"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Github className="w-5 h-5" />
                </motion.button>
              </div>
            </>
          )}

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            {t("termsPrefix")}{" "}
            <button className="text-primary hover:underline">{t("termsOfService")}</button>
            {" "}{t("and")}{" "}
            <button className="text-primary hover:underline">{t("privacyPolicy")}</button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
