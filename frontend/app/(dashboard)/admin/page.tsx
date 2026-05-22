"use client"

import { motion } from "framer-motion"
import { useCallback, useEffect, useMemo, useState } from "react"
import type { FormEvent } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/providers/auth-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"
import {
  Users,
  FileText,
  BarChart3,
  Shield,
  Search,
  MoreVertical,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
  Database,
  AlertTriangle,
  Bell,
  Send,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

type AdminTab = "users" | "documents" | "reports" | "notifications"

interface DashboardSummary {
  totalUsers: number
  totalDocuments: number
  totalPublicDocuments: number
  totalChatSessions: number
  totalChatMessages: number
  totalDocumentViews: number
  pendingReviewDocuments: number
}

interface AdminUser {
  id: number
  fullName: string
  email: string
  avatarUrl?: string | null
  university?: string | null
  major?: string | null
  status: "ACTIVE" | "INACTIVE" | "BANNED" | string
  roles: string[]
  documentCount: number
  createdAt: string
}

interface AdminDocument {
  id: number
  ownerName: string
  subjectName?: string | null
  categoryName?: string | null
  title: string
  originalFileName: string
  fileSize?: number | null
  status: string
  createdAt: string
}

interface AdminReport {
  id: number
  documentId?: number | null
  documentTitle?: string | null
  reportedBy: number
  reporterName: string
  reason: string
  description?: string | null
  status: "PENDING" | "RESOLVED" | "REJECTED" | string
  createdAt: string
}

interface MessageResponse {
  message: string
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

async function apiJson<T>(path: string) {
  const response = await fetch(`${getApiUrl()}${path}`)
  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || "Could not load admin data")
  }
  return response.json() as Promise<T>
}

async function patchStatus<T>(path: string, status: string) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || "Could not update status")
  }

  return response.json() as Promise<T>
}

