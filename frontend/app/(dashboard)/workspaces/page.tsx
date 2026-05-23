"use client"

import { AnimatePresence, motion } from "framer-motion"
import { type FormEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { useDropzone } from "react-dropzone"
import {
  ArrowRight,
  Check,
  Clipboard,
  Copy,
  FileText,
  Hash,
  Loader2,
  MessageSquare,
  Plus,
  Search,
  Send,
  Trophy,
  Upload,
  UserPlus,
  UsersRound,
  X,
} from "lucide-react"
import { useAuth } from "@/components/providers/auth-provider"
import { useLanguage } from "@/components/providers/language-provider"
import { getApiUrl, getNetworkErrorMessage } from "@/lib/api"

interface WorkspaceDto {
  id: number
  name: string
  description?: string | null
  inviteCode: string
  ownerId: number
  ownerName: string
  memberCount: number
  documentCount: number
  messageCount: number
  createdAt: string
  updatedAt: string
}

interface WorkspaceMemberDto {
  userId: number
  fullName: string
  email: string
  avatarUrl?: string | null
  role: string
  uploadedDocuments: number
  messageCount: number
  contributionScore: number
  joinedAt: string
}

interface WorkspaceMessageDto {
  id: number
  workspaceId: number
  userId: number
  userName: string
  userAvatarUrl?: string | null
  content: string
  createdAt: string
}

interface DocumentDto {
  id: number
  ownerId: number
  ownerName: string
  title: string
  originalFileName: string
  fileSize?: number | null
  fileType?: string | null
  createdAt: string
}

interface WorkspaceDetailDto {
  workspace: WorkspaceDto
  members: WorkspaceMemberDto[]
  documents: DocumentDto[]
  messages: WorkspaceMessageDto[]
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
}

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

function formatFileSize(bytes?: number | null) {
  if (!bytes) {
    return "Unknown size"
  }

  const units = ["B", "KB", "MB", "GB"]
  let size = bytes
  let unit = 0
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024
    unit += 1
  }
  return `${size.toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "U"
}

async function uploadWorkspaceFile(file: File, ownerId: string, workspaceId: number): Promise<DocumentDto> {
  const formData = new FormData()
  formData.append("ownerId", ownerId)
  formData.append("workspaceId", String(workspaceId))
  formData.append("file", file)

  const response = await fetch(`${getApiUrl()}/api/uploads/documents`, {
    method: "POST",
    body: formData,
  })

  const body = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(body?.message || "Could not upload document")
  }

  return body as DocumentDto
}

export default function WorkspacesPage() {
  const { user } = useAuth()
  const { t } = useLanguage()
  const router = useRouter()
  const [workspaces, setWorkspaces] = useState<WorkspaceDto[]>([])
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(null)
  const [detail, setDetail] = useState<WorkspaceDetailDto | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isDetailLoading, setIsDetailLoading] = useState(false)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isJoinOpen, setIsJoinOpen] = useState(false)
  const [workspaceName, setWorkspaceName] = useState("")
  const [workspaceDescription, setWorkspaceDescription] = useState("")
  const [inviteCode, setInviteCode] = useState("")
  const [isSavingWorkspace, setIsSavingWorkspace] = useState(false)
  const [comment, setComment] = useState("")
  const [isSendingComment, setIsSendingComment] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number | null>(null)
  const [uploadLabel, setUploadLabel] = useState("")

  const loadWorkspaces = useCallback(async () => {
    if (!user) {
      return
    }

    setIsLoading(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load workspaces")
      }

      const data = body as WorkspaceDto[]
      setWorkspaces(data)
      setSelectedWorkspaceId((current) => {
        if (current && data.some((workspace) => workspace.id === current)) {
          return current
        }
        return data[0]?.id ?? null
      })
      if (data.length === 0) {
        setDetail(null)
      }
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsLoading(false)
    }
  }, [user])

  const loadDetail = useCallback(async (workspaceId: number) => {
    if (!user) {
      return
    }

    setIsDetailLoading(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${workspaceId}?userId=${user.id}`)
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not load workspace")
      }

      setDetail(body as WorkspaceDetailDto)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsDetailLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadWorkspaces()
  }, [loadWorkspaces])

  useEffect(() => {
    if (selectedWorkspaceId) {
      loadDetail(selectedWorkspaceId)
    }
  }, [loadDetail, selectedWorkspaceId])

  const filteredWorkspaces = useMemo(() => {
    const keyword = searchQuery.trim().toLowerCase()
    if (!keyword) {
      return workspaces
    }
    return workspaces.filter((workspace) =>
      workspace.name.toLowerCase().includes(keyword) ||
      workspace.inviteCode.toLowerCase().includes(keyword) ||
      (workspace.description || "").toLowerCase().includes(keyword)
    )
  }, [searchQuery, workspaces])

  const selectedWorkspace = detail?.workspace || workspaces.find((workspace) => workspace.id === selectedWorkspaceId) || null
  const topMembers = detail?.members.slice(0, 5) || []

  const createWorkspace = async () => {
    if (!user || !workspaceName.trim()) {
      setError("Workspace name is required")
      return
    }

    setIsSavingWorkspace(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces?ownerId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workspaceName.trim(),
          description: workspaceDescription.trim() || null,
        }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not create workspace")
      }

      const created = body as WorkspaceDto
      setWorkspaces((current) => [created, ...current.filter((workspace) => workspace.id !== created.id)])
      setSelectedWorkspaceId(created.id)
      setWorkspaceName("")
      setWorkspaceDescription("")
      setIsCreateOpen(false)
      setMessage("Workspace created")
      setTimeout(() => setMessage(""), 1400)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const joinWorkspace = async () => {
    if (!user || !inviteCode.trim()) {
      setError("Workspace code is required")
      return
    }

    setIsSavingWorkspace(true)
    setError("")
    setMessage("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/join?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: inviteCode.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not join workspace")
      }

      const joined = body as WorkspaceDto
      setWorkspaces((current) => [joined, ...current.filter((workspace) => workspace.id !== joined.id)])
      setSelectedWorkspaceId(joined.id)
      setInviteCode("")
      setIsJoinOpen(false)
      setMessage("Workspace joined")
      setTimeout(() => setMessage(""), 1400)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSavingWorkspace(false)
    }
  }

  const copyInviteCode = async () => {
    if (!selectedWorkspace) {
      return
    }
    await navigator.clipboard.writeText(selectedWorkspace.inviteCode)
    setMessage("Workspace code copied")
    setTimeout(() => setMessage(""), 1200)
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user || !selectedWorkspaceId || acceptedFiles.length === 0) {
      return
    }

    setError("")
    setMessage("")
    for (const file of acceptedFiles) {
      try {
        setUploadProgress(20)
        setUploadLabel(`Uploading ${file.name}`)
        await uploadWorkspaceFile(file, user.id, selectedWorkspaceId)
        setUploadProgress(90)
      } catch (err) {
        setError(getNetworkErrorMessage(err))
        setUploadProgress(null)
        setUploadLabel("")
        return
      }
    }

    setUploadProgress(100)
    setUploadLabel("Upload complete")
    await Promise.all([loadWorkspaces(), loadDetail(selectedWorkspaceId)])
    setTimeout(() => {
      setUploadProgress(null)
      setUploadLabel("")
    }, 1200)
  }, [loadDetail, loadWorkspaces, selectedWorkspaceId, user])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-powerpoint": [".ppt"],
      "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
    },
  })

  const sendComment = async (event: FormEvent) => {
    event.preventDefault()
    if (!user || !selectedWorkspaceId || !comment.trim()) {
      return
    }

    setIsSendingComment(true)
    setError("")
    try {
      const response = await fetch(`${getApiUrl()}/api/workspaces/${selectedWorkspaceId}/messages?userId=${user.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: comment.trim() }),
      })
      const body = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(body?.message || "Could not send message")
      }

      const created = body as WorkspaceMessageDto
      setDetail((current) => current ? { ...current, messages: [...current.messages, created] } : current)
      setComment("")
      await loadDetail(selectedWorkspaceId)
    } catch (err) {
      setError(getNetworkErrorMessage(err))
    } finally {
      setIsSendingComment(false)
    }
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">{t("workspaces")}</h1>
          <p className="mt-1 text-muted-foreground">Shared study rooms for documents, discussion, and contribution tracking.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <motion.button
            onClick={() => setIsJoinOpen(true)}
            className="flex items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <UserPlus className="h-4 w-4 text-primary" />
            Join by Code
          </motion.button>
          <motion.button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="h-4 w-4" />
            New Workspace
          </motion.button>
        </div>
      </motion.div>

      {(error || message) && (
        <motion.div
          variants={item}
          className={`rounded-xl border px-4 py-3 text-sm ${
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-accent/30 bg-accent/10 text-accent"
          }`}
        >
          {error || message}
        </motion.div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <motion.div variants={item} className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search workspaces..."
              className="w-full rounded-xl border border-border/50 bg-secondary/50 py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
            />
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/20 py-14 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading workspaces...
            </div>
          ) : filteredWorkspaces.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 p-8 text-center">
              <UsersRound className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="font-medium text-foreground">No workspaces yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create one or join with a code.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredWorkspaces.map((workspace) => (
                <motion.button
                  key={workspace.id}
                  onClick={() => setSelectedWorkspaceId(workspace.id)}
                  className={`glass-card w-full rounded-xl p-4 text-left transition-all ${
                    selectedWorkspace?.id === workspace.id ? "border-primary/40 bg-primary/10" : "hover:border-primary/30"
                  }`}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <UsersRound className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">{workspace.name}</p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md bg-secondary/70 px-2 py-0.5">
                          <Hash className="h-3 w-3" />
                          {workspace.inviteCode}
                        </span>
                        <span>{workspace.memberCount} members</span>
                      </div>
                      <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{workspace.documentCount} docs</span>
                        <span>{workspace.messageCount} comments</span>
                      </div>
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="min-w-0">
          {!selectedWorkspace ? (
            <div className="glass-card rounded-xl px-6 py-20 text-center">
              <UsersRound className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-semibold text-foreground">Choose a workspace</p>
              <p className="mt-1 text-sm text-muted-foreground">Your shared documents and comments will appear here.</p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="glass-card rounded-xl p-5">
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                        <UsersRound className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-foreground">{selectedWorkspace.name}</h2>
                        <p className="text-sm text-muted-foreground">Owner: {selectedWorkspace.ownerName}</p>
                      </div>
                    </div>
                    {selectedWorkspace.description && (
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">{selectedWorkspace.description}</p>
                    )}
                  </div>
                  <button
                    onClick={copyInviteCode}
                    className="flex w-fit items-center gap-2 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <Copy className="h-4 w-4 text-primary" />
                    {selectedWorkspace.inviteCode}
                  </button>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
                    <p className="text-xs text-muted-foreground">Members</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{selectedWorkspace.memberCount}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
                    <p className="text-xs text-muted-foreground">Documents</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{selectedWorkspace.documentCount}</p>
                  </div>
                  <div className="rounded-xl border border-border/50 bg-secondary/25 p-4">
                    <p className="text-xs text-muted-foreground">Comments</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{selectedWorkspace.messageCount}</p>
                  </div>
                </div>
              </div>

              {isDetailLoading && !detail ? (
                <div className="flex items-center justify-center gap-2 rounded-xl border border-border/50 bg-secondary/20 py-14 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading workspace...
                </div>
              ) : (
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div className="space-y-6">
                    <div className="glass-card rounded-xl p-5">
                      <div className="mb-4 flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">Documents</h3>
                          <p className="text-sm text-muted-foreground">Files uploaded by workspace members.</p>
                        </div>
                      </div>

                      <div
                        {...getRootProps()}
                        className={`relative mb-4 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all ${
                          isDragActive
                            ? "border-primary bg-primary/10"
                            : "border-border/60 bg-secondary/20 hover:border-primary/50 hover:bg-secondary/30"
                        }`}
                      >
                        <input {...getInputProps()} />
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                            <Upload className="h-5 w-5" />
                          </div>
                          <p className="text-sm font-medium text-foreground">
                            {isDragActive ? "Drop files here" : "Upload workspace documents"}
                          </p>
                          <p className="text-xs text-muted-foreground">PDF, Word, and PowerPoint</p>
                        </div>
                        <AnimatePresence>
                          {uploadProgress !== null && (
                            <motion.div
                              className="absolute inset-0 flex items-center justify-center rounded-xl bg-background/80 backdrop-blur-sm"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                            >
                              <div className="flex flex-col items-center gap-3">
                                {uploadProgress < 100 ? (
                                  <>
                                    <div className="h-2 w-48 overflow-hidden rounded-full bg-secondary">
                                      <motion.div className="h-full bg-primary" animate={{ width: `${uploadProgress}%` }} />
                                    </div>
                                    <p className="text-sm text-foreground">{uploadLabel}</p>
                                  </>
                                ) : (
                                  <div className="flex items-center gap-2 text-accent">
                                    <Check className="h-4 w-4" />
                                    <span className="text-sm font-medium">{uploadLabel}</span>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      <div className="space-y-3">
                        {detail?.documents.map((doc) => (
                          <motion.div
                            key={doc.id}
                            onClick={() => router.push(`/documents/${doc.id}/view`)}
                            className="flex cursor-pointer items-center gap-4 rounded-xl border border-border/50 bg-secondary/25 p-4 transition-colors hover:bg-secondary/45"
                            whileHover={{ x: 4 }}
                          >
                            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-primary/15">
                              <FileText className="h-5 w-5 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{doc.title || doc.originalFileName}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                <span>Uploaded by {doc.ownerName}</span>
                                <span>{formatFileSize(doc.fileSize)}</span>
                                <span>{formatDate(doc.createdAt)}</span>
                              </div>
                            </div>
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </motion.div>
                        ))}

                        {detail?.documents.length === 0 && (
                          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-10 text-center">
                            <FileText className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                            <p className="font-medium text-foreground">No documents yet</p>
                            <p className="mt-1 text-sm text-muted-foreground">Upload a file to start this workspace library.</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Discussion</h3>
                      </div>
                      <div className="mb-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
                        {detail?.messages.map((messageItem) => (
                          <div key={messageItem.id} className="flex gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                              {messageItem.userAvatarUrl ? (
                                <img src={messageItem.userAvatarUrl} alt={messageItem.userName} className="h-full w-full object-cover" />
                              ) : (
                                initials(messageItem.userName)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-foreground">{messageItem.userName}</p>
                                <span className="text-xs text-muted-foreground">{formatDate(messageItem.createdAt)}</span>
                              </div>
                              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{messageItem.content}</p>
                            </div>
                          </div>
                        ))}

                        {detail?.messages.length === 0 && (
                          <div className="rounded-xl border border-dashed border-border/60 bg-secondary/20 px-6 py-10 text-center text-sm text-muted-foreground">
                            No discussion yet.
                          </div>
                        )}
                      </div>

                      <form onSubmit={sendComment} className="flex gap-2">
                        <input
                          value={comment}
                          onChange={(event) => setComment(event.target.value)}
                          placeholder="Write a comment..."
                          className="min-w-0 flex-1 rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                        />
                        <button
                          type="submit"
                          disabled={isSendingComment || !comment.trim()}
                          className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {isSendingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                          Send
                        </button>
                      </form>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="glass-card rounded-xl p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Top Contributors</h3>
                      </div>
                      <div className="space-y-3">
                        {topMembers.map((member, index) => (
                          <div key={member.userId} className="flex items-center gap-3 rounded-xl border border-border/50 bg-secondary/25 p-3">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-primary/15 text-xs font-semibold text-primary">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
                              ) : (
                                initials(member.fullName)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="truncate text-sm font-medium text-foreground">{member.fullName}</p>
                                {index === 0 && <span className="rounded-md bg-primary/15 px-1.5 py-0.5 text-[10px] font-semibold text-primary">Top</span>}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {member.uploadedDocuments} uploads, {member.messageCount} comments
                              </p>
                            </div>
                            <span className="text-sm font-semibold text-foreground">{member.contributionScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="glass-card rounded-xl p-5">
                      <div className="mb-4 flex items-center gap-2">
                        <UsersRound className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-foreground">Members</h3>
                      </div>
                      <div className="space-y-2">
                        {detail?.members.map((member) => (
                          <div key={member.userId} className="flex items-center gap-3 rounded-xl px-2 py-2">
                            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-xs font-semibold text-muted-foreground">
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.fullName} className="h-full w-full object-cover" />
                              ) : (
                                initials(member.fullName)
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-foreground">{member.fullName}</p>
                              <p className="truncate text-xs text-muted-foreground">{member.email}</p>
                            </div>
                            <span className="rounded-md bg-secondary/70 px-2 py-0.5 text-[11px] text-muted-foreground">{member.role}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {isCreateOpen && (
          <WorkspaceModal
            title="New Workspace"
            icon={<Plus className="h-5 w-5" />}
            onClose={() => setIsCreateOpen(false)}
            footer={
              <>
                <button
                  onClick={() => setIsCreateOpen(false)}
                  className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={createWorkspace}
                  disabled={isSavingWorkspace}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Create
                </button>
              </>
            }
          >
            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Workspace Name</label>
                <input
                  value={workspaceName}
                  onChange={(event) => setWorkspaceName(event.target.value)}
                  placeholder="SE1847 Study Group"
                  className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-foreground">Description</label>
                <textarea
                  value={workspaceDescription}
                  onChange={(event) => setWorkspaceDescription(event.target.value)}
                  rows={3}
                  placeholder="Lectures, project notes, and exam materials."
                  className="w-full resize-none rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>
          </WorkspaceModal>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isJoinOpen && (
          <WorkspaceModal
            title="Join Workspace"
            icon={<Clipboard className="h-5 w-5" />}
            onClose={() => setIsJoinOpen(false)}
            footer={
              <>
                <button
                  onClick={() => setIsJoinOpen(false)}
                  className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {t("cancel")}
                </button>
                <button
                  onClick={joinWorkspace}
                  disabled={isSavingWorkspace}
                  className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSavingWorkspace ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Join
                </button>
              </>
            }
          >
            <div>
              <label className="mb-2 block text-sm font-medium text-foreground">Workspace Code</label>
              <input
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                placeholder="WSABC123"
                className="w-full rounded-xl border border-border/50 bg-secondary/50 px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
              />
            </div>
          </WorkspaceModal>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function WorkspaceModal({
  title,
  icon,
  children,
  footer,
  onClose,
}: {
  title: string
  icon: ReactNode
  children: ReactNode
  footer: ReactNode
  onClose: () => void
}) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="glass-card w-full max-w-lg rounded-xl p-6"
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 16 }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              {icon}
            </div>
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {children}

        <div className="mt-6 flex justify-end gap-3">
          {footer}
        </div>
      </motion.div>
    </motion.div>
  )
}
