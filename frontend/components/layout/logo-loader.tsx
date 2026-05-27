"use client"

import { Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

interface LogoLoaderProps {
  label?: string
  sublabel?: string
  compact?: boolean
  fullScreen?: boolean
  className?: string
}

export function LogoLoader({
  label = "AI Study Hub",
  sublabel = "Preparing your study space",
  compact = false,
  fullScreen = false,
  className,
}: LogoLoaderProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-center justify-center text-center",
        fullScreen ? "min-h-screen bg-background gradient-mesh" : compact ? "py-5" : "min-h-[320px] py-12",
        className
      )}
    >
      <div className={cn("flex flex-col items-center", compact ? "gap-3" : "gap-4")}>
        <div className={cn("ai-logo-loader relative flex items-center justify-center", compact ? "h-12 w-12" : "h-20 w-20")}>
          <span className="ai-logo-loader-ring" aria-hidden="true" />
          <span className="ai-logo-loader-pulse" aria-hidden="true" />
          <span className={cn("ai-logo-loader-mark rounded-2xl bg-primary/20 text-primary", compact ? "h-10 w-10" : "h-14 w-14")}>
            <Sparkles className={cn(compact ? "h-5 w-5" : "h-7 w-7")} />
          </span>
          <span className="ai-logo-loader-spark ai-logo-loader-spark-one" aria-hidden="true" />
          <span className="ai-logo-loader-spark ai-logo-loader-spark-two" aria-hidden="true" />
          <span className="ai-logo-loader-spark ai-logo-loader-spark-three" aria-hidden="true" />
        </div>

        <div className="space-y-1">
          <p className={cn("font-semibold text-foreground", compact ? "text-sm" : "text-base")}>{label}</p>
          <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>{sublabel}</p>
        </div>

        {!compact && (
          <div className="ai-logo-loader-bar" aria-hidden="true">
            <span />
          </div>
        )}
      </div>
    </div>
  )
}