async function postJson<T>(path: string, body: unknown) {
  const response = await fetch(`${getApiUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.message || "Request failed")
  }

  return response.json() as Promise<T>
}

function formatNumber(value?: number) {
  return new Intl.NumberFormat().format(value || 0)
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date)
}

function formatBytes(value?: number | null) {
  if (!value) {
    return "Unknown size"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = value
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex += 1
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

function primaryRole(roles: string[]) {
  if (roles.includes("ADMIN")) {
    return "Admin"
  }
  if (roles.includes("USER")) {
    return "User"
  }
  return roles[0] || "User"
}

function statusStyle(status: string) {
  switch (status.toUpperCase()) {
    case "ACTIVE":
    case "RESOLVED":
      return "bg-accent/15 text-accent border-accent/20"
    case "PENDING":
    case "PENDING_REVIEW":
      return "bg-chart-4/15 text-chart-4 border-chart-4/20"
    case "BANNED":
    case "REJECTED":
      return "bg-destructive/15 text-destructive border-destructive/20"
    default:
      return "bg-muted/50 text-muted-foreground border-border/50"
  }
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("users")
  const [searchQuery, setSearchQuery] = useState("")
  const [summary, setSummary] = useState<DashboardSummary | null>(null)
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [pendingDocuments, setPendingDocuments] = useState<AdminDocument[]>([])
  const [reports, setReports] = useState<AdminReport[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [reportsError, setReportsError] = useState("")
  const [actionKey, setActionKey] = useState<string | null>(null)
  const [notificationTarget, setNotificationTarget] = useState<"all" | "user">("all")
  const [notificationUserId, setNotificationUserId] = useState("")
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationContent, setNotificationContent] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationError, setNotificationError] = useState("")
  const [isSendingNotification, setIsSendingNotification] = useState(false)
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const isAdmin = user?.roles.includes("ADMIN")

  const loadAdminData = useCallback(async () => {
    setIsLoading(true)
    setError("")
    setReportsError("")
    try {
      const [summaryData, usersData, documentsData] = await Promise.all([
        apiJson<DashboardSummary>("/api/analytics/summary"),
        apiJson<AdminUser[]>("/api/admin/users"),
        apiJson<AdminDocument[]>("/api/admin/documents/pending"),
      ])
      setSummary(summaryData)
      setAdminUsers(usersData)
      setPendingDocuments(documentsData)

      try {
        const reportsData = await apiJson<AdminReport[]>("/api/admin/reports")
        setReports(reportsData)
      } catch (err) {
        setReports([])
        setReportsError(getNetworkErrorMessage(err))
      }
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!authLoading && (!user || !isAdmin)) {
      router.replace("/dashboard")
    }
  }, [authLoading, isAdmin, router, user])

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadAdminData()
    }
  }, [authLoading, isAdmin, loadAdminData])

  const filteredUsers = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) {
      return adminUsers
    }

    return adminUsers.filter((row) =>
      row.fullName.toLowerCase().includes(keyword) ||
      row.email.toLowerCase().includes(keyword) ||
      primaryRole(row.roles).toLowerCase().includes(keyword) ||
      row.status.toLowerCase().includes(keyword)
    )
  }, [adminUsers, searchQuery])

  const stats = [
    {
      icon: Users,
      label: "Total Users",
      value: formatNumber(summary?.totalUsers),
      detail: "users table",
      color: "text-primary",
    },
    {
      icon: FileText,
      label: "Total Documents",
      value: formatNumber(summary?.totalDocuments),
      detail: `${formatNumber(summary?.totalPublicDocuments)} public`,
      color: "text-accent",
    },
    {
      icon: BarChart3,
      label: "Document Views",
      value: formatNumber(summary?.totalDocumentViews),
      detail: "view logs",
      color: "text-chart-3",
    },
    {
      icon: Shield,
      label: "Pending Review",
      value: formatNumber(summary?.pendingReviewDocuments),
      detail: "documents queue",
      color: "text-chart-4",
    },
  ]

  const handleUserStatus = async (id: number, status: "ACTIVE" | "INACTIVE" | "BANNED") => {
    setActionKey(`user-${id}`)
    setError("")
    try {
      const updatedUser = await patchStatus<AdminUser>(`/api/admin/users/${id}/status`, status)
      setAdminUsers((current) => current.map((row) => row.id === id ? updatedUser : row))
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setActionKey(null)
    }
  }

  const handleDocumentStatus = async (id: number, status: "ACTIVE" | "REJECTED") => {
    setActionKey(`document-${id}`)
    setError("")
    try {
      await patchStatus<AdminDocument>(`/api/admin/documents/${id}/status`, status)
      await loadAdminData()
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setActionKey(null)
    }
  }

  const handleReportStatus = async (id: number, status: "RESOLVED" | "REJECTED") => {
    setActionKey(`report-${id}`)
    setError("")
    setReportsError("")
    try {
      const updatedReport = await patchStatus<AdminReport>(`/api/admin/reports/${id}/status`, status)
      setReports((current) => current.map((row) => row.id === id ? updatedReport : row))
    } catch (err) {
      setReportsError(getNetworkErrorMessage(err))
    } finally {
      setActionKey(null)
    }
  }

  const handleSendNotification = async (event: FormEvent) => {
    event.preventDefault()
    setNotificationMessage("")
    setNotificationError("")

    if (!notificationTitle.trim() || !notificationContent.trim()) {
      setNotificationError("Title and message are required.")
      return
    }

    if (notificationTarget === "user" && !notificationUserId) {
      setNotificationError("Choose a user to receive this notification.")
      return
    }

    setIsSendingNotification(true)
    try {
      const response = await postJson<MessageResponse>("/api/admin/notifications", {
        broadcast: notificationTarget === "all",
        userId: notificationTarget === "user" ? Number(notificationUserId) : null,
        title: notificationTitle.trim(),
        content: notificationContent.trim(),
      })
      setNotificationMessage(response.message)
      setNotificationTitle("")
      setNotificationContent("")
    } catch (err) {
      setNotificationError(getNetworkErrorMessage(err))
    } finally {
      setIsSendingNotification(false)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading admin session...
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    )
  }

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Live platform data from the connected database.</p>
        </div>
        <motion.button
          onClick={loadAdminData}
          disabled={isLoading}
          className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
          whileHover={isLoading ? {} : { scale: 1.02 }}
          whileTap={isLoading ? {} : { scale: 0.98 }}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh Data
        </motion.button>
      </motion.div>

      {error && (
        <motion.div
          variants={item}
          className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </motion.div>
      )}

      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            className="glass-card rounded-xl p-5"
            whileHover={{ y: -4, scale: 1.02 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * index }}
          >
            <div className="flex items-start justify-between gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-secondary ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center gap-1 rounded-full border border-border/50 bg-secondary/40 px-2 py-1 text-[11px] font-medium text-muted-foreground">
                <Database className="h-3 w-3" />
                SQL
              </span>
            </div>
            <div className="mt-4">
              <p className="text-2xl font-bold text-foreground">{isLoading ? "..." : stat.value}</p>
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground/80">{stat.detail}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} className="flex flex-wrap items-center gap-2 border-b border-border/50 pb-2">
        {[
          { id: "users" as const, label: "User Management", icon: Users },
          { id: "documents" as const, label: "Document Moderation", icon: FileText },
          { id: "reports" as const, label: "Reports", icon: BarChart3 },
          { id: "notifications" as const, label: "Notifications", icon: Bell },
        ].map((tab) => (
          <motion.button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </motion.button>
        ))}
      </motion.div>

      {activeTab === "users" && (
        <motion.div variants={item} className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground transition-all focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
            <button className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-muted-foreground transition-colors hover:text-foreground">
              <Filter className="h-4 w-4" />
              {formatNumber(filteredUsers.length)} shown
            </button>
          </div>

          <div className="glass-card overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">User</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Documents</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="p-4 text-left text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="p-4 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((row) => {
                    const isCurrentUser = String(row.id) === user.id
                    return (
                      <tr key={row.id} className="border-b border-border/50 transition-colors hover:bg-secondary/30">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary/80 to-accent/80 font-medium text-white">
                              {initials(row.fullName)}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{row.fullName}</p>
                              <p className="text-xs text-muted-foreground">{row.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`rounded-md border px-2 py-1 text-xs font-medium ${
                            row.roles.includes("ADMIN")
                              ? "border-chart-4/20 bg-chart-4/15 text-chart-4"
                              : "border-primary/20 bg-primary/15 text-primary"
                          }`}>
                            {primaryRole(row.roles)}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-foreground">{formatNumber(row.documentCount)}</td>
                        <td className="p-4">
                          <span className={`inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium ${statusStyle(row.status)}`}>
                            {row.status === "ACTIVE" ? <CheckCircle className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {row.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-muted-foreground">{formatDate(row.createdAt)}</td>
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <motion.button
                                disabled={actionKey === `user-${row.id}` || isCurrentUser}
                                className="rounded-lg p-1 hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <MoreVertical className="h-4 w-4 text-muted-foreground" />
                              </motion.button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="glass-card border-border/50">
                              <DropdownMenuItem className="cursor-default gap-2 text-muted-foreground">
                                <Eye className="h-4 w-4" /> ID #{row.id}
                              </DropdownMenuItem>
                              {row.status !== "ACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() => handleUserStatus(row.id, "ACTIVE")}
                                  className="cursor-pointer gap-2 text-accent focus:text-accent"
                                >
                                  <CheckCircle className="h-4 w-4" /> Activate
                                </DropdownMenuItem>
                              )}
                              {row.status === "ACTIVE" && (
                                <DropdownMenuItem
                                  onClick={() => handleUserStatus(row.id, "INACTIVE")}
                                  className="cursor-pointer gap-2 text-muted-foreground focus:text-foreground"
                                >
                                  <XCircle className="h-4 w-4" /> Suspend
                                </DropdownMenuItem>
                              )}
                              {row.status !== "BANNED" && (
                                <DropdownMenuItem
                                  onClick={() => handleUserStatus(row.id, "BANNED")}
                                  className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                                >
                                  <Ban className="h-4 w-4" /> Ban
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {!isLoading && filteredUsers.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">
                No users found in the database for this search.
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "documents" && (
        <motion.div variants={item} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Pending Documents for Review</h3>
            <p className="mt-1 text-sm text-muted-foreground">Loaded from documents where status is PENDING_REVIEW.</p>
          </div>
          <div className="space-y-3">
            {pendingDocuments.map((doc) => (
              <div key={doc.id} className="glass-card flex flex-col gap-4 rounded-xl p-4 md:flex-row md:items-center">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{doc.title || doc.originalFileName}</p>
                  <p className="text-xs text-muted-foreground">
                    Uploaded by {doc.ownerName} - {doc.subjectName || doc.categoryName || "Uncategorized"} - {formatBytes(doc.fileSize)}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(doc.createdAt)}</span>
                <div className="flex items-center gap-2">
                  <motion.button
                    onClick={() => handleDocumentStatus(doc.id, "ACTIVE")}
                    disabled={actionKey === `document-${doc.id}`}
                    className="rounded-lg bg-accent/15 p-2 text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Approve"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <CheckCircle className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    onClick={() => handleDocumentStatus(doc.id, "REJECTED")}
                    disabled={actionKey === `document-${doc.id}`}
                    className="rounded-lg bg-destructive/15 p-2 text-destructive transition-colors hover:bg-destructive/25 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Reject"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <XCircle className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            ))}
            {!isLoading && pendingDocuments.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center">
                <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">No pending documents</p>
                <p className="mt-1 text-sm text-muted-foreground">There are no PENDING_REVIEW documents in the database.</p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "reports" && (
        <motion.div variants={item} className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground">User Reports</h3>
            <p className="mt-1 text-sm text-muted-foreground">Loaded from the reports table.</p>
          </div>
          {reportsError && (
            <div className="flex items-start gap-3 rounded-xl border border-chart-4/30 bg-chart-4/10 px-4 py-3 text-sm text-chart-4">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <div>
                <p className="font-medium text-foreground">Reports API is not available from the current backend.</p>
                <p className="mt-1 text-muted-foreground">
                  Redeploy the backend with the latest admin routes, then refresh this page.
                </p>
                <p className="mt-2 text-xs text-muted-foreground">{reportsError}</p>
              </div>
            </div>
          )}
          <div className="space-y-3">
            {reports.map((report) => (
              <div key={report.id} className="glass-card rounded-xl p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-foreground">{report.reason}</p>
                      <span className={`rounded-md border px-2 py-1 text-xs font-medium ${statusStyle(report.status)}`}>
                        {report.status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Reported by {report.reporterName} - {report.documentTitle || "No document linked"}
                    </p>
                    {report.description && (
                      <p className="mt-3 text-sm text-foreground/80">{report.description}</p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">{formatDate(report.createdAt)}</p>
                  </div>
                  {report.status === "PENDING" && (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      <motion.button
                        onClick={() => handleReportStatus(report.id, "RESOLVED")}
                        disabled={actionKey === `report-${report.id}`}
                        className="rounded-lg bg-accent/15 p-2 text-accent transition-colors hover:bg-accent/25 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Resolve report"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </motion.button>
                      <motion.button
                        onClick={() => handleReportStatus(report.id, "REJECTED")}
                        disabled={actionKey === `report-${report.id}`}
                        className="rounded-lg bg-destructive/15 p-2 text-destructive transition-colors hover:bg-destructive/25 disabled:cursor-not-allowed disabled:opacity-50"
                        title="Reject report"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <XCircle className="h-4 w-4" />
                      </motion.button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {!isLoading && reports.length === 0 && (
              <div className="glass-card rounded-xl p-8 text-center">
                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  {reportsError ? "Reports unavailable" : "No reports found"}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {reportsError ? "The rest of the admin dashboard is still using live database data." : "The reports table is currently empty."}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div variants={item} className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <form onSubmit={handleSendNotification} className="glass-card rounded-xl p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Send Notification</h3>
                <p className="text-sm text-muted-foreground">Create a message in the user notification center.</p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-secondary/50 p-1">
              {[
                { id: "all" as const, label: "All Users" },
                { id: "user" as const, label: "One User" },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => {
                    setNotificationTarget(option.id)
                    setNotificationMessage("")
                    setNotificationError("")
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    notificationTarget === option.id
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {notificationTarget === "user" && (
              <div className="mb-4">
                <label className="mb-2 block text-sm font-medium text-foreground">Recipient</label>
                <select
                  value={notificationUserId}
                  onChange={(event) => setNotificationUserId(event.target.value)}
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">Choose a user</option>
                  {adminUsers.map((row) => (
                    <option key={row.id} value={row.id}>
                      {row.fullName} - {row.email}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-foreground">Title</label>
              <input
                value={notificationTitle}
                onChange={(event) => setNotificationTitle(event.target.value)}
                maxLength={255}
                placeholder="Maintenance update"
                className="w-full rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-foreground">Message</label>
              <textarea
                value={notificationContent}
                onChange={(event) => setNotificationContent(event.target.value)}
                rows={6}
                placeholder="Write the notification content..."
                className="min-h-36 w-full resize-y rounded-xl border border-border/50 bg-secondary/50 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>

            {notificationMessage && (
              <div className="mb-4 rounded-xl border border-accent/25 bg-accent/10 px-3 py-2 text-sm text-accent">
                {notificationMessage}
              </div>
            )}

            {notificationError && (
              <div className="mb-4 rounded-xl border border-destructive/25 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {notificationError}
              </div>
            )}

            <motion.button
              type="submit"
              disabled={isSendingNotification}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
              whileHover={isSendingNotification ? {} : { scale: 1.02 }}
              whileTap={isSendingNotification ? {} : { scale: 0.98 }}
            >
              <Send className="h-4 w-4" />
              {isSendingNotification ? "Sending..." : "Send Notification"}
            </motion.button>
          </form>

          <div className="glass-card rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-primary">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">Delivery</p>
                <p className="text-xs text-muted-foreground">{formatNumber(adminUsers.length)} users loaded</p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Current target</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {notificationTarget === "all"
                    ? "All active users"
                    : adminUsers.find((row) => String(row.id) === notificationUserId)?.fullName || "No user selected"}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Active users</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatNumber(adminUsers.filter((row) => row.status === "ACTIVE").length)}
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-secondary/30 p-3">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Blocked users</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {formatNumber(adminUsers.filter((row) => row.status === "BANNED").length)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
