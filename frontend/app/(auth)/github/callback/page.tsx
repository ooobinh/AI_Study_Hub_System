"use client"

import { Suspense, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowRight, Github, Sparkles } from "lucide-react"
import { LogoLoader } from "@/components/layout/logo-loader"
import { useAuth } from "@/components/providers/auth-provider"
import { getNetworkErrorMessage } from "@/lib/api"

export default function GithubCallbackPage() {
  return (
    <Suspense fallback={<GithubCallbackShell message="Connecting GitHub..." />}>
      <GithubCallbackContent />
    </Suspense>
  )
}

function GithubCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { loginWithGithubCode } = useAuth()
  const handledRef = useRef(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (handledRef.current) {
      return
    }
    handledRef.current = true

    const oauthError = searchParams.get("error_description") || searchParams.get("error")
    const code = searchParams.get("code")
    const returnedState = searchParams.get("state")
    const storedState = localStorage.getItem("aiStudyHubGithubOAuthState")

    if (oauthError) {
      localStorage.removeItem("aiStudyHubGithubOAuthState")
      setError(oauthError)
      return
    }

    if (!code) {
      localStorage.removeItem("aiStudyHubGithubOAuthState")
      setError("GitHub did not return a login code. Please try again.")
      return
    }

    if (!storedState || !returnedState || storedState !== returnedState) {
      localStorage.removeItem("aiStudyHubGithubOAuthState")
      setError("GitHub login session expired. Please try again.")
      return
    }

    const completeLogin = async () => {
      try {
        const redirectUri = `${window.location.origin}/github/callback`
        await loginWithGithubCode(code, redirectUri)
        localStorage.removeItem("aiStudyHubGithubOAuthState")
        router.replace("/dashboard")
      } catch (err) {
        localStorage.removeItem("aiStudyHubGithubOAuthState")
        setError(getNetworkErrorMessage(err))
      }
    }

    completeLogin()
  }, [loginWithGithubCode, router, searchParams])

  if (error) {
    return <GithubCallbackShell error={error} />
  }

  return <GithubCallbackShell message="Signing you in with GitHub..." />
}

function GithubCallbackShell({ message, error }: { message?: string; error?: string }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 gradient-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-card relative w-full max-w-md rounded-2xl p-8 text-center backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center justify-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 glow-primary">
            <span className="absolute inset-1 rounded-xl bg-gradient-to-br from-primary/25 via-accent/15 to-transparent" />
            <Sparkles className="relative h-6 w-6 text-primary" />
          </div>
          <div className="text-left">
            <h1 className="text-xl font-bold text-foreground">AI Study Hub</h1>
            <p className="text-xs text-muted-foreground">GitHub Login</p>
          </div>
        </div>

        {error ? (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/25 bg-destructive/10 text-destructive">
              <Github className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">Could not sign in with GitHub</h2>
            <p className="mt-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90"
            >
              Back to login
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        ) : (
          <LogoLoader className="min-h-0 py-0" label="AI Study Hub" sublabel={message || "Please wait..."} />
        )}
      </motion.div>
    </div>
  )
}
