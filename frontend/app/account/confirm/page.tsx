"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react"
import { LogoLoader } from "@/components/layout/logo-loader"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface AccountActionResult {
  action: string
  message: string
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const [result, setResult] = useState<AccountActionResult | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) {
      setError("Confirmation token is missing.")
      setLoading(false)
      return
    }

    const confirm = async () => {
      try {
        const response = await fetch(`${getApiUrl()}/api/auth/account/confirm?token=${encodeURIComponent(token)}`)
        const body = await response.json().catch(() => null)
        if (!response.ok) {
          throw new Error(body?.message || "Could not confirm this account action")
        }
        const actionResult = body as AccountActionResult
        setResult(actionResult)
        if (actionResult.action === "DELETE_ACCOUNT") {
          localStorage.removeItem("aiStudyHubUser")
          localStorage.removeItem("aiStudyHubToken")
        }
      } catch (err) {
        setError(getNetworkErrorMessage(err))
      } finally {
        setLoading(false)
      }
    }

    confirm()
  }, [token])

  const isSuccess = Boolean(result) && !error

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="absolute inset-0 gradient-mesh" />
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="glass-card relative w-full max-w-lg rounded-2xl p-8 text-center"
      >
        {loading ? (
          <LogoLoader compact label="AI Study Hub" sublabel="Verifying secure link..." className="py-0" />
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
          <ShieldCheck className="h-4 w-4" />
          AI Study Hub
        </div>
        <h1 className="mt-3 text-2xl font-bold text-foreground">
          {loading ? "Confirming account action" : isSuccess ? "Confirmation complete" : "Confirmation failed"}
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          {loading ? "Please wait while we verify your secure link." : error || result?.message}
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href={result?.action === "DELETE_ACCOUNT" ? "/login" : "/settings"}
            className="rounded-xl bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground"
          >
            {result?.action === "DELETE_ACCOUNT" ? "Back to login" : "Back to settings"}
          </Link>
        </div>
      </motion.div>
    </div>
  )
}

export default function AccountConfirmPage() {
  return (
    <Suspense
      fallback={
        <LogoLoader fullScreen label="AI Study Hub" sublabel="Loading confirmation..." />
      }
    >
      <ConfirmContent />
    </Suspense>
  )
}
