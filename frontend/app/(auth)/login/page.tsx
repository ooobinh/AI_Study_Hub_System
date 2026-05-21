"use client"

import { motion } from "framer-motion"
import { useState } from "react"
import { Sparkles, Mail, Lock, User, Github, ArrowRight, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import { emailFormatMessage, isValidEmail } from "@/lib/validation"

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
  const router = useRouter()
  const { login, register } = useAuth()
  const emailIsInvalid = emailTouched && email.trim().length > 0 && !isValidEmail(email)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setMessage("")
    setEmailTouched(true)

    if (isForgotPassword) {
      if (!email.trim()) {
        setError("Please enter your email address.")
        return
      }
      if (!isValidEmail(email)) {
        setError(emailFormatMessage)
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
          throw new Error(body?.message || "Could not send reset email")
        }
        setMessage(body?.message || "If that email exists, a password reset link has been sent.")
      } catch (err) {
        setError(getNetworkErrorMessage(err))
      } finally {
        setIsSubmitting(false)
      }
      return
    }

    if (!email.trim() || !password.trim() || (!isLogin && !name.trim())) {
      setError(isLogin ? "Please enter email and password." : "Please enter your name, email, and password.")
      return
    }
    if (!isValidEmail(email)) {
      setError(emailFormatMessage)
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
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh" />
      
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
              className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center glow-primary"
              whileHover={{ scale: 1.05, rotate: 5 }}
            >
              <Sparkles className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h1 className="text-xl font-bold text-foreground">AI Study Hub</h1>
              <p className="text-xs text-muted-foreground">Smart Learning Platform</p>
            </div>
          </motion.div>

          {/* Toggle */}
          <div className="flex mb-6 p-1 rounded-xl bg-secondary/50">
            {["Login", "Register"].map((tab, i) => (
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
                Enter your email and we will send a secure link to create a new password.
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
              <label className="block text-sm font-medium text-foreground mb-2">Full Name</label>
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
              <label className="block text-sm font-medium text-foreground mb-2">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    if (error === emailFormatMessage) {
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
                  {emailFormatMessage}
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
              <label className="block text-sm font-medium text-foreground mb-2">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  minLength={6}
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
                  Forgot password?
                </button>
              </motion.div>
            )}

            {isForgotPassword && (
              <button
                type="button"
                onClick={() => { setIsForgotPassword(false); setError(""); setMessage(""); setEmailTouched(false) }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Back to sign in
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
              {isSubmitting ? "Please wait..." : isForgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Create Account"}
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-xs text-muted-foreground">or continue with</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          {/* Social Logins */}
          <div className="flex gap-3">
            <motion.button
              className="flex-1 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Google
            </motion.button>
            <motion.button
              className="flex-1 py-3 rounded-xl bg-secondary/50 border border-border/50 text-foreground font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Github className="w-5 h-5" />
              GitHub
            </motion.button>
          </div>

          {/* Terms */}
          <p className="text-xs text-muted-foreground text-center mt-6">
            By continuing, you agree to our{" "}
            <button className="text-primary hover:underline">Terms of Service</button>
            {" "}and{" "}
            <button className="text-primary hover:underline">Privacy Policy</button>
          </p>
        </div>
      </motion.div>
    </div>
  )
}
