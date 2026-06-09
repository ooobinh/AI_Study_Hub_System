"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, MailCheck, XCircle } from "lucide-react"
import { LogoLoader } from "@/components/layout/logo-loader"
import { useAuth } from "@/components/providers/auth-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface MessageResponse {
  message: string
}

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { updateUser } = useAuth()
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError("Verification token is missing.")
      setLoading(false)
      return
    }

    const verify = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/verify-email?token=${encodeURIComponent(token)}`)
        const body = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(body?.message || "Could not verify this email.")
        }
        const result = body as MessageResponse
        setMessage(result.message || "Email verified successfully.")
        updateUser({ emailVerified: true, emailVerificationDeadline: null })
      } catch (err) {
        setError(getNetworkErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    verify()
  }, [token])

  const isSuccess = Boolean(message) && !error

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 gradient-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-card relative w-full max-w-lg rounded-2xl p-8 text-center"
      >
        {loading ? (
          <LogoLoader compact label="AI Study Hub" sublabel="Verifying your email..." className="py-0" />
        ) : (
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/25 bg-primary/15 text-primary">
            {isSuccess ? (
              <CheckCircle2 className="h-8 w-8" />
            ) : (
              <XCircle className="h-8 w-8 text-destructive" />
            )}
          </div>
        )}

        <div className="mt-6 flex items-center justify-center gap-2 text-sm font-medium text-muted-foreground">
          <MailCheck className="h-4 w-4" />
          AI Study Hub
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          {loading ? "Verifying email" : isSuccess ? "Email verified" : "Verification failed"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {loading ? "Please wait while we check your secure link." : error || message}
        </p>
        {!loading && (
          <div className="mt-8 flex justify-center gap-3">
            <Link
              href={isSuccess ? "/dashboard" : "/settings"}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
            >
              {isSuccess ? "Go to dashboard" : "Back to settings"}
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<LogoLoader fullScreen label="AI Study Hub" sublabel="Loading verification..." />}>
      <VerifyEmailContent />
    </Suspense>
  )
}
