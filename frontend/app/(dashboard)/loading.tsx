import { LogoLoader } from "@/components/layout/logo-loader"

export default function DashboardLoading() {
  return (
    <LogoLoader
      className="min-h-[calc(100vh-7rem)]"
      label="AI Study Hub"
      sublabel="Loading your workspace"
    />
  )
}
